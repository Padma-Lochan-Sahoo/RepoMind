"use client";

import { useState } from "react";
import { FileCode2 } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Citation, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

const VISIBLE_BY_DEFAULT = 4;

function lineLabel(citation: Citation) {
  if (citation.startLine && citation.endLine) {
    return citation.startLine === citation.endLine
      ? `L${citation.startLine}`
      : `L${citation.startLine}–${citation.endLine}`;
  }

  if (citation.startLine) return `L${citation.startLine}`;
  return null;
}

/** GitHub anchors look like #L10 or #L10-L20. */
function lineAnchor(citation: Citation) {
  if (!citation.startLine) return "";

  if (citation.endLine && citation.endLine !== citation.startLine) {
    return `#L${citation.startLine}-L${citation.endLine}`;
  }

  return `#L${citation.startLine}`;
}

function citationHref(repo: Repository, citation: Citation) {
  const base =
    repo.htmlUrl?.replace(/\/$/, "") ??
    `https://github.com/${repo.owner}/${repo.name}`;

  const branch = repo.defaultBranch || "main";
  const path = citation.filePath.replace(/^\//, "");

  return `${base}/blob/${branch}/${path}${lineAnchor(citation)}`;
}

export function CitationChips({
  citations,
  repo,
  className,
}: {
  citations: Citation[];
  repo: Repository;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const valid = citations.filter((c) => c.filePath);
  if (!valid.length) return null;

  const visible = expanded ? valid : valid.slice(0, VISIBLE_BY_DEFAULT);
  const hidden = valid.length - visible.length;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Sources
      </p>

      <div className="flex flex-wrap gap-1.5">
        {visible.map((citation, index) => {
          const lines = lineLabel(citation);

          return (
            <Tooltip key={`${citation.filePath}-${citation.startLine}-${index}`}>
              <TooltipTrigger
                render={
                  <a
                    href={citationHref(repo, citation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-all hover:-translate-y-px hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  />
                }
              >
                <FileCode2 className="size-3 shrink-0 text-primary" />
                <span className="truncate font-mono">
                  {citation.filePath.split("/").pop() ?? citation.filePath}
                </span>
                {lines ? (
                  <span className="shrink-0 rounded bg-muted px-1 font-mono text-[10px]">
                    {lines}
                  </span>
                ) : null}
              </TooltipTrigger>
              <TooltipContent className="font-mono">
                {citation.filePath}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {(hidden > 0 || (expanded && valid.length > VISIBLE_BY_DEFAULT)) && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center rounded-lg border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {expanded ? "Show less" : `+${hidden} more`}
          </button>
        )}
      </div>
    </div>
  );
}
