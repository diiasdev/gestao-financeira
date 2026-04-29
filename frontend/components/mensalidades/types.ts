export type MensalidadeCategory =
  | "servicos"
  | "saude"
  | "assinaturas"
  | "moradia"
  | "utilidades"
  | "educacao";

export type MensalidadeStatus = "paid" | "pending" | "overdue";

export type MensalidadeInstallmentHistoryItem = {
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  status: MensalidadeStatus;
  isCurrent: boolean;
};

export type Mensalidade = {
  id: string;
  name: string;
  category: MensalidadeCategory;
  dueDate: string;
  amount: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  paidAt?: string | null;
  statusRaw?: string | null;
  updatedAt?: string;
  autopay?: boolean;
  installmentHistory?: MensalidadeInstallmentHistoryItem[];
};

export type MensalidadesSummary = {
  totalProjected: number;
  totalPaid: number;
  totalOpen: number;
  overdueAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  dueSoonCount: number;
};

export type MensalidadesFilterStatus = "all" | MensalidadeStatus;

export type MensalidadesFiltersState = {
  status: MensalidadesFilterStatus;
  category: MensalidadeCategory | "all";
  date: string;
};
