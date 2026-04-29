import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type NotifyDto = {
  title: string;
  type: string;
  message: string;
  is_read?: string;
};

@Injectable()
export class NotifyService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeReadValue(value?: string): string {
    if (!value) return 'false';
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'read'
      ? 'true'
      : 'false';
  }

  private isRead(value: string): boolean {
    return this.normalizeReadValue(value) === 'true';
  }

  async sendNotify(dto: NotifyDto) {
    try {
      const newNotify = await this.prisma.notify.create({
        data: {
          title: dto.title,
          type: dto.type,
          message: dto.message,
          is_read: this.normalizeReadValue(dto.is_read),
          read_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Sucesso ao enviar notificação',
        data: newNotify,
      };
    } catch (error: any) {
      console.error('Erro ao enviar notificação: ', error);
      return {
        success: false,
        message: 'Erro ao enviar notificação',
        data: [],
      };
    }
  }

  async sendNotifyIfNotExists(dto: NotifyDto) {
    try {
      const currentNotify = await this.prisma.notify.findFirst({
        where: {
          title: dto.title,
          type: dto.type,
          message: dto.message,
        },
      });

      if (currentNotify) {
        return {
          success: true,
          message: 'Notificação já existente',
          data: currentNotify,
        };
      }

      return this.sendNotify(dto);
    } catch (error: any) {
      console.error('Erro ao verificar notificação: ', error);
      return {
        success: false,
        message: 'Erro ao verificar notificação',
        data: [],
      };
    }
  }

  async getNotify(limit?: number) {
    const take = Number.isFinite(limit) ? Math.min(Math.max(limit ?? 30, 1), 100) : 30;
    const rows = await this.prisma.notify.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take,
    });

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        unread: !this.isRead(row.is_read),
      })),
    };
  }

  async markAsRead(id: string) {
    try {
      const updated = await this.prisma.notify.update({
        where: { id },
        data: {
          is_read: 'true',
          read_at: new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida: ', error);
      return {
        success: false,
        message: 'Erro ao marcar notificação como lida',
        data: [],
      };
    }
  }

  async markAllAsRead() {
    try {
      const updated = await this.prisma.notify.updateMany({
        where: {
          NOT: {
            is_read: 'true',
          },
        },
        data: {
          is_read: 'true',
          read_at: new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      console.error('Erro ao marcar notificações como lidas: ', error);
      return {
        success: false,
        message: 'Erro ao marcar notificações como lidas',
        data: [],
      };
    }
  }
}
