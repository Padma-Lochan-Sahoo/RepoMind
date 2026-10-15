import Link from "next/link";
import { Compass } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
      <div className="relative flex flex-col items-center gap-5 animate-fade-up">
        <BrandMark />
        <div className="flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
          <Compass className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            That page doesn&apos;t exist, or the repository link you followed is
            no longer valid.
          </p>
        </div>
        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
