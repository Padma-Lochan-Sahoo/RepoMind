"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { useCurrentUser } from "@/hooks/use-auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  const { data: user, isLoading, isFetched } = useCurrentUser();

  useEffect(() => {
    if (!isFetched || isLoading) return;

    if (user) {
      let target = "/dashboard";
      try {
        const saved = sessionStorage.getItem("repomind:next");
        sessionStorage.removeItem("repomind:next");
        if (saved && saved.startsWith("/") && !saved.startsWith("//")) {
          target = saved;
        }
      } catch {
        // ignore
      }
      router.replace(target);
      return;
    }

    router.replace("/login?error=session");
  }, [user, isLoading, isFetched, router]);

  return <FullScreenLoader label="Finishing GitHub sign-in..." />;
}
