"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { useCurrentUser } from "@/hooks/use-auth";
import { UNAUTHORIZED_EVENT } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Any API call that comes back 401 re-validates the session; if it is gone
  // the `me` query errors and the effect below sends the user to sign in.
  useEffect(() => {
    const onUnauthorized = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  useEffect(() => {
    if (!isLoading && !user) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return <FullScreenLoader label="Loading your workspace..." />;
  }

  if (isError || !user) {
    return <FullScreenLoader label="Redirecting to sign in..." />;
  }

  return <>{children}</>;
}
