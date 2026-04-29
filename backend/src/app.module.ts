import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinanceModule } from './modules/finance/finance.module';
import { MonthlyModule } from './modules/monthly/monthly.module';

@Module({
  imports: [FinanceModule, MonthlyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
