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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RafflesService } from './raffles.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Raffles')
@Controller('raffles')
export class RafflesController {
  constructor(private readonly rafflesService: RafflesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new raffle (Admin only)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRaffleDto,
  ) {
    return this.rafflesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all raffles' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rafflesService.findAll({
      status: status as any,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get raffle by ID' })
  async findOne(@Param('id') id: string) {
    return this.rafflesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reserve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reserve tickets' })
  async reserveTickets(
    @CurrentUser('id') userId: string,
    @Param('id') raffleId: string,
    @Body('ticketNumbers') ticketNumbers: number[],
  ) {
    return this.rafflesService.reserveTickets(raffleId, userId, ticketNumbers);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my tickets' })
  async getMyTickets(@CurrentUser('id') userId: string) {
    return this.rafflesService.getMyTickets(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/draw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Draw winner (Admin only)' })
  async drawWinner(
    @CurrentUser('id') adminId: string,
    @Param('id') raffleId: string,
  ) {
    return this.rafflesService.drawWinner(raffleId, adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('cleanup-reservations')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release expired reservations (Admin only)' })
  async releaseExpiredReservations() {
    return this.rafflesService.releaseExpiredReservations();
  }
}
