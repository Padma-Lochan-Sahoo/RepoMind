"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_CHARS = 4000;
const MAX_HEIGHT_PX = 176;

type ChatComposerProps = {
  disabled?: boolean;
  streaming: boolean;
  repoName: string;
  onSend: (content: string) => void | Promise<void>;
  onStop: () => void;
};

export function ChatComposer({
  disabled = false,
  streaming,
  repoName,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the cursor in the box after each answer, but only on devices with a
  // real keyboard so phones don't pop the on-screen keyboard open unprompted.
  useEffect(() => {
    if (disabled || streaming) return;
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }
  }, [disabled, streaming]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }

  function submit() {
    const content = value.trim();
    if (!content || disabled || streaming || content.length > MAX_CHARS) return;
    void onSend(content);
    setValue("");
    requestAnimationFrame(resize);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Don't submit while an IME (e.g. Japanese/Chinese input) is composing.
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const tooLong = value.length > MAX_CHARS;
  const nearLimit = value.length > MAX_CHARS * 0.85;

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-2 md:px-4 md:pb-4"
    >
      <div
        className={cn(
          "mx-auto w-full max-w-3xl rounded-2xl border bg-card p-2 shadow-lg shadow-foreground/5 transition-all",
          "focus-within:border-primary/50 focus-within:shadow-primary/10 focus-within:ring-4 focus-within:ring-primary/10",
          tooLong && "border-destructive/60 focus-within:border-destructive focus-within:ring-destructive/10",
          disabled && "opacity-60"
        )}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || streaming}
            placeholder={
              streaming
                ? "RepoMind is answering…"
                : `Ask anything about ${repoName}…`
            }
            aria-label="Message RepoMind"
            rows={1}
            className="max-h-44 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />

          {streaming ? (
            <Button
              type="button"
              size="icon-lg"
              variant="secondary"
              onClick={onStop}
              aria-label="Stop generating"
              className="shrink-0"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-lg"
              disabled={disabled || !value.trim() || tooLong}
              aria-label="Send message"
              className="shrink-0 bg-brand-gradient text-white shadow-md transition-transform enabled:hover:scale-105 enabled:active:scale-95"
            >
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto mt-2 flex w-full max-w-3xl items-center justify-between px-2 text-[11px] text-muted-foreground">
        <span className="hidden sm:inline">
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to
          send ·{" "}
          <kbd className="rounded border bg-muted px-1 font-mono">Shift</kbd>
          {" + "}
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd>{" "}
          for a new line
        </span>
        <span className="sm:hidden">Answers are grounded in your code</span>

        <span
          className={cn(
            "tabular-nums transition-opacity",
            nearLimit ? "opacity-100" : "opacity-0",
            tooLong && "font-medium text-destructive"
          )}
        >
          {value.length}/{MAX_CHARS}
        </span>
      </div>
    </form>
  );
}
