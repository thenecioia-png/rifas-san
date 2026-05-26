import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet' })
  async getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit to wallet' })
  async deposit(
    @CurrentUser('id') userId: string,
    @Body() data: { amount: number; description?: string },
  ) {
    return this.walletService.deposit(
      userId,
      data.amount,
      data.description || 'Wallet deposit',
    );
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw from wallet' })
  async withdraw(
    @CurrentUser('id') userId: string,
    @Body() data: { amount: number; description?: string },
  ) {
    return this.walletService.withdraw(
      userId,
      data.amount,
      data.description || 'Wallet withdrawal',
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
