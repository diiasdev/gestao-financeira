"use client";

import * as React from "react";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  formatters,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      weekStartsOn={0}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "relative flex h-8 items-center justify-center",
        caption_label: "text-sm font-semibold text-foreground capitalize",
        nav: "flex items-center gap-1",
        table: "w-full border-collapse",
        weekdays: "grid grid-cols-7",
        weekday: "h-9 text-center text-[0.82rem] font-medium text-muted-foreground",
        weeks: "space-y-1",
        week: "grid grid-cols-7",
        day: "flex h-9 items-center justify-center p-0",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-md p-0 font-normal text-foreground aria-selected:opacity-100"
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute left-0 h-7 w-7 rounded-lg border border-border bg-background p-0 text-foreground opacity-90 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute right-0 h-7 w-7 rounded-lg border border-border bg-background p-0 text-foreground opacity-90 hover:opacity-100"
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-accent/40 text-foreground",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground/40 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatCaption: (date) =>
          new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date),
        formatWeekdayName: (date) =>
          new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
            .format(date)
            .replace(".", "")
            .toLowerCase(),
        ...formatters,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
