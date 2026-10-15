"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  GitBranch,
  Lock,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { LanguageIcon } from "@/components/icons/language-icon";
import { IndexErrorAlert } from "@/components/dashboard/index-error-alert";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getRepoProgress,
  useStartIndexing,
} from "@/hooks/use-repos";
import type { Repository } from "@/lib/api";
import { formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RepoCardProps {
  repo: Repository;
  className?: string;
  style?: React.CSSProperties;
}

export function RepoCard({ repo, className, style }: RepoCardProps) {
  const router = useRouter();
  const indexMutation = useStartIndexing();

  const isIndexing =
    repo.indexStatus === "INDEXING" || indexMutation.isPending;

  const isFailed = repo.indexStatus === "FAILED";
  const isReady = repo.indexStatus === "READY";
  const progress = getRepoProgress(repo);
  const indexedAgo = timeAgo(repo.indexedAt);

  function openChat() {
    router.push(`/chat/${repo.id}`);
  }

  function handlePrimary() {
    if (isReady) {
      openChat();
      return;
    }

    indexMutation.mutate(repo.id, {
      onSuccess: () => router.push(`/chat/${repo.id}`),
    });
  }

  const githubUrl =
    repo.htmlUrl ?? `https://github.com/${repo.owner}/${repo.name}`;

  return (
    <article
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card",
        "shadow-sm shadow-foreground/5 transition-all duration-300",
        isFailed
          ? "border-destructive/30"
          : "border-border/80 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
    >
      {/* subtle accent edge that lights up on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <LanguageIcon language={repo.language} />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              {repo.owner}
              {repo.isPrivate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  <Lock className="size-2.5" />
                  Private
                </span>
              )}
            </p>

            <h3 className="truncate text-base font-semibold leading-6 tracking-tight">
              {repo.name || "Unnamed repository"}
            </h3>
          </div>
        </div>

        <IndexStatusBadge status={repo.indexStatus} />
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pb-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {repo.description?.trim() || "No description provided."}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
            <GitBranch className="size-3.5" />
            {repo.defaultBranch || "main"}
          </span>

          <LanguageBadge language={repo.language} />

          {isReady && (
            <span className="rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground tabular-nums">
              {formatNumber(repo.chunkCount)} chunks
            </span>
          )}
        </div>

        {isIndexing && (
          <div className="space-y-2 rounded-xl border border-info/20 bg-info/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Spinner className="size-3.5 text-info" />
                Indexing repository
              </span>

              <span className="text-xs tabular-nums text-muted-foreground">
                {repo.filesTotal > 0
                  ? `${repo.filesProcessed}/${repo.filesTotal} files`
                  : "Preparing…"}
              </span>
            </div>

            <ProgressBar value={progress} indeterminate={repo.filesTotal === 0} />
          </div>
        )}

        {isFailed && (
          <IndexErrorAlert message={repo.errorMessage} />
        )}

        <div className="flex-1" />

        {isReady && indexedAgo && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Indexed {indexedAgo}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-muted/30 p-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${repo.fullName} on GitHub`}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              />
            }
          >
            <GitHubIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>View on GitHub</TooltipContent>
        </Tooltip>

        <div className="flex shrink-0 items-center gap-1.5">
          {isReady && (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Re-index repository"
                          disabled={indexMutation.isPending}
                        />
                      }
                    />
                  }
                >
                  <RefreshCw />
                </TooltipTrigger>
                <TooltipContent>Re-index</TooltipContent>
              </Tooltip>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Re-index {repo.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This re-reads every file from GitHub and rebuilds the
                    search index. Existing chats are kept, but chat is
                    unavailable while indexing runs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    onClick={() =>
                      indexMutation.mutate(repo.id, {
                        onSuccess: () => router.push(`/chat/${repo.id}`),
                      })
                    }
                  >
                    <RefreshCw />
                    Re-index
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            size="sm"
            onClick={handlePrimary}
            disabled={isIndexing && !isReady}
            className="min-w-24 shadow-sm"
          >
            {indexMutation.isPending ? (
              <>
                <Spinner />
                Starting
              </>
            ) : isReady ? (
              <>
                <MessageSquare />
                Chat
                <ArrowRight />
              </>
            ) : isIndexing ? (
              <>
                <Spinner />
                Indexing
              </>
            ) : isFailed ? (
              <>
                <RefreshCw />
                Retry
              </>
            ) : (
              <>
                <Sparkles />
                Index &amp; chat
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
