import { RepoMindIcon } from "@/components/icons/repomind-icon";

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-5 overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />

      <div className="relative">
        <span className="absolute inset-0 rounded-[18px] bg-brand-gradient opacity-40 blur-xl animate-ping-slow" />
        <RepoMindIcon className="relative size-14 rounded-[18px] shadow-lg animate-float" />
      </div>

      {label && (
        <p
          role="status"
          className="relative text-sm text-muted-foreground animate-fade-in"
        >
          {label}
        </p>
      )}
    </div>
  );
}
