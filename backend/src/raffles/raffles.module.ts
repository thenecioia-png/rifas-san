import { Module } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { RafflesController } from './raffles.controller';

@Module({
  providers: [RafflesService],
  controllers: [RafflesController],
  exports: [RafflesService],
})
export class RafflesModule {}
