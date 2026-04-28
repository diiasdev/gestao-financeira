import { ReceiptText } from "lucide-react";

import { ButtonMoviments } from "@/components/layout/ButtonMoviments";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TransactionsHeader() {
  return (
    <Card className="border-border/90 bg-[radial-gradient(circle_at_10%_15%,rgba(212,175,55,0.14),transparent_42%),linear-gradient(125deg,rgba(30,30,30,0.98),rgba(20,20,20,0.94))]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="inline-flex items-center gap-1.5 border-primary/35 text-primary">
              <ReceiptText className="size-3.5" />
              Histórico Financeiro
            </Badge>
            <CardTitle className="text-3xl leading-tight">Transações</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Consulte seu histórico real de entradas e saídas com filtros rápidos por período, categoria e tipo.
            </CardDescription>
          </div>
          <div className="shrink-0">
            <ButtonMoviments />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
