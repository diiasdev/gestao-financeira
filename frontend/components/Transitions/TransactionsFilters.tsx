import { CalendarDays, Filter, ListFilter, RotateCcw } from "lucide-react";

import { resolveCategoryVisual } from "@/components/Transitions/transaction-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionsFiltersState } from "@/components/Transitions/types";
import { cn } from "@/lib/utils";

type CategoryOption = {
  value: string;
  label: string;
};

type TransactionsFiltersProps = {
  filters: TransactionsFiltersState;
  categories: CategoryOption[];
  resultCount: number;
  onChange: (next: Partial<TransactionsFiltersState>) => void;
  onClear: () => void;
};

export function TransactionsFilters({
  filters,
  categories,
  resultCount,
  onChange,
  onClear,
}: TransactionsFiltersProps) {
  const hasActiveFilters = filters.type !== "all" || filters.category !== "all" || Boolean(filters.date);
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : undefined;
  const selectedCategory = filters.category === "all" ? null : categories.find((category) => category.value === filters.category);
  const SelectedCategoryIcon = selectedCategory ? resolveCategoryVisual(selectedCategory.value).icon : ListFilter;

  const formatDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="size-4 text-primary" />
              Filtros
            </CardTitle>
            <CardDescription>Refine a visualização por categoria, tipo de movimentação e data.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{resultCount} resultados</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={onClear}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="size-3.5" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Tipo</p>
            <Select value={filters.type} onValueChange={(value) => onChange({ type: value as TransactionsFiltersState["type"] })}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ambos</SelectItem>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Categoria</p>
            <Select value={filters.category} onValueChange={(value) => onChange({ category: value })}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione a categoria">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <SelectedCategoryIcon className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedCategory?.label ?? "Todas as categorias"}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <ListFilter className="size-4 text-primary" />
                    Todas as categorias
                  </span>
                </SelectItem>
                {categories.map((category) => {
                  const CategoryIcon = resolveCategoryVisual(category.value).icon;

                  return (
                    <SelectItem key={category.value} value={category.value}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon className="size-4 text-primary" />
                        {category.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Data</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-between rounded-xl border-input bg-background px-3 text-left text-sm font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <span>{selectedDate ? new Intl.DateTimeFormat("pt-BR").format(selectedDate) : "dd/mm/aaaa"}</span>
                  <CalendarDays className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => onChange({ date: date ? formatDateInputValue(date) : "" })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
