"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { IndexStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export type FilterStatus = "ALL" | IndexStatus;
export type VisibilityFilter = "all" | "public" | "private";
export type SortKey = "name" | "recent" | "status";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "READY", label: "Ready" },
  { value: "INDEXING", label: "Indexing" },
  { value: "PENDING", label: "New" },
  { value: "FAILED", label: "Failed" },
];

type DashboardToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
  status: FilterStatus;
  onStatusChange: (value: FilterStatus) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  statusCounts: Record<FilterStatus, number>;
};

function FilterChip({
  selected,
  count,
  children,
  onClick,
}: {
  selected: boolean;
  count?: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
        selected
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] tabular-nums",
            selected ? "bg-primary-foreground/20" : "bg-muted"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function DashboardToolbar({
  search,
  onSearchChange,
  visibility,
  onVisibilityChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  statusCounts,
}: DashboardToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search box (like GitHub).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search repositories…  (press / to focus)"
            aria-label="Search repositories"
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex items-center gap-2 sm:ml-auto">
          <NativeSelect
            size="sm"
            aria-label="Visibility"
            value={visibility}
            onChange={(event) =>
              onVisibilityChange(event.target.value as VisibilityFilter)
            }
          >
            <NativeSelectOption value="all">All visibility</NativeSelectOption>
            <NativeSelectOption value="public">Public only</NativeSelectOption>
            <NativeSelectOption value="private">Private only</NativeSelectOption>
          </NativeSelect>

          <NativeSelect
            size="sm"
            aria-label="Sort repositories"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
          >
            <NativeSelectOption value="name">Sort: Name</NativeSelectOption>
            <NativeSelectOption value="recent">Sort: Recently indexed</NativeSelectOption>
            <NativeSelectOption value="status">Sort: Status</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        {STATUS_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            selected={status === option.value}
            count={statusCounts[option.value]}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
