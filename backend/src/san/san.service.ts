import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanMember, SanSchedule } from '@prisma/client';

@Injectable()
export class SanService {
  private readonly logger = new Logger(SanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSanGroup(adminId: string, data: {
    name: string;
    description?: string;
    totalMembers: number;
    contributionAmount: number;
    frequency: string;
    startDate: string;
    lateFeePercentage?: number;
    gracePeriodDays?: number;
  }) {
    const startDate = new Date(data.startDate);
    const totalRounds = data.totalMembers;
    
    // Calculate end date based on frequency
    const endDate = this.calculateEndDate(startDate, totalRounds, data.frequency);

    const sanGroup = await this.prisma.sanGroup.create({
      data: {
        name: data.name,
        description: data.description,
        totalMembers: data.totalMembers,
        contributionAmount: data.contributionAmount,
        frequency: data.frequency,
        startDate,
        endDate,
        totalRounds,
        lateFeePercentage: data.lateFeePercentage || 5,
        gracePeriodDays: data.gracePeriodDays || 3,
        status: 'PENDING',
      },
    });

    this.logger.log(`SAN group created: ${sanGroup.id}`);
    return sanGroup;
  }

  async joinSanGroup(sanGroupId: string, userId: string) {
    const sanGroup = await this.prisma.sanGroup.findUnique({
      where: { id: sanGroupId },
      include: {
        members: true,
      },
    });

    if (!sanGroup) {
      throw new NotFoundException('SAN group not found');
    }

    if (sanGroup.status !== 'PENDING') {
      throw new BadRequestException('SAN group is not accepting new members');
    }

    if (sanGroup.members.length >= sanGroup.totalMembers) {
      throw new ConflictException('SAN group is full');
    }

    // Check if user is already a member
    const existingMember = sanGroup.members.find((m: SanMember) => m.userId === userId);
    if (existingMember) {
      throw new ConflictException('User is already a member of this SAN group');
    }

    const turnNumber = sanGroup.members.length + 1;

    const member = await this.prisma.sanMember.create({
      data: {
        sanGroupId,
        userId,
        turnNumber,
        status: 'PENDING',
      },
    });

    // If group is now full, activate it and generate schedule
    if (sanGroup.members.length + 1 >= sanGroup.totalMembers) {
      await this.activateSanGroup(sanGroupId);
    }

    this.logger.log(`User ${userId} joined SAN group ${sanGroupId} with turn ${turnNumber}`);
    return member;
  }

  async activateSanGroup(sanGroupId: string) {
    const sanGroup = await this.prisma.sanGroup.findUnique({
      where: { id: sanGroupId },
      include: { members: true },
    });

    if (!sanGroup) {
      throw new NotFoundException('SAN group not found');
    }

    // Generate payment schedule
    const schedule = [];
    for (let round = 1; round <= sanGroup.totalRounds; round++) {
      const dueDate = this.calculateRoundDate(
        sanGroup.startDate,
        round,
        sanGroup.frequency,
      );

      // Find recipient for this round (turn-based)
      const recipient = sanGroup.members.find((m: SanMember) => m.turnNumber === round);

      schedule.push({
        sanGroupId,
        roundNumber: round,
        dueDate,
        recipientMemberId: recipient?.id,
        amount: Number(sanGroup.contributionAmount) * sanGroup.totalMembers,
      });
    }

    await this.prisma.sanSchedule.createMany({
      data: schedule,
    });

    // Update group status
    await this.prisma.sanGroup.update({
      where: { id: sanGroupId },
      data: {
        status: 'ACTIVE',
        currentRound: 1,
      },
    });

    // Update all pending members to active
    await this.prisma.sanMember.updateMany({
      where: { sanGroupId, status: 'PENDING' },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`SAN group ${sanGroupId} activated with ${sanGroup.totalRounds} rounds`);
  }

  async recordSanPayment(
    sanGroupId: string,
    memberId: string,
    roundNumber: number,
    amount: number,
    paymentMethod: string,
    paymentReference?: string,
  ) {
    const sanGroup = await this.prisma.sanGroup.findUnique({
      where: { id: sanGroupId },
      include: {
        members: true,
        schedule: true,
      },
    });

    if (!sanGroup) {
      throw new NotFoundException('SAN group not found');
    }

    const member = sanGroup.members.find((m: SanMember) => m.id === memberId);
    if (!member) {
      throw new NotFoundException('Member not found in this SAN group');
    }

    const schedule = sanGroup.schedule.find(
      (s: SanSchedule) => s.roundNumber === roundNumber,
    );

    if (!schedule) {
      throw new NotFoundException('Round not found');
    }

    // Calculate late fee if applicable
    const now = new Date();
    let lateFee = 0;
    if (now > schedule.dueDate) {
      const daysLate = Math.floor(
        (now.getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysLate > sanGroup.gracePeriodDays) {
        lateFee =
          (Number(sanGroup.contributionAmount) * Number(sanGroup.lateFeePercentage)) / 100;
      }
    }

    const totalPaid = amount + lateFee;

    const payment = await this.prisma.sanPayment.create({
      data: {
        sanGroupId,
        memberId,
        roundNumber,
        amount,
        lateFee,
        totalPaid,
        status: 'PAID',
        paymentMethod: paymentMethod as any,
        paymentReference,
        paidAt: now,
      },
    });

    // Update schedule
    await this.prisma.sanSchedule.update({
      where: {
        sanGroupId_roundNumber: {
          sanGroupId,
          roundNumber,
        },
      },
      data: {
        isPaid: true,
        paidAt: now,
      },
    });

    // Check if all members paid for this round
    const roundPayments = await this.prisma.sanPayment.count({
      where: {
        sanGroupId,
        roundNumber,
        status: 'PAID',
      },
    });

    if (roundPayments >= sanGroup.totalMembers) {
      // Move to next round
      if (sanGroup.currentRound < sanGroup.totalRounds) {
        await this.prisma.sanGroup.update({
          where: { id: sanGroupId },
          data: { currentRound: { increment: 1 } },
        });
      } else {
        // Complete the group
        await this.prisma.sanGroup.update({
          where: { id: sanGroupId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    this.logger.log(
      `Payment recorded for SAN ${sanGroupId}, member ${memberId}, round ${roundNumber}`,
    );

    return payment;
  }

  async getSanGroupDetails(sanGroupId: string) {
    const sanGroup = await this.prisma.sanGroup.findUnique({
      where: { id: sanGroupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            payments: true,
          },
        },
        schedule: {
          orderBy: { roundNumber: 'asc' },
        },
        payments: {
          include: {
            member: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sanGroup) {
      throw new NotFoundException('SAN group not found');
    }

    return sanGroup;
  }

  async getUserSanGroups(userId: string) {
    return this.prisma.sanMember.findMany({
      where: { userId },
      include: {
        sanGroup: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLatePayments(sanGroupId?: string) {
    const where = sanGroupId ? { sanGroupId } : {};
    
    const now = new Date();
    
    return this.prisma.sanSchedule.findMany({
      where: {
        ...where,
        isPaid: false,
        dueDate: { lt: now },
      },
      include: {
        sanGroup: {
          select: {
            id: true,
            name: true,
            contributionAmount: true,
            gracePeriodDays: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private calculateEndDate(
    startDate: Date,
    totalRounds: number,
    frequency: string,
  ): Date {
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'WEEKLY':
        date.setDate(date.getDate() + totalRounds * 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + totalRounds * 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + totalRounds);
        break;
      default:
        date.setMonth(date.getMonth() + totalRounds);
    }
    
    return date;
  }

  private calculateRoundDate(
    startDate: Date,
    round: number,
    frequency: string,
  ): Date {
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'WEEKLY':
        date.setDate(date.getDate() + (round - 1) * 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + (round - 1) * 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + (round - 1));
        break;
      default:
        date.setMonth(date.getMonth() + (round - 1));
    }
    
    return date;
  }
}
