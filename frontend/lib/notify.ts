import { API_BASE_URL } from "@/lib/finance";

export const NOTIFY_UPDATED_EVENT = "notify:updated";

type NotifyApiItem = {
  id: string;
  title: string;
  type: string;
  message: string;
  is_read: string;
  unread?: boolean;
  createdAt: string;
  read_at: string;
};

type NotifyApiResponse =
  | NotifyApiItem[]
  | {
      success?: boolean;
      data?: unknown;
      message?: unknown;
    };

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  type: string;
  unread: boolean;
  createdAt: string;
};

function toNotification(item: NotifyApiItem): AppNotification {
  const unreadFromIsRead = item.is_read.trim().toLowerCase() !== "true";
  return {
    id: item.id,
    title: item.title,
    description: item.message,
    type: item.type,
    unread: typeof item.unread === "boolean" ? item.unread : unreadFromIsRead,
    createdAt: item.createdAt,
  };
}

function parseRows(payload: NotifyApiResponse | null): NotifyApiItem[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
    return payload.data as NotifyApiItem[];
  }

  return [];
}

function getErrorMessage(payload: NotifyApiResponse | null): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) return null;

  const message = payload.message;
  if (typeof message === "string" && message.trim()) return message;
  return null;
}

export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const response = await fetch(`${API_BASE_URL}/notify?limit=${Math.max(1, Math.min(limit, 100))}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as NotifyApiResponse | null;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? "Não foi possível carregar as notificações.");
  }

  return parseRows(payload).map(toNotification);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notify/${id}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as NotifyApiResponse | null;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? "Não foi possível marcar a notificação como lida.");
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notify/read-all`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as NotifyApiResponse | null;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? "Não foi possível marcar as notificações como lidas.");
  }
}
