import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';
import fs from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

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

export type ReadReceiptDto = {
  receiptUrl: string;
};

export type ReceiptAutofillData = {
  type: TransactionType;
  description: string;
  amount: number;
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

  private parseCurrencyToNumber(rawValue: string): number {
    const normalized = rawValue.replace(/\./g, '').replace(',', '.');
    return Number(normalized);
  }

  private extractAmountFromText(text: string): number | null {
    const valueMatch =
      text.match(/Valor\s+original:\s*R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i) ??
      text.match(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i);

    if (!valueMatch || !valueMatch[1]) return null;

    const amount = this.parseCurrencyToNumber(valueMatch[1]);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private parseDateTimeBrToIso(dateBr: string, timeBr?: string): string | null {
    const [dayRaw, monthRaw, yearRaw] = dateBr.split('/');
    if (!dayRaw || !monthRaw || !yearRaw) return null;

    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);

    const [hhRaw, mmRaw, ssRaw] = (timeBr ?? '12:00:00').split(':');
    const hours = Number(hhRaw ?? '12');
    const minutes = Number(mmRaw ?? '00');
    const seconds = Number(ssRaw ?? '00');

    const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
  }

  private parseDateWithPtMonthToIso(
    dayRaw: string,
    monthRaw: string,
    yearRaw: string,
    timeBr?: string,
  ): string | null {
    const monthMap: Record<string, number> = {
      janeiro: 0,
      fevereiro: 1,
      marco: 2,
      abril: 3,
      maio: 4,
      junho: 5,
      julho: 6,
      agosto: 7,
      setembro: 8,
      outubro: 9,
      novembro: 10,
      dezembro: 11,
    };

    const day = Number(dayRaw);
    const month = monthMap[this.normalizeText(monthRaw)];
    const year = Number(yearRaw);
    if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) {
      return null;
    }

    const [hhRaw, mmRaw, ssRaw] = (timeBr ?? '12:00:00').split(':');
    const hours = Number(hhRaw ?? '12');
    const minutes = Number(mmRaw ?? '00');
    const seconds = Number(ssRaw ?? '00');

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
  }

  private extractRecipient(text: string): string | null {
    const lines = text
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (this.normalizeText(line).startsWith('para')) {
        const nextLine = lines[index + 1];
        if (!nextLine) continue;

        const cleaned = nextLine.replace(/^[\d.\-*\/\s]+/, '').trim();
        const fallback = nextLine.trim();
        const recipient = cleaned || fallback;

        if (recipient) {
          return recipient.slice(0, 120);
        }
      }

      if (this.normalizeText(line).startsWith('recebido de')) {
        const currentLineValue = line.replace(/recebido\s+de\s*/i, '').trim();
        if (currentLineValue) {
          return currentLineValue.slice(0, 120);
        }

        const nextLine = lines[index + 1];
        if (nextLine) {
          return nextLine.trim().slice(0, 120);
        }
      }
    }

    return null;
  }

  private extractDateFromText(text: string): string | null {
    const normalized = this.normalizeText(text).replace(/\s+/g, ' ');
    const withTime = normalized.match(
      /realizad[oa]\s+em\s*([0-3]?\d\/[01]?\d\/\d{4})\s*(?:as)\s*([0-2]?\d:[0-5]\d(?::[0-5]\d)?)/i,
    );

    if (withTime && withTime[1]) {
      return this.parseDateTimeBrToIso(withTime[1], withTime[2]);
    }

    const dateOnly = normalized.match(/\b([0-3]?\d\/[01]?\d\/\d{4})\b/);
    if (dateOnly && dateOnly[1]) {
      return this.parseDateTimeBrToIso(dateOnly[1]);
    }

    const dateWithMonth = normalized.match(
      /\b([0-3]?\d)\s+de\s+([a-zç]+)\s+de\s+(\d{4})\s*(?:as\s*([0-2]?\d:[0-5]\d(?::[0-5]\d)?))?/i,
    );
    if (dateWithMonth) {
      return this.parseDateWithPtMonthToIso(
        dateWithMonth[1],
        dateWithMonth[2],
        dateWithMonth[3],
        dateWithMonth[4],
      );
    }

    return null;
  }

  private extractTransactionType(text: string): TransactionType {
    const normalized = this.normalizeText(text);

    if (
      normalized.includes('recebido') ||
      normalized.includes('recebimento') ||
      normalized.includes('credito em conta') ||
      normalized.includes('creditado')
    ) {
      return 'INCOME';
    }

    if (
      normalized.includes('enviado') ||
      normalized.includes('transferido') ||
      normalized.includes('pago') ||
      normalized.includes('pagamento') ||
      normalized.includes('comprovante de pix')
    ) {
      return 'EXPENSE';
    }

    return 'EXPENSE';
  }

  private async readImageText(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker('por+eng');

    try {
      const result = await worker.recognize(imageBuffer);
      return result.data.text?.trim() ?? '';
    } finally {
      await worker.terminate();
    }
  }

  private async readImageTextFromDataUrl(dataUrl: string): Promise<string> {
    const base64 = dataUrl.split(',')[1] ?? '';
    if (!base64) {
      throw new Error('Imagem inválida.');
    }

    return this.readImageText(Buffer.from(base64, 'base64'));
  }

  readReceipt = async (receiptSource: string) => {
    try {
      if (!receiptSource?.trim()) {
        throw new Error('Comprovante não informado.');
      }

      if (receiptSource.startsWith('data:image/')) {
        const imageText = await this.readImageTextFromDataUrl(receiptSource);
        return {
          success: true,
          message: 'Sucesso ao Ler Comprovante',
          data: imageText,
        };
      }

      let pdfBuffer: Buffer;
      if (receiptSource.startsWith('data:application/pdf;base64,')) {
        const base64 = receiptSource.split(',')[1] ?? '';
        pdfBuffer = Buffer.from(base64, 'base64');
      } else {
        const fileBuffer = fs.readFileSync(receiptSource);
        const extension = path.extname(receiptSource).toLowerCase();

        if (['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
          const imageText = await this.readImageText(fileBuffer);
          return {
            success: true,
            message: 'Sucesso ao Ler Comprovante',
            data: imageText,
          };
        }

        pdfBuffer = fileBuffer;
      }

      if (pdfBuffer.subarray(0, 4).toString('ascii') !== '%PDF') {
        throw new Error('Arquivo informado não é um PDF válido.');
      }

      const parser = new PDFParse({ data: pdfBuffer });
      let data;
      try {
        data = await parser.getText();
      } finally {
        await parser.destroy();
      }

      return {
        success: true,
        message: 'Sucesso ao Ler Comprovante',
        data: data.text?.trim() ?? '',
      };
    } catch (error: any) {
      console.error('Erro ao ler comprovante: ', error);

      return {
        success: false,
        message: error?.message ?? 'Erro ao ler comprovante',
        data: [],
      };
    }
  };

  createMovimentToReceipt = async (receiptSource: string) => {
    try {
      const read = await this.readReceipt(receiptSource);
      if (!read.success || typeof read.data !== 'string') {
        throw new Error(typeof read.message === 'string' ? read.message : 'Erro ao ler comprovante.');
      }

      const text = read.data;
      const normalizedText = this.normalizeText(text);
      if (!normalizedText.includes('pix')) {
        throw new Error('Formato de comprovante não suportado para preenchimento automático.');
      }

      const amount = this.extractAmountFromText(text);
      if (!amount) {
        throw new Error('Não foi possível identificar o valor da saída no comprovante.');
      }

      const recipient = this.extractRecipient(text);
      const type = this.extractTransactionType(text);

      const autofillData: ReceiptAutofillData = {
        type,
        description:
          recipient && type === 'INCOME'
            ? `Pix de ${recipient}`
            : recipient
              ? `Pix para ${recipient}`
              : type === 'INCOME'
                ? 'Entrada via Pix'
                : 'Despesa via Pix',
        amount,
        date: this.extractDateFromText(text) ?? new Date().toISOString(),
        paymentMethod: 'pix',
        receiptUrl: receiptSource,
      };

      return {
        success: true,
        message: 'Comprovante lido com sucesso.',
        data: autofillData,
      };
    } catch (error: any) {
      console.error('Erro ao gerar movimentação pelo comprovante: ', error);
      return {
        success: false,
        message: error?.message ?? 'Erro ao gerar movimentação pelo comprovante',
        data: [],
      };
    }
  };
}
