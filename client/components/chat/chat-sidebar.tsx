"use client";

import { useState } from "react";
import { GitBranch, MessageSquarePlus, Trash2 } from "lucide-react";

import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { GitHubIcon } from "@/components/icons/github-icon";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
} from "@/hooks/use-chat";
import type { ChatSession, Repository } from "@/lib/api";
import { formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChatSessionPanel({
  repo,
  sessionId,
  onSelectSession,
  onSessionDeleted,
  className,
}: {
  repo: Repository;
  sessionId: string | null;
  onSelectSession: (id: string) => void;
  onSessionDeleted?: (id: string) => void;
  className?: string;
}) {
  const ready = repo.indexStatus === "READY";
  const sessionsQuery = useChatSessions(repo.id, ready);
  const createSession = useCreateChatSession(repo.id);
  const deleteSession = useDeleteChatSession(repo.id);

  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);

  const githubUrl =
    repo.htmlUrl ?? `https://github.com/${repo.owner}/${repo.name}`;

  function handleNewChat() {
    createSession.mutate("New chat", {
      onSuccess: (session) => onSelectSession(session.id),
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;

    deleteSession.mutate(target.id, {
      onSuccess: () => onSessionDeleted?.(target.id),
      onSettled: () => setPendingDelete(null),
    });
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="space-y-3 border-b border-border/70 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {repo.owner}
            </p>
            <h2 className="truncate text-base font-semibold tracking-tight">
              {repo.name}
            </h2>
          </div>
          <IndexStatusBadge status={repo.indexStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
            <GitBranch className="size-3.5" />
            {repo.defaultBranch || "main"}
          </span>
          <LanguageBadge language={repo.language} />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {formatNumber(repo.chunkCount)} chunks
            {repo.filesTotal > 0 && ` · ${formatNumber(repo.filesTotal)} files`}
          </span>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
          >
            <GitHubIcon className="size-3.5" />
            GitHub
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Chats
        </p>
        <Button
          size="xs"
          variant="outline"
          onClick={handleNewChat}
          disabled={!ready || createSession.isPending}
        >
          {createSession.isPending ? (
            <Spinner className="size-3" />
          ) : (
            <MessageSquarePlus />
          )}
          New chat
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-2 pt-0">
          {sessionsQuery.isLoading && (
            <>
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </>
          )}

          {sessionsQuery.isSuccess && sessionsQuery.data.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No chats yet. Ask a question to start one.
            </p>
          )}

          {sessionsQuery.data?.map((session) => {
            const selected = session.id === sessionId;

            return (
              <div
                key={session.id}
                className={cn(
                  "group/session relative flex items-center rounded-xl transition-colors",
                  selected
                    ? "bg-primary/10 ring-1 ring-primary/25"
                    : "hover:bg-muted/70"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  aria-current={selected ? "true" : undefined}
                  className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      selected && "text-primary"
                    )}
                  >
                    {session.title || "New chat"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {timeAgo(session.createdAt)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(session)}
                  aria-label={`Delete chat ${session.title}`}
                  className="mr-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/session:opacity-100 max-md:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteSession.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; and all of its messages will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteSession.isPending}
            >
              {deleteSession.isPending ? <Spinner /> : <Trash2 />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Desktop column wrapper. */
export function ChatSidebar(props: React.ComponentProps<typeof ChatSessionPanel>) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-muted/20 md:block">
      <ChatSessionPanel {...props} />
    </aside>
  );
}
