import type { Mensalidade } from "@/components/mensalidades/types";

export const mensalidadesMock: Mensalidade[] = [
  {
    id: "internet",
    name: "Plano de Internet Fibra",
    category: "servicos",
    dueDate: "2026-05-05",
    amount: 149.9,
    paidAt: null,
    autopay: true,
  },
  {
    id: "academia",
    name: "Academia Premium",
    category: "saude",
    dueDate: "2026-05-10",
    amount: 129.9,
    paidAt: "2026-04-24",
  },
  {
    id: "streaming",
    name: "Assinatura Streaming",
    category: "assinaturas",
    dueDate: "2026-05-12",
    amount: 39.9,
    paidAt: null,
  },
  {
    id: "condominio",
    name: "Condomínio",
    category: "moradia",
    dueDate: "2026-04-15",
    amount: 650,
    paidAt: null,
  },
  {
    id: "energia",
    name: "Conta de Energia",
    category: "utilidades",
    dueDate: "2026-04-30",
    amount: 219.7,
    paidAt: null,
    autopay: true,
  },
  {
    id: "curso",
    name: "Plataforma de Estudos",
    category: "educacao",
    dueDate: "2026-05-22",
    amount: 89.9,
    paidAt: null,
  },
];
