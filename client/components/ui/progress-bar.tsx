import { cn } from "@/lib/utils";

/** Slim gradient progress bar. `indeterminate` shows a moving shimmer. */
export function ProgressBar({
  value,
  indeterminate = false,
  className,
}: {
  value: number;
  indeterminate?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-brand-gradient transition-[width] duration-500 ease-out",
          indeterminate && "w-full opacity-70 animate-shimmer bg-[length:200%_100%]"
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
