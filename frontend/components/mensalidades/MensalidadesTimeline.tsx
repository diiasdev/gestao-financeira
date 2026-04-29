"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import type { Mensalidade, MensalidadeStatus } from "@/components/mensalidades/types";
import {
  formatAmount,
  formatDueDate,
  getDaysUntilDue,
  getMensalidadeStatus,
  resolveCategoryVisual,
  resolveStatusVisual,
} from "@/components/mensalidades/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MensalidadesTimelineProps = {
  items: Mensalidade[];
};

function getDueDateTone(status: MensalidadeStatus, daysUntilDue: number): string {
  if (status === "paid") return "text-success/90";
  if (status === "overdue") return "text-destructive";
  if (daysUntilDue === 0) return "text-destructive";
  if (daysUntilDue > 0 && daysUntilDue <= 3) return "text-primary";
  return "text-muted-foreground";
}

function getDueContextLabel(status: MensalidadeStatus, daysUntilDue: number): string {
  if (status === "paid") return "Pagamento confirmado";
  if (status === "overdue") return `${Math.abs(daysUntilDue)}d em atraso`;
  if (daysUntilDue === 0) return "Vence hoje";
  if (daysUntilDue > 0 && daysUntilDue <= 3) return `Vence em ${daysUntilDue}d`;
  return "No prazo";
}

function getStatusBadgeClassName(status: MensalidadeStatus): string {
  if (status === "paid") return "border-success/45 bg-success/15 text-success";
  if (status === "overdue") return "border-destructive/45 bg-destructive/15 text-destructive";
  return "border-border/80 bg-muted/55 text-muted-foreground";
}

function getRowClassName(status: MensalidadeStatus): string {
  if (status === "paid") return "bg-success/[0.04] hover:!bg-success/[0.1]";
  if (status === "overdue") return "bg-destructive/[0.035] hover:!bg-destructive/[0.08]";
  return "hover:!bg-muted/35";
}

export function MensalidadesTimeline({ items }: MensalidadesTimelineProps) {
  const [manuallyPaidIds, setManuallyPaidIds] = useState<Set<string>>(new Set());
  const [canceledPaidIds, setCanceledPaidIds] = useState<Set<string>>(new Set());

  const handleMarkAsPaid = (id: string) => {
    setManuallyPaidIds((current) => {
      if (current.has(id)) return current;

      const next = new Set(current);
      next.add(id);
      return next;
    });

    setCanceledPaidIds((current) => {
      if (!current.has(id)) return current;

      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const handleCancelPaid = (id: string, baseStatus: "paid" | "pending" | "overdue") => {
    setManuallyPaidIds((current) => {
      if (!current.has(id)) return current;

      const next = new Set(current);
      next.delete(id);
      return next;
    });

    if (baseStatus === "paid") {
      setCanceledPaidIds((current) => {
        if (current.has(id)) return current;

        const next = new Set(current);
        next.add(id);
        return next;
      });
      return;
    }

    setCanceledPaidIds((current) => {
      if (!current.has(id)) return current;

      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  return (
    <Card className="border-border/80 bg-gradient-to-b from-card to-card/95 shadow-[0_18px_46px_-26px_rgba(0,0,0,0.7)]">
      <CardHeader className="border-b border-border/55 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Mensalidades</CardTitle>
            <CardDescription>Contas recorrentes com vencimento, valor e status.</CardDescription>
          </div>
          <Badge variant="outline" className="border-border/80 bg-background/40 px-2.5 py-1 text-xs">
            {items.length} itens
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        <div className="overflow-hidden rounded-2xl border border-border/75 bg-gradient-to-b from-card/75 via-card/55 to-background/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-card/75 backdrop-blur">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Conta</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="pr-5 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:last-child]:border-b-0">
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma mensalidade encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const baseStatus = getMensalidadeStatus(item);
                  const daysUntilDue = getDaysUntilDue(item.dueDate);
                  const status =
                    manuallyPaidIds.has(item.id)
                      ? "paid"
                      : canceledPaidIds.has(item.id) && baseStatus === "paid"
                        ? daysUntilDue < 0
                          ? "overdue"
                          : "pending"
                        : baseStatus;

                  const categoryVisual = resolveCategoryVisual(item.category);
                  const statusVisual = resolveStatusVisual(status, daysUntilDue);
                  const CategoryIcon = categoryVisual.icon;
                  const StatusIcon = statusVisual.icon;
                  const installmentTotal = Math.max(1, item.installmentTotal ?? 1);
                  const installmentCurrent = Math.min(
                    Math.max(1, item.installmentCurrent ?? 1),
                    installmentTotal
                  );

                  const statusLabel =
                    status === "pending" ? statusVisual.label : status === "paid" ? "Pago" : "Atrasado";

                  return (
                    <TableRow
                      key={item.id}
                      className={cn("group/row border-border/55 transition-colors odd:bg-background/15", getRowClassName(status))}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                              categoryVisual.iconClassName
                            )}
                          >
                            <CategoryIcon className="size-4" />
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{categoryVisual.label}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <p className={cn("text-sm font-medium tabular-nums", getDueDateTone(status, daysUntilDue))}>
                          {formatDueDate(item.dueDate)}
                        </p>
                        <p className="text-[11px] text-muted-foreground/90">{getDueContextLabel(status, daysUntilDue)}</p>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {installmentCurrent} de {installmentTotal}
                        </p>
                        <p className="text-[11px] text-muted-foreground/90">
                          {installmentTotal > 1 ? "Parcela atual" : "Parcela única"}
                        </p>
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-right text-lg font-semibold whitespace-nowrap tabular-nums",
                          statusVisual.amountClassName
                        )}
                      >
                        {formatAmount(item.amount)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant={statusVisual.badgeVariant}
                          className={cn(
                            "inline-flex min-w-[112px] justify-center gap-1 rounded-full px-2.5 py-1 text-[11px]",
                            getStatusBadgeClassName(status)
                          )}
                        >
                          <StatusIcon className="size-3.5" />
                          {statusLabel}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-5 text-right">
                        {status !== "paid" ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="h-7 min-w-[92px] rounded-full border-success/45 bg-success/10 px-3 text-success hover:bg-success/15 hover:text-success"
                            onClick={() => handleMarkAsPaid(item.id)}
                          >
                            <Check className="size-3" />
                            Pago
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="h-7 min-w-[92px] rounded-full border-destructive/45 bg-destructive/10 px-3 text-destructive hover:bg-destructive/15 hover:text-destructive"
                            onClick={() => handleCancelPaid(item.id, baseStatus)}
                          >
                            <X className="size-3" />
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
