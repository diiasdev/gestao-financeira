import { CalendarClock, Sparkles, WalletCards } from "lucide-react";

import { ButtonMoviments } from "@/components/layout/ButtonMoviments";
import type { MensalidadesSummary } from "@/components/mensalidades/types";
import { formatAmount } from "@/components/mensalidades/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MensalidadesHeroProps = {
  summary: MensalidadesSummary;
};

export function MensalidadesHero({ summary }: MensalidadesHeroProps) {
  return (
    <Card className="relative overflow-hidden border-border/85 bg-[radial-gradient(circle_at_12%_18%,rgba(212,175,55,0.16),transparent_44%),linear-gradient(132deg,rgba(28,28,28,0.98),rgba(16,16,16,0.95))]">
      <CardContent className="relative px-6 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -top-20 -right-8 h-52 w-52 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="inline-flex items-center gap-1.5 border-primary/35 text-primary">
              <CalendarClock className="size-3.5" />
              Cobranças recorrentes
            </Badge>

            <div className="space-y-2">
              <CardTitle className="text-3xl leading-tight text-foreground sm:text-4xl">Mensalidades</CardTitle>
              <CardDescription className="max-w-2xl text-base text-muted-foreground/95">
                Acompanhe vencimentos com clareza e priorize o que precisa de ação agora.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="secondary" className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                {summary.dueSoonCount} vencendo nesta semana
              </Badge>
              <Badge
                variant={summary.overdueCount > 0 ? "destructive" : "success"}
                className={cn("inline-flex items-center gap-1.5")}
              >
                <WalletCards className="size-3.5" />
                {summary.overdueCount > 0
                  ? `${summary.overdueCount} em atraso`
                  : "Nenhuma mensalidade atrasada"}
              </Badge>
            </div>
          </div>

          <div className="flex w-full max-w-[22rem] flex-col gap-3">
            <div className="self-end">
              <ButtonMoviments />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="text-[0.7rem] tracking-[0.16em] text-primary uppercase">Em aberto</p>
                <p className="mt-1 text-xl font-semibold text-primary tabular-nums">{formatAmount(summary.totalOpen)}</p>
              </div>

              <div
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  summary.overdueAmount > 0
                    ? "border-destructive/35 bg-destructive/10"
                    : "border-success/35 bg-success/10"
                )}
              >
                <p
                  className={cn(
                    "text-[0.7rem] tracking-[0.16em] uppercase",
                    summary.overdueAmount > 0 ? "text-destructive" : "text-success"
                  )}
                >
                  Em atraso
                </p>
                <p
                  className={cn(
                    "mt-1 text-xl font-semibold tabular-nums",
                    summary.overdueAmount > 0 ? "text-destructive" : "text-success"
                  )}
                >
                  {formatAmount(summary.overdueAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
