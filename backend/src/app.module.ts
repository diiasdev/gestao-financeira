import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [FinanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
