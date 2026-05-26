import { Module } from '@nestjs/common';
import { SanService } from './san.service';
import { SanController } from './san.controller';

@Module({
  providers: [SanService],
  controllers: [SanController],
  exports: [SanService],
})
export class SanModule {}
