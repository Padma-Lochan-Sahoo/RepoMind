"use client";

import type { LucideIcon } from "lucide-react";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Sticky page header used by every dashboard page. Contains the sidebar
 * trigger so the navigation is reachable on mobile as well.
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="h-5" />

        {Icon && (
          <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm sm:flex">
            <Icon className="size-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground md:text-sm">
              {description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <ModeToggle />
        </div>
      </div>

      {children && <div className="px-4 pb-3 md:px-6">{children}</div>}
    </header>
  );
}
