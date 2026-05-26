import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() data: {
      amount: number;
      method: string;
      currency?: string;
      metadata?: any;
    },
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.paymentsService.createPayment({
      userId,
      amount: data.amount,
      method: data.method,
      currency: data.currency,
      ipAddress,
      userAgent,
      metadata: data.metadata,
    });
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('x-mp-signature') mpSignature?: string,
  ) {
    const signature = stripeSignature || mpSignature;
    return this.paymentsService.processWebhook(provider, payload, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  async getPaymentHistory(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
  ) {
    return this.paymentsService.getPaymentHistory(userId, { status, method });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/refund')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment (Admin only)' })
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() data: { amount?: number; reason?: string },
  ) {
    return this.paymentsService.refundPayment(
      paymentId,
      data.amount,
      data.reason,
    );
  }
}
