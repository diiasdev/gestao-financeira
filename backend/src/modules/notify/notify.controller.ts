import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { type NotifyDto, NotifyService } from './notify.service';

@Controller('notify')
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post()
  async sendNotify(@Body() dto: NotifyDto) {
    return this.notifyService.sendNotify(dto);
  }

  @Get()
  async getNotify(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    return this.notifyService.getNotify(Number.isFinite(parsedLimit) ? parsedLimit : undefined);
  }

  @Patch('read-all')
  async markAllAsRead() {
    return this.notifyService.markAllAsRead();
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notifyService.markAsRead(id);
  }
}
