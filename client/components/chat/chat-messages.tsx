"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  BookOpen,
  Check,
  Copy,
  FolderTree,
  GitBranch,
  KeyRound,
  Play,
  ServerCog,
  Sparkles,
} from "lucide-react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";
import { RepoMindIcon } from "@/components/icons/repomind-icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, Repository } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: "Give me an overview",
    prompt: "Give me a high-level overview of this repository and what it does.",
  },
  {
    icon: FolderTree,
    title: "Explain the structure",
    prompt: "How is this project structured? Walk me through the main folders and modules.",
  },
  {
    icon: KeyRound,
    title: "Find authentication",
    prompt: "How is authentication and authorization implemented?",
  },
  {
    icon: Play,
    title: "Run it locally",
    prompt: "How do I set up and run this project locally?",
  },
  {
    icon: ServerCog,
    title: "Entry points",
    prompt: "What are the main entry points and how does a request flow through the code?",
  },
  {
    icon: GitBranch,
    title: "Key dependencies",
    prompt: "What are the key dependencies and what is each used for?",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable (insecure context) — ignore silently
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : "Copy message"}
      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

function AssistantAvatar() {
  return (
    <div className="mt-0.5 shrink-0">
      <RepoMindIcon className="size-8 rounded-xl shadow-sm" />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <AssistantAvatar />
      <div className="flex items-center gap-2 pt-1.5 text-sm text-muted-foreground">
        <span className="flex gap-1" aria-hidden>
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1.5 animate-bounce rounded-full bg-primary/70"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
        Searching the codebase…
      </div>
    </div>
  );
}

export function ChatMessages({
  repo,
  messages,
  streamText,
  streaming = false,
  isLoading,
  onSuggestion,
}: {
  repo: Repository;
  messages: ChatMessage[];
  streamText: string;
  streaming?: boolean;
  isLoading: boolean;
  onSuggestion?: (prompt: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastCountRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 120;
    stickRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  // Follow the conversation only while the reader is at the bottom, so they
  // can scroll up and read earlier answers while a reply streams in.
  useEffect(() => {
    const grew = messages.length > lastCountRef.current;
    lastCountRef.current = messages.length;

    const last = messages[messages.length - 1];
    if (grew && last?.role === "USER") stickRef.current = true;

    if (stickRef.current) scrollToBottom(!streamText);
  }, [messages, streamText, streaming, scrollToBottom]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <Skeleton className="h-14 w-2/3 self-end rounded-3xl" />
          <div className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-xl" />
            <Skeleton className="h-28 w-4/5 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-1/2 self-end rounded-3xl" />
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !streamText && !streaming) {
    return (
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div className="m-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-10">
          <div className="space-y-4 text-center animate-fade-up">
            <div className="relative mx-auto w-fit">
              <span className="absolute inset-0 rounded-3xl bg-brand-gradient opacity-30 blur-2xl" />
              <RepoMindIcon className="relative size-16 rounded-3xl shadow-xl animate-float" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Ask <span className="text-gradient">{repo.name}</span> anything
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Answers are grounded in the files indexed from this
                repository, with links back to the exact code.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-2.5 sm:grid-cols-2">
            {SUGGESTIONS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onSuggestion?.(item.prompt)}
                disabled={!onSuggestion}
                className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 disabled:pointer-events-none disabled:opacity-60 animate-fade-up"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                    {item.prompt}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-6 md:px-6">
          {messages.map((message) => {
            const isUser = message.role === "USER";
            const ago = timeAgo(message.createdAt);

            if (isUser) {
              return (
                <div
                  key={message.id}
                  className="group flex flex-col items-end gap-1 animate-pop"
                >
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-brand-gradient px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-primary/20 wrap-break-word md:max-w-[75%]">
                    {message.content}
                  </div>
                  {ago && (
                    <span className="px-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {ago}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div key={message.id} className="group flex gap-3 animate-fade-up">
                <AssistantAvatar />
                <div className="min-w-0 flex-1 space-y-3">
                  <ChatMarkdown content={message.content} />
                  <CitationChips citations={message.citations} repo={repo} />
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                    <CopyButton text={message.content} />
                    {ago && <span>{ago}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {streamText ? (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="min-w-0 flex-1">
                <ChatMarkdown content={streamText} streaming />
                <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-primary animate-caret" />
              </div>
            </div>
          ) : null}

          {streaming && !streamText && <ThinkingIndicator />}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          stickRef.current = true;
          scrollToBottom(true);
        }}
        aria-label="Scroll to latest message"
        className={cn(
          "absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg transition-all hover:bg-muted",
          showJump
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <ArrowDown className="size-3.5" />
        {streaming ? "Follow answer" : "Latest"}
        {streaming && <Sparkles className="size-3 text-primary" />}
      </button>
    </div>
  );
}
