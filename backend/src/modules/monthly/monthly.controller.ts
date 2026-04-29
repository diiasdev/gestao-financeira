import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { type MonthlyDto, MonthlyService } from './monthly.service';

@Controller('monthly')
export class MonthlyController {
  constructor(private readonly monthlyService: MonthlyService) {}

  @Post()
  async registerMonthly(@Body() dto: MonthlyDto) {
    return this.monthlyService.registerMonthly(dto);
  }

  @Get()
  async getMonthly() {
    return this.monthlyService.getMonthly();
  }

  @Patch(':id/paid')
  async paidStatus(@Param('id') id: string) {
    return this.monthlyService.paidStatus(id);
  }

  @Patch(':id/edit')
  async editMonthly(@Param('id') id: string, @Body() dto: MonthlyDto) {
    return this.monthlyService.editMonthly(id, dto);
  }

  @Delete(':id/delete')
  async deleteMonthly(@Param('id') id: string) {
    return this.monthlyService.deleteMonthly(id);
  }
}
