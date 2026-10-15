"use client";

import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

import "./chat-markdown.css";

export function ChatMarkdown({
  content,
  streaming = false,
  className,
}: {
  content: string;
  streaming?: boolean;
  className?: string;
}) {
  if (!content && !streaming) return null;

  return (
    <div className={cn("chat-markdown", className)}>
      <Streamdown
        mode={streaming ? "streaming" : "static"}
        shikiTheme={["github-light", "github-dark"]}
      >
        {content || ""}
      </Streamdown>
    </div>
  );
}
