import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";
import { cn } from "@/lib/utils";

type TransactionsSummaryProps = {
  entries: number;
  expenses: number;
  balance: number;
  count: number;
};

export function TransactionsSummary({ entries, expenses, balance, count }: TransactionsSummaryProps) {
  const cards = [
    {
      title: "Entradas",
      value: formatCurrencyBRL(entries),
      icon: ArrowUpRight,
      tone: "success" as const,
    },
    {
      title: "Saídas",
      value: formatCurrencyBRL(expenses),
      icon: ArrowDownRight,
      tone: "destructive" as const,
    },
    {
      title: "Saldo filtrado",
      value: formatCurrencyBRL(balance),
      icon: Scale,
      tone: balance >= 0 ? ("default" as const) : ("destructive" as const),
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="h-full min-h-[9.75rem] border-border/80 bg-card/90 sm:min-h-[10.25rem]">
            <CardContent className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="text-lg font-semibold tracking-tight whitespace-nowrap text-foreground tabular-nums sm:text-xl">
                  {item.value}
                </p>
                <Badge className="w-fit" variant={item.tone}>
                  {count} movimentações
                </Badge>
              </div>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                  item.tone === "success" && "border-success/35 bg-success/15 text-success",
                  item.tone === "destructive" && "border-destructive/35 bg-destructive/15 text-destructive",
                  item.tone === "default" && "border-primary/35 bg-primary/15 text-primary"
                )}
              >
                <Icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
