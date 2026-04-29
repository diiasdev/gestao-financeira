export type MensalidadeCategory =
  | "servicos"
  | "saude"
  | "assinaturas"
  | "moradia"
  | "utilidades"
  | "educacao";

export type MensalidadeStatus = "paid" | "pending" | "overdue";

export type Mensalidade = {
  id: string;
  name: string;
  category: MensalidadeCategory;
  dueDate: string;
  amount: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  paidAt?: string | null;
  autopay?: boolean;
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
