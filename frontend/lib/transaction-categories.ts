export type TransactionCategoryOption = {
  value: string;
  label: string;
};

export const BASE_TRANSACTION_CATEGORIES: TransactionCategoryOption[] = [
  { value: "moradia", label: "Moradia" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "transporte", label: "Transporte" },
  { value: "lazer", label: "Lazer" },
  { value: "investimentos", label: "Investimentos" },
  { value: "saude", label: "Saúde" },
  { value: "assinatura", label: "Assinatura" },
];

export const EXTRA_INCOME_TRANSACTION_CATEGORY: TransactionCategoryOption = {
  value: "pagamento",
  label: "Pagamento",
};

export const ALL_TRANSACTION_CATEGORIES: TransactionCategoryOption[] = [
  ...BASE_TRANSACTION_CATEGORIES,
  EXTRA_INCOME_TRANSACTION_CATEGORY,
];
