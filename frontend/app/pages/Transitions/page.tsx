"use client";

import { useMemo, useState } from "react";

import { TransactionsFilters } from "@/components/Transitions/TransactionsFilters";
import { TransactionsHeader } from "@/components/Transitions/TransactionsHeader";
import { TransactionsList } from "@/components/Transitions/TransactionsList";
import { TransactionsSummary } from "@/components/Transitions/TransactionsSummary";
import { normalizeCategory } from "@/components/Transitions/transaction-visuals";
import type { TransactionsFiltersState } from "@/components/Transitions/types";
import { BottomNavigation, Header } from "@/components/layout/Header";
import { toAmountNumber } from "@/lib/finance";
import { ALL_TRANSACTION_CATEGORIES } from "@/lib/transaction-categories";
import { useFinanceTransactions } from "@/lib/use-finance-transactions";

const INITIAL_FILTERS: TransactionsFiltersState = {
  type: "all",
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

export default function TransitionsPage() {
  const { transactions, isLoading, error } = useFinanceTransactions();
  const [filters, setFilters] = useState<TransactionsFiltersState>(INITIAL_FILTERS);
  const categoryOptions = ALL_TRANSACTION_CATEGORIES;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType =
        filters.type === "all" ||
        (filters.type === "income" && transaction.type === "INCOME") ||
        (filters.type === "expense" && transaction.type === "EXPENSE");

      if (!matchesType) return false;

      if (filters.category !== "all") {
        const transactionCategory = normalizeCategory(transaction.category);
        if (transactionCategory !== filters.category) return false;
      }

      const transactionDateKey = toLocalDateKey(transaction.date);
      if (filters.date && (!transactionDateKey || transactionDateKey !== filters.date)) {
        return false;
      }

      return true;
    });
  }, [filters, transactions]);

  const filteredSummary = useMemo(() => {
    let entries = 0;
    let expenses = 0;

    for (const transaction of filteredTransactions) {
      const amount = Math.abs(toAmountNumber(transaction.amount));
      if (transaction.type === "INCOME") {
        entries += amount;
      } else {
        expenses += amount;
      }
    }

    return {
      entries,
      expenses,
      balance: entries - expenses,
    };
  }, [filteredTransactions]);

  const handleFiltersChange = (next: Partial<TransactionsFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header activeTab="transactions" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:gap-5 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
        <TransactionsHeader />

        <TransactionsSummary
          entries={filteredSummary.entries}
          expenses={filteredSummary.expenses}
          balance={filteredSummary.balance}
          count={filteredTransactions.length}
        />

        <TransactionsFilters
          filters={filters}
          categories={categoryOptions}
          resultCount={filteredTransactions.length}
          onChange={handleFiltersChange}
          onClear={() => setFilters(INITIAL_FILTERS)}
        />

        <TransactionsList transactions={filteredTransactions} isLoading={isLoading} error={error} />
      </main>
      <BottomNavigation activeTab="transactions" />
    </div>
  );
}
