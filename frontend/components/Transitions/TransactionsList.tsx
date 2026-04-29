"use client";

import {
  getCategoryToneClasses,
  normalizeCategory,
  resolveCategoryVisual,
  resolvePaymentMethodVisual,
} from "@/components/Transitions/transaction-visuals";
import { CalendarClock, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  API_BASE_URL,
  formatCurrencyBRL,
  formatDateBR,
  toAmountNumber,
  type FinanceTransaction,
} from "@/lib/finance";
import { getInvestmentSnapshot } from "@/lib/investments";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type TransactionsListProps = {
  transactions: FinanceTransaction[];
  isLoading: boolean;
  error: string | null;
};

function resolveReceiptLink(receiptUrl?: string | null): string | null {
  const value = receiptUrl?.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
    return value;
  }

  if (/^www\./i.test(value)) {
    return `https://${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  return null;
}

export function TransactionsList({ transactions, isLoading, error }: TransactionsListProps) {
  const [selectedInvestment, setSelectedInvestment] = useState<FinanceTransaction | null>(null);
  const selectedSnapshot = useMemo(() => {
    if (!selectedInvestment) return null;

    return getInvestmentSnapshot({
      amount: selectedInvestment.amount,
      annualRate: selectedInvestment.annualRate,
      date: selectedInvestment.date,
    });
  }, [selectedInvestment]);

  const handleOpenInvestment = (transaction: FinanceTransaction) => {
    const isInvestment = normalizeCategory(transaction.category) === "investimentos";
    if (!isInvestment) return;

    setSelectedInvestment(transaction);
  };

  return (
    <>
      <Card className="border-border/85 bg-card/95">
        <CardHeader>
          <CardTitle>Lista de movimentações</CardTitle>
          <CardDescription>Registros reais com detalhes de categoria, data e forma de pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="mt-3 h-4 w-full" />
              </div>
              <div className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-3 h-4 w-full" />
              </div>
              <div className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="mt-3 h-4 w-full" />
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              Nenhuma movimentação encontrada para os filtros aplicados.
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-background/70 md:block">
                <Table>
                  <TableHeader className="bg-card/80">
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Comprovantes</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((item) => {
                      const categoryVisual = resolveCategoryVisual(item.category);
                      const paymentMethodVisual = resolvePaymentMethodVisual(item.paymentMethod);
                      const isIncome = item.type === "INCOME";
                      const isInvestment = normalizeCategory(item.category) === "investimentos";
                      const amount = Math.abs(toAmountNumber(item.amount));
                      const amountClass = isInvestment
                        ? "text-primary"
                        : isIncome
                          ? "text-success"
                          : "text-destructive";
                      const CategoryIcon = categoryVisual.icon;
                      const PaymentIcon = paymentMethodVisual.icon;
                      const categoryStyles = getCategoryToneClasses(categoryVisual.tone);
                      const receiptLink = resolveReceiptLink(item.receiptUrl);

                      return (
                        <TableRow
                          key={item.id}
                          className={cn(isInvestment && "cursor-pointer hover:bg-primary/8")}
                          onClick={() => handleOpenInvestment(item)}
                          onKeyDown={(event) => {
                            if (!isInvestment) return;
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            handleOpenInvestment(item);
                          }}
                          role={isInvestment ? "button" : undefined}
                          tabIndex={isInvestment ? 0 : undefined}
                        >
                          <TableCell className="font-medium text-foreground">{item.description || "Sem descrição"}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className={cn("flex size-8 items-center justify-center rounded-lg border", categoryStyles.icon)}>
                                <CategoryIcon className="size-4" />
                              </span>
                              {categoryVisual.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isIncome ? "success" : "destructive"}>
                              {isIncome ? "Entrada" : "Saída"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDateBR(item.date)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <PaymentIcon className="size-4 text-primary" />
                              {paymentMethodVisual.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {receiptLink ? (
                              <a
                                href={receiptLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                              >
                                Ver comprovante
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem comprovante</span>
                            )}
                          </TableCell>
                          <TableCell className={cn("text-right text-base font-semibold whitespace-nowrap tabular-nums", amountClass)}>
                            {`${isIncome ? "+" : "-"}${formatCurrencyBRL(amount)}`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {transactions.map((item, index) => {
                  const categoryVisual = resolveCategoryVisual(item.category);
                  const paymentMethodVisual = resolvePaymentMethodVisual(item.paymentMethod);
                  const isIncome = item.type === "INCOME";
                  const isInvestment = normalizeCategory(item.category) === "investimentos";
                  const amount = Math.abs(toAmountNumber(item.amount));
                  const amountClass = isInvestment
                    ? "text-primary"
                    : isIncome
                      ? "text-success"
                      : "text-destructive";
                  const CategoryIcon = categoryVisual.icon;
                  const PaymentIcon = paymentMethodVisual.icon;
                  const categoryStyles = getCategoryToneClasses(categoryVisual.tone);
                  const receiptLink = resolveReceiptLink(item.receiptUrl);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "space-y-3 rounded-2xl border border-border/75 bg-background/70 px-4 py-3",
                        isInvestment && "cursor-pointer hover:border-primary/30"
                      )}
                      onClick={() => handleOpenInvestment(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border", categoryStyles.icon)}>
                            <CategoryIcon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.description || "Sem descrição"}</p>
                            <p className="text-xs text-muted-foreground">{formatDateBR(item.date)}</p>
                          </div>
                        </div>
                        <p className={cn("shrink-0 text-right text-base font-semibold whitespace-nowrap tabular-nums", amountClass)}>
                          {`${isIncome ? "+" : "-"}${formatCurrencyBRL(amount)}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{categoryVisual.label}</Badge>
                        <Badge variant={isIncome ? "success" : "destructive"}>
                          {isIncome ? "Entrada" : "Saída"}
                        </Badge>
                        <Badge variant="outline" className="inline-flex items-center gap-1.5">
                          <PaymentIcon className="size-3.5" />
                          {paymentMethodVisual.label}
                        </Badge>
                      </div>

                      <div>
                        {receiptLink ? (
                          <a
                            href={receiptLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                          >
                            Ver comprovante
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem comprovante</span>
                        )}
                      </div>

                      {index < transactions.length - 1 ? <Separator className="opacity-35" /> : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedInvestment)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedInvestment(null);
        }}
      >
        <DialogContent className="max-w-lg border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_42%),linear-gradient(120deg,rgba(30,30,30,0.98),rgba(18,18,18,0.96))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-primary" />
              Detalhes do investimento
            </DialogTitle>
            <DialogDescription>
              O rendimento é atualizado somente após cada mês completo desde a data do aporte.
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && selectedSnapshot ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Descrição</p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedInvestment.description || "Investimento"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">% ao ano</p>
                  <p className="mt-1 text-lg font-semibold text-primary tabular-nums">
                    {selectedSnapshot.annualRate > 0 ? `${selectedSnapshot.annualRate.toFixed(2)}% a.a` : "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Aporte inicial</p>
                  <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.principal)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Rendimento acumulado</p>
                  <p className="mt-1 text-lg font-semibold text-success tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.earnings)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Valor atualizado</p>
                  <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.currentValue)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs tracking-[0.12em] text-primary uppercase">Ciclo de atualização</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-primary">
                  <Badge variant="default">{selectedSnapshot.monthsElapsed} mês(es) completos</Badge>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    Próxima virada: {formatDateBR(selectedSnapshot.nextUpdateDate)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
