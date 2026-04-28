import { CalendarClock, CheckCircle2, Clock3, TriangleAlert } from "lucide-react";

import { ButtonMoviments } from "@/components/layout/ButtonMoviments";
import { BottomNavigation, Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const mensalidades = [
  {
    name: "Plano de Internet",
    category: "Serviços",
    dueDate: "05/05/2026",
    amount: "R$ 149,90",
    status: "Pendente",
    tone: "warning" as const,
  },
  {
    name: "Academia",
    category: "Saúde",
    dueDate: "10/05/2026",
    amount: "R$ 129,90",
    status: "Pago",
    tone: "paid" as const,
  },
  {
    name: "Streaming",
    category: "Assinaturas",
    dueDate: "12/05/2026",
    amount: "R$ 39,90",
    status: "Pendente",
    tone: "warning" as const,
  },
  {
    name: "Condomínio",
    category: "Moradia",
    dueDate: "15/05/2026",
    amount: "R$ 650,00",
    status: "Atrasado",
    tone: "late" as const,
  },
];

function resolveStatusBadgeVariant(tone: "warning" | "paid" | "late") {
  if (tone === "paid") return "success" as const;
  if (tone === "late") return "destructive" as const;
  return "default" as const;
}

function resolveStatusIcon(tone: "warning" | "paid" | "late") {
  if (tone === "paid") return CheckCircle2;
  if (tone === "late") return TriangleAlert;
  return Clock3;
}

export default function MensalidadesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header activeTab="mensalidades" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:gap-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
        <Card className="border-border/90 bg-[radial-gradient(circle_at_10%_15%,rgba(212,175,55,0.14),transparent_42%),linear-gradient(125deg,rgba(30,30,30,0.98),rgba(20,20,20,0.94))]">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Badge variant="outline" className="inline-flex items-center gap-1.5 border-primary/35 text-primary">
                  <CalendarClock className="size-3.5" />
                  Cobranças recorrentes
                </Badge>
                <CardTitle className="text-3xl leading-tight">Mensalidades</CardTitle>
                <CardDescription className="max-w-2xl text-base">
                  Acompanhe suas cobranças recorrentes e evite atrasos.
                </CardDescription>
              </div>
              <div className="shrink-0">
                <ButtonMoviments />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Próximos pagamentos</CardTitle>
            <CardDescription>Lista de mensalidades com status de vencimento.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-3 md:hidden">
              {mensalidades.map((item) => {
                const StatusIcon = resolveStatusIcon(item.tone);

                return (
                  <article
                    key={`${item.name}-${item.dueDate}`}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category} • venc.: {item.dueDate}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold whitespace-nowrap text-foreground tabular-nums">{item.amount}</p>
                    </div>

                    <div className="mt-3">
                      <Badge
                        variant={resolveStatusBadgeVariant(item.tone)}
                        className={cn("inline-flex items-center gap-1.5")}
                      >
                        <StatusIcon className="size-3.5" />
                        {item.status}
                      </Badge>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-background/70 md:block">
              <Table>
                <TableHeader className="bg-card/80">
                  <TableRow>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mensalidades.map((item) => {
                    const StatusIcon = resolveStatusIcon(item.tone);

                    return (
                      <TableRow key={`${item.name}-${item.dueDate}`}>
                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-muted-foreground">{item.dueDate}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap text-foreground tabular-nums">
                          {item.amount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={resolveStatusBadgeVariant(item.tone)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <StatusIcon className="size-3.5" />
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNavigation activeTab="mensalidades" />
    </div>
  );
}
