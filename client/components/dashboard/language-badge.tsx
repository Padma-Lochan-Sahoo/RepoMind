import { LanguageIcon } from "@/components/icons/language-icon";
import { cn } from "@/lib/utils";

export function LanguageBadge({
  language,
  showLabel = true,
  className,
}: {
  language: string | null | undefined;
  showLabel?: boolean;
  className?: string;
}) {
  const label = language?.trim() || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 py-1 pr-2.5 pl-1 text-xs text-muted-foreground",
        className
      )}
    >
      <LanguageIcon
        language={label}
        className="size-5 rounded-md"
        iconClassName="size-3"
      />
      {showLabel ? <span className="truncate">{label}</span> : null}
    </span>
  );
}
