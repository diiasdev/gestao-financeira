import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.mensalidades.findMany({
      orderBy: {
        date: 'asc',
      },
    });
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
}
