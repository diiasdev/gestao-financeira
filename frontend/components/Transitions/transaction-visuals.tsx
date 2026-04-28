import {
  CarFront,
  CreditCard,
  FileText,
  Heart,
  House,
  PiggyBank,
  QrCode,
  Ticket,
  UtensilsCrossed,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { formatCategoryLabel } from "@/lib/finance";

type CategoryTone = "primary" | "success" | "danger" | "neutral";

type CategoryVisual = {
  label: string;
  icon: LucideIcon;
  tone: CategoryTone;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  moradia: { label: "Moradia", icon: House, tone: "primary" },
  alimentacao: { label: "Alimentação", icon: UtensilsCrossed, tone: "primary" },
  transporte: { label: "Transporte", icon: CarFront, tone: "danger" },
  lazer: { label: "Lazer", icon: Ticket, tone: "neutral" },
  investimentos: { label: "Investimentos", icon: PiggyBank, tone: "success" },
  pagamento: { label: "Pagamento", icon: WalletCards, tone: "primary" },
  saude: { label: "Saúde", icon: Heart, tone: "danger" },
  assinatura: { label: "Assinatura", icon: FileText, tone: "neutral" },
};

const PAYMENT_METHOD_VISUALS: Record<string, { label: string; icon: LucideIcon }> = {
  pix: { label: "Pix", icon: QrCode },
  credito: { label: "Crédito", icon: CreditCard },
  debito: { label: "Débito", icon: WalletCards },
};

export function normalizeCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveCategoryVisual(category: string): CategoryVisual {
  const normalized = normalizeCategory(category);
  const config = CATEGORY_VISUALS[normalized];

  if (config) return config;

  return {
    label: formatCategoryLabel(category),
    icon: FileText,
    tone: "neutral",
  };
}

export function resolvePaymentMethodVisual(paymentMethod: string): { label: string; icon: LucideIcon } {
  const normalized = normalizeCategory(paymentMethod);
  const config = PAYMENT_METHOD_VISUALS[normalized];

  if (config) return config;

  return {
    label: formatCategoryLabel(paymentMethod),
    icon: WalletCards,
  };
}

export function getCategoryToneClasses(tone: CategoryTone): { icon: string; badge: string; bar: string } {
  if (tone === "success") {
    return {
      icon: "border-success/35 bg-success/15 text-success",
      badge: "border-success/35 bg-success/15 text-success",
      bar: "bg-success",
    };
  }

  if (tone === "danger") {
    return {
      icon: "border-destructive/35 bg-destructive/15 text-destructive",
      badge: "border-destructive/35 bg-destructive/15 text-destructive",
      bar: "bg-destructive",
    };
  }

  if (tone === "primary") {
    return {
      icon: "border-primary/35 bg-primary/15 text-primary",
      badge: "border-primary/35 bg-primary/15 text-primary",
      bar: "bg-primary",
    };
  }

  return {
    icon: "border-border bg-muted text-muted-foreground",
    badge: "border-border bg-muted text-muted-foreground",
    bar: "bg-muted-foreground",
  };
}
