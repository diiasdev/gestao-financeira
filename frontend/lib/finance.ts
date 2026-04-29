export const FINANCE_UPDATED_EVENT = "finance:transactions-updated";

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const port = process.env.NEXT_PUBLIC_API_PORT?.trim() || "3001";

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }

  return `http://localhost:${port}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

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

export type UpdateFinanceTransactionInput = {
  id: string;
  type: FinanceTransactionType;
  description: string;
  amount: number;
  annualRate?: number;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
};

type FinanceTransactionsResponse =
  | FinanceTransaction[]
  | {
      data?: unknown;
    };

type FinanceMutationResponse = {
  success?: boolean;
  message?: unknown;
  data?: unknown;
};

function getApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;

  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(message)) {
    const parsed = message.filter((item): item is string => typeof item === "string");
    return parsed.length > 0 ? parsed.join(", ") : null;
  }

  return null;
}

function toFinanceTransaction(payload: unknown): FinanceTransaction | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.type !== "string" ||
    typeof row.description !== "string" ||
    (typeof row.amount !== "number" && typeof row.amount !== "string") ||
    typeof row.category !== "string" ||
    typeof row.date !== "string" ||
    typeof row.paymentMethod !== "string" ||
    typeof row.createdAt !== "string" ||
    typeof row.updatedAt !== "string"
  ) {
    return null;
  }

  return row as unknown as FinanceTransaction;
}

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

export async function updateTransaction(
  input: UpdateFinanceTransactionInput
): Promise<FinanceTransaction> {
  const response = await fetch(`${API_BASE_URL}/finance/${input.id}/edit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: input.type,
      description: input.description,
      amount: input.amount,
      annualRate: input.annualRate,
      category: input.category,
      date: input.date,
      paymentMethod: input.paymentMethod,
      receiptUrl: input.receiptUrl,
    }),
  });

  const payload = (await response.json().catch(() => null)) as FinanceMutationResponse | null;
  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload) ?? "Não foi possível editar a movimentação.");
  }

  if (payload?.success === false) {
    throw new Error(getApiErrorMessage(payload) ?? "Não foi possível editar a movimentação.");
  }

  const updated =
    payload && typeof payload === "object" && "data" in payload
      ? toFinanceTransaction(payload.data)
      : null;

  if (!updated) {
    throw new Error("Resposta inválida ao editar movimentação.");
  }

  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/finance/${id}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as FinanceMutationResponse | null;
  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload) ?? "Não foi possível excluir a movimentação.");
  }

  if (payload?.success === false) {
    throw new Error(getApiErrorMessage(payload) ?? "Não foi possível excluir a movimentação.");
  }
}
