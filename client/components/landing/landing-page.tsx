"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileCode2,
  GitBranch,
  Layers,
  Lock,
  MessageSquareText,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import { HeroCanvas } from "@/components/landing/hero-canvas";
import { RepoMindIcon } from "@/components/icons/repomind-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/* ----------------------------- demo content ----------------------------- */

const PROMPTS = [
  {
    id: "auth",
    label: "How does sign-in work?",
    answer:
      "Sign-in starts at the OAuth callback handler, which exchanges the code for a token and creates a session. Protected routes read the current user from the session middleware, and tokens are encrypted before they are stored.",
    paths: ["src/auth/callback.ts", "src/middleware/session.ts"],
  },
  {
    id: "index",
    label: "Where are background jobs started?",
    answer:
      "Jobs are enqueued from the sync service right after a repository is connected. A worker pulls each job, processes the files in batches, and reports progress back so the UI can show a live percentage.",
    paths: ["src/services/sync.ts", "src/workers/indexer.ts"],
  },
  {
    id: "chat",
    label: "How are API errors handled?",
    answer:
      "Errors are thrown as typed exceptions and caught by one global handler that maps them to HTTP status codes and a consistent JSON body, so controllers never format error responses themselves.",
    paths: ["src/errors/handler.ts", "src/errors/types.ts"],
  },
] as const;

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Conversational answers",
    body: "Ask in plain English and get explanations that read like a teammate who knows the whole codebase.",
  },
  {
    icon: FileCode2,
    title: "Cited by file & line",
    body: "Every answer links to the exact files and line ranges it used, so you can verify in one click.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    body: "Answers appear token by token. Stop anytime when you've seen enough.",
  },
  {
    icon: Lock,
    title: "Private repos, safely",
    body: "Works with private repositories. Access tokens are encrypted at rest and never exposed to the browser.",
  },
  {
    icon: Layers,
    title: "Remembers the thread",
    body: "Follow-up questions understand what you just asked, so you can dig deeper without repeating yourself.",
  },
  {
    icon: Bot,
    title: "Grounded, not guessing",
    body: "RepoMind answers from retrieved code. When the context isn't enough, it tells you instead of inventing things.",
  },
];

const STEPS = [
  {
    icon: GitBranch,
    title: "Connect a repository",
    body: "Sign in with GitHub and pick the project you actually ship.",
  },
  {
    icon: Search,
    title: "Index what matters",
    body: "RepoMind reads your source, docs and config and builds a searchable map of it.",
  },
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    body: "Get answers that cite files and functions — not vague summaries.",
  },
];

const FAQS = [
  {
    q: "Which repositories can I use?",
    a: "Any public or private repository your GitHub account can access, including organisation repos. You choose which ones to index.",
  },
  {
    q: "Does RepoMind change my code?",
    a: "No. It only reads files through the GitHub API to build the index. Nothing is written back to your repositories.",
  },
  {
    q: "How are answers generated?",
    a: "Your question is matched against the indexed code chunks, the most relevant ones are sent to the language model as context, and the reply is streamed back with citations.",
  },
  {
    q: "What happens when the repository changes?",
    a: "Re-index it from the dashboard whenever you want a fresh snapshot. Your existing chats are kept.",
  },
];

/* ------------------------------ typing demo ----------------------------- */

const subscribeReducedMotion = (cb: () => void) => {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Types out `text`. Remount with a new `key` to restart. */
function TypedText({ text }: { text: string }) {
  const [count, setCount] = React.useState(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const id = window.setInterval(
      () => setCount((c) => (reduced ? text.length : Math.min(c + 2, text.length))),
      reduced ? 0 : 22
    );
    return () => window.clearInterval(id);
  }, [text, reduced]);

  const done = count >= text.length;

  return (
    <>
      {text.slice(0, count)}
      {!done && (
        <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-primary animate-caret" />
      )}
    </>
  );
}

function ChatMock({
  prompt,
}: {
  prompt: (typeof PROMPTS)[number];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
          acme/shop-api · example
        </span>
      </div>

      <div className="min-h-[19rem] space-y-5 p-4 sm:p-5">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand-gradient px-4 py-2.5 text-sm text-white shadow-md">
            {prompt.label}
          </div>
        </div>

        <div key={prompt.id} className="flex gap-3">
          <RepoMindIcon className="size-8 rounded-xl shadow-sm" />
          <div className="min-w-0 flex-1 space-y-3 text-sm leading-relaxed text-foreground/90">
            <p className="min-h-[7.5rem]">
              <TypedText text={prompt.answer} />
            </p>
            <div className="flex flex-wrap gap-1.5">
              {prompt.paths.map((path) => (
                <span
                  key={path}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  <FileCode2 className="size-3 text-primary" />
                  {path}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export function LandingPage() {
  const [activePrompt, setActivePrompt] = React.useState(0);
  const prompt = PROMPTS[activePrompt];

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="RepoMind home">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#ask" className="transition-colors hover:text-foreground">
              Demo
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
            >
              Sign in
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              AI that actually read your code
            </span>

            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Ask your codebase.
              <br />
              <span className="text-gradient animate-gradient-pan">
                Get answers with receipts.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Connect GitHub, index a repository, and chat through architecture,
              ownership and edge cases — grounded in your real files, with
              links to the exact lines.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 gap-2 bg-foreground px-5 text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:bg-foreground/90"
                )}
              >
                <GitHubIcon className="size-4" />
                Start with GitHub
              </Link>
              <a
                href="#ask"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 gap-2 px-5"
                )}
              >
                See it in action
                <ArrowRight className="size-4" />
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["Public & private repos", "Read-only access", "Streaming answers"].map(
                (item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-success" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div
            className="relative animate-fade-up lg:translate-x-4"
            style={{ animationDelay: "150ms" }}
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-3xl" />
            <div className="animate-float-slow">
              <ChatMock prompt={PROMPTS[0]} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to{" "}
              <span className="text-gradient">understand code faster</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Built for engineers who live in the repo and hate guessing.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-brand-gradient group-hover:text-white">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="scroll-mt-16 border-t border-border/60 bg-muted/30"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              From clone to clarity
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Three steps. No ceremony.
            </p>
          </div>

          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative text-center">
                <div className="relative mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/25">
                  <step.icon className="size-5" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-border bg-background text-[11px] font-semibold text-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Interactive demo */}
      <section id="ask" className="scroll-mt-16 border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ask like you mean it
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pick a question and watch how RepoMind answers with a concrete
              path through the code. (Example content — your answers come from
              your own repositories.)
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div className="flex flex-col gap-2" role="tablist" aria-label="Example questions">
              {PROMPTS.map((item, index) => {
                const selected = index === activePrompt;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActivePrompt(index)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
                      selected
                        ? "border-transparent bg-brand-gradient text-white shadow-lg shadow-primary/25"
                        : "border-border/70 bg-card hover:-translate-y-0.5 hover:border-primary/30"
                    )}
                  >
                    {item.label}
                    <ArrowRight
                      className={cn(
                        "size-4 shrink-0 transition-all",
                        selected ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <ChatMock prompt={prompt} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>

          <Accordion className="mt-10 bg-card">
            {FAQS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="absolute inset-4 -z-10 rounded-[2rem] bg-aurora sm:inset-6" />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Open a repo. Start the conversation.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Onboarding, debugging and design reviews move at the speed of a
              good question.
            </p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 inline-flex h-11 gap-2 bg-foreground px-6 text-background shadow-lg transition-all hover:-translate-y-0.5 hover:bg-foreground/90"
              )}
            >
              <GitHubIcon className="size-4" />
              Get started — it&apos;s free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <BrandMark className="text-foreground" />
          <p>Chat with your repositories.</p>
        </div>
      </footer>
    </div>
  );
}
