# RepoMind – Backend

Spring Boot **4.1** (Java **21**) service that handles GitHub OAuth, repository sync, indexing
into a pgvector store, and streaming RAG chat via **Spring AI** + OpenAI.

## Requirements

- JDK 21
- PostgreSQL 15+ with the **pgvector** extension
- OpenAI API key
- A GitHub OAuth App

## Configuration

```bash
cp .env.example .env     # values are read from ./.env at startup
```

| Variable                   | Required | Description                                                   |
| -------------------------- | :------: | ------------------------------------------------------------- |
| `DATABASE_URL`             | ✅ | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/repomind`          |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | ✅ | DB credentials                                      |
| `OPENAI_API_KEY`           | ✅ | Used for embeddings and chat                                        |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App credentials                    |
| `FRONTEND_URL`             |  | Where to redirect after login (default `http://localhost:3000`)         |
| `CORS_ALLOWED_ORIGIN`      |  | Allowed browser origin(s) (default `http://localhost:3000`)             |
| `TOKEN_ENCRYPTOR_PASSWORD` / `TOKEN_ENCRYPTOR_SALT` |  | Encrypt GitHub tokens at rest. **Change in production.** Salt must be hex. |
| `PORT`                     |  | HTTP port (default `8080`)                                              |
| `SHOW_SQL`                 |  | Log SQL statements (default `false`)                                    |

OAuth callback URL to register on GitHub: `http://localhost:8080/login/oauth2/code/github`.

Tables and the vector schema are created automatically (`ddl-auto: update`,
`pgvector.initialize-schema: true`).

## Run

```bash
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
./mvnw test                     # tests
./mvnw clean package            # build target/*.jar
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Health check: `GET http://localhost:8080/api/health`

## API

All `/api/**` endpoints need the session cookie, except where noted.

| Method | Path                                  | Description                                      |
| ------ | ------------------------------------- | ------------------------------------------------ |
| GET    | `/oauth2/authorization/github`        | Start GitHub login (public)                      |
| GET    | `/api/health`                         | Liveness probe (public)                          |
| GET    | `/api/auth/me`                        | Current user                                     |
| POST   | `/api/auth/logout`                    | End the session                                  |
| GET    | `/api/repos`                          | List repositories (syncs from GitHub by default; `?refresh=false` skips the sync) |
| GET    | `/api/repos/{id}`                     | Repository details                               |
| POST   | `/api/repos/{id}/index`               | Start (re-)indexing                              |
| GET    | `/api/repos/{id}/status`              | Indexing progress                                |
| POST   | `/api/chat/sessions`                  | Create a chat `{repositoryId, title?}`           |
| GET    | `/api/chat/sessions?repositoryId=…`   | List chats of a repository                       |
| GET    | `/api/chat/sessions/{id}`             | Messages of a chat                               |
| DELETE | `/api/chat/sessions/{id}`             | Delete a chat and its messages                   |
| POST   | `/api/chat/sessions/{id}/messages`    | Ask a question – **SSE stream**                  |

**SSE events:** `user_message` → `token`* → `assistant_message` → `done`, or `error` (with a message).

Errors are JSON: `{ status, error, message, timestamp }`. GitHub upstream failures (expired token,
rate limit, empty repo) are translated to friendly messages.

## How RAG works

1. **Index** – the default-branch tree is listed, source files are filtered (`CodeFileFilter`: allowed
   extensions, size limit, skipped folders), fetched, split into token-based chunks (`CodeChunker`,
   with approximate `startLine`/`endLine` metadata), embedded and stored in pgvector.
2. **Retrieve** – the question (plus the previous question for short follow-ups) is embedded and the
   top-K similar chunks of *that repository* are fetched.
3. **Generate** – a grounded prompt (system rules + retrieved context + recent conversation + question)
   is streamed from the chat model; tokens are forwarded over SSE and the final answer is stored with
   its citations. If the client disconnects, generation is cancelled and the partial answer is saved.

## Structure

```
src/main/java/repoMind/backend/
├── config/        # Security, CORS, async executor, app config
├── controller/    # REST controllers (auth, repos, chat, health)
├── dto/           # Request/response records
├── entity/        # JPA entities (User, Repository, ChatSession, ChatMessage)
├── exceptions/    # Domain exceptions + GlobalExceptionHandler
├── repository/    # Spring Data repositories
├── security/      # Principal, current-user helper, OAuth user service
└── service/
    ├── ai/        # Retrieval, prompt builder, SSE stream handler
    ├── github/    # GitHub API client + rate limiter
    └── indexing/  # File filter, chunker, indexing service
```

## Notes

- Interrupted indexing jobs (e.g. server restart) are marked **FAILED** on startup so they can be retried.
- `@Valid` is not used (no validation starter); inputs are validated explicitly in the services.
- Never commit `.env`. If a key was exposed, rotate it.
