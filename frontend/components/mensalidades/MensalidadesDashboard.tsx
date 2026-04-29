"use client";

import { useMemo, useState } from "react";

import { mensalidadesMock } from "@/components/mensalidades/data";
import type { NovaMensalidadeInput } from "@/components/mensalidades/ButtonNovaMensalidade";
import { MensalidadesFilters } from "@/components/mensalidades/MensalidadesFilters";
import { MensalidadesHero } from "@/components/mensalidades/MensalidadesHero";
import { MensalidadesMetrics } from "@/components/mensalidades/MensalidadesMetrics";
import { MensalidadesTimeline } from "@/components/mensalidades/MensalidadesTimeline";
import type { Mensalidade, MensalidadeCategory, MensalidadesFiltersState } from "@/components/mensalidades/types";
import {
  getMensalidadeStatus,
  getMensalidadesSummary,
  resolveCategoryVisual,
  sortMensalidadesByPriority,
} from "@/components/mensalidades/utils";

const INITIAL_FILTERS: MensalidadesFiltersState = {
  status: "all",
  category: "all",
  date: "",
};

function toLocalDateKey(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MensalidadesDashboard() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>(mensalidadesMock);
  const [filters, setFilters] = useState<MensalidadesFiltersState>(INITIAL_FILTERS);

  const categories = useMemo(() => {
    const unique = new Set<MensalidadeCategory>(mensalidades.map((item) => item.category));

    return Array.from(unique)
      .sort((a, b) => resolveCategoryVisual(a).label.localeCompare(resolveCategoryVisual(b).label, "pt-BR"))
      .map((category) => ({
        value: category,
        label: resolveCategoryVisual(category).label,
      }));
  }, [mensalidades]);

  const filteredItems = useMemo(() => {
    return mensalidades.filter((item) => {
      const status = getMensalidadeStatus(item);
      const itemDate = toLocalDateKey(item.dueDate);

      const matchesStatus = filters.status === "all" || status === filters.status;
      if (!matchesStatus) return false;

      const matchesCategory = filters.category === "all" || item.category === filters.category;
      if (!matchesCategory) return false;

      if (filters.date && (!itemDate || itemDate !== filters.date)) return false;

      return true;
    });
  }, [filters, mensalidades]);

  const orderedItems = useMemo(() => sortMensalidadesByPriority(filteredItems), [filteredItems]);
  const summary = useMemo(() => getMensalidadesSummary(filteredItems), [filteredItems]);

  const handleCreateMensalidade = (input: NovaMensalidadeInput) => {
    const normalizedId = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const itemId = `${normalizedId || "mensalidade"}-${Date.now()}`;

    setMensalidades((current) => [
      ...current,
      {
        id: itemId,
        name: input.name,
        category: input.category,
        dueDate: input.dueDate,
        amount: input.amount,
        installmentCurrent: 1,
        installmentTotal: input.installmentsTotal,
        paidAt: null,
      },
    ]);
  };

  const handleFiltersChange = (next: Partial<MensalidadesFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <MensalidadesHero summary={summary} onCreateMensalidade={handleCreateMensalidade} />
      <MensalidadesMetrics summary={summary} />

      <MensalidadesFilters
        filters={filters}
        categories={categories}
        resultCount={orderedItems.length}
        onChange={handleFiltersChange}
        onClear={() => setFilters(INITIAL_FILTERS)}
      />

      <MensalidadesTimeline items={orderedItems} />
    </div>
  );
}
