import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
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

  @Patch(':id/edit')
  async editTransactions(@Param('id') id: string, @Body() dto: TransactionDto) {
    return this.financeService.editTransactions(id, dto);
  }

  @Delete(':id/delete')
  async deleteTransaction(@Param('id') id: string) {
    return this.financeService.excluidTransactions(id);
  }
}
