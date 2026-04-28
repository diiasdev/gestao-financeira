export const FINANCE_UPDATED_EVENT = "finance:transactions-updated";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);

export type FinanceTransactionType = "INCOME" | "EXPENSE";

export type FinanceTransaction = {
  id: string;
  type: FinanceTransactionType;
  description: string;
  amount: number | string;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string | null;
  annualRate?: number | string | null;
  createdAt: string;
  updatedAt: string;
};

type FinanceTransactionsResponse =
  | FinanceTransaction[]
  | {
      data?: unknown;
    };

export function toAmountNumber(amount: number | string): number {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : 0;
  }

  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrencyBRL(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function formatDateBR(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatCategoryLabel(category: string): string {
  const normalized = category.replace(/[_-]+/g, " ").trim();
  if (!normalized) return "-";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export async function fetchTransactions(): Promise<FinanceTransaction[]> {
  const response = await fetch(`${API_BASE_URL}/finance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as movimentações.");
  }

  const payload = (await response.json()) as FinanceTransactionsResponse;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
    return payload.data as FinanceTransaction[];
  }

  return [];
}
