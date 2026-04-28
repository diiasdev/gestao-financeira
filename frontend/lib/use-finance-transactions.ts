"use client";

import { useCallback, useEffect, useState } from "react";

import { FINANCE_UPDATED_EVENT, fetchTransactions, type FinanceTransaction } from "@/lib/finance";

export function useFinanceTransactions() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);

    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as movimentações."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();

    const handleTransactionsUpdated = () => {
      void reload();
    };

    window.addEventListener(FINANCE_UPDATED_EVENT, handleTransactionsUpdated);

    return () => {
      window.removeEventListener(FINANCE_UPDATED_EVENT, handleTransactionsUpdated);
    };
  }, [reload]);

  return {
    transactions,
    isLoading,
    error,
    reload,
  };
}
