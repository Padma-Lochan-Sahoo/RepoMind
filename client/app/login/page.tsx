"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  FileCode2,
  Lock,
  Loader2,
  MessagesSquare,
  Zap,
} from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGitHubLoginUrl } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-auth";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:
    "GitHub could not complete the sign-in. Please try again.",
  session:
    "We couldn't start your session. Check that the backend is running, then try again.",
};

const HIGHLIGHTS = [
  {
    icon: MessagesSquare,
    title: "Ask in plain English",
    body: "No more grepping through folders to understand how things fit.",
  },
  {
    icon: FileCode2,
    title: "Answers with receipts",
    body: "Every reply links back to the exact files and lines it used.",
  },
  {
    icon: Zap,
    title: "Streaming, instant",
    body: "Watch answers appear live, and stop whenever you have enough.",
  },
];

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");
  const rawNext = params.get("next") || "/dashboard";
  // Only allow same-site relative paths (prevents open redirects).
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";
  const { data: user, isLoading } = useCurrentUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next);
    }
  }, [user, isLoading, next, router]);

  if (isLoading || user) {
    return <FullScreenLoader label="Checking your session..." />;
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[oklch(0.17_0.03_275)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -right-24 top-1/3 size-80 rounded-full bg-brand-gradient opacity-25 blur-3xl animate-float-slow" />

        <Link href="/" className="relative w-fit">
          <BrandMark className="text-white" />
        </Link>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
              Understand any codebase in minutes, not days.
            </h2>
            <p className="text-base leading-relaxed text-white/70">
              Connect GitHub, index a repository, and start a conversation with
              your code.
            </p>
          </div>

          <ul className="space-y-5">
            {HIGHLIGHTS.map((item, index) => (
              <li
                key={item.title}
                className="flex gap-3.5 animate-fade-up"
                style={{ animationDelay: `${150 + index * 110}ms` }}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <item.icon className="size-4 text-white" />
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-white/60">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-white/50">
          <Lock className="size-3.5" />
          Your GitHub token is encrypted at rest and only used to read your
          repositories.
        </p>
      </aside>

      {/* Sign-in panel */}
      <div className="relative flex flex-col bg-background">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-50 lg:hidden" />

        <header className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <ModeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 sm:px-8">
          <div className="w-full max-w-sm space-y-8 animate-fade-up">
            <div className="space-y-5 text-center">
              <div className="flex justify-center lg:hidden">
                <BrandMark />
              </div>
              <div className="mx-auto hidden size-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg lg:flex">
                <GitHubIcon className="size-7" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in with GitHub to chat with your repositories.
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>
                  {ERROR_MESSAGES[error] ?? "Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <a
              href={getGitHubLoginUrl()}
              aria-disabled={isRedirecting}
              aria-busy={isRedirecting}
              onClick={(event) => {
                if (isRedirecting) {
                  event.preventDefault();
                  return;
                }

                setIsRedirecting(true);
                try {
                  sessionStorage.setItem("repomind:next", next);
                } catch {
                  // storage unavailable — fall back to the dashboard
                }
              }}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-12 w-full gap-2.5 bg-foreground text-base text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:bg-foreground/90 hover:shadow-xl aria-disabled:pointer-events-none aria-disabled:opacity-70"
              )}
            >
              {isRedirecting ? (
                <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
              ) : (
                <GitHubIcon className="size-5" />
              )}
              {isRedirecting ? "Connecting to GitHub…" : "Continue with GitHub"}
            </a>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              RepoMind asks for the <code className="rounded bg-muted px-1 py-0.5 font-mono">repo</code>{" "}
              scope so it can read private repositories you choose to index.
              Nothing is changed in your repositories.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginContent />
    </Suspense>
  );
}
