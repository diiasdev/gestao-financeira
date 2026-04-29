import { toAmountNumber } from "@/lib/finance";

type AnnualRateInput = number | string | null | undefined;

function toDate(input: string | Date): Date {
  const parsed = input instanceof Date ? input : new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function parseAnnualRateValue(rate: AnnualRateInput): number {
  if (typeof rate === "number") {
    return Number.isFinite(rate) ? rate : 0;
  }

  if (typeof rate === "string") {
    const parsed = Number(rate.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function getFullMonthsElapsed(startInput: string, referenceDate: Date): number {
  const startDate = toDate(startInput);

  let months =
    (referenceDate.getFullYear() - startDate.getFullYear()) * 12 +
    (referenceDate.getMonth() - startDate.getMonth());

  if (referenceDate.getDate() < startDate.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function calculateInvestmentUpdatedValue(
  amount: number,
  annualRate: number,
  date: string,
  now: Date
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(annualRate) || annualRate <= 0) return amount;

  const monthsElapsed = getFullMonthsElapsed(date, now);
  if (monthsElapsed <= 0) return amount;

  const monthlyFactor = Math.pow(1 + annualRate / 100, 1 / 12);
  return amount * Math.pow(monthlyFactor, monthsElapsed);
}

function buildMonthAnniversary(referenceDate: Date, originalDay: number): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(originalDay, lastDayOfMonth);

  return new Date(year, month, day, 12, 0, 0, 0);
}

export function getNextInvestmentUpdateDate(startInput: string, referenceDate: Date): Date {
  const startDate = toDate(startInput);
  const thisMonthAnniversary = buildMonthAnniversary(referenceDate, startDate.getDate());

  if (referenceDate.getTime() <= thisMonthAnniversary.getTime()) {
    return thisMonthAnniversary;
  }

  const nextMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1, 12, 0, 0, 0);
  return buildMonthAnniversary(nextMonth, startDate.getDate());
}

export function getInvestmentSnapshot(params: {
  amount: number | string;
  annualRate: AnnualRateInput;
  date: string;
  now?: Date;
}): {
  principal: number;
  annualRate: number;
  monthsElapsed: number;
  currentValue: number;
  earnings: number;
  nextUpdateDate: Date;
} {
  const now = params.now ?? new Date();
  const principal = Math.abs(toAmountNumber(params.amount));
  const annualRate = parseAnnualRateValue(params.annualRate);
  const monthsElapsed = getFullMonthsElapsed(params.date, now);
  const currentValue = calculateInvestmentUpdatedValue(principal, annualRate, params.date, now);
  const earnings = Math.max(0, currentValue - principal);
  const nextUpdateDate = getNextInvestmentUpdateDate(params.date, now);

  return {
    principal,
    annualRate,
    monthsElapsed,
    currentValue,
    earnings,
    nextUpdateDate,
  };
}
