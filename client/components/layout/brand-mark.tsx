import { RepoMindIcon } from "@/components/icons/repomind-icon";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-semibold tracking-tight",
        className
      )}
    >
      <RepoMindIcon
        className={cn("size-8 rounded-[10px] shadow-sm", iconClassName)}
      />

      <span className="font-heading text-[1.05rem] leading-none">
        Repo<span className="text-gradient">Mind</span>
      </span>
    </div>
  );
}
