import { AlarmClockCheck, CircleCheckBig, HandCoins, ShieldAlert } from "lucide-react";
import type { ComponentType } from "react";

import type { MensalidadesSummary } from "@/components/mensalidades/types";
import { formatAmount } from "@/components/mensalidades/utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MensalidadesMetricsProps = {
  summary: MensalidadesSummary;
};

type MetricConfig = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  value: (summary: MensalidadesSummary) => number;
  detail: (summary: MensalidadesSummary) => string;
  iconToneClassName: string;
  valueToneClassName?: string;
  glowClassName: string;
};

const metricCards: MetricConfig[] = [
  {
    id: "projected",
    title: "Projeção mensal",
    icon: HandCoins,
    value: (summary) => summary.totalProjected,
    detail: (summary) => `${summary.pendingCount + summary.overdueCount} cobranças em aberto`,
    iconToneClassName: "border-primary/35 bg-primary/15 text-primary",
    glowClassName: "from-primary/16 to-transparent",
  },
  {
    id: "paid",
    title: "Quitado",
    icon: CircleCheckBig,
    value: (summary) => summary.totalPaid,
    detail: (summary) => `${summary.paidCount} cobranças pagas`,
    iconToneClassName: "border-success/35 bg-success/15 text-success",
    valueToneClassName: "text-success",
    glowClassName: "from-success/14 to-transparent",
  },
  {
    id: "open",
    title: "Em aberto",
    icon: AlarmClockCheck,
    value: (summary) => summary.totalOpen,
    detail: (summary) => `${summary.dueSoonCount} vencem em até 7 dias`,
    iconToneClassName: "border-primary/35 bg-primary/15 text-primary",
    valueToneClassName: "text-primary",
    glowClassName: "from-primary/16 to-transparent",
  },
  {
    id: "overdue",
    title: "Em atraso",
    icon: ShieldAlert,
    value: (summary) => summary.overdueAmount,
    detail: (summary) => `${summary.overdueCount} cobrança(s) atrasada(s)`,
    iconToneClassName: "border-destructive/35 bg-destructive/15 text-destructive",
    valueToneClassName: "text-destructive",
    glowClassName: "from-destructive/16 to-transparent",
  },
];

export function MensalidadesMetrics({ summary }: MensalidadesMetricsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.id} className="group relative overflow-hidden border-border/80 bg-card/95">
            <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b", metric.glowClassName)} />

            <CardContent className="relative space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105",
                    metric.iconToneClassName
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>

              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight text-foreground tabular-nums",
                  metric.valueToneClassName
                )}
              >
                {formatAmount(metric.value(summary))}
              </p>

              <p className="text-xs text-muted-foreground">{metric.detail(summary)}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
