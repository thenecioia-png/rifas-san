import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: any;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    description: string;
    ipAddress: string;
    userAgent: string;
    requestMethod: string;
    requestPath: string;
    requestBody?: any;
    statusCode?: number;
    durationMs?: number;
  }) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          description: data.description,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestMethod: data.requestMethod,
          requestPath: data.requestPath,
          requestBody: data.requestBody,
          statusCode: data.statusCode,
          durationMs: data.durationMs,
        },
      });

      this.logger.debug(`Audit log created: ${auditLog.id}`);
      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw - audit failure shouldn't break the operation
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogStats() {
    const [
      totalLogs,
      todayLogs,
      actionCounts,
    ] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
      }),
    ]);

    return {
      totalLogs,
      todayLogs,
      actionCounts: actionCounts.map((ac) => ({
        action: ac.action,
        count: ac._count.action,
      })),
    };
  }
}
