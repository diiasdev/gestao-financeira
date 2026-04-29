"use client";

import {
  getCategoryToneClasses,
  normalizeCategory,
  resolveCategoryVisual,
  resolvePaymentMethodVisual,
} from "@/components/Transitions/transaction-visuals";
import { CalendarClock, Paperclip, Pencil, PiggyBank, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  API_BASE_URL,
  FINANCE_UPDATED_EVENT,
  deleteTransaction,
  formatCategoryLabel,
  formatCurrencyBRL,
  formatDateBR,
  toAmountNumber,
  updateTransaction,
  type FinanceTransactionType,
  type FinanceTransaction,
} from "@/lib/finance";
import { getInvestmentSnapshot } from "@/lib/investments";
import { BASE_TRANSACTION_CATEGORIES, EXTRA_INCOME_TRANSACTION_CATEGORY } from "@/lib/transaction-categories";
import { cn } from "@/lib/utils";
import { useId, useMemo, useState } from "react";

type TransactionsListProps = {
  transactions: FinanceTransaction[];
  isLoading: boolean;
  error: string | null;
};

type PaymentMethodOption = {
  value: string;
  label: string;
};

type EditFormState = {
  type: FinanceTransactionType;
  description: string;
  amount: string;
  annualRate: string;
  category: string;
  date: string;
  paymentMethod: string;
  receiptFileName: string;
};

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "pix", label: "Pix" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
];

const FALLBACK_DATE = new Date().toISOString().slice(0, 10);

function toInputDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return FALLBACK_DATE;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toApiDate(input: string): string {
  const parsed = new Date(`${input}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Não foi possível ler o arquivo."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function getApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(message)) {
    const parsed = message.filter((item): item is string => typeof item === "string");
    return parsed.length > 0 ? parsed.join(", ") : null;
  }

  return null;
}

function toFriendlySubmitError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("request entity too large") ||
    normalized.includes("payloadtoolargeerror") ||
    normalized.includes("entity.too.large")
  ) {
    return "O arquivo do comprovante é muito grande. Tente um arquivo menor (até ~8 MB).";
  }

  return message || "Não foi possível editar a movimentação.";
}

function resolveReceiptLink(receiptUrl?: string | null): string | null {
  const value = receiptUrl?.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
    return value;
  }

  if (/^www\./i.test(value)) {
    return `https://${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  return null;
}

export function TransactionsList({ transactions, isLoading, error }: TransactionsListProps) {
  const editReceiptInputId = useId();
  const [selectedInvestment, setSelectedInvestment] = useState<FinanceTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    type: "EXPENSE",
    description: "",
    amount: "",
    annualRate: "",
    category: "",
    date: FALLBACK_DATE,
    paymentMethod: "",
    receiptFileName: "",
  });
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedSnapshot = useMemo(() => {
    if (!selectedInvestment) return null;

    return getInvestmentSnapshot({
      amount: selectedInvestment.amount,
      annualRate: selectedInvestment.annualRate,
      date: selectedInvestment.date,
    });
  }, [selectedInvestment]);

  const editCategoryOptions = useMemo(() => {
    const categoryOptions =
      editForm.type === "INCOME"
        ? [...BASE_TRANSACTION_CATEGORIES, EXTRA_INCOME_TRANSACTION_CATEGORY]
        : BASE_TRANSACTION_CATEGORIES;

    const hasCategory = categoryOptions.some(
      (option) => normalizeCategory(option.value) === normalizeCategory(editForm.category)
    );

    if (hasCategory || !editForm.category.trim()) return categoryOptions;

    return [
      ...categoryOptions,
      {
        value: editForm.category,
        label: formatCategoryLabel(editForm.category),
      },
    ];
  }, [editForm.category, editForm.type]);

  const editPaymentMethodOptions = useMemo(() => {
    const hasPaymentMethod = PAYMENT_METHOD_OPTIONS.some(
      (option) => normalizeCategory(option.value) === normalizeCategory(editForm.paymentMethod)
    );

    if (hasPaymentMethod || !editForm.paymentMethod.trim()) return PAYMENT_METHOD_OPTIONS;

    return [
      ...PAYMENT_METHOD_OPTIONS,
      {
        value: editForm.paymentMethod,
        label: formatCategoryLabel(editForm.paymentMethod),
      },
    ];
  }, [editForm.paymentMethod]);

  const isEditingInvestment = normalizeCategory(editForm.category) === "investimentos";

  const handleOpenInvestment = (transaction: FinanceTransaction) => {
    const isInvestment = normalizeCategory(transaction.category) === "investimentos";
    if (!isInvestment) return;

    setSelectedInvestment(transaction);
  };

  const handleOpenEdit = (transaction: FinanceTransaction) => {
    setActionError(null);
    setEditingTransaction(transaction);
    setEditReceiptFile(null);
    setEditError(null);
    setEditForm({
      type: transaction.type,
      description: transaction.description ?? "",
      amount: toAmountNumber(transaction.amount).toString(),
      annualRate:
        transaction.annualRate !== null && transaction.annualRate !== undefined
          ? toAmountNumber(transaction.annualRate).toString()
          : "",
      category: normalizeCategory(transaction.category),
      date: toInputDate(transaction.date),
      paymentMethod: normalizeCategory(transaction.paymentMethod),
      receiptFileName: "",
    });
  };

  const handleEditTypeChange = (type: FinanceTransactionType) => {
    setEditForm((current) => {
      const isPaymentCategory = normalizeCategory(current.category) === EXTRA_INCOME_TRANSACTION_CATEGORY.value;
      const nextCategory = type === "EXPENSE" && isPaymentCategory
        ? BASE_TRANSACTION_CATEGORIES[0]?.value ?? "moradia"
        : current.category;

      return {
        ...current,
        type,
        category: nextCategory,
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    const description = editForm.description.trim();
    const amount = Number(editForm.amount.replace(",", "."));
    const category = editForm.category.trim();
    const paymentMethod = editForm.paymentMethod.trim();
    const annualRate = Number(editForm.annualRate.replace(",", "."));

    if (!description) {
      setEditError("Informe a descrição.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Informe um valor válido maior que zero.");
      return;
    }

    if (!category) {
      setEditError("Selecione uma categoria.");
      return;
    }

    if (!paymentMethod) {
      setEditError("Selecione a forma de pagamento.");
      return;
    }

    if (!editForm.date) {
      setEditError("Selecione a data.");
      return;
    }

    if (isEditingInvestment && (!Number.isFinite(annualRate) || annualRate <= 0)) {
      setEditError("Informe uma taxa anual válida maior que zero para investimentos.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const nextReceiptUrl = editReceiptFile
        ? await fileToDataUrl(editReceiptFile)
        : editingTransaction.receiptUrl ?? undefined;

      await updateTransaction({
        id: editingTransaction.id,
        type: editForm.type,
        description,
        amount,
        annualRate: isEditingInvestment ? annualRate : undefined,
        category,
        date: toApiDate(editForm.date),
        paymentMethod,
        receiptUrl: nextReceiptUrl,
      });

      setEditingTransaction(null);
      setEditReceiptFile(null);
      window.dispatchEvent(new Event(FINANCE_UPDATED_EVENT));
    } catch (saveError) {
      if (saveError instanceof Error) {
        setEditError(toFriendlySubmitError(saveError));
      } else {
        setEditError(getApiErrorMessage(saveError) ?? "Não foi possível editar a movimentação.");
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (transaction: FinanceTransaction) => {
    if (isDeletingId) return;

    const amount = Math.abs(toAmountNumber(transaction.amount));
    const confirmed = window.confirm(
      `Excluir a movimentação "${transaction.description || "Sem descrição"}" (${formatCurrencyBRL(amount)})?`
    );
    if (!confirmed) return;

    setActionError(null);
    setIsDeletingId(transaction.id);

    try {
      await deleteTransaction(transaction.id);

      if (selectedInvestment?.id === transaction.id) {
        setSelectedInvestment(null);
      }

      if (editingTransaction?.id === transaction.id) {
        setEditingTransaction(null);
        setEditReceiptFile(null);
        setEditError(null);
      }

      window.dispatchEvent(new Event(FINANCE_UPDATED_EVENT));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir a movimentação."
      );
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <>
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
          {actionError ? (
            <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {actionError}
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
                      <TableHead>Comprovantes</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((item) => {
                      const categoryVisual = resolveCategoryVisual(item.category);
                      const paymentMethodVisual = resolvePaymentMethodVisual(item.paymentMethod);
                      const isIncome = item.type === "INCOME";
                      const isInvestment = normalizeCategory(item.category) === "investimentos";
                      const amount = Math.abs(toAmountNumber(item.amount));
                      const amountClass = isInvestment
                        ? "text-primary"
                        : isIncome
                          ? "text-success"
                          : "text-destructive";
                      const CategoryIcon = categoryVisual.icon;
                      const PaymentIcon = paymentMethodVisual.icon;
                      const categoryStyles = getCategoryToneClasses(categoryVisual.tone);
                      const receiptLink = resolveReceiptLink(item.receiptUrl);

                      return (
                        <TableRow
                          key={item.id}
                          className={cn(isInvestment && "cursor-pointer hover:bg-primary/8")}
                          onClick={() => handleOpenInvestment(item)}
                          onKeyDown={(event) => {
                            if (!isInvestment) return;
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            handleOpenInvestment(item);
                          }}
                          role={isInvestment ? "button" : undefined}
                          tabIndex={isInvestment ? 0 : undefined}
                        >
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
                          <TableCell>
                            {receiptLink ? (
                              <a
                                href={receiptLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                              >
                                Ver comprovante
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem comprovante</span>
                            )}
                          </TableCell>
                          <TableCell className={cn("text-right text-base font-semibold whitespace-nowrap tabular-nums", amountClass)}>
                            {`${isIncome ? "+" : "-"}${formatCurrencyBRL(amount)}`}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenEdit(item);
                                }}
                                disabled={isDeletingId === item.id}
                              >
                                <Pencil className="size-3.5" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDelete(item);
                                }}
                                disabled={isDeletingId === item.id}
                              >
                                <Trash2 className="size-3.5" />
                                {isDeletingId === item.id ? "Excluindo..." : "Excluir"}
                              </Button>
                            </div>
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
                  const isInvestment = normalizeCategory(item.category) === "investimentos";
                  const amount = Math.abs(toAmountNumber(item.amount));
                  const amountClass = isInvestment
                    ? "text-primary"
                    : isIncome
                      ? "text-success"
                      : "text-destructive";
                  const CategoryIcon = categoryVisual.icon;
                  const PaymentIcon = paymentMethodVisual.icon;
                  const categoryStyles = getCategoryToneClasses(categoryVisual.tone);
                  const receiptLink = resolveReceiptLink(item.receiptUrl);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "space-y-3 rounded-2xl border border-border/75 bg-background/70 px-4 py-3",
                        isInvestment && "cursor-pointer hover:border-primary/30"
                      )}
                      onClick={() => handleOpenInvestment(item)}
                    >
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

                      <div>
                        {receiptLink ? (
                          <a
                            href={receiptLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                          >
                            Ver comprovante
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem comprovante</span>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          disabled={isDeletingId === item.id}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(item);
                          }}
                          disabled={isDeletingId === item.id}
                        >
                          <Trash2 className="size-3.5" />
                          {isDeletingId === item.id ? "Excluindo..." : "Excluir"}
                        </Button>
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

      <Dialog
        open={Boolean(editingTransaction)}
        onOpenChange={(isOpen) => {
          if (isSubmittingEdit) return;
          if (!isOpen) {
            setEditingTransaction(null);
            setEditReceiptFile(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_42%),linear-gradient(120deg,rgba(30,30,30,0.98),rgba(18,18,18,0.96))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              Editar movimentação
            </DialogTitle>
            <DialogDescription>
              Atualize os dados da movimentação e salve para aplicar no histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => handleEditTypeChange(value as FinanceTransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Entrada</SelectItem>
                    <SelectItem value="EXPENSE">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Ex.: Compra supermercado"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select
                  value={editForm.paymentMethod}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    {editPaymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {editCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comprovante</Label>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-input bg-background px-2.5">
                  <input
                    id={editReceiptInputId}
                    type="file"
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setEditReceiptFile(file);
                      setEditForm((current) => ({
                        ...current,
                        receiptFileName: file?.name ?? "",
                      }));
                    }}
                  />
                  <label
                    htmlFor={editReceiptInputId}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/15 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                  >
                    <Paperclip className="size-3.5" />
                    Escolher arquivo
                  </label>
                  <span
                    className={cn(
                      "truncate text-sm",
                      editForm.receiptFileName || editingTransaction?.receiptUrl
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {editForm.receiptFileName ||
                      (editingTransaction?.receiptUrl
                        ? "Comprovante atual salvo"
                        : "Nenhum arquivo escolhido")}
                  </span>
                </div>
              </div>
            </div>

            {isEditingInvestment ? (
              <div className="space-y-2">
                <Label>Taxa anual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.annualRate}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, annualRate: event.target.value }))
                  }
                  placeholder="12.50"
                />
              </div>
            ) : null}

            {editError ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-3 gap-3 border-t border-border/60 pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl px-4"
              onClick={() => {
                if (isSubmittingEdit) return;
                setEditingTransaction(null);
                setEditReceiptFile(null);
                setEditError(null);
              }}
              disabled={isSubmittingEdit}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-xl px-4 font-semibold"
              onClick={() => void handleSaveEdit()}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedInvestment)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedInvestment(null);
        }}
      >
        <DialogContent className="max-w-lg border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_42%),linear-gradient(120deg,rgba(30,30,30,0.98),rgba(18,18,18,0.96))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-primary" />
              Detalhes do investimento
            </DialogTitle>
            <DialogDescription>
              O rendimento é atualizado somente após cada mês completo desde a data do aporte.
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && selectedSnapshot ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Descrição</p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedInvestment.description || "Investimento"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">% ao ano</p>
                  <p className="mt-1 text-lg font-semibold text-primary tabular-nums">
                    {selectedSnapshot.annualRate > 0 ? `${selectedSnapshot.annualRate.toFixed(2)}% a.a` : "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Aporte inicial</p>
                  <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.principal)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Rendimento acumulado</p>
                  <p className="mt-1 text-lg font-semibold text-success tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.earnings)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/65 p-3">
                  <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Valor atualizado</p>
                  <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyBRL(selectedSnapshot.currentValue)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs tracking-[0.12em] text-primary uppercase">Ciclo de atualização</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-primary">
                  <Badge variant="default">{selectedSnapshot.monthsElapsed} mês(es) completos</Badge>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    Próxima virada: {formatDateBR(selectedSnapshot.nextUpdateDate)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
