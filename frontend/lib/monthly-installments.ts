import type {
  Mensalidade,
  MensalidadeInstallmentHistoryItem,
  MensalidadeStatus,
} from "@/components/mensalidades/types";

const MONTHLY_ROLLOVER_DAY = 5;

function toDate(input: string | Date): Date {
  const parsed = input instanceof Date ? input : new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .trim();
}

function isPaidStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeText(status);
  return normalized === "paid" || normalized === "pago" || normalized === "quitado";
}

function buildRolloverDate(year: number, monthIndex: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(MONTHLY_ROLLOVER_DAY, lastDay);
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function resolveFirstInstallmentDueDate(baseDateInput: string): Date {
  const baseDate = toDate(baseDateInput);
  const sameMonth = buildRolloverDate(baseDate.getFullYear(), baseDate.getMonth());

  if (baseDate.getTime() <= sameMonth.getTime()) return sameMonth;

  return buildRolloverDate(baseDate.getFullYear(), baseDate.getMonth() + 1);
}

function resolveInstallmentDueDate(firstDueDate: Date, installmentNumber: number): Date {
  const monthOffset = Math.max(0, installmentNumber - 1);
  return buildRolloverDate(firstDueDate.getFullYear(), firstDueDate.getMonth() + monthOffset);
}

function resolveCurrentInstallmentNumber(item: Mensalidade, now: Date): number {
  const total = Math.max(1, item.installmentTotal ?? 1);
  let current = Math.min(Math.max(1, item.installmentCurrent ?? 1), total);

  const paidAt = item.paidAt ? toDate(item.paidAt) : null;
  const statusPaid = isPaidStatus(item.statusRaw) || Boolean(item.paidAt);
  const firstDueDate = resolveFirstInstallmentDueDate(item.dueDate);

  while (current < total) {
    const currentDueDate = resolveInstallmentDueDate(firstDueDate, current);
    const nextDueDate = resolveInstallmentDueDate(firstDueDate, current + 1);
    const currentInstallmentPaid = statusPaid && paidAt && paidAt.getTime() >= currentDueDate.getTime();

    if (!currentInstallmentPaid) break;
    if (now.getTime() < nextDueDate.getTime()) break;

    current += 1;
  }

  return current;
}

function resolveCurrentInstallmentStatus(params: {
  item: Mensalidade;
  currentInstallmentNumber: number;
  now: Date;
  firstDueDate: Date;
}): MensalidadeStatus {
  const { item, currentInstallmentNumber, now, firstDueDate } = params;
  const currentDueDate = resolveInstallmentDueDate(firstDueDate, currentInstallmentNumber);
  const nextDueDate =
    currentInstallmentNumber < Math.max(1, item.installmentTotal ?? 1)
      ? resolveInstallmentDueDate(firstDueDate, currentInstallmentNumber + 1)
      : null;

  const paidAt = item.paidAt ? toDate(item.paidAt) : null;
  const statusPaid = isPaidStatus(item.statusRaw) || Boolean(item.paidAt);
  const currentInstallmentPaid =
    statusPaid &&
    paidAt &&
    paidAt.getTime() >= currentDueDate.getTime() &&
    (!nextDueDate || paidAt.getTime() < nextDueDate.getTime());

  if (currentInstallmentPaid) return "paid";
  if (now.getTime() > currentDueDate.getTime()) return "overdue";
  return "pending";
}

export function resolveMensalidadeCycle(item: Mensalidade, referenceDate: Date = new Date()): Mensalidade {
  const total = Math.max(1, item.installmentTotal ?? 1);
  const firstDueDate = resolveFirstInstallmentDueDate(item.dueDate);
  const currentInstallment = resolveCurrentInstallmentNumber(item, referenceDate);
  const currentStatus = resolveCurrentInstallmentStatus({
    item,
    currentInstallmentNumber: currentInstallment,
    now: referenceDate,
    firstDueDate,
  });
  const currentDueDate = resolveInstallmentDueDate(firstDueDate, currentInstallment);

  const history: MensalidadeInstallmentHistoryItem[] = Array.from({ length: total }, (_, index) => {
    const installmentNumber = index + 1;
    const dueDate = resolveInstallmentDueDate(firstDueDate, installmentNumber).toISOString();
    const isCurrent = installmentNumber === currentInstallment;

    let status: MensalidadeStatus = "pending";
    if (installmentNumber < currentInstallment) status = "paid";
    if (isCurrent) status = currentStatus;

    return {
      installmentNumber,
      totalInstallments: total,
      dueDate,
      status,
      isCurrent,
    };
  });

  return {
    ...item,
    dueDate: currentDueDate.toISOString(),
    installmentCurrent: currentInstallment,
    installmentTotal: total,
    paidAt: currentStatus === "paid" ? item.paidAt ?? item.updatedAt ?? new Date().toISOString() : null,
    installmentHistory: history,
  };
}
