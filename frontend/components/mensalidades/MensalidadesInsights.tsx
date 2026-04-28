import { AlertTriangle, CircleCheckBig, Clock3, Sparkles } from "lucide-react";

import type { Mensalidade, MensalidadesSummary } from "@/components/mensalidades/types";
import { formatAmount, getDaysUntilDue, getMensalidadeStatus } from "@/components/mensalidades/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MensalidadesInsightsProps = {
  summary: MensalidadesSummary;
  items: Mensalidade[];
};

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

export function MensalidadesInsights({ summary, items }: MensalidadesInsightsProps) {
  const projected = Math.max(summary.totalProjected, 0);
  const paidRate = projected > 0 ? (summary.totalPaid / projected) * 100 : 0;
  const openRate = projected > 0 ? (summary.totalOpen / projected) * 100 : 0;
  const overdueRate = projected > 0 ? (summary.overdueAmount / projected) * 100 : 0;

  const dueSoonAmount = items.reduce((total, item) => {
    const status = getMensalidadeStatus(item);
    const daysUntilDue = getDaysUntilDue(item.dueDate);

    if (status === "pending" && daysUntilDue >= 0 && daysUntilDue <= 7) {
      return total + Math.max(0, item.amount);
    }

    return total;
  }, 0);

  const dueSoonRate = projected > 0 ? (dueSoonAmount / projected) * 100 : 0;

  const recommendation =
    summary.overdueAmount > 0
      ? {
          title: "Ação imediata",
          text: `Priorize ${formatAmount(summary.overdueAmount)} em atrasos para reduzir juros e multas.`,
          tone: "destructive" as const,
        }
      : dueSoonAmount > 0
        ? {
            title: "Próxima ação",
            text: `Reserve ${formatAmount(dueSoonAmount)} para vencimentos dos próximos 7 dias.`,
            tone: "primary" as const,
          }
        : {
            title: "Situação estável",
            text: "Sem riscos imediatos. Continue acompanhando o ciclo de vencimentos.",
            tone: "success" as const,
          };

  const rows = [
    {
      key: "overdue",
      label: "Atraso acumulado",
      helper: `${summary.overdueCount} cobrança(s) atrasada(s)`,
      value: formatAmount(summary.overdueAmount),
      barWidth: overdueRate,
      barClassName: "bg-destructive",
      textClassName: "text-destructive",
      icon: AlertTriangle,
    },
    {
      key: "dueSoon",
      label: "Vencendo em até 7 dias",
      helper: `${summary.dueSoonCount} cobrança(s) próximas`,
      value: formatAmount(dueSoonAmount),
      barWidth: dueSoonRate,
      barClassName: "bg-primary",
      textClassName: "text-primary",
      icon: Clock3,
    },
    {
      key: "paid",
      label: "Liquidação já realizada",
      helper: `${summary.paidCount} cobrança(s) pagas`,
      value: formatAmount(summary.totalPaid),
      barWidth: paidRate,
      barClassName: "bg-success",
      textClassName: "text-success",
      icon: CircleCheckBig,
    },
  ] as const;

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Saúde financeira das mensalidades
        </CardTitle>
        <CardDescription>Indicadores que mostram risco, compromisso mensal e execução de pagamentos.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
          <div>
            <p className="text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase">Taxa de quitação</p>
            <p className="mt-1 text-base font-semibold text-success tabular-nums">{formatPercent(paidRate)}</p>
            <p className="text-xs text-muted-foreground">{formatAmount(summary.totalPaid)} pagos</p>
          </div>

          <div>
            <p className="text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase">Comprometimento</p>
            <p className="mt-1 text-base font-semibold text-primary tabular-nums">{formatPercent(openRate)}</p>
            <p className="text-xs text-muted-foreground">{formatAmount(summary.totalOpen)} em aberto</p>
          </div>
        </div>

        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div key={row.key} className="rounded-xl border border-border/65 bg-background/60 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn("inline-flex items-center gap-1.5 text-sm font-medium", row.textClassName)}>
                    <Icon className="size-4" />
                    {row.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.helper}</p>
                </div>
                <p className={cn("text-sm font-semibold tabular-nums", row.textClassName)}>{row.value}</p>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/85">
                <div
                  className={cn("h-full rounded-full transition-all", row.barClassName)}
                  style={{ width: `${Math.max(8, Math.min(100, row.barWidth))}%` }}
                />
              </div>
            </div>
          );
        })}

        <Separator className="opacity-60" />

        <div
          className={cn(
            "rounded-xl border px-3.5 py-3",
            recommendation.tone === "destructive" && "border-destructive/35 bg-destructive/10",
            recommendation.tone === "primary" && "border-primary/30 bg-primary/10",
            recommendation.tone === "success" && "border-success/35 bg-success/10"
          )}
        >
          <p
            className={cn(
              "text-xs tracking-[0.14em] uppercase",
              recommendation.tone === "destructive" && "text-destructive",
              recommendation.tone === "primary" && "text-primary",
              recommendation.tone === "success" && "text-success"
            )}
          >
            {recommendation.title}
          </p>
          <p className="mt-1 text-sm text-foreground">{recommendation.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
