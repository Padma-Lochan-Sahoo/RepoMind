"use client";

import {
  AlertCircle,
  Database,
  FileSearch,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { ProgressBar } from "@/components/ui/progress-bar";

import {
  getRepoProgress,
  useStartIndexing,
} from "@/hooks/use-repos";

import type {
  IndexStatusResponse,
  Repository,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";

export function IndexingState({
  repo,
  status,
}: {
  repo: Repository;
  status?: IndexStatusResponse;
}) {
  const indexMutation = useStartIndexing();

  const filesProcessed =
    status?.filesProcessed ?? repo.filesProcessed;

  const filesTotal =
    status?.filesTotal ?? repo.filesTotal;

  const chunkCount =
    status?.chunkCount ?? repo.chunkCount;

  const progress = getRepoProgress({
    filesProcessed,
    filesTotal,
  });

  const indexStatus =
    status?.indexStatus ?? repo.indexStatus;

  const errorMessage =
    status?.errorMessage ?? repo.errorMessage;

  if (indexStatus === "PENDING") {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
            <Sparkles />
          </EmptyMedia>

          <EmptyTitle>Index {repo.name} to start chatting</EmptyTitle>

          <EmptyDescription>
            RepoMind reads the source files, splits them into searchable
            chunks and embeds them. It only takes a minute or two for most
            repositories.
          </EmptyDescription>
        </EmptyHeader>

        <Button
          size="lg"
          onClick={() => indexMutation.mutate(repo.id)}
          disabled={indexMutation.isPending}
        >
          {indexMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          {indexMutation.isPending ? "Starting…" : "Start indexing"}
        </Button>
      </Empty>
    );
  }

  if (indexStatus === "FAILED") {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>

          <EmptyTitle>Indexing failed</EmptyTitle>

          <EmptyDescription className="max-h-32 overflow-auto break-words">
            {errorMessage ||
              "Something went wrong while indexing this repository."}
          </EmptyDescription>
        </EmptyHeader>

        <Button
          onClick={() => indexMutation.mutate(repo.id)}
          disabled={indexMutation.isPending}
        >
          {indexMutation.isPending ? (
            <Loader2
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <RotateCcw data-icon="inline-start" />
          )}

          {indexMutation.isPending
            ? "Retrying..."
            : "Retry indexing"}
        </Button>
      </Empty>
    );
  }

  const steps = [
    { icon: FileSearch, label: "Reading files", active: filesTotal === 0 || progress < 100 },
    { icon: Database, label: "Embedding chunks", active: filesTotal > 0 },
  ];

  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <div className="relative mb-2">
          <span className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-ping-slow" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg">
            <Loader2 className="size-7 animate-spin" />
          </div>
        </div>

        <EmptyTitle>
          Indexing {repo.fullName}
        </EmptyTitle>

        <EmptyDescription>
          {filesTotal > 0
            ? `${formatNumber(filesProcessed)} of ${formatNumber(filesTotal)} files · ${formatNumber(chunkCount)} chunks embedded`
            : "Fetching repository files and preparing embeddings…"}
        </EmptyDescription>
      </EmptyHeader>

      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <ProgressBar value={progress} indeterminate={filesTotal === 0} className="h-2" />
          <p className="text-right text-xs tabular-nums text-muted-foreground">
            {filesTotal > 0 ? `${progress}%` : "Starting…"}
          </p>
        </div>

        <ul className="flex justify-center gap-4 text-xs text-muted-foreground">
          {steps.map((step) => (
            <li key={step.label} className="inline-flex items-center gap-1.5">
              <step.icon className="size-3.5 text-primary" />
              {step.label}
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-muted-foreground">
          You can leave this page — chat unlocks when indexing finishes.
        </p>
      </div>
    </Empty>
  );
}
