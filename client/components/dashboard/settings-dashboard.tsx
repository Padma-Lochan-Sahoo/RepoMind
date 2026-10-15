"use client";

import { ExternalLink, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const noopSubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function SettingsDashboard() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const userName = user?.displayName ?? user?.githubUsername ?? "User";
  const userHandle = user?.githubUsername ? `@${user.githubUsername}` : "";

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your RepoMind account and appearance."
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4 md:p-6">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5 animate-fade-up">
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in with GitHub.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <Avatar className="size-14 rounded-2xl ring-2 ring-primary/20">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={userName} />
              <AvatarFallback className="rounded-2xl">
                {getInitials(userName) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{userName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {userHandle}
              </p>
            </div>
          </div>

          {user?.githubUsername && (
            <a
              href={`https://github.com/${user.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="size-4" />
              View GitHub profile
            </a>
          )}
        </section>

        <section
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5 animate-fade-up"
          style={{ animationDelay: "70ms" }}
        >
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how RepoMind looks to you.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const selected = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5 animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          <h2 className="text-sm font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign out of RepoMind on this device.
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut />
            {logout.isPending ? "Signing out..." : "Log out"}
          </Button>
        </section>
      </div>
    </div>
  );
}
