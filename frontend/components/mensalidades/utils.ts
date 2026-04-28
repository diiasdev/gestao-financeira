import {
  AlarmClock,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  House,
  TriangleAlert,
  Tv,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { formatCurrencyBRL } from "@/lib/finance";
import type { Mensalidade, MensalidadeCategory, MensalidadesSummary, MensalidadeStatus } from "./types";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "destructive";

type CategoryVisual = {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

type StatusVisual = {
  label: string;
  icon: LucideIcon;
  badgeVariant: BadgeVariant;
  amountClassName: string;
};

const CATEGORY_VISUALS: Record<MensalidadeCategory, CategoryVisual> = {
  servicos: {
    label: "Serviços",
    icon: Wifi,
    iconClassName: "border-primary/35 bg-primary/15 text-primary",
  },
  saude: {
    label: "Saúde",
    icon: CircleDollarSign,
    iconClassName: "border-success/35 bg-success/15 text-success",
  },
  assinaturas: {
    label: "Assinaturas",
    icon: Tv,
    iconClassName: "border-primary/25 bg-primary/10 text-primary",
  },
  moradia: {
    label: "Moradia",
    icon: Building2,
    iconClassName: "border-border/70 bg-muted/65 text-foreground",
  },
  utilidades: {
    label: "Utilidades",
    icon: Zap,
    iconClassName: "border-primary/35 bg-primary/15 text-primary",
  },
  educacao: {
    label: "Educação",
    icon: GraduationCap,
    iconClassName: "border-primary/25 bg-primary/10 text-primary",
  },
};

function getStartOfDay(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

export function toDate(input: string): Date {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDueDate(input: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(toDate(input));
}

export function formatAmount(amount: number): string {
  return formatCurrencyBRL(amount);
}

export function getDaysUntilDue(dueDateInput: string, referenceDate: Date = new Date()): number {
  const dueDate = getStartOfDay(toDate(dueDateInput));
  const reference = getStartOfDay(referenceDate);
  const diff = dueDate.getTime() - reference.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMensalidadeStatus(
  item: Mensalidade,
  referenceDate: Date = new Date()
): MensalidadeStatus {
  if (item.paidAt) return "paid";
  if (getDaysUntilDue(item.dueDate, referenceDate) < 0) return "overdue";
  return "pending";
}

export function resolveCategoryVisual(category: MensalidadeCategory): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? {
    label: "Categoria",
    icon: House,
    iconClassName: "border-border bg-muted text-muted-foreground",
  };
}

export function resolveStatusVisual(
  status: MensalidadeStatus,
  daysUntilDue: number
): StatusVisual {
  if (status === "paid") {
    return {
      label: "Pago",
      icon: CheckCircle2,
      badgeVariant: "success",
      amountClassName: "text-success",
    };
  }

  if (status === "overdue") {
    return {
      label: "Atrasado",
      icon: TriangleAlert,
      badgeVariant: "destructive",
      amountClassName: "text-destructive",
    };
  }

  if (daysUntilDue === 0) {
    return {
      label: "Vence hoje",
      icon: AlarmClock,
      badgeVariant: "destructive",
      amountClassName: "text-primary",
    };
  }

  if (daysUntilDue > 0 && daysUntilDue <= 3) {
    return {
      label: `Vence em ${daysUntilDue}d`,
      icon: AlarmClock,
      badgeVariant: "default",
      amountClassName: "text-primary",
    };
  }

  return {
    label: "Pendente",
    icon: Clock3,
    badgeVariant: "secondary",
    amountClassName: "text-foreground",
  };
}

export function sortMensalidadesByPriority(
  items: Mensalidade[],
  referenceDate: Date = new Date()
): Mensalidade[] {
  const statusWeight: Record<MensalidadeStatus, number> = {
    overdue: 0,
    pending: 1,
    paid: 2,
  };

  return [...items].sort((a, b) => {
    const statusA = getMensalidadeStatus(a, referenceDate);
    const statusB = getMensalidadeStatus(b, referenceDate);

    if (statusWeight[statusA] !== statusWeight[statusB]) {
      return statusWeight[statusA] - statusWeight[statusB];
    }

    return toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime();
  });
}

export function getMensalidadesSummary(
  items: Mensalidade[],
  referenceDate: Date = new Date()
): MensalidadesSummary {
  let totalProjected = 0;
  let totalPaid = 0;
  let totalOpen = 0;
  let overdueAmount = 0;
  let pendingAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const item of items) {
    const amount = Math.max(0, item.amount);
    const status = getMensalidadeStatus(item, referenceDate);
    const daysUntilDue = getDaysUntilDue(item.dueDate, referenceDate);

    totalProjected += amount;

    if (status === "paid") {
      paidCount += 1;
      totalPaid += amount;
      continue;
    }

    pendingAmount += amount;
    totalOpen += amount;

    if (status === "overdue") {
      overdueCount += 1;
      overdueAmount += amount;
      continue;
    }

    pendingCount += 1;

    if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      dueSoonCount += 1;
    }
  }

  return {
    totalProjected,
    totalPaid,
    totalOpen,
    overdueAmount,
    pendingAmount,
    paidCount,
    pendingCount,
    overdueCount,
    dueSoonCount,
  };
}
