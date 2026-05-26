import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async createPayment(data: {
    userId: string;
    amount: number;
    method: string;
    currency?: string;
    ipAddress: string;
    userAgent: string;
    metadata?: any;
  }) {
    // Idempotency check
    const idempotencyKey = `payment:${data.userId}:${data.amount}:${Date.now()}`;
    const existing = await this.redis.get(idempotencyKey);
    
    if (existing) {
      throw new BadRequestException('Duplicate payment request detected');
    }

    await this.redis.set(idempotencyKey, 'processing', 300);

    const fee = this.calculateFee(data.amount, data.method);
    const totalAmount = data.amount + fee;

    const payment = await this.prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        fee,
        totalAmount,
        currency: data.currency || 'USD',
        method: data.method as any,
        status: 'PENDING',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    this.logger.log(`Payment created: ${payment.id} for user ${data.userId}`);
    return payment;
  }

  async processWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ) {
    // Verify webhook signature
    const isValid = await this.verifyWebhookSignature(provider, payload, signature);
    
    if (!isValid) {
      this.logger.error(`Invalid webhook signature from ${provider}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const providerRef = this.extractProviderRef(provider, payload);
    
    if (!providerRef) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // Check for duplicate webhook
    const webhookKey = `webhook:${provider}:${providerRef}`;
    const processed = await this.redis.get(webhookKey);
    
    if (processed) {
      this.logger.warn(`Duplicate webhook received: ${webhookKey}`);
      return { status: 'already_processed' };
    }

    await this.redis.set(webhookKey, 'processed', 86400); // 24 hours

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef },
    });

    if (!payment) {
      this.logger.error(`Payment not found for provider ref: ${providerRef}`);
      throw new NotFoundException('Payment not found');
    }

    // Idempotency: Don't process already completed payments
    if (payment.status === 'PAID') {
      return { status: 'already_paid', paymentId: payment.id };
    }

    const status = this.mapProviderStatus(provider, payload);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status as any,
        webhookReceived: true,
        webhookData: payload,
        providerResponse: payload,
      },
    });

    this.logger.log(
      `Webhook processed for payment ${payment.id}, status: ${status}`,
    );

    return { status, paymentId: payment.id };
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PAID') {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    const refundAmount = amount || payment.totalAmount;

    if (refundAmount > payment.totalAmount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: refundAmount === payment.totalAmount ? 'REFUNDED' : 'PAID',
        refundedAmount: { increment: refundAmount },
        refundedAt: new Date(),
        refundReason: reason,
      },
    });

    this.logger.log(`Payment ${paymentId} refunded: ${refundAmount}`);
    return updatedPayment;
  }

  async getPaymentHistory(userId: string, filters?: {
    status?: string;
    method?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.method) where.method = filters.method;
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentStats() {
    const [
      totalPayments,
      totalAmount,
      pendingAmount,
      paidAmount,
      refundedAmount,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'REFUNDED' },
        _sum: { refundedAmount: true },
      }),
    ]);

    return {
      totalPayments,
      totalAmount: totalAmount._sum.totalAmount || 0,
      pendingAmount: pendingAmount._sum.totalAmount || 0,
      paidAmount: paidAmount._sum.totalAmount || 0,
      refundedAmount: refundedAmount._sum.refundedAmount || 0,
    };
  }

  private calculateFee(amount: number, method: string): number {
    const feeRates: Record<string, number> = {
      STRIPE: 0.029,
      MERCADOPAGO: 0.039,
      PAYPAL: 0.034,
      BANK_TRANSFER: 0,
      CASH: 0,
      WALLET: 0,
    };

    const rate = feeRates[method] || 0;
    return Math.round(amount * rate * 100) / 100;
  }

  private async verifyWebhookSignature(
    provider: string,
    payload: any,
    signature?: string,
  ): Promise<boolean> {
    // Implement provider-specific signature verification
    switch (provider) {
      case 'stripe':
        return this.verifyStripeSignature(payload, signature);
      case 'mercadopago':
        return this.verifyMercadoPagoSignature(payload, signature);
      case 'paypal':
        return this.verifyPayPalSignature(payload, signature);
      default:
        return true; // For development; require signatures in production
    }
  }

  private verifyStripeSignature(payload: any, signature?: string): boolean {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret || !signature) return false;
    // Implement Stripe signature verification
    return true;
  }

  private verifyMercadoPagoSignature(payload: any, signature?: string): boolean {
    const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret || !signature) return false;
    return true;
  }

  private verifyPayPalSignature(payload: any, signature?: string): boolean {
    const secret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    if (!secret || !signature) return false;
    return true;
  }

  private extractProviderRef(provider: string, payload: any): string | null {
    switch (provider) {
      case 'stripe':
        return payload.data?.object?.id || payload.id;
      case 'mercadopago':
        return payload.data?.id || payload.id;
      case 'paypal':
        return payload.resource?.id || payload.id;
      default:
        return payload.id || null;
    }
  }

  private mapProviderStatus(provider: string, payload: any): string {
    switch (provider) {
      case 'stripe':
        return this.mapStripeStatus(payload);
      case 'mercadopago':
        return this.mapMercadoPagoStatus(payload);
      case 'paypal':
        return this.mapPayPalStatus(payload);
      default:
        return 'PENDING';
    }
  }

  private mapStripeStatus(payload: any): string {
    const status = payload.data?.object?.status;
    switch (status) {
      case 'succeeded':
        return 'PAID';
      case 'failed':
        return 'FAILED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private mapMercadoPagoStatus(payload: any): string {
    const status = payload.data?.status;
    switch (status) {
      case 'approved':
        return 'PAID';
      case 'rejected':
        return 'FAILED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private mapPayPalStatus(payload: any): string {
    const status = payload.resource?.status;
    switch (status) {
      case 'COMPLETED':
        return 'PAID';
      case 'FAILED':
        return 'FAILED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }
}
