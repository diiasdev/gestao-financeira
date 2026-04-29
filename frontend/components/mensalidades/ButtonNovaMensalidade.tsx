"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { z } from "zod";

import type { MensalidadeCategory } from "@/components/mensalidades/types";
import { resolveCategoryVisual } from "@/components/mensalidades/utils";
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
  DialogTrigger,
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
import { cn } from "@/lib/utils";

const categoryOptions: MensalidadeCategory[] = [
  "moradia",
  "utilidades",
  "servicos",
  "assinaturas",
  "educacao",
  "saude",
];

const installmentOptions = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `${value}x` };
});

function parseAmount(value: string): number {
  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) return Number.NaN;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;
  if (!decimalSeparator) return Number(cleaned);

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

function toLocalDateKey(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const mensalidadeSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da mensalidade."),
  category: z.enum(["servicos", "saude", "assinaturas", "moradia", "utilidades", "educacao"], {
    error: "Selecione uma categoria.",
  }),
  dueDate: z.date({ error: "Selecione a data de vencimento." }),
  amount: z
    .string()
    .min(1, "Informe o valor.")
    .refine((value) => Number.isFinite(parseAmount(value)) && parseAmount(value) > 0, {
      message: "Informe um valor válido maior que zero.",
    }),
  installments: z
    .string()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 12, {
      message: "Selecione a quantidade de parcelas.",
    }),
});

type MensalidadeFormValues = z.infer<typeof mensalidadeSchema>;

export type NovaMensalidadeInput = {
  name: string;
  category: MensalidadeCategory;
  dueDate: string;
  amount: number;
  installmentsTotal: number;
};

type ButtonNovaMensalidadeProps = {
  onCreate: (input: NovaMensalidadeInput) => void;
};

const defaultValues: DefaultValues<MensalidadeFormValues> = {
  name: "",
  category: undefined,
  dueDate: undefined,
  amount: "",
  installments: undefined,
};

export function ButtonNovaMensalidade({ onCreate }: ButtonNovaMensalidadeProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<MensalidadeFormValues>({
    resolver: zodResolver(mensalidadeSchema),
    defaultValues,
  });

  const handleSubmit = (values: MensalidadeFormValues) => {
    onCreate({
      name: values.name.trim(),
      category: values.category,
      dueDate: toLocalDateKey(values.dueDate),
      amount: parseAmount(values.amount),
      installmentsTotal: Number(values.installments),
    });

    form.reset(defaultValues);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset(defaultValues);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Nova mensalidade
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.1),transparent_42%),linear-gradient(120deg,rgba(30,30,30,0.98),rgba(18,18,18,0.96))] p-7">
        <DialogHeader>
          <DialogTitle>Cadastrar mensalidade</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar uma nova cobrança recorrente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Plano de celular" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorias</SelectLabel>
                          {categoryOptions.map((category) => {
                            const visual = resolveCategoryVisual(category);
                            const CategoryIcon = visual.icon;

                            return (
                              <SelectItem key={category} value={category}>
                                <span className="flex items-center gap-2">
                                  <CategoryIcon className="size-3.5 text-primary" />
                                  {visual.label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        className="h-11"
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

              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Quantidade</SelectLabel>
                          {installmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-between rounded-xl border-input bg-background px-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? new Intl.DateTimeFormat("pt-BR").format(field.value) : "dd/mm/aaaa"}
                          <CalendarIcon className="size-4 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-1">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl px-4">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="rounded-xl bg-primary px-4 font-semibold text-primary-foreground">
                <Wallet className="size-4" />
                Salvar mensalidade
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
