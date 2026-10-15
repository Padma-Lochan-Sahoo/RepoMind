"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-60" />
      <div className="relative flex flex-col items-center gap-5 animate-fade-up">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. You can try again, and if it keeps
            happening, refresh the page.
          </p>
        </div>
        <Button onClick={reset} size="lg">
          <RotateCcw />
          Try again
        </Button>
      </div>
    </div>
  );
}
