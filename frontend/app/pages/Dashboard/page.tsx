"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CarFront,
  CreditCard,
  FileText,
  Heart,
  House,
  PiggyBank,
  Ticket,
  UtensilsCrossed,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { ButtonMoviments } from "@/components/layout/ButtonMoviments";
import { BottomNavigation, Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCategoryLabel, formatCurrencyBRL, formatDateBR, toAmountNumber } from "@/lib/finance";
import { useFinanceTransactions } from "@/lib/use-finance-transactions";
import { cn } from "@/lib/utils";

type CardTone = "neutral" | "positive" | "negative" | "accent";
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

function normalizeCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveCategoryVisual(category: string): CategoryVisual {
  const normalized = normalizeCategory(category);
  const config = CATEGORY_VISUALS[normalized];

  if (config) return config;

  return {
    label: formatCategoryLabel(category),
    icon: CreditCard,
    tone: "neutral",
  };
}

function getToneClass(tone: CardTone): string {
  if (tone === "positive") return "text-success";
  if (tone === "negative") return "text-destructive";
  if (tone === "accent") return "text-primary";
  return "text-foreground";
}

function getSummaryIconClass(tone: CardTone): string {
  if (tone === "positive") return "border-success/35 bg-success/15 text-success";
  if (tone === "negative") return "border-destructive/35 bg-destructive/15 text-destructive";
  if (tone === "accent") return "border-primary/35 bg-primary/15 text-primary";
  return "border-border bg-muted text-foreground";
}

function getCategoryToneClasses(tone: CategoryTone): { icon: string; bar: string } {
  if (tone === "success") {
    return {
      icon: "border-success/35 bg-success/15 text-success",
      bar: "bg-success",
    };
  }

  if (tone === "danger") {
    return {
      icon: "border-destructive/35 bg-destructive/15 text-destructive",
      bar: "bg-destructive",
    };
  }

  if (tone === "primary") {
    return {
      icon: "border-primary/35 bg-primary/15 text-primary",
      bar: "bg-primary",
    };
  }

  return {
    icon: "border-border bg-muted text-muted-foreground",
    bar: "bg-muted-foreground",
  };
}

export default function DashboardPage() {
  const { transactions, isLoading, error } = useFinanceTransactions();

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let investments = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(toAmountNumber(transaction.amount));

      if (transaction.type === "INCOME") {
        income += amount;
        incomeCount += 1;
      } else {
        expense += amount;
        expenseCount += 1;
      }

      if (normalizeCategory(transaction.category) === "investimentos") {
        investments += amount;
      }
    }

    return {
      income,
      expense,
      balance: income - expense,
      investments,
      incomeCount,
      expenseCount,
      count: transactions.length,
    };
  }, [transactions]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Saldo Atual",
        value: formatCurrencyBRL(summary.balance),
        trend: `${summary.count} movimentações`,
        tone: "neutral" as const,
        icon: Wallet,
      },
      {
        title: "Receitas",
        value: formatCurrencyBRL(summary.income),
        trend: `${summary.incomeCount} entradas`,
        tone: "positive" as const,
        icon: ArrowUpRight,
      },
      {
        title: "Despesas",
        value: formatCurrencyBRL(summary.expense),
        trend: `${summary.expenseCount} saídas`,
        tone: "negative" as const,
        icon: ArrowDownRight,
      },
      {
        title: "Investimentos",
        value: formatCurrencyBRL(summary.investments),
        trend: "Total aplicado",
        tone: "accent" as const,
        icon: PiggyBank,
      },
    ],
    [summary]
  );

  const recentActivities = useMemo(
    () =>
      transactions.slice(0, 6).map((transaction) => {
        const amount = Math.abs(toAmountNumber(transaction.amount));
        const isIncome = transaction.type === "INCOME";
        const categoryVisual = resolveCategoryVisual(transaction.category);

        return {
          id: transaction.id,
          title: transaction.description || "Sem descrição",
          category: categoryVisual.label,
          categoryTone: categoryVisual.tone,
          categoryIcon: categoryVisual.icon,
          date: formatDateBR(transaction.date),
          paymentMethod: formatCategoryLabel(transaction.paymentMethod),
          value: `${isIncome ? "+" : "-"}${formatCurrencyBRL(amount)}`,
          amountTone: isIncome ? ("positive" as const) : ("negative" as const),
        };
      }),
    [transactions]
  );

  const categoryHighlights = useMemo(() => {
    const totals = new Map<
      string,
      {
        key: string;
        label: string;
        icon: LucideIcon;
        tone: CategoryTone;
        total: number;
        count: number;
      }
    >();

    for (const transaction of transactions) {
      const key = normalizeCategory(transaction.category);
      const amount = Math.abs(toAmountNumber(transaction.amount));
      const categoryVisual = resolveCategoryVisual(transaction.category);
      const current = totals.get(key);

      if (current) {
        current.total += amount;
        current.count += 1;
        continue;
      }

      totals.set(key, {
        key,
        label: categoryVisual.label,
        icon: categoryVisual.icon,
        tone: categoryVisual.tone,
        total: amount,
        count: 1,
      });
    }

    const sorted = Array.from(totals.values()).sort((a, b) => b.total - a.total);
    const totalAmount = sorted.reduce((acc, item) => acc + item.total, 0);

    return sorted.slice(0, 6).map((item) => ({
      ...item,
      share: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
    }));
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header activeTab="dashboard" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:gap-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
        <Card className="relative overflow-hidden border-border/90 bg-[radial-gradient(circle_at_14%_18%,rgba(212,175,55,0.16),transparent_48%),linear-gradient(135deg,rgba(30,30,30,0.98),rgba(22,22,22,0.92))]">
          <div className="pointer-events-none absolute -top-24 -right-12 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <CardHeader className="relative pb-4">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Visão Geral
                </Badge>
                <CardTitle className="text-2xl leading-tight text-foreground sm:text-3xl">
                  Bem-vindo ao seu painel financeiro
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm sm:text-base">
                  Acompanhe receitas, despesas e evolução patrimonial com decisões rápidas e dados reais.
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={summary.balance >= 0 ? "success" : "destructive"}>
                    Saldo {summary.balance >= 0 ? "positivo" : "negativo"}
                  </Badge>
                  <Badge variant="secondary">{summary.count} registros ativos</Badge>
                </div>
              </div>
              <div className="shrink-0">
                <ButtonMoviments />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="relative flex-wrap gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>Dados atualizados em {formatDateBR(new Date())}</span>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <span>Fonte: API de movimentações</span>
          </CardFooter>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.title}
                className="group relative h-full min-h-[10.5rem] overflow-hidden border-border/80 bg-card/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 sm:min-h-[11rem]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(212,175,55,0.08),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardHeader className="relative pb-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <CardDescription className="text-sm">{card.title}</CardDescription>
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border text-sm transition-transform duration-300 group-hover:scale-105",
                        getSummaryIconClass(card.tone)
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="relative mt-auto space-y-2.5">
                  <p className="text-2xl font-semibold tracking-tight whitespace-nowrap text-foreground tabular-nums sm:text-3xl">
                    {card.value}
                  </p>
                  <Badge
                    className="w-fit"
                    variant={
                      card.tone === "positive"
                        ? "success"
                        : card.tone === "negative"
                          ? "destructive"
                          : card.tone === "accent"
                            ? "default"
                            : "secondary"
                    }
                  >
                    {card.trend}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <Card className="border-border/85 bg-card/95">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                <CardTitle className="min-w-0 flex-1 text-xl leading-tight sm:text-2xl">Movimentações recentes</CardTitle>
                <Badge variant="outline" className="shrink-0 text-xs">
                  Últimas {recentActivities.length || 0}
                </Badge>
              </div>
              <CardDescription>Histórico mais recente com categoria, forma de pagamento e valor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-52" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </>
              ) : error ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma movimentação registrada ainda.
                </div>
              ) : (
                recentActivities.map((activity, index) => {
                  const categoryStyles = getCategoryToneClasses(activity.categoryTone);
                  const CategoryIcon = activity.categoryIcon;

                  return (
                    <div key={activity.id}>
                      <article className="rounded-2xl border border-border/75 bg-background/65 px-4 py-3 transition-colors hover:border-primary/25 hover:bg-background/85">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span
                              className={cn(
                                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border",
                                categoryStyles.icon
                              )}
                            >
                              <CategoryIcon className="size-4" />
                            </span>
                            <div className="min-w-0 space-y-1">
                              <p className="text-base font-semibold text-foreground">{activity.title}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{activity.category}</Badge>
                                <Badge variant="outline">{activity.date}</Badge>
                                <Badge variant="outline">{activity.paymentMethod}</Badge>
                              </div>
                            </div>
                          </div>
                          <p
                            className={cn(
                              "shrink-0 text-right text-lg font-semibold whitespace-nowrap tabular-nums sm:text-xl",
                              getToneClass(activity.amountTone)
                            )}
                          >
                            {activity.value}
                          </p>
                        </div>
                      </article>
                      {index < recentActivities.length - 1 ? <Separator className="my-3 opacity-40" /> : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/85 bg-card/95">
            <CardHeader>
              <CardTitle>Categorias em destaque</CardTitle>
              <CardDescription>Distribuição das movimentações por categoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </>
              ) : categoryHighlights.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Sem categorias para exibir.
                </div>
              ) : (
                categoryHighlights.map((item) => {
                  const toneClasses = getCategoryToneClasses(item.tone);
                  const Icon = item.icon;

                  return (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-8 items-center justify-center rounded-lg border text-sm",
                              toneClasses.icon
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.count} movimentações</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold whitespace-nowrap text-foreground tabular-nums">
                          {formatCurrencyBRL(item.total)}
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", toneClasses.bar)}
                          style={{ width: `${Math.max(item.share, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <BottomNavigation activeTab="dashboard" />
    </div>
  );
}
