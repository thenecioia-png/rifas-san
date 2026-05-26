import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || 
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Specific events
  notifyTicketSold(raffleId: string, ticketNumber: number) {
    this.broadcast('ticket:sold', { raffleId, ticketNumber });
  }

  notifyReservationExpired(raffleId: string, ticketNumbers: number[]) {
    this.broadcast('ticket:expired', { raffleId, ticketNumbers });
  }

  notifyPaymentConfirmed(userId: string, paymentId: string) {
    this.sendToUser(userId, 'payment:confirmed', { paymentId });
  }

  notifySanTurn(userId: string, sanGroupId: string, roundNumber: number) {
    this.sendToUser(userId, 'san:turn', { sanGroupId, roundNumber });
  }

  notifyRaffleWinner(raffleId: string, winner: any) {
    this.broadcast('raffle:winner', { raffleId, winner });
  }
}
