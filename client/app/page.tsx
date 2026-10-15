import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "RepoMind — Chat with your repositories",
  description:
    "Connect GitHub, index your codebase, and ask grounded questions with file-level citations.",
};

export default function Home() {
  return <LandingPage />;
}
