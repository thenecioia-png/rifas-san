import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      // Auto-create wallet if it doesn't exist
      return this.createWallet(userId);
    }

    return wallet;
  }

  async createWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.wallet.create({
      data: { userId },
    });
  }

  async deposit(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const newBalance = Number(wallet.balance) + amount;

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          totalDeposited: { increment: amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'DEPOSIT',
          amount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description,
          referenceId,
        },
      });

      this.logger.log(`Deposit of ${amount} to wallet ${wallet.id}`);
      return transaction;
    });
  }

  async withdraw(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = Number(wallet.balance) - amount;

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          totalWithdrawn: { increment: amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'WITHDRAWAL',
          amount: -amount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description,
          referenceId,
        },
      });

      this.logger.log(`Withdrawal of ${amount} from wallet ${wallet.id}`);
      return transaction;
    });
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
