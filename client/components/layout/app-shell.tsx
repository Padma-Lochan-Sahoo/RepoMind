"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageSquare, Settings } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { RepoMindIcon } from "@/components/icons/repomind-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useRepos } from "@/hooks/use-repos";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Separator } from "@/components/ui/separator";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  dashboardNavGroups,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";

import { cn } from "@/lib/utils";

// Re-exported so existing imports keep working.
export { BrandMark };

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** Pages that render their own <PageHeader /> pass `hideHeader`. */
  hideHeader?: boolean;
  /** Lock the layout to the viewport height (chat): inner areas scroll. */
  fullHeight?: boolean;
};

function QuickChatLinks() {
  const pathname = usePathname();
  const { data: repos } = useRepos();

  const ready = (repos ?? [])
    .filter((repo) => repo.indexStatus === "READY")
    .slice(0, 6);

  if (ready.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Quick chat</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {ready.map((repo) => (
            <SidebarMenuItem key={repo.id}>
              <SidebarMenuButton
                render={<Link href={`/chat/${repo.id}`} />}
                isActive={pathname === `/chat/${repo.id}`}
              >
                <MessageSquare />
                <span className="truncate">{repo.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppShell({
  children,
  title,
  description,
  actions,
  hideHeader = false,
  fullHeight = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const userName = user?.displayName ?? user?.githubUsername ?? "User";
  const userHandle = user?.githubUsername ? `@${user.githubUsername}` : "";

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <SidebarProvider className={cn(fullHeight && "h-svh overflow-hidden")}>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/dashboard" />}
                tooltip="RepoMind"
              >
                <RepoMindIcon className="size-8 rounded-[10px] shadow-sm" />

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Repo<span className="text-gradient">Mind</span>
                  </span>

                  <span className="truncate text-xs text-muted-foreground">
                    Chat with your code
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {dashboardNavGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>
                {group.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    const isActive = isDashboardNavActive(
                      pathname,
                      item.href,
                      item.exact
                    );

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <QuickChatLinks />
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton size="lg" />}
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user?.avatarUrl ?? undefined}
                      alt={userName}
                    />

                    <AvatarFallback className="rounded-lg">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {userName}
                    </span>

                    <span className="truncate text-xs text-muted-foreground">
                      {userHandle}
                    </span>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="w-56"
                >
                  <DropdownMenuLabel>
                    My Account
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/settings")}
                    >
                      <Settings />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      variant="destructive"
                      disabled={logout.isPending}
                      onClick={() => logout.mutate()}
                    >
                      <LogOut />
                      {logout.isPending ? "Logging out..." : "Logout"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className={cn(fullHeight && "min-h-0 overflow-hidden")}>
        {!hideHeader && (
          <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                {title && (
                  <h1 className="truncate text-sm font-semibold">
                    {title}
                  </h1>
                )}

                {description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {actions}
                <ModeToggle />
              </div>
            </div>
          </header>
        )}

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            fullHeight && "min-h-0"
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function GhostButtonIcon({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-4xl px-3 text-sm font-medium transition-colors hover:bg-muted",
        className
      )}
    >
      {children}
    </Link>
  );
}
