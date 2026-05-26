import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { UserRole, TicketStatus, RaffleStatus } from '@prisma/client';

@Injectable()
export class RafflesService {
  private readonly logger = new Logger(RafflesService.name);
  private readonly RESERVATION_TTL = 600; // 10 minutes in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(userId: string, dto: CreateRaffleDto) {
    const raffle = await this.prisma.raffle.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        drawDate: new Date(dto.drawDate),
        createdBy: userId,
        status: 'DRAFT',
        prizeValue: dto.prizeValue,
        ticketPrice: dto.ticketPrice,
      },
    });

    // Create tickets in bulk
    const ticketsData = Array.from({ length: dto.totalTickets }, (_, i) => ({
      raffleId: raffle.id,
      ticketNumber: i + 1,
      status: 'AVAILABLE' as TicketStatus,
    }));

    await this.prisma.ticket.createMany({
      data: ticketsData,
      skipDuplicates: false,
    });

    this.logger.log(`Raffle created: ${raffle.id} with ${dto.totalTickets} tickets`);
    return raffle;
  }

  async findAll(filters: {
    status?: RaffleStatus;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [raffles, total] = await Promise.all([
      this.prisma.raffle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tickets: true },
          },
        },
      }),
      this.prisma.raffle.count({ where }),
    ]);

    return {
      data: raffles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            userId: true,
          },
          orderBy: { ticketNumber: 'asc' },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!raffle) {
      throw new NotFoundException('Raffle not found');
    }

    return raffle;
  }

  async reserveTickets(
    raffleId: string,
    userId: string,
    ticketNumbers: number[],
  ) {
    const lockKey = `raffle:${raffleId}:lock`;
    const lockAcquired = await this.redis.acquireLock(lockKey, 30);

    if (!lockAcquired) {
      throw new ConflictException('Raffle is currently being processed, please try again');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Verify raffle exists and is active
        const raffle = await tx.raffle.findUnique({
          where: { id: raffleId },
        });

        if (!raffle) {
          throw new NotFoundException('Raffle not found');
        }

        if (raffle.status !== 'ACTIVE') {
          throw new BadRequestException('Raffle is not active');
        }

        // Check if tickets are available
        const tickets = await tx.ticket.findMany({
          where: {
            raffleId,
            ticketNumber: { in: ticketNumbers },
          },
        });

        if (tickets.length !== ticketNumbers.length) {
          throw new BadRequestException('Some tickets do not exist');
        }

        const unavailableTickets = tickets.filter(
          (t) => t.status === 'SOLD' || (t.status === 'RESERVED' && t.userId !== userId),
        );

        if (unavailableTickets.length > 0) {
          throw new ConflictException(
            `Tickets ${unavailableTickets.map((t) => t.ticketNumber).join(', ')} are not available`,
          );
        }

        // Check if user already has some tickets reserved
        const userReservedTickets = tickets.filter(
          (t) => t.status === 'RESERVED' && t.userId === userId,
        );

        const ticketsToReserve = ticketNumbers.filter(
          (num) => !userReservedTickets.some((t) => t.ticketNumber === num),
        );

        if (ticketsToReserve.length === 0) {
          return { message: 'Tickets already reserved', tickets: userReservedTickets };
        }

        // Reserve tickets
        const updatedTickets = await tx.ticket.updateMany({
          where: {
            raffleId,
            ticketNumber: { in: ticketsToReserve },
            status: 'AVAILABLE',
          },
          data: {
            status: 'RESERVED',
            userId,
            reservationExpiresAt: new Date(Date.now() + this.RESERVATION_TTL * 1000),
          },
        });

        if (updatedTickets.count !== ticketsToReserve.length) {
          throw new ConflictException('Some tickets were already taken');
        }

        // Store reservation in Redis for quick expiry check
        const reservationKey = `reservation:${raffleId}:${userId}`;
        await this.redis.set(
          reservationKey,
          JSON.stringify(ticketsToReserve),
          this.RESERVATION_TTL,
        );

        this.logger.log(
          `User ${userId} reserved ${ticketsToReserve.length} tickets in raffle ${raffleId}`,
        );

        return {
          message: 'Tickets reserved successfully',
          tickets: ticketsToReserve,
          expiresAt: new Date(Date.now() + this.RESERVATION_TTL * 1000),
          totalPrice: ticketsToReserve.length * Number(raffle.ticketPrice),
        };
      }, {
        isolationLevel: 'Serializable',
      });
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  async confirmTicketPurchase(
    raffleId: string,
    userId: string,
    ticketNumbers: number[],
    paymentId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const raffle = await tx.raffle.findUnique({
        where: { id: raffleId },
      });

      if (!raffle) {
        throw new NotFoundException('Raffle not found');
      }

      const tickets = await tx.ticket.findMany({
        where: {
          raffleId,
          ticketNumber: { in: ticketNumbers },
          userId,
          status: 'RESERVED',
        },
      });

      if (tickets.length !== ticketNumbers.length) {
        throw new BadRequestException('Some tickets are not reserved by this user');
      }

      const now = new Date();
      const expiredTickets = tickets.filter(
        (t) => t.reservationExpiresAt && t.reservationExpiresAt < now,
      );

      if (expiredTickets.length > 0) {
        // Release expired tickets
        await tx.ticket.updateMany({
          where: { id: { in: expiredTickets.map((t) => t.id) } },
          data: {
            status: 'AVAILABLE',
            userId: null,
            reservationExpiresAt: null,
          },
        });

        throw new ConflictException(
          `Reservation expired for tickets: ${expiredTickets.map((t) => t.ticketNumber).join(', ')}`,
        );
      }

      // Mark tickets as sold
      await tx.ticket.updateMany({
        where: {
          raffleId,
          ticketNumber: { in: ticketNumbers },
        },
        data: {
          status: 'SOLD',
          pricePaid: raffle.ticketPrice,
          purchasedAt: now,
          reservationExpiresAt: null,
        },
      });

      // Update raffle tickets sold count
      await tx.raffle.update({
        where: { id: raffleId },
        data: {
          ticketsSold: { increment: ticketNumbers.length },
        },
      });

      // Update payment with ticket reference
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' },
      });

      this.logger.log(
        `User ${userId} purchased ${ticketNumbers.length} tickets in raffle ${raffleId}`,
      );

      return {
        message: 'Purchase confirmed',
        tickets: ticketNumbers,
      };
    }, {
      isolationLevel: 'Serializable',
    });
  }

  async releaseExpiredReservations() {
    const expiredReservations = await this.prisma.ticket.findMany({
      where: {
        status: 'RESERVED',
        reservationExpiresAt: { lt: new Date() },
      },
    });

    if (expiredReservations.length === 0) {
      return { released: 0 };
    }

    const result = await this.prisma.ticket.updateMany({
      where: {
        status: 'RESERVED',
        reservationExpiresAt: { lt: new Date() },
      },
      data: {
        status: 'AVAILABLE',
        userId: null,
        reservationExpiresAt: null,
      },
    });

    this.logger.log(`Released ${result.count} expired reservations`);
    return { released: result.count };
  }

  async drawWinner(raffleId: string, adminId: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: {
          where: { status: 'SOLD' },
        },
      },
    });

    if (!raffle) {
      throw new NotFoundException('Raffle not found');
    }

    if (raffle.status === 'DRAWN' || raffle.status === 'COMPLETED') {
      throw new BadRequestException('Raffle already drawn');
    }

    if (raffle.tickets.length === 0) {
      throw new BadRequestException('No tickets sold for this raffle');
    }

    // Cryptographically secure random selection
    const crypto = require('crypto');
    const randomBuffer = crypto.randomBytes(4);
    const randomIndex = randomBuffer.readUInt32LE(0) % raffle.tickets.length;
    const winningTicket = raffle.tickets[randomIndex];

    const updatedRaffle = await this.prisma.raffle.update({
      where: { id: raffleId },
      data: {
        status: 'DRAWN',
        winningTicketId: winningTicket.id,
        drawResult: winningTicket.ticketNumber.toString(),
      },
      include: {
        tickets: {
          where: { id: winningTicket.id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Raffle ${raffleId} drawn. Winner: Ticket #${winningTicket.ticketNumber}`,
    );

    return updatedRaffle;
  }

  async getMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: {
        userId,
        status: { in: ['RESERVED', 'SOLD'] },
      },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            prizeName: true,
            drawDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
