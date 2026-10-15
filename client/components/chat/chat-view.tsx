"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, PanelLeft } from "lucide-react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  ChatSessionPanel,
  ChatSidebar,
} from "@/components/chat/chat-sidebar";
import { IndexingState } from "@/components/chat/indexing-state";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useStreamChat,
} from "@/hooks/use-chat";

import { useRepository } from "@/hooks/use-repos";

export function ChatView({ repoId }: { repoId: string }) {
  const repoQuery = useRepository(repoId);
  const repo = repoQuery.data;

  const ready = repo?.indexStatus === "READY";

  const sessionsQuery = useChatSessions(repoId, ready);
  const { mutate: createChat, isPending: creatingChat } =
    useCreateChatSession(repoId);

  const [selectedSessionId, setSelectedSessionId] =
    useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const autoCreateRef = useRef(false);

  const sessions = sessionsQuery.data;

  // The selection may point at a chat that no longer exists (deleted).
  const selectionValid =
    selectedSessionId !== null &&
    (sessions?.some((s) => s.id === selectedSessionId) ?? true);

  const sessionId =
    (selectionValid ? selectedSessionId : null) ??
    sessions?.[0]?.id ??
    null;

  const activeSession = sessions?.find((s) => s.id === sessionId);

  const messagesQuery = useChatMessages(sessionId);

  const { send, stop, streaming, streamText } =
    useStreamChat(sessionId, repoId);

  // First visit (or after deleting the last chat): create one automatically.
  useEffect(() => {
    if (!ready || !sessionsQuery.isSuccess) return;

    if ((sessions?.length ?? 0) > 0) {
      autoCreateRef.current = false;
      return;
    }

    if (autoCreateRef.current || creatingChat) return;
    autoCreateRef.current = true;

    createChat(undefined, {
      onSuccess: (session) => setSelectedSessionId(session.id),
      onError: () => {
        autoCreateRef.current = false;
      },
    });
  }, [ready, sessionsQuery.isSuccess, sessions, createChat, creatingChat]);

  if (repoQuery.isLoading) {
    return (
      <AppShell title="Loading chat…" fullHeight>
        <div className="grid min-h-0 flex-1 gap-4 p-4 md:grid-cols-[18rem_1fr]">
          <Skeleton className="hidden rounded-2xl md:block" />
          <Skeleton className="rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (repoQuery.isError || !repo) {
    return (
      <AppShell title="Repository unavailable">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            {(repoQuery.error as Error)?.message ??
              "Repository could not be loaded."}
          </p>

          <Button render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  function handleNewChat() {
    createChat("New chat", {
      onSuccess: (session) => {
        setSelectedSessionId(session.id);
        setDrawerOpen(false);
      },
    });
  }

  return (
    <AppShell
      fullHeight
      title={repo.fullName}
      description={
        ready
          ? activeSession?.title ?? "Ask questions grounded in this repository"
          : "Waiting for indexing to finish"
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft data-icon="inline-start" />
          <span className="hidden sm:inline">Repositories</span>
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1">
        <ChatSidebar
          repo={repo}
          sessionId={sessionId}
          onSelectSession={setSelectedSessionId}
          onSessionDeleted={(id) => {
            if (id === selectedSessionId) setSelectedSessionId(null);
          }}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile chat bar: the sidebar becomes a drawer */}
          {ready && (
            <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawerOpen(true)}
              >
                <PanelLeft />
                Chats
              </Button>
              <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {activeSession?.title ?? "New chat"}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNewChat}
                disabled={creatingChat}
                aria-label="New chat"
              >
                <MessageSquarePlus />
              </Button>
            </div>
          )}

          {!ready ? (
            <IndexingState repo={repo} />
          ) : (
            <>
              <ChatMessages
                repo={repo}
                messages={messagesQuery.data ?? []}
                streamText={streamText}
                streaming={streaming}
                isLoading={messagesQuery.isLoading || !sessionId}
                onSuggestion={sessionId ? (prompt) => void send(prompt) : undefined}
              />

              <ChatComposer
                disabled={!sessionId}
                streaming={streaming}
                repoName={repo.name}
                onSend={send}
                onStop={stop}
              />
            </>
          )}
        </section>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-80 max-w-[85vw] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Chats</SheetTitle>
            <SheetDescription>
              Switch between your conversations about {repo.name}.
            </SheetDescription>
          </SheetHeader>
          <ChatSessionPanel
            repo={repo}
            sessionId={sessionId}
            onSelectSession={(id) => {
              setSelectedSessionId(id);
              setDrawerOpen(false);
            }}
            onSessionDeleted={(id) => {
              if (id === selectedSessionId) setSelectedSessionId(null);
            }}
          />
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

export default ChatView;
