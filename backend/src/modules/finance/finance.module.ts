import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [NotifyModule],
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService],
  exports: [FinanceService],
})
export class FinanceModule {}
