import { Body, Controller, Get, Post } from '@nestjs/common';
import { FinanceService } from './finance.service';
import type { TransactionDto } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  async registerTransaction(@Body() dto: TransactionDto) {
    return this.financeService.registerTransaction(dto);
  }

  @Get()
  async getTransactions() {
    return this.financeService.getTransactions();
  }
}
