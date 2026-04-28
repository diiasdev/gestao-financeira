import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type TransactionDto = {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async registerTransaction(dto: TransactionDto) {
    try {
      // Campos: Tipo (Entrada - Saida), Descricao, Valor, Categoria, Data, Forma de pagamento, Comprovante.

      const newMoviment = await this.prisma.transaction.create({
        data: {
          type: dto.type,
          description: dto.description,
          amount: dto.amount,
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
}
