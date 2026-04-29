import { MonthlyController } from './monthly.controller';
import { MonthlyService } from './monthly.service';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [NotifyModule],
  controllers: [MonthlyController],
  providers: [MonthlyService, PrismaService],
  exports: [MonthlyService],
})
export class MonthlyModule {}
