import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';

export type TransactionDto = {
  type: TransactionType;
  description: string;
  amount: number;
  annualRate?: number;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
};

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyService: NotifyService,
  ) {}

  private formatCurrencyBRL(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(amount));
  }

  async registerTransaction(dto: TransactionDto) {
    try {
      const newMoviment = await this.prisma.transaction.create({
        data: {
          type: dto.type,
          description: dto.description,
          amount: dto.amount,
          annualRate: dto.annualRate,
          category: dto.category,
          date: dto.date,
          paymentMethod: dto.paymentMethod,
          receiptUrl: dto.receiptUrl,
        },
      });

      if (!newMoviment) {
        console.error('Sem movimento');
        return;
      }

      await this.notifyService.sendNotify({
        title: 'Movimentação registrada',
        type: 'transaction.created',
        message: `${dto.type === 'INCOME' ? 'Entrada' : 'Saída'} de ${this.formatCurrencyBRL(dto.amount)} em "${dto.category}" (${dto.description}) foi registrada.`,
        is_read: 'false',
      });

      return {
        success: true,
        message: 'Sucesso ao Registar Movimento',
        data: newMoviment,
      };
    } catch (error: any) {
      console.error('Erro ao Registrar Transição', error);
      return {
        success: false,
        message: 'Erro ao Registrar Transição',
        data: [],
      };
    }
  }

  async getTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: {
        date: 'desc',
      },
    });
  }

  editTransactions = async (id: string, dto: TransactionDto) => {
    try {
      const edited = await this.prisma.transaction.update({
        where: { id },
        data: {
          type: dto.type,
          description: dto.description,
          amount: dto.amount,
          annualRate: dto.annualRate,
          category: dto.category,
          date: dto.date,
          paymentMethod: dto.paymentMethod,
          receiptUrl: dto.receiptUrl,
        },
      });

      return {
        success: true,
        message: 'Sucesso ao editar Notificação',
        data: edited,
      };
    } catch (error: any) {
      console.error('Erro ao editar Movimentação: ', error);
      return {
        success: false,
        message: 'Erro ao editar movimentação',
        data: [],
      };
    }
  };

  excluidTransactions = async (id: string) => {
    try {
      const exclued = await this.prisma.transaction.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Sucesso ao excluir Movimentação',
        data: exclued,
      };
    } catch (error: any) {
      console.error('Erro ao excluir Movimentação: ', error);

      return {
        success: false,
        message: 'Erro ao excluir Movimetação',
        data: [],
      };
    }
  };
}
