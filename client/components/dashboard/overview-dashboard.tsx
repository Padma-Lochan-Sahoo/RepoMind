"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FolderGit2,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-auth";
import { useRepos } from "@/hooks/use-repos";
import { formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function OverviewDashboard() {
  const reposQuery = useRepos();
  const { data: user } = useCurrentUser();
  const repos = reposQuery.data ?? [];

  const ready = repos.filter((repo) => repo.indexStatus === "READY");
  const indexing = repos.filter((repo) => repo.indexStatus === "INDEXING");
  const failed = repos.filter((repo) => repo.indexStatus === "FAILED");
  const pending = repos.filter((repo) => repo.indexStatus === "PENDING");

  const totalChunks = ready.reduce((sum, repo) => sum + repo.chunkCount, 0);

  const recent = [...ready]
    .sort(
      (a, b) =>
        new Date(b.indexedAt ?? 0).getTime() -
        new Date(a.indexedAt ?? 0).getTime()
    )
    .slice(0, 6);

  // Language breakdown across all repositories
  const languageCounts = new Map<string, number>();
  repos.forEach((repo) => {
    const key = repo.language?.trim() || "Other";
    languageCounts.set(key, (languageCounts.get(key) ?? 0) + 1);
  });
  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxLanguage = languages[0]?.[1] ?? 1;

  const stats = [
    {
      label: "Connected",
      value: repos.length,
      hint: "GitHub repositories",
      icon: FolderGit2,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Ready to chat",
      value: ready.length,
      hint: `${formatNumber(totalChunks)} code chunks indexed`,
      icon: MessageSquare,
      tone: "text-success bg-success/10",
    },
    {
      label: "Indexing",
      value: indexing.length,
      hint: indexing.length ? "Working on it…" : "Nothing running",
      icon: Loader2,
      tone: "text-info bg-info/10",
      spin: indexing.length > 0,
    },
    {
      label: "Needs attention",
      value: failed.length + pending.length,
      hint: `${pending.length} not indexed · ${failed.length} failed`,
      icon: AlertTriangle,
      tone: "text-warning bg-warning/15",
    },
  ];

  const steps = [
    { label: "Connect GitHub", done: Boolean(user) },
    { label: "Index a repository", done: ready.length > 0 || indexing.length > 0 },
    { label: "Ask your first question", done: ready.length > 0 },
  ];

  const firstName = (user?.displayName ?? user?.githubUsername ?? "").split(" ")[0];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        icon={LayoutGrid}
        title="Overview"
        description="A snapshot of your repositories and indexing health."
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-80" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">
                {greeting()}
                {firstName ? `, ${firstName}` : ""} 👋
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {ready.length > 0
                  ? "Pick up where you left off."
                  : "Let's get your first repo talking."}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {recent[0] ? (
                <Link
                  href={`/chat/${recent[0].id}`}
                  className={cn(buttonVariants({ size: "lg" }), "shadow-md")}
                >
                  <MessageSquare />
                  Chat with {recent[0].name}
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "shadow-md")}
                >
                  <Sparkles />
                  Choose a repository
                </Link>
              )}
            </div>
          </div>
        </section>

        {reposQuery.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {reposQuery.isError && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t load overview</EmptyTitle>
              <EmptyDescription>
                {(reposQuery.error as Error).message}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => void reposQuery.refetch()}>Try again</Button>
          </Empty>
        )}

        {reposQuery.isSuccess && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm shadow-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl",
                        stat.tone
                      )}
                    >
                      <stat.icon
                        className={cn("size-4", stat.spin && "animate-spin")}
                      />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Ready to chat</h2>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" })
                    )}
                  >
                    View all
                    <ArrowRight />
                  </Link>
                </div>

                {recent.length === 0 ? (
                  <Empty className="border border-dashed">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Sparkles />
                      </EmptyMedia>
                      <EmptyTitle>No indexed repositories yet</EmptyTitle>
                      <EmptyDescription>
                        Index a repository from the Repositories tab to start
                        chatting with your code.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Link
                      href="/dashboard"
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Go to repositories
                    </Link>
                  </Empty>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {recent.map((repo) => (
                      <Link
                        key={repo.id}
                        href={`/chat/${repo.id}`}
                        className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-muted-foreground">
                            {repo.owner}
                          </p>
                          <p className="truncate font-semibold">{repo.name}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <LanguageBadge language={repo.language} />
                            {timeAgo(repo.indexedAt) && (
                              <span className="text-xs text-muted-foreground">
                                {timeAgo(repo.indexedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <IndexStatusBadge status={repo.indexStatus} />
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <div className="space-y-6">
                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5">
                  <h2 className="text-sm font-semibold">Getting started</h2>
                  <ol className="mt-4 space-y-3">
                    {steps.map((step, index) => (
                      <li key={step.label} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                            step.done
                              ? "bg-success text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {step.done ? <Check className="size-3.5" /> : index + 1}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            step.done && "text-muted-foreground line-through"
                          )}
                        >
                          {step.label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                {languages.length > 0 && (
                  <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5">
                    <h2 className="text-sm font-semibold">Languages</h2>
                    <ul className="mt-4 space-y-3">
                      {languages.map(([name, count]) => (
                        <li key={name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{name}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {count} {count === 1 ? "repo" : "repos"}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-brand-gradient"
                              style={{ width: `${(count / maxLanguage) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
