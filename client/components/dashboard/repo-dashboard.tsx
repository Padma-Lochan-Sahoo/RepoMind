"use client";

import { useMemo, useState } from "react";
import { FolderGit2, RefreshCw, SearchX } from "lucide-react";

import {
  DashboardToolbar,
  type FilterStatus,
  type SortKey,
  type VisibilityFilter,
} from "@/components/dashboard/dashboard-header";
import { RepoCard } from "@/components/dashboard/repo-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRefreshRepos,
  useRepos,
} from "@/hooks/use-repos";
import type { Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_RANK: Record<Repository["indexStatus"], number> = {
  READY: 0,
  INDEXING: 1,
  PENDING: 2,
  FAILED: 3,
};

export function RepoDashboard() {
  const reposQuery = useRepos();
  const refresh = useRefreshRepos();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("ALL");
  const [sort, setSort] = useState<SortKey>("name");
  const [visibility, setVisibility] =
    useState<VisibilityFilter>("all");

  const repos = reposQuery.data;

  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      ALL: repos?.length ?? 0,
      READY: 0,
      INDEXING: 0,
      PENDING: 0,
      FAILED: 0,
    };
    repos?.forEach((repo) => {
      counts[repo.indexStatus] += 1;
    });
    return counts;
  }, [repos]);

  const filtered = useMemo(() => {
    const list = repos ?? [];
    const q = search.trim().toLowerCase();

    const result = list.filter((repo) => {
      if (status !== "ALL" && repo.indexStatus !== status) return false;
      if (visibility === "private" && !repo.isPrivate) return false;
      if (visibility === "public" && repo.isPrivate) return false;
      if (!q) return true;

      return (
        repo.fullName.toLowerCase().includes(q) ||
        (repo.description ?? "").toLowerCase().includes(q) ||
        (repo.language ?? "").toLowerCase().includes(q)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "recent") {
        const at = a.indexedAt ? new Date(a.indexedAt).getTime() : 0;
        const bt = b.indexedAt ? new Date(b.indexedAt).getTime() : 0;
        return bt - at || a.fullName.localeCompare(b.fullName);
      }
      if (sort === "status") {
        return (
          STATUS_RANK[a.indexStatus] - STATUS_RANK[b.indexStatus] ||
          a.fullName.localeCompare(b.fullName)
        );
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [repos, search, status, visibility, sort]);

  const isSyncing = refresh.isPending || reposQuery.isFetching;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        icon={FolderGit2}
        title="Repositories"
        description={
          repos
            ? `${repos.length} connected · ${statusCounts.READY} ready to chat`
            : "Loading repositories…"
        }
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => refresh.mutate()}
            disabled={isSyncing}
          >
            <RefreshCw className={cn(isSyncing && "animate-spin")} />
            <span className="hidden sm:inline">Sync from GitHub</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
        <DashboardToolbar
          search={search}
          onSearchChange={setSearch}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
          statusCounts={statusCounts}
        />

        {reposQuery.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-64 rounded-2xl"
              />
            ))}
          </div>
        )}

        {reposQuery.isError && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>

              <EmptyTitle>
                Couldn&apos;t load repositories
              </EmptyTitle>

              <EmptyDescription>
                {(reposQuery.error as Error).message}
              </EmptyDescription>
            </EmptyHeader>

            <Button
              onClick={() => {
                void reposQuery.refetch();
              }}
            >
              Try again
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess && repos && repos.length === 0 && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>
              <EmptyTitle>No repositories found</EmptyTitle>
              <EmptyDescription>
                We couldn&apos;t find any repositories on your GitHub account.
                Create one on GitHub, then sync again.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => refresh.mutate()} disabled={isSyncing}>
              <RefreshCw className={cn(isSyncing && "animate-spin")} />
              Sync from GitHub
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess &&
          repos &&
          repos.length > 0 &&
          filtered.length === 0 && (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>

                <EmptyTitle>
                  No repositories match
                </EmptyTitle>

                <EmptyDescription>
                  Try a different search or clear the filters.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setVisibility("all");
                }}
              >
                Clear filters
              </Button>
            </Empty>
          )}

        {reposQuery.isSuccess && filtered.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((repo, index) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
