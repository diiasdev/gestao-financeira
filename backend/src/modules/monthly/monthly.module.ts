import { MonthlyController } from './monthly.controller';
import { MonthlyService } from './monthly.service';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MonthlyController],
  providers: [MonthlyService, PrismaService],
  exports: [MonthlyService],
})
export class MonthlyModule {}
