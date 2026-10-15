"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-auth";
import type { User } from "@/lib/api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserButton({ user }: { user: User }) {
  const logout = useLogout();
  const fallback = initials(user.displayName) || user.githubUsername.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="h-10 gap-2 rounded-full px-2 pr-3" />
        }
      >
        <Avatar size="sm">
          <AvatarImage
            src={user.avatarUrl ?? undefined}
            alt={user.displayName}
          />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span className="max-w-36 truncate text-sm font-medium">
          {user.displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {user.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                @{user.githubUsername}
              </p>
              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              <p className="text-xs text-muted-foreground">
                GitHub ID: {user.githubId}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut />
          {logout.isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
