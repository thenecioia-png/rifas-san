import {
  IsString,
  IsNumber,
  IsDecimal,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRaffleDto {
  @ApiProperty({ example: 'Rifa de Auto 2024' })
  @IsString()
  @IsNotEmpty()
  @Max(255)
  title: string;

  @ApiProperty({ example: 'Gran rifa de un auto deportivo 0km' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Auto BMW M4 2024' })
  @IsString()
  @IsNotEmpty()
  prizeName: string;

  @ApiProperty({ example: 85000.00 })
  @IsDecimal({ decimal_digits: '2' })
  prizeValue: number;

  @ApiProperty({ example: 10.00 })
  @IsDecimal({ decimal_digits: '2' })
  ticketPrice: number;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(1)
  @Max(100000)
  totalTickets: number;

  @ApiProperty({ example: '2024-02-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '2024-03-15T20:00:00Z' })
  @IsDateString()
  drawDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prizeDescription?: string;
}
