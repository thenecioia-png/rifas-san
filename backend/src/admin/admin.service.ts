import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalRaffles,
      activeRaffles,
      totalSanGroups,
      activeSanGroups,
      totalPayments,
      totalRevenue,
      todayRevenue,
      ticketsSold,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.raffle.count(),
      this.prisma.raffle.count({ where: { status: 'ACTIVE' } }),
      this.prisma.sanGroup.count(),
      this.prisma.sanGroup.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count(),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.ticket.count({ where: { status: 'SOLD' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: await this.getNewUsersToday(),
      },
      raffles: {
        total: totalRaffles,
        active: activeRaffles,
        ticketsSold,
      },
      san: {
        total: totalSanGroups,
        active: activeSanGroups,
      },
      payments: {
        total: totalPayments,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
      },
    };
  }

  async getUserStats() {
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const usersByStatus = await this.prisma.user.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      byRole: usersByRole.map((u) => ({
        role: u.role,
        count: u._count.role,
      })),
      byStatus: usersByStatus.map((u) => ({
        status: u.status,
        count: u._count.status,
      })),
    };
  }

  async getRevenueReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    // This would typically use raw SQL for date grouping
    // Simplified version for demonstration
    return {
      period,
      message: 'Revenue report endpoint - implement with raw SQL queries',
    };
  }

  private async getNewUsersToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
  }
}
