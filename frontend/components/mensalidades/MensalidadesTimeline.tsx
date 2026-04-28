"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import type { Mensalidade } from "@/components/mensalidades/types";
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
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Mensalidades</CardTitle>
            <CardDescription>Contas recorrentes com vencimento, valor e status.</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {items.length} itens
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/60">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-card/70">
              <TableRow className="hover:bg-transparent">
                <TableHead>Conta</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
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

                  const statusLabel =
                    status === "paid" ? "Pago" : status === "overdue" ? "Atrasado" : "Pendente";

                  return (
                    <TableRow key={item.id} className="hover:bg-background/70">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg border",
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

                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDueDate(item.dueDate)}
                      </TableCell>

                      <TableCell className={cn("text-right text-lg font-semibold whitespace-nowrap tabular-nums", statusVisual.amountClassName)}>
                        {formatAmount(item.amount)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge variant={statusVisual.badgeVariant} className="inline-flex items-center gap-1 text-[11px]">
                          <StatusIcon className="size-3.5" />
                          {statusLabel}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {status !== "paid" ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="border-success/40 text-success hover:bg-success/10 hover:text-success"
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
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
