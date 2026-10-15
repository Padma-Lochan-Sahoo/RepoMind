"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";

const SUMMARY_LIMIT = 100;

function getErrorSummary(message: string) {
  const line =
    message
      .split("\n")
      .find((part) => part.trim().length > 0) ?? "";

  if (line.length <= SUMMARY_LIMIT) {
    return line;
  }

  return `${line.slice(0, SUMMARY_LIMIT - 1)}…`;
}

interface IndexErrorAlertProps {
  message?: string | null;
}

export function IndexErrorAlert({
  message,
}: IndexErrorAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  const errorMessage = message?.trim() || 
    "Could not index this repository. Retry to try again.";

  const summary = getErrorSummary(errorMessage);
  const hasMore = errorMessage.length > SUMMARY_LIMIT;

  return (
    <Alert variant="destructive">
      <AlertCircle />

      <AlertTitle>Indexing failed</AlertTitle>

      <AlertDescription className="min-w-0">
        <div className="space-y-2">
          <p className="break-words">{summary}</p>

          {hasMore && (
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <CollapsibleTrigger className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">
                {isOpen ? "Show less" : "Show full error"}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs">
                  {errorMessage}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

