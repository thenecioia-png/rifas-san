import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SanService } from './san.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('SAN - Savings Groups')
@Controller('san')
export class SanController {
  constructor(private readonly sanService: SanService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new SAN group (Admin only)' })
  async createGroup(
    @CurrentUser('id') adminId: string,
    @Body() data: {
      name: string;
      description?: string;
      totalMembers: number;
      contributionAmount: number;
      frequency: string;
      startDate: string;
      lateFeePercentage?: number;
      gracePeriodDays?: number;
    },
  ) {
    return this.sanService.createSanGroup(adminId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('groups/:id/join')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a SAN group' })
  async joinGroup(
    @CurrentUser('id') userId: string,
    @Param('id') sanGroupId: string,
  ) {
    return this.sanService.joinSanGroup(sanGroupId, userId);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all SAN groups' })
  async findAllGroups() {
    // Implementation needed
    return { message: 'Get all SAN groups' };
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get SAN group details' })
  async getGroupDetails(@Param('id') id: string) {
    return this.sanService.getSanGroupDetails(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my SAN groups' })
  async getMyGroups(@CurrentUser('id') userId: string) {
    return this.sanService.getUserSanGroups(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record SAN payment (Admin only)' })
  async recordPayment(
    @Body() data: {
      sanGroupId: string;
      memberId: string;
      roundNumber: number;
      amount: number;
      paymentMethod: string;
      paymentReference?: string;
    },
  ) {
    return this.sanService.recordSanPayment(
      data.sanGroupId,
      data.memberId,
      data.roundNumber,
      data.amount,
      data.paymentMethod,
      data.paymentReference,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('late-payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get late payments (Admin only)' })
  async getLatePayments(@Query('sanGroupId') sanGroupId?: string) {
    return this.sanService.getLatePayments(sanGroupId);
  }
}
