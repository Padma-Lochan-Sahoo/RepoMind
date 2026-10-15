<div align="center">

# RepoMind

**Chat with your GitHub repositories.** Connect GitHub, index a codebase, and ask
questions in plain English — answers stream back grounded in your real files,
with links to the exact lines they came from.

</div>

---

## ✨ Features

- **GitHub sign-in** – OAuth login; works with public *and* private repositories.
- **One-click indexing** – files are fetched, chunked, embedded and stored in a vector database, with live progress.
- **Grounded chat (RAG)** – answers are generated from retrieved code, never from guesses.
- **Citations with line numbers** – every answer links to the file *and* line range on GitHub.
- **Streaming responses** – tokens appear live; stop generating at any time (partial answers are kept).
- **Conversation memory** – follow-up questions understand the previous turns.
- **Auto-named chats**, multiple chats per repo, delete chats you no longer need.
- **Dashboard** – search, filter by status/visibility, sort, re-index, language breakdown overview.
- **Polished UI** – responsive, light/dark/system themes, animated landing page, keyboard friendly, reduced-motion aware.

## 🧱 Architecture

```
┌────────────────────┐   REST + SSE (cookies)   ┌──────────────────────────┐
│  client (Next.js)  │ ───────────────────────▶ │  backend (Spring Boot)   │
│  React 19 · TW 4   │                          │  OAuth2 · JPA · Spring AI│
└────────────────────┘                          └───────────┬──────────────┘
                                                            │
                          ┌─────────────────────────────────┼──────────────────┐
                          ▼                                 ▼                  ▼
                   GitHub REST API               PostgreSQL + pgvector     OpenAI API
                 (repos, tree, contents)       (users, chats, embeddings) (embeddings, chat)
```

| Folder        | What it is                                         | Docs                            |
| ------------- | -------------------------------------------------- | ------------------------------- |
| [`client/`](client/)   | Next.js 16 web app (UI)                  | [client/README.md](client/README.md)   |
| [`backend/`](backend/) | Spring Boot 4 API, indexing & RAG        | [backend/README.md](backend/README.md) |

## 🚀 Quick start

### Prerequisites

| Tool        | Version | Notes                                              |
| ----------- | ------- | -------------------------------------------------- |
| Node.js     | 20+     | for the client                                     |
| Java (JDK)  | 21      | for the backend                                    |
| PostgreSQL  | 15+     | **with the `pgvector` extension**                  |
| OpenAI key  | –       | embeddings + chat                                  |
| GitHub OAuth App | –  | for sign-in                                        |

### 1. Start PostgreSQL with pgvector

```bash
docker run -d --name repomind-db \
  -e POSTGRES_USER=repomind -e POSTGRES_PASSWORD=repomind -e POSTGRES_DB=repomind \
  -p 5432:5432 pgvector/pgvector:pg16
```

### 2. Create a GitHub OAuth App

GitHub → *Settings → Developer settings → OAuth Apps → New*:

- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:8080/login/oauth2/code/github`

Copy the Client ID and generate a Client Secret.

### 3. Configure & run the backend

```bash
cd backend
cp .env.example .env        # then fill in the values
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
```

The API starts on <http://localhost:8080> (health check: `GET /api/health`).

### 4. Configure & run the client

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>, click **Sign in**, pick a repository, **Index & chat**.

## 🗂 Project structure

```
RepoMind/
├── client/        # Next.js app (app router, components, hooks, lib)
├── backend/       # Spring Boot app (controllers, services, entities)
├── .gitignore     # root ignore rules (client/ and backend/ have their own)
└── README.md
```

## 🔐 Security notes

- Real secrets live only in `backend/.env` (git-ignored). Use the `.env.example` templates.
- GitHub access tokens are encrypted at rest (`TOKEN_ENCRYPTOR_*`). **Change the defaults** in any shared/production environment.
- The session cookie is `HttpOnly`, `SameSite=Lax`. For production, serve over HTTPS and set the cookie `secure` flag.
- If a secret was ever committed or shared (including inside a zip), **rotate it**.

## 🩺 Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Login bounces back to `/login?error=session` | Backend not running, wrong `NEXT_PUBLIC_API_BASE_URL`, or `FRONTEND_URL`/`CORS_ALLOWED_ORIGIN` mismatch. |
| `redirect_uri_mismatch` from GitHub | OAuth callback must be exactly `http://localhost:8080/login/oauth2/code/github`. |
| Indexing fails immediately | Check `OPENAI_API_KEY`; the error is shown on the repo card and in the backend log. |
| `extension "vector" is not available` | Use a pgvector-enabled Postgres image (see step 1). |
| Repo stuck on *Indexing* after a restart | Fixed: on startup interrupted jobs are marked *Failed* so you can retry. |
| Cookies not sent to the API | Keep client and backend on the same site (e.g. both `localhost`). |

## 📄 License

Add your license of choice here.
