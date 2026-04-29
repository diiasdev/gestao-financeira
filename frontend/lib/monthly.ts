import type { Mensalidade, MensalidadeCategory } from "@/components/mensalidades/types";
import { API_BASE_URL } from "@/lib/finance";

type MonthlyApiRecord = {
  id: string;
  name: string;
  category: string;
  value: string | number;
  installments: string;
  date: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type MonthlyListResponse =
  | MonthlyApiRecord[]
  | {
      data?: unknown;
    };

type MonthlyCreateResponse =
  | {
      success?: boolean;
      message?: string;
      data?: unknown;
    }
  | MonthlyApiRecord;

type MonthlyStatusResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

type MonthlyMutationResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export type RegisterMonthlyInput = {
  name: string;
  category: MensalidadeCategory;
  amount: number;
  dueDate: string;
  installmentsTotal: number;
};

export type UpdateMonthlyInput = {
  id: string;
  name: string;
  category: MensalidadeCategory;
  amount: number;
  dueDate: string;
  installmentsTotal: number;
  status?: string | null;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .trim();
}

function toCategory(value: string): MensalidadeCategory {
  const normalized = normalizeText(value);

  if (normalized.includes("moradia") || normalized.includes("condominio")) return "moradia";
  if (normalized.includes("utilidade") || normalized.includes("energia") || normalized.includes("agua")) {
    return "utilidades";
  }
  if (normalized.includes("assinatura") || normalized.includes("streaming")) return "assinaturas";
  if (normalized.includes("educacao") || normalized.includes("estudo")) return "educacao";
  if (normalized.includes("saude") || normalized.includes("academia")) return "saude";

  return "servicos";
}

function toAmount(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;

  if (!decimalSeparator) {
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const thousandSeparator = decimalSeparator === "," ? "." : ",";
  const withoutThousandSeparator = cleaned.split(thousandSeparator).join("");
  const normalized =
    decimalSeparator === ","
      ? withoutThousandSeparator.replace(",", ".")
      : withoutThousandSeparator;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInstallments(value: string): { current: number; total: number } {
  const numbers = (value.match(/\d+/g) ?? [])
    .map((chunk) => Number(chunk))
    .filter((chunk) => Number.isInteger(chunk) && chunk > 0);

  if (numbers.length >= 2) {
    const total = Math.max(numbers[0], numbers[1]);
    const current = Math.min(numbers[0], total);
    return { current, total };
  }

  if (numbers.length === 1) {
    return { current: 1, total: numbers[0] };
  }

  return { current: 1, total: 1 };
}

function isPaidStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeText(status);
  return normalized === "paid" || normalized === "pago" || normalized === "quitado";
}

function toMensalidade(record: MonthlyApiRecord): Mensalidade {
  const installments = parseInstallments(record.installments);

  return {
    id: record.id,
    name: record.name,
    category: toCategory(record.category),
    amount: toAmount(record.value),
    dueDate: record.date,
    installmentCurrent: installments.current,
    installmentTotal: installments.total,
    paidAt: isPaidStatus(record.status) ? record.updatedAt ?? record.date : null,
    statusRaw: record.status ?? null,
    updatedAt: record.updatedAt,
  };
}

function toApiDate(dueDate: string): string {
  const parsed = new Date(`${dueDate}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function getCreateErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}

function toMonthlyRecord(payload: unknown): MonthlyApiRecord | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.category !== "string" ||
    (typeof record.value !== "string" && typeof record.value !== "number") ||
    typeof record.installments !== "string" ||
    typeof record.date !== "string"
  ) {
    return null;
  }

  return record as MonthlyApiRecord;
}

export async function fetchMonthly(): Promise<Mensalidade[]> {
  const response = await fetch(`${API_BASE_URL}/monthly`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as mensalidades.");
  }

  const payload = (await response.json().catch(() => null)) as MonthlyListResponse | null;
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray(payload.data)
      ? payload.data
      : [];

  return rows.map((row) => toMonthlyRecord(row)).filter((row): row is MonthlyApiRecord => row !== null).map(toMensalidade);
}

export async function registerMonthly(input: RegisterMonthlyInput): Promise<Mensalidade> {
  const installmentsTotal = Math.max(1, Math.min(12, Math.trunc(input.installmentsTotal)));
  const payload = {
    name: input.name,
    category: input.category,
    value: input.amount.toString(),
    installments: `1/${installmentsTotal}`,
    date: toApiDate(input.dueDate),
    status: "pending",
  };

  const response = await fetch(`${API_BASE_URL}/monthly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawResponse = (await response.json().catch(() => null)) as MonthlyCreateResponse | null;

  if (!response.ok) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível cadastrar a mensalidade.");
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "success" in rawResponse &&
    rawResponse.success === false
  ) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível cadastrar a mensalidade.");
  }

  const createdRecord = rawResponse && typeof rawResponse === "object" && "data" in rawResponse
    ? toMonthlyRecord(rawResponse.data)
    : toMonthlyRecord(rawResponse);

  if (createdRecord) return toMensalidade(createdRecord);

  return {
    id: `mensalidade-${Date.now()}`,
    name: input.name,
    category: input.category,
    amount: input.amount,
    dueDate: payload.date,
    installmentCurrent: 1,
    installmentTotal: installmentsTotal,
    paidAt: null,
    statusRaw: "pending",
    updatedAt: new Date().toISOString(),
  };
}

export async function markMonthlyAsPaid(monthlyId: string): Promise<Mensalidade> {
  const response = await fetch(`${API_BASE_URL}/monthly/${monthlyId}/paid`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const rawResponse = (await response.json().catch(() => null)) as MonthlyStatusResponse | null;

  if (!response.ok) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível atualizar o status da mensalidade.");
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "success" in rawResponse &&
    rawResponse.success === false
  ) {
    throw new Error(
      getCreateErrorMessage(rawResponse) ?? "Não foi possível atualizar o status da mensalidade."
    );
  }

  const updatedRecord =
    rawResponse && typeof rawResponse === "object" && "data" in rawResponse
      ? toMonthlyRecord(rawResponse.data)
      : null;

  if (updatedRecord) return toMensalidade(updatedRecord);

  throw new Error("Resposta inválida ao atualizar status da mensalidade.");
}

export async function updateMonthly(input: UpdateMonthlyInput): Promise<Mensalidade> {
  const installmentsTotal = Math.max(1, Math.min(12, Math.trunc(input.installmentsTotal)));
  const payload = {
    name: input.name,
    category: input.category,
    value: input.amount.toString(),
    installments: `1/${installmentsTotal}`,
    date: toApiDate(input.dueDate),
    status: input.status ?? "pending",
  };

  const response = await fetch(`${API_BASE_URL}/monthly/${input.id}/edit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawResponse = (await response.json().catch(() => null)) as MonthlyMutationResponse | null;

  if (!response.ok) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível editar a mensalidade.");
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "success" in rawResponse &&
    rawResponse.success === false
  ) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível editar a mensalidade.");
  }

  const updatedRecord =
    rawResponse && typeof rawResponse === "object" && "data" in rawResponse
      ? toMonthlyRecord(rawResponse.data)
      : null;

  if (updatedRecord) return toMensalidade(updatedRecord);

  throw new Error("Resposta inválida ao editar mensalidade.");
}

export async function deleteMonthly(monthlyId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/monthly/${monthlyId}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const rawResponse = (await response.json().catch(() => null)) as MonthlyMutationResponse | null;

  if (!response.ok) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível excluir a mensalidade.");
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "success" in rawResponse &&
    rawResponse.success === false
  ) {
    throw new Error(getCreateErrorMessage(rawResponse) ?? "Não foi possível excluir a mensalidade.");
  }
}
