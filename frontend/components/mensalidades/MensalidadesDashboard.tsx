"use client";

import { useEffect, useMemo, useState } from "react";

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
import { resolveMensalidadeCycle } from "@/lib/monthly-installments";
import { fetchMonthly, markMonthlyAsPaid, registerMonthly } from "@/lib/monthly";

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
  const [monthlyPlans, setMonthlyPlans] = useState<Mensalidade[]>([]);
  const [filters, setFilters] = useState<MensalidadesFiltersState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [referenceNow, setReferenceNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const monthly = await fetchMonthly();
        if (!active) return;
        setMonthlyPlans(monthly);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Não foi possível carregar as mensalidades."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReferenceNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const mensalidades = useMemo(
    () => monthlyPlans.map((item) => resolveMensalidadeCycle(item, referenceNow)),
    [monthlyPlans, referenceNow]
  );

  const categories = useMemo(() => {
    const unique = new Set<MensalidadeCategory>(monthlyPlans.map((item) => item.category));

    return Array.from(unique)
      .sort((a, b) => resolveCategoryVisual(a).label.localeCompare(resolveCategoryVisual(b).label, "pt-BR"))
      .map((category) => ({
        value: category,
        label: resolveCategoryVisual(category).label,
      }));
  }, [monthlyPlans]);

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

  const handleCreateMensalidade = async (input: NovaMensalidadeInput) => {
    const createdMonthly = await registerMonthly({
      name: input.name,
      category: input.category,
      amount: input.amount,
      dueDate: input.dueDate,
      installmentsTotal: input.installmentsTotal,
    });

    setMonthlyPlans((current) => [...current, createdMonthly]);
    setLoadError(null);
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const updatedMonthly = await markMonthlyAsPaid(id);

      setMonthlyPlans((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updatedMonthly } : item))
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Não foi possível atualizar o status da mensalidade."
      );
    }
  };

  const handleFiltersChange = (next: Partial<MensalidadesFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <MensalidadesHero summary={summary} onCreateMensalidade={handleCreateMensalidade} />
      <MensalidadesMetrics summary={summary} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando mensalidades...</p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      <MensalidadesFilters
        filters={filters}
        categories={categories}
        resultCount={orderedItems.length}
        onChange={handleFiltersChange}
        onClear={() => setFilters(INITIAL_FILTERS)}
      />

      <MensalidadesTimeline items={orderedItems} onMarkAsPaid={handleMarkAsPaid} />
    </div>
  );
}
