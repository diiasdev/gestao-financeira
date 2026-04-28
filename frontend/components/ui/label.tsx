"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase leading-none select-none"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));

Label.displayName = "Label";

export { Label };
