# 02. Architecture Decision Records (ADRs)

## ADR-001: Next.js 16 App Router Full-Stack Monolith
- **Status**: Accepted
- **Context**: `fabric.so` uses Next.js with dynamic workspace routing (`/[workspaceSlug]/...`), query-parameter modal overlays (`?expandedFdocId=<id>`), and REST API endpoints. We need a unified, maintainable, high-performance full-stack architecture.
- **Decision**: Build the application on **Next.js 16 App Router** (`src/app/`) with React 19 Client/Server Components and typed Route Handlers (`src/app/api/...`).
- **Consequences**: Single deployment unit, shared TypeScript domain types between frontend and backend, seamless server-side session enforcement, and URL-compatible workspace routing (`/[workspaceSlug]/home`, `/[workspaceSlug]/spaces/[spaceId]`, etc.).

---

## ADR-002: Dual SQLite (Local Dev) & PostgreSQL (Production) Persistence with Prisma 7 Driver Adapters
- **Status**: Accepted
- **Context**: The system must use SQLite for zero-configuration local development and E2E testing while supporting PostgreSQL in production, matching the proven pattern in `../Arcade`.
- **Decision**: Use **Prisma 7** (`@prisma/client` `^7.10.1`) with runtime driver adapter selection in `src/lib/prisma.ts`:
  - When `DATABASE_URL` starts with `postgres://` or `postgresql://`, instantiate `PrismaPg` (`@prisma/adapter-pg`).
  - Otherwise, instantiate `PrismaBetterSqlite3` (`@prisma/adapter-better-sqlite3`) pointing at `file:./prisma/dev.db`.
  - Maintain `prisma/schema.prisma` (SQLite default) and `prisma/schema.postgres.prisma` (PostgreSQL production target).
- **Consequences**: Fast, deterministic local development and CI tests with SQLite, and seamless production scaling on PostgreSQL without changing application query code.

---

## ADR-003: Fail-Closed Invite-Only Authentication, Single-Use/Expiring Codes, RBAC, and Audit Logging
- **Status**: Accepted
- **Context**: The application requires invite-only registration with single-use, expiring invitation codes, role assignment (`Admin`, `Editor`, `Viewer`), invitation revocation, and comprehensive audit logging, following `../Arcade/docs/NEXTAUTH_INVITE_ONLY_SPEC.md` and security best practices (no public HTTP bootstrap admin endpoint).
- **Decision**:
  1. Enforce `ACCOUNT_ADMISSION_MODE=invitation-only` (fail-closed by default).
  2. Store only the **SHA-256 hash** (`tokenHash`) of invitation codes in `AccountInvitation`; return the raw invitation code (`FBRC-XXXX-XXXX-XXXX`) **once** to the Admin at creation time.
  3. Validate invitation status (`PENDING`), expiration (`expiresAt > now`), and optional email binding (`invitedEmail`) inside a serializable Prisma transaction during `/api/auth/register`, atomically marking the invitation `ACCEPTED`, creating the `User` with the invited `role`, hashing the password with `bcryptjs`, provisioning the user's default Workspace & `Rue` AI Assistant, and writing an `AuditLog` entry.
  4. Provide CLI-only bootstrap (`npm run bootstrap:admin` -> `scripts/bootstrap-admin.ts`) so only deployment administrators with shell access can bootstrap the initial `Admin` account.
- **Consequences**: Eliminates unauthorized signups, prevents token leakage at rest, guarantees single-use redemption under concurrency, and provides a complete tamper-evident audit trail (`INVITE_CREATED`, `INVITE_ACCEPTED`, `INVITE_REVOKED`, `USER_LOGIN`, `USER_ROLE_UPDATED`).

---

## ADR-004: Polymorphic Unified Resource Graph (`Resource`)
- **Status**: Accepted
- **Context**: In `fabric.so`, Spaces, Folders, Notes (`notepad`), Canvases (`canvas`), Web Links (`link`), PDFs (`document`), Images (`image`), Audio (`audio`), Video (`video`), and Voice Notes (`voice_note`) all share a single hierarchical resource model (`POST /v2/resources/filter`) with shared metadata, tags, comments, permissions, pinning, and soft-deletion (`deletedAt`).
- **Decision**: Model all workspace items in a unified `Resource` table with:
  - `kind`: `'folder' | 'notepad' | 'canvas' | 'link' | 'document' | 'image' | 'video' | 'audio' | 'voice_note'`
  - `root`: `'SPACE' | 'INBOX' | 'PRIVATE'`
  - `parentId`: Self-referencing nullable foreign key for nested folders/spaces.
  - `content`: Rich Markdown / structured JSON block content for notes and transcripts.
  - `data`: JSON column storing kind-specific state (e.g., Canvas nodes & edges, Audio/Video duration & waveform peaks, PDF page count, Web Link OpenGraph metadata, color palette).
- **Consequences**: Simplifies global search, tag filtering, trash/restore, sharing, and AI context grounding across all media types.

---

## ADR-005: URL-Driven Split-Screen Resource Viewer (`?expandedFdocId=<id>`) with Spatial & Timestamped Annotations
- **Status**: Accepted
- **Context**: Opening any resource in `fabric.so` appends `?expandedFdocId=<id>` to the current URL and opens a split-screen overlay with a kind-specific editor/viewer on the left and a multi-tab inspector (`Rue` AI Chat, `Comments`, `Info / Details`, `Share`) on the right. Furthermore, comments on Images, PDFs, Videos, and Audio files support spatial `(x, y, page)` pins and temporal `timestamp` anchors.
- **Decision**: Implement a global `ExpandedResourceModal` synchronized with `?expandedFdocId=<id>` that renders:
  - **Rich Note Editor** with `/` slash command menu (AI generation, headings, checklists, callouts, code blocks, quotes, tables).
  - **Spatial Canvas Editor** with draggable/resizable cards, sticky notes, shapes, connector lines, and zoom/pan controls.
  - **Interactive Audio & Voice Note Waveform Player** with playback speed (`0.5x`–`2x`), `-10s/+10s` skip, and clickable timestamp markers on the waveform.
  - **Video Player** with both timeline timestamp markers and spatial frame pins.
  - **PDF & Image Viewers** with zoom/page controls and click-to-pin spatial annotations (`x`, `y` normalized percentages + `page` number).
- **Consequences**: Deep-linkable resources, zero context switching when previewing/editing items inside a Space or Home view, and full parity with Fabric's multimodal annotation UX.

---

## ADR-006: Pluggable AI Provider Architecture (`@github/copilot-sdk` Default + Azure OpenAI Adapter)
- **Status**: Accepted
- **Context**: The user requested: *"If need ai capability, use copilot sdk and call copilot model, we will switch to azure openai later, so make the ai capability plugable."*
- **Decision**: Create a clean provider abstraction (`src/lib/ai/types.ts` and `src/lib/ai/index.ts`) implementing the Strategy pattern:
  - `CopilotSdkProvider` (`src/lib/ai/providers/copilot-sdk.ts`): Uses the official `@github/copilot-sdk` (`CopilotClient`) to execute prompts and multi-turn conversations against GitHub Copilot models, with automatic resilient fallback if the local CLI daemon lacks an interactive OAuth token in headless CI environments.
  - `AzureOpenAIProvider` (`src/lib/ai/providers/azure-openai.ts`): Uses Azure OpenAI Chat Completions REST API (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`) so switching to Azure OpenAI requires only setting `AI_PROVIDER=azure-openai` in `.env` (or switching in Workspace AI Settings).
- **Consequences**: All AI features—`Rue` contextual chat, the 8 built-in AI Actions (`Summarize`, `List points`, `Explain like I'm five`, `Tidy up formatting`, `Tweet`, `To-do list`, `Email`, `Compact`), Custom Actions, Note `/` AI commands, Automatic Renaming, and Scheduled AI Agents/Tasks—work seamlessly through one unified `getAIProvider()` interface.
