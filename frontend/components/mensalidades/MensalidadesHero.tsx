import { CalendarClock, Sparkles, WalletCards } from "lucide-react";

import { ButtonNovaMensalidade, type NovaMensalidadeInput } from "@/components/mensalidades/ButtonNovaMensalidade";
import type { MensalidadesSummary } from "@/components/mensalidades/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type MensalidadesHeroProps = {
  summary: MensalidadesSummary;
  onCreateMensalidade: (input: NovaMensalidadeInput) => void;
};

export function MensalidadesHero({ summary, onCreateMensalidade }: MensalidadesHeroProps) {
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
              <Badge variant={summary.overdueCount > 0 ? "destructive" : "success"} className="inline-flex items-center gap-1.5">
                <WalletCards className="size-3.5" />
                {summary.overdueCount > 0
                  ? `${summary.overdueCount} em atraso`
                  : "Nenhuma mensalidade atrasada"}
              </Badge>
            </div>
          </div>

          <div className="self-end">
            <ButtonNovaMensalidade onCreate={onCreateMensalidade} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
