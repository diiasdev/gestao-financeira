"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cva } from "class-variance-authority";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  CarFront,
  CheckCircle2,
  CreditCard,
  FileText,
  Heart,
  House,
  Paperclip,
  Pin,
  PiggyBank,
  QrCode,
  Ticket,
  UtensilsCrossed,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { useForm, useWatch, type DefaultValues } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeCategory } from "@/components/Transitions/transaction-visuals";
import { API_BASE_URL, FINANCE_UPDATED_EVENT } from "@/lib/finance";
import { NOTIFY_UPDATED_EVENT } from "@/lib/notify";
import { BASE_TRANSACTION_CATEGORIES, EXTRA_INCOME_TRANSACTION_CATEGORY } from "@/lib/transaction-categories";
import { cn } from "@/lib/utils";

const movementSchema = z
  .object({
    movementType: z.enum(["income", "expense"]),
    description: z.string().min(1, "Informe a descrição"),
    amount: z.string().min(1, "Informe o valor"),
    paymentMethod: z.string().min(1, "Selecione a forma de pagamento"),
    category: z.string().min(1, "Selecione uma categoria"),
    date: z.date({ error: "Selecione uma data" }),
    receipt: z.string().optional(),
    annualRate: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!isInvestmentCategory(values.category)) return;

    const annualRate = parseAnnualRate(values.annualRate ?? "");
    if (!Number.isFinite(annualRate) || annualRate <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma taxa anual válida maior que zero.",
        path: ["annualRate"],
      });
    }
  });

type MovementFormValues = z.infer<typeof movementSchema>;
type TransactionType = "INCOME" | "EXPENSE";

type RegisterMovementPayload = {
  type: TransactionType;
  description: string;
  amount: number;
  annualRate?: number;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
};

type ReceiptAutofillData = {
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
};

type ReceiptAutofillResponse = {
  success?: boolean;
  message?: unknown;
  data?: unknown;
};

const categories: Array<{
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = BASE_TRANSACTION_CATEGORIES.map((category) => {
  const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    moradia: House,
    alimentacao: UtensilsCrossed,
    transporte: CarFront,
    lazer: Ticket,
    investimentos: PiggyBank,
    saude: Heart,
    assinatura: FileText,
  };

  return {
    value: category.value,
    label: category.label,
    icon: iconMap[category.value] ?? Wallet,
  };
});

const incomeExtraCategory: {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
} = {
  value: EXTRA_INCOME_TRANSACTION_CATEGORY.value,
  label: EXTRA_INCOME_TRANSACTION_CATEGORY.label,
  icon: Wallet,
};

const paymentMethods: Array<{
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "pix", label: "Pix", icon: QrCode },
  { value: "credito", label: "Crédito", icon: CreditCard },
  { value: "debito", label: "Débito", icon: WalletCards },
];

const movementTypeCard = cva(
  "relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
  {
    variants: {
      tone: {
        income: "",
        expense: "",
      },
      active: {
        true: "",
        false: "opacity-80 hover:opacity-100",
      },
    },
    compoundVariants: [
      {
        tone: "income",
        active: true,
        className:
          "border-success/60 bg-success/15 text-success shadow-[0_0_26px_rgba(46,204,113,0.18)]",
      },
      {
        tone: "income",
        active: false,
        className: "border-success/35 bg-success/10 text-success",
      },
      {
        tone: "expense",
        active: true,
        className:
          "border-destructive/60 bg-destructive/15 text-destructive shadow-[0_0_26px_rgba(231,76,60,0.2)]",
      },
      {
        tone: "expense",
        active: false,
        className: "border-destructive/35 bg-destructive/10 text-destructive",
      },
    ],
    defaultVariants: {
      active: false,
    },
  }
);

const defaultMovementValues: DefaultValues<MovementFormValues> = {
  movementType: "income",
  description: "",
  amount: "",
  paymentMethod: "",
  category: "",
  date: undefined,
  receipt: "",
  annualRate: "",
};

function isInvestmentCategory(category: string): boolean {
  return normalizeCategory(category) === "investimentos";
}

function parseAmount(value: string): number {
  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) return Number.NaN;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;

  if (!decimalSeparator) {
    return Number(cleaned);
  }

  const thousandSeparator = decimalSeparator === "," ? "." : ",";
  const withoutThousandSeparator = cleaned.split(thousandSeparator).join("");
  const normalized =
    decimalSeparator === ","
      ? withoutThousandSeparator.replace(",", ".")
      : withoutThousandSeparator;

  return Number(normalized);
}

function formatAmountInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const amount = Number(digitsOnly) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function parseAnnualRate(value: string): number {
  const cleaned = value.trim().replace("%", "").replace(/\s+/g, "").replace(",", ".");
  if (!cleaned) return Number.NaN;

  return Number(cleaned);
}

function formatAnnualRateInput(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const [integerPart, ...decimals] = cleaned.split(".");
  const decimal = decimals.join("").slice(0, 2);

  return decimal.length > 0 ? `${integerPart}.${decimal}` : integerPart;
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

function formatAmountFromNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toReceiptAutofillData(payload: unknown): ReceiptAutofillData | null {
  if (!payload || typeof payload !== "object") return null;

  const row = payload as Record<string, unknown>;
  if (
    typeof row.type !== "string" ||
    typeof row.description !== "string" ||
    typeof row.amount !== "number" ||
    typeof row.date !== "string" ||
    typeof row.paymentMethod !== "string"
  ) {
    return null;
  }

  if (row.type !== "INCOME" && row.type !== "EXPENSE") {
    return null;
  }

  return {
    type: row.type,
    description: row.description,
    amount: row.amount,
    date: row.date,
    paymentMethod: row.paymentMethod,
    receiptUrl: typeof row.receiptUrl === "string" ? row.receiptUrl : undefined,
  };
}

function getApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const message = (data as { message?: unknown }).message;
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

  return message || "Não foi possível registrar a movimentação.";
}

export function ButtonMoviments() {
  const receiptInputId = useId();
  const quickReceiptInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [isPinningReceipt, setIsPinningReceipt] = useState(false);
  const [isQuickPinningReceipt, setIsQuickPinningReceipt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: defaultMovementValues,
  });

  const selectedType = useWatch({
    control: form.control,
    name: "movementType",
  });
  const selectedCategory = useWatch({
    control: form.control,
    name: "category",
  });
  const isInvestmentCategorySelected = isInvestmentCategory(selectedCategory);
  const categoryOptions = selectedType === "income" ? [...categories, incomeExtraCategory] : categories;

  useEffect(() => {
    if (selectedType === "expense" && selectedCategory === incomeExtraCategory.value) {
      form.setValue("category", "", { shouldValidate: true });
    }
  }, [form, selectedCategory, selectedType]);

  useEffect(() => {
    if (!isInvestmentCategorySelected) {
      form.setValue("annualRate", "", { shouldValidate: false, shouldDirty: false });
    }
  }, [form, isInvestmentCategorySelected]);

  useEffect(() => {
    if (!successAlert) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessAlert(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successAlert]);

  const registerMovement = async (payload: RegisterMovementPayload, successMessage: string) => {
    const response = await fetch(`${API_BASE_URL}/finance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(data) ?? "Não foi possível registrar a movimentação.");
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      (data as { success: boolean }).success === false
    ) {
      throw new Error(getApiErrorMessage(data) ?? "Não foi possível registrar a movimentação.");
    }

    form.reset(defaultMovementValues);
    setSelectedReceiptFile(null);
    setDialogOpen(false);
    setSuccessAlert(successMessage);
    window.dispatchEvent(new Event(FINANCE_UPDATED_EVENT));
    window.dispatchEvent(new Event(NOTIFY_UPDATED_EVENT));
  };

  const registerFromReceiptFile = async (
    file: File,
    options: { shouldAutoRegister: boolean; fallbackCategory?: string; successMessage: string }
  ) => {
    try {
      const receiptUrl = await fileToDataUrl(file);
      const response = await fetch(`${API_BASE_URL}/finance/receipt/autofill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiptUrl }),
      });

      const payload = (await response.json().catch(() => null)) as ReceiptAutofillResponse | null;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload) ?? "Não foi possível ler o comprovante.");
      }

      if (payload?.success === false) {
        throw new Error(getApiErrorMessage(payload) ?? "Não foi possível ler o comprovante.");
      }

      const autofill = toReceiptAutofillData(payload?.data);
      if (!autofill) {
        throw new Error("Resposta inválida ao ler comprovante.");
      }

      const parsedDate = new Date(autofill.date);
      const resolvedDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      const resolvedType = autofill.type === "INCOME" ? "income" : "expense";

      form.setValue("movementType", resolvedType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("description", autofill.description, { shouldDirty: true, shouldValidate: true });
      form.setValue("amount", formatAmountFromNumber(autofill.amount), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("date", resolvedDate, { shouldDirty: true, shouldValidate: true });
      form.setValue("paymentMethod", autofill.paymentMethod, {
        shouldDirty: true,
        shouldValidate: true,
      });

      let selectedCategoryValue = form.getValues("category").trim();
      if (!selectedCategoryValue && options.fallbackCategory) {
        selectedCategoryValue = options.fallbackCategory;
        form.setValue("category", selectedCategoryValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (!selectedCategoryValue || !options.shouldAutoRegister) {
        setSuccessAlert("Comprovante lido. Escolha a categoria para concluir o registro.");
        return;
      }

      const annualRate = isInvestmentCategory(selectedCategoryValue)
        ? parseAnnualRate(form.getValues("annualRate") ?? "")
        : undefined;

      const movementPayload: RegisterMovementPayload = {
        type: autofill.type,
        description: autofill.description,
        amount: autofill.amount,
        annualRate: Number.isFinite(annualRate) ? annualRate : undefined,
        category: selectedCategoryValue,
        date: resolvedDate.toISOString(),
        paymentMethod: autofill.paymentMethod,
        receiptUrl,
      };

      await registerMovement(movementPayload, options.successMessage);
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setSubmitError(`Não foi possível conectar ao backend (${API_BASE_URL}).`);
        return;
      }

      setSubmitError(toFriendlySubmitError(error));
    }
  };

  const onPinReceipt = async () => {
    setSubmitError(null);

    if (!selectedReceiptFile) {
      setSubmitError("Selecione um comprovante para fixar.");
      return;
    }

    setIsPinningReceipt(true);
    try {
      await registerFromReceiptFile(selectedReceiptFile, {
        shouldAutoRegister: true,
        successMessage: "Movimentação registrada a partir do comprovante.",
      });
    } finally {
      setIsPinningReceipt(false);
    }
  };

  const onSubmit = async (values: MovementFormValues) => {
    setSubmitError(null);

    const parsedAmount = parseAmount(values.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError("Informe um valor válido maior que zero.");
      return;
    }

    const annualRate = isInvestmentCategory(values.category)
      ? parseAnnualRate(values.annualRate ?? "")
      : undefined;

    try {
      const receiptUrl = selectedReceiptFile ? await fileToDataUrl(selectedReceiptFile) : undefined;

      const payload: RegisterMovementPayload = {
        type: values.movementType === "income" ? "INCOME" : "EXPENSE",
        description: values.description,
        amount: parsedAmount,
        annualRate: Number.isFinite(annualRate) ? annualRate : undefined,
        category: values.category,
        date: values.date.toISOString(),
        paymentMethod: values.paymentMethod,
        receiptUrl,
      };

      await registerMovement(payload, "Movimentação registrada com sucesso.");
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setSubmitError(`Não foi possível conectar ao backend (${API_BASE_URL}).`);
        return;
      }

      setSubmitError(toFriendlySubmitError(error));
    }
  };

  const openNewMovementDialog = () => {
    setSubmitError(null);
    setDialogOpen(true);
  };

  const openPinReceiptDialog = () => {
    setSubmitError(null);
    quickReceiptInputRef.current?.click();
  };

  const onQuickPinFileChange = async (file: File | null) => {
    if (!file) return;

    setIsQuickPinningReceipt(true);
    setSubmitError(null);
    try {
      await registerFromReceiptFile(file, {
        shouldAutoRegister: true,
        fallbackCategory: "pagamento",
        successMessage: "Movimentação registrada por comprovante.",
      });
    } finally {
      setIsQuickPinningReceipt(false);
    }
  };

  return (
    <>
      <input
        ref={quickReceiptInputRef}
        type="file"
        accept=".pdf,image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void onQuickPinFileChange(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={openPinReceiptDialog}
          disabled={isQuickPinningReceipt || isPinningReceipt || form.formState.isSubmitting}
          className="h-10 rounded-xl border-primary/45 bg-primary/10 px-4 font-semibold text-primary hover:bg-primary/20"
        >
          <Pin className="size-4" />
          {isQuickPinningReceipt ? "Lendo comprovante..." : "Fixar comprovante"}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={openNewMovementDialog}
          className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Wallet className="size-4" />
          Novo Movimento
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) {
            setSubmitError(null);
            setSelectedReceiptFile(null);
            setIsPinningReceipt(false);
            form.setValue("receipt", "", { shouldValidate: false, shouldDirty: false });
          }
        }}
      >
        <DialogContent className="max-w-[720px] border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_42%),linear-gradient(120deg,rgba(30,30,30,0.98),rgba(18,18,18,0.96))] p-8">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle>Registrar movimentação</DialogTitle>
              <DialogDescription>
                Escolha o tipo e preencha os dados da sua entrada ou saída.
              </DialogDescription>
            </DialogHeader>

            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Fechar modal"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("income")}
                        className={movementTypeCard({
                          tone: "income",
                          active: field.value === "income",
                        })}
                        aria-pressed={field.value === "income"}
                      >
                        <span className="flex items-center gap-2 text-lg font-semibold">
                          <ArrowUpRight className="size-4" />
                          Entrada
                        </span>
                        <span className="text-sm text-foreground/70">Receita ou crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange("expense")}
                        className={movementTypeCard({
                          tone: "expense",
                          active: field.value === "expense",
                        })}
                        aria-pressed={field.value === "expense"}
                      >
                        <span className="flex items-center gap-2 text-lg font-semibold">
                          <ArrowDownLeft className="size-4" />
                          Saída
                        </span>
                        <span className="text-sm text-foreground/70">Despesa ou débito</span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprovante</FormLabel>
                  <FormControl>
                    <div className="flex min-h-12 items-center gap-2 rounded-xl border border-input bg-background px-2.5 py-1.5">
                      <input
                        id={receiptInputId}
                        type="file"
                        accept=".pdf,image/*"
                        className="sr-only"
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setSelectedReceiptFile(file);
                          field.onChange(file?.name ?? "");
                        }}
                      />

                      <label
                        htmlFor={receiptInputId}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/15 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                      >
                        <Paperclip className="size-3.5" />
                        Escolher arquivo
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg px-3 text-xs"
                        onClick={onPinReceipt}
                        disabled={!selectedReceiptFile || isPinningReceipt || form.formState.isSubmitting}
                      >
                        <Pin className="size-3.5" />
                        {isPinningReceipt ? "Lendo..." : "Fixar comprovante"}
                      </Button>

                      <span
                        className={cn(
                          "flex-1 truncate text-sm",
                          field.value ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {field.value || "Nenhum arquivo escolhido"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Salário, aluguel..." className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        className="h-12 text-base"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(formatAmountInput(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorias</SelectLabel>
                          {categoryOptions.map((category) => {
                            const Icon = category.icon;

                            return (
                              <SelectItem key={category.value} value={category.value}>
                                <span className="flex items-center gap-2">
                                  <Icon className="size-4 text-primary" />
                                  {category.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-12 w-full justify-between rounded-xl border-input bg-background px-3 text-left text-base font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? new Intl.DateTimeFormat("pt-BR").format(field.value)
                              : "dd/mm/aaaa"}
                            <CalendarIcon className="size-4 text-muted-foreground" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isInvestmentCategorySelected ? (
              <FormField
                control={form.control}
                name="annualRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% ao ano</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 12.5"
                        className="h-12 text-base"
                        inputMode="decimal"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(formatAnnualRateInput(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Pagamento</SelectLabel>
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;

                          return (
                            <SelectItem key={method.value} value={method.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="size-4 text-primary" />
                                {method.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-1">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl px-4"
                  disabled={form.formState.isSubmitting}
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={cn(
                  "rounded-xl px-4 font-semibold",
                  selectedType === "income" && "bg-success text-success-foreground hover:bg-success/90",
                  selectedType === "expense" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {form.formState.isSubmitting ? "Salvando..." : "Salvar movimentação"}
              </Button>
            </DialogFooter>
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {successAlert ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[80] flex items-center gap-2 rounded-xl border border-success/40 bg-success/15 px-4 py-3 text-sm font-medium text-success shadow-[0_16px_30px_rgba(46,204,113,0.28)] sm:bottom-4"
        >
          <CheckCircle2 className="size-4" />
          {successAlert}
        </div>
      ) : null}
    </>
  );
}
