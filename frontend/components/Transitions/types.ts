export type TransactionTypeFilter = "all" | "income" | "expense";

export type TransactionsFiltersState = {
  type: TransactionTypeFilter;
  category: string;
  date: string;
};
