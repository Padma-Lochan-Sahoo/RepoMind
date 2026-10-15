# RepoMind – Client

The web UI for RepoMind, built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**
and **Base UI / shadcn-style components**. Server state is handled by **TanStack Query**.

## Requirements

- Node.js 20+ and npm

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

| Variable                   | Default                 | Description                                  |
| -------------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL of the RepoMind backend (no trailing `/`). |

> The backend must be running and must list this app's origin in `CORS_ALLOWED_ORIGIN`.

## Scripts

| Command           | Purpose                              |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Development server with hot reload   |
| `npm run build`   | Production build                     |
| `npm run start`   | Serve the production build           |
| `npm run lint`    | ESLint                               |

Type-check: `npx tsc --noEmit`.

## Structure

```
client/
├── app/                    # Routes (App Router)
│   ├── page.tsx            # Landing page
│   ├── login/              # GitHub sign-in
│   ├── auth/callback/      # Return point after OAuth
│   ├── dashboard/          # Repositories · Overview · Settings
│   ├── chat/[repoId]/      # Chat with a repository
│   ├── error.tsx · not-found.tsx
│   └── globals.css         # Design tokens, animations, utilities
├── components/
│   ├── landing/            # Hero, features, interactive demo, FAQ
│   ├── dashboard/          # Repo cards, toolbar, overview, settings
│   ├── chat/               # Messages, composer, sidebar, citations
│   ├── layout/             # App shell, page header, brand mark, loaders
│   ├── providers/          # Query, theme and auth-guard providers
│   └── ui/                 # Primitive components (button, dialog, …)
├── hooks/                  # use-auth, use-repos, use-chat
├── lib/                    # api client, SSE stream parser, query keys, helpers
└── proxy.ts                # Route protection (Next 16 "proxy", formerly middleware)
```

## How it works

- **Auth** – the backend owns the session cookie (`REPOMIND_SESSION`). The client keeps a
  lightweight `repomind_auth` cookie so `proxy.ts` can redirect before rendering; the real check
  is `GET /api/auth/me` (`RequireAuth`). A `401` from any API call re-validates the session.
- **Data** – all requests go through `lib/api.ts` with `credentials: "include"`. Repository status
  is polled while a repo is *Indexing*.
- **Chat streaming** – `lib/stream-chat.ts` parses the Server-Sent Events from
  `POST /api/chat/sessions/{id}/messages` (`user_message`, `token`, `assistant_message`, `error`, `done`).
  Stopping the stream aborts the request; the server keeps the partial answer.

## Design system

Tokens live in `app/globals.css` (OKLCH colors, light + dark). Handy utilities:
`bg-brand-gradient`, `text-gradient`, `bg-aurora`, `bg-grid`, `glass`, plus animations
(`animate-fade-up`, `animate-float`, `animate-pop`, …). All motion respects
`prefers-reduced-motion`. Fonts: **Geist** (UI) and **JetBrains Mono** (code).

## Conventions

- Use the shared `PageHeader` for dashboard pages (it includes the mobile sidebar trigger).
- Prefer `useQuery`/`useMutation` hooks from `hooks/`; keep query keys in `lib/query-keys.ts`.
- Check `node_modules/next/dist/docs/` for Next.js 16 specifics before using framework APIs.
