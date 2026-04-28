import Image from "next/image";
import Link from "next/link";
import { cva } from "class-variance-authority";
import { ArrowLeftRight, Bell, CalendarDays, LayoutDashboard } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeaderTab = "dashboard" | "transactions" | "mensalidades";

type HeaderProps = {
  activeTab: HeaderTab;
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative size-10 rounded-xl border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/70 hover:text-primary"
              aria-label="Notificações"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-success shadow-[0_0_12px_rgba(46,204,113,0.75)]" />
            </Button>

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
