import { NotifyService } from './notify.service';
import { NotifyController } from './notify.controller';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [NotifyController],
  providers: [NotifyService, PrismaService],
  exports: [NotifyService],
})
export class NotifyModule {}
