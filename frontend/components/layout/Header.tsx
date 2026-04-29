"use client";

import Image from "next/image";
import Link from "next/link";
import { cva } from "class-variance-authority";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CalendarDays,
  CircleCheckBig,
  PiggyBank,
  LayoutDashboard,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  NOTIFY_UPDATED_EVENT,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/notify";
import { cn } from "@/lib/utils";

export type HeaderTab = "dashboard" | "transactions" | "mensalidades";

type HeaderProps = {
  activeTab: HeaderTab;
};

type NotificationTone = "warning" | "success" | "primary" | "neutral";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  tone: NotificationTone;
  unread?: boolean;
};

const tabs: Array<{
  id: HeaderTab;
  label: string;
  mobileLabel?: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/pages/Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "transactions",
    label: "Transações",
    href: "/pages/Transitions",
    icon: ArrowLeftRight,
  },
  {
    id: "mensalidades",
    label: "Mensalidades",
    mobileLabel: "Mensais",
    href: "/pages/Mensalidades",
    icon: CalendarDays,
  },
];

const tabTriggerVariants = cva(
  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
  {
    variants: {
      active: {
        true: "border-primary/55 bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(212,175,55,0.32)]",
        false:
          "border-transparent text-muted-foreground hover:border-border hover:bg-muted/75 hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

const surfaceVariants = cva("rounded-2xl border border-border bg-background/70");

function getNotificationToneClasses(tone: NotificationTone): string {
  if (tone === "warning") return "border-destructive/40 bg-destructive/15 text-destructive";
  if (tone === "success") return "border-success/40 bg-success/15 text-success";
  if (tone === "primary") return "border-primary/45 bg-primary/15 text-primary";
  return "border-border/80 bg-muted/65 text-muted-foreground";
}

function formatNotificationTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "Agora";
  if (diffMs < 3_600_000) return `Há ${Math.floor(diffMs / 60_000)} min`;
  if (diffMs < 86_400_000) return `Há ${Math.floor(diffMs / 3_600_000)} h`;
  if (diffMs < 604_800_000) return `Há ${Math.floor(diffMs / 86_400_000)} d`;

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function toNotificationItem(item: AppNotification): NotificationItem {
  const type = item.type.trim().toLowerCase();

  if (type === "monthly.due_soon") {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      timestamp: formatNotificationTimestamp(item.createdAt),
      icon: AlertTriangle,
      tone: "warning",
      unread: item.unread,
    };
  }

  if (type === "monthly.paid") {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      timestamp: formatNotificationTimestamp(item.createdAt),
      icon: CircleCheckBig,
      tone: "success",
      unread: item.unread,
    };
  }

  if (type === "transaction.created") {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      timestamp: formatNotificationTimestamp(item.createdAt),
      icon: PiggyBank,
      tone: "primary",
      unread: item.unread,
    };
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    timestamp: formatNotificationTimestamp(item.createdAt),
    icon: Wallet,
    tone: "neutral",
    unread: item.unread,
  };
}

type HeaderTabsProps = {
  activeTab: HeaderTab;
};

function HeaderTabs({ activeTab }: HeaderTabsProps) {
  return (
    <nav className={cn(surfaceVariants(), "flex p-1")}>
      <ul className="flex w-full items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                className={cn(tabTriggerVariants({ active: isActive }), "whitespace-nowrap")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNavigation({ activeTab }: HeaderTabsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pt-1.5 pr-[max(env(safe-area-inset-right),0.5rem)] pb-[max(env(safe-area-inset-bottom),0.35rem)] pl-[max(env(safe-area-inset-left),0.5rem)] lg:hidden">
      <div className="mx-auto w-full max-w-[26rem] rounded-[1.6rem] border border-border/70 bg-[linear-gradient(145deg,rgba(34,34,34,0.96),rgba(19,19,19,0.98))] p-1 shadow-[0_-10px_30px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <ul className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex min-h-[3.75rem] flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[0.66rem] leading-none transition-all duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-1 inset-y-1 rounded-2xl transition-all duration-300",
                      isActive
                        ? "bg-[linear-gradient(165deg,rgba(212,175,55,0.2),rgba(212,175,55,0.08))] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.28),0_10px_22px_rgba(212,175,55,0.14)]"
                        : "bg-transparent group-hover:bg-muted/70"
                    )}
                  />

                  <span
                    className={cn(
                      "relative z-10 flex size-8 items-center justify-center rounded-lg border transition-all duration-300",
                      isActive
                        ? "border-primary/50 bg-primary/15 text-primary shadow-[0_10px_24px_rgba(212,175,55,0.25)]"
                        : "border-border/70 bg-background/70 text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-3.5 transition-all duration-300", isActive ? "-translate-y-0.5 scale-105" : "group-hover:scale-105")} />
                  </span>

                  <span className={cn("relative z-10 mt-1 whitespace-nowrap transition-all duration-300", isActive && "font-semibold")}>
                    {tab.mobileLabel ?? tab.label}
                  </span>

                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 mt-1 h-0.5 rounded-full bg-primary transition-all duration-300",
                      isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function Header({ activeTab }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);

  const reloadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    setNotificationError(null);

    try {
      const rows = await fetchNotifications();
      setNotifications(rows.map(toNotificationItem));
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Não foi possível carregar as notificações."
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    void reloadNotifications();

    const handleNotifyUpdated = () => {
      void reloadNotifications();
    };

    window.addEventListener(NOTIFY_UPDATED_EVENT, handleNotifyUpdated);
    return () => {
      window.removeEventListener(NOTIFY_UPDATED_EVENT, handleNotifyUpdated);
    };
  }, [reloadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, unread: false } : item))
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Não foi possível marcar a notificação como lida."
      );
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount <= 0 || isMarkingAllAsRead) return;

    setIsMarkingAllAsRead(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Não foi possível marcar as notificações como lidas."
      );
    } finally {
      setIsMarkingAllAsRead(false);
    }
  }, [isMarkingAllAsRead, unreadCount]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-linear-to-r from-card via-card to-background/90 backdrop-blur">
      <div className="animate-in fade-in-0 slide-in-from-top-2 mx-auto w-full max-w-7xl px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 duration-500 sm:px-6 sm:pb-3 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-3 lg:min-w-[236px]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/12 text-primary shadow-[0_0_24px_rgba(212,175,55,0.28)]">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] tracking-[0.22em] text-muted-foreground uppercase">Gestão Financeira</p>
              <p className="truncate text-sm font-semibold text-foreground">Painel</p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <HeaderTabs activeTab={activeTab} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[236px] lg:justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="relative size-10 rounded-xl border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/70 hover:text-primary"
                  aria-label="Notificações"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 ? (
                    <>
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-success shadow-[0_0_12px_rgba(46,204,113,0.75)]" />
                      <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-success/40 bg-success px-1 text-[10px] font-semibold leading-none text-success-foreground">
                        {unreadCount}
                      </span>
                    </>
                  ) : null}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                sideOffset={12}
                align="end"
                className="w-[min(92vw,26rem)] rounded-2xl border-border/90 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_48%),linear-gradient(140deg,rgba(30,30,30,0.98),rgba(18,18,18,0.95))] p-0 shadow-[0_24px_45px_rgba(0,0,0,0.52)]"
              >
                <div className="border-b border-border/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notificações</p>
                      <p className="text-xs text-muted-foreground">Atualizações recentes do seu painel financeiro.</p>
                    </div>
                    <Badge variant={unreadCount > 0 ? "success" : "secondary"} className="mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} novas` : "Tudo em dia"}
                    </Badge>
                  </div>
                </div>

                <div className="max-h-[68vh] overflow-y-auto px-2 py-2 sm:max-h-[24rem]">
                  <div className="space-y-1.5">
                    {isLoadingNotifications && notifications.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-muted-foreground">Carregando notificações...</p>
                    ) : null}

                    {notificationError && notifications.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-destructive">{notificationError}</p>
                    ) : null}

                    {!isLoadingNotifications && !notificationError && notifications.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-muted-foreground">Sem notificações no momento.</p>
                    ) : null}

                    {notifications.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (!item.unread) return;
                            void handleMarkAsRead(item.id);
                          }}
                          className="group w-full rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-border/75 hover:bg-background/65"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border", getNotificationToneClasses(item.tone))}>
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                                {item.unread ? <span className="size-1.5 shrink-0 rounded-full bg-success" /> : null}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                              <p className="mt-1 text-[11px] text-muted-foreground/90">{item.timestamp}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/70 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="flex-1 rounded-lg"
                      onClick={() => void handleMarkAllAsRead()}
                      disabled={unreadCount <= 0 || isMarkingAllAsRead}
                    >
                      Marcar todas como lidas
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => void reloadNotifications()}
                      disabled={isLoadingNotifications}
                    >
                      Atualizar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className={cn(surfaceVariants(), "flex items-center gap-2 px-2.5 py-1.5")}>
              <Image
                src="/avatar-gabriel.svg"
                alt="Foto de perfil de Gabriel Dias"
                width={32}
                height={32}
                className="rounded-xl border border-primary/40"
              />
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-foreground">Gabriel Dias</p>
                <p className="text-xs text-muted-foreground">Gestão Patrimonial</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
