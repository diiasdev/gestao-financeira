import { getCategoryToneClasses, resolveCategoryVisual, resolvePaymentMethodVisual } from "@/components/Transitions/transaction-visuals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatDateBR, toAmountNumber, type FinanceTransaction } from "@/lib/finance";
import { cn } from "@/lib/utils";

type TransactionsListProps = {
  transactions: FinanceTransaction[];
  isLoading: boolean;
  error: string | null;
};

export function TransactionsList({ transactions, isLoading, error }: TransactionsListProps) {
  return (
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
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((item) => {
                    const categoryVisual = resolveCategoryVisual(item.category);
                    const paymentMethodVisual = resolvePaymentMethodVisual(item.paymentMethod);
                    const isIncome = item.type === "INCOME";
                    const amount = Math.abs(toAmountNumber(item.amount));
                    const amountClass = isIncome ? "text-success" : "text-destructive";
                    const CategoryIcon = categoryVisual.icon;
                    const PaymentIcon = paymentMethodVisual.icon;
                    const categoryStyles = getCategoryToneClasses(categoryVisual.tone);

                    return (
                      <TableRow key={item.id}>
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
                const amount = Math.abs(toAmountNumber(item.amount));
                const amountClass = isIncome ? "text-success" : "text-destructive";
                const CategoryIcon = categoryVisual.icon;
                const PaymentIcon = paymentMethodVisual.icon;
                const categoryStyles = getCategoryToneClasses(categoryVisual.tone);

                return (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-border/75 bg-background/70 px-4 py-3">
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

                    {index < transactions.length - 1 ? <Separator className="opacity-35" /> : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
