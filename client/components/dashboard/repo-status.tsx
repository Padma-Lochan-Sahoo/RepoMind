import type { IndexStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<IndexStatus, string> = {
  READY: "Ready",
  INDEXING: "Indexing",
  PENDING: "Not indexed",
  FAILED: "Failed",
};

const STATUS_STYLES: Record<IndexStatus, { pill: string; dot: string }> = {
  READY: {
    pill: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  INDEXING: {
    pill: "border-info/30 bg-info/10 text-info",
    dot: "bg-info animate-pulse",
  },
  PENDING: {
    pill: "border-border bg-muted/60 text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  FAILED: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function getIndexStatusLabel(status: IndexStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function IndexStatusBadge({
  status,
  className,
}: {
  status: IndexStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        style.pill,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {getIndexStatusLabel(status)}
    </span>
  );
}
