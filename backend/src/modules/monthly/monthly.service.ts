import { Injectable } from '@nestjs/common';
import type { Mensalidades } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';

export type MonthlyDto = {
  name: string;
  category: string;
  value: string;
  installments: string;
  date: string;
  status: string;
};

@Injectable()
export class MonthlyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyService: NotifyService,
  ) {}

  private normalizeStatus(status: string | null | undefined): string {
    return (status ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isPaidStatus(status: string | null | undefined): boolean {
    const normalizedStatus = this.normalizeStatus(status);
    return normalizedStatus === 'pago' || normalizedStatus === 'paid' || normalizedStatus === 'quitado';
  }

  private toDate(input: string | Date): Date | null {
    const date = input instanceof Date ? input : new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const msInOneDay = 1000 * 60 * 60 * 24;
    return Math.floor((dueStart.getTime() - todayStart.getTime()) / msInOneDay);
  }

  private formatDateBR(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  private async createDueSoonNotify(monthly: Mensalidades) {
    if (this.isPaidStatus(monthly.status)) return;

    const dueDate = this.toDate(monthly.date);
    if (!dueDate) return;

    const daysUntilDue = this.getDaysUntilDue(dueDate);
    if (daysUntilDue < 0 || daysUntilDue > 7) return;

    await this.notifyService.sendNotifyIfNotExists({
      title: 'Mensalidade perto do vencimento',
      type: 'monthly.due_soon',
      message: `"${monthly.name}" vence em ${this.formatDateBR(dueDate)}.`,
      is_read: 'false',
    });
  }

  async registerMonthly(dto: MonthlyDto) {
    try {
      const newMonthly = await this.prisma.mensalidades.create({
        data: {
          name: dto.name,
          category: dto.category,
          value: dto.value,
          installments: dto.installments,
          date: dto.date,
          status: dto.status,
        },
      });

      console.log('Mensalidade Registrada: ', newMonthly);
      await this.createDueSoonNotify(newMonthly);

      return {
        success: true,
        message: 'Sucesso ao cadastrar Mensalidade',
        data: newMonthly,
      };
    } catch (error: any) {
      console.error('Erro ao registrar mensaliade: ', error);
      return {
        success: false,
        message: 'Erro ao registrar Mensalidade',
        data: [],
      };
    }
  }

  async getMonthly() {
    const monthlyList = await this.prisma.mensalidades.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    await Promise.all(
      monthlyList.map((monthly) => this.createDueSoonNotify(monthly)),
    );

    return monthlyList;
  }

  async paidStatus(monthlyId: string) {
    try {
      const currentMonthly = await this.prisma.mensalidades.findUnique({
        where: {
          id: monthlyId,
        },
      });

      if (!currentMonthly) {
        return {
          success: false,
          message: 'Mensalidade não encontrada.',
          data: [],
        };
      }

      const paidMonthly = await this.prisma.mensalidades.update({
        where: {
          id: monthlyId,
        },
        data: {
          status: 'Pago',
        },
      });

      await this.notifyService.sendNotify({
        title: 'Mensalidade marcada como paga',
        type: 'monthly.paid',
        message: `"${paidMonthly.name}" foi marcada como paga.`,
        is_read: 'false',
      });

      return {
        success: true,
        message: 'Sucesso ao alterar status',
        data: paidMonthly,
      };
    } catch (error: any) {
      console.error('erro ao mudar status da mensaliade: ', error);

      return {
        success: false,
        message: 'Erro ao mudar status da mensalidade',
        data: [],
      };
    }
  }

  async editMonthly(monthlyId: string, dto: MonthlyDto) {
    try {
      const currentMonthly = await this.prisma.mensalidades.findUnique({
        where: {
          id: monthlyId,
        },
      });

      if (!currentMonthly) {
        return {
          success: false,
          message: 'Mensalidade não encontrada.',
          data: [],
        };
      }

      const updatedMonthly = await this.prisma.mensalidades.update({
        where: {
          id: monthlyId,
        },
        data: {
          name: dto.name,
          category: dto.category,
          value: dto.value,
          installments: dto.installments,
          date: dto.date,
          status: dto.status,
        },
      });

      await this.notifyService.sendNotify({
        title: 'Mensalidade editada',
        type: 'monthly.updated',
        message: `"${updatedMonthly.name}" foi atualizada.`,
        is_read: 'false',
      });

      if (!this.isPaidStatus(updatedMonthly.status)) {
        await this.createDueSoonNotify(updatedMonthly);
      }

      return {
        success: true,
        message: 'Sucesso ao editar mensalidade',
        data: updatedMonthly,
      };
    } catch (error: any) {
      console.error('erro ao editar mensalidade: ', error);
      return {
        success: false,
        message: 'Erro ao editar mensalidade',
        data: [],
      };
    }
  }

  async deleteMonthly(monthlyId: string) {
    try {
      const currentMonthly = await this.prisma.mensalidades.findUnique({
        where: {
          id: monthlyId,
        },
      });

      if (!currentMonthly) {
        return {
          success: false,
          message: 'Mensalidade não encontrada.',
          data: [],
        };
      }

      const deletedMonthly = await this.prisma.mensalidades.delete({
        where: {
          id: monthlyId,
        },
      });

      await this.notifyService.sendNotify({
        title: 'Mensalidade excluída',
        type: 'monthly.deleted',
        message: `"${deletedMonthly.name}" foi removida.`,
        is_read: 'false',
      });

      return {
        success: true,
        message: 'Sucesso ao excluir mensalidade',
        data: deletedMonthly,
      };
    } catch (error: any) {
      console.error('erro ao excluir mensalidade: ', error);
      return {
        success: false,
        message: 'Erro ao excluir mensalidade',
        data: [],
      };
    }
  }
}
