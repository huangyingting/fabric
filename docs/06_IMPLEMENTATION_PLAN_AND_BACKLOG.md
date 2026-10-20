# 06. Implementation Plan and Task Backlog

## Phase 1: Project Scaffolding & Dual-Database Setup (`scaffold-project`)
- **T-101**: Configure `.gitignore` (protecting `.cred`, `.env*`, `node_modules`, `.next`, `prisma/*.db*`) and `package.json` with Next.js `^16.4.2`, React `^19.0.0`, `next-auth` `^4.24.15`, `@prisma/client` `^7.10.1`, `@prisma/adapter-better-sqlite3`, `@prisma/adapter-pg`, `@github/copilot-sdk`, `lucide-react`, `bcryptjs`, and `@playwright/test`.
- **T-102**: Create `prisma/schema.prisma` (SQLite local dev) and `prisma/schema.postgres.prisma` (PostgreSQL production), plus `prisma.config.ts` and `src/lib/prisma.ts`.
- **T-103**: Run Prisma migration (`prisma migrate dev --name init`) and generate the Prisma client.
- **T-104**: Implement `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin`) and `prisma/seed.ts` to seed the initial Admin user, sample Editor/Viewer invitations, default workspace (`powlowskijoshuah-cq1od1`), `Example space` with all 8 canonical multimodal resources (`Welcome to Fabric` note, `Memory as Mirror` quote note, `Attention Is All You Need` PDF, `People sitting down to watch a movie` MP4 video, `Wind in Prairie Birdsong` MP3 audio, 3 sample images, plus a Spatial Canvas), `Inbox`, default tags, `Rue` AI Assistant, 8 built-in AI Actions, sample Scheduled AI Task, and sample Connections.

## Phase 2: Invite-Only Authentication, RBAC & Audit Logging (`implement-features`)
- **T-201**: Implement `src/lib/auth.ts` (NextAuth Credentials provider + JWT/session callbacks injecting `user.id`, `user.role`, `user.defaultWorkspaceSlug`, `user.hasFinishedOnboarding`).
- **T-202**: Implement `src/lib/invitations.ts` and `src/lib/audit.ts` for SHA-256 invitation token hashing, single-use/expiration validation, revocation, and structured `AuditLog` persistence.
- **T-203**: Implement `/api/auth/register`, `/api/auth/validate-invite`, `/api/admin/invitations`, `/api/admin/users`, and `/api/admin/audit-logs`.
- **T-204**: Build `/signin`, `/signup` (with invite code badge, role preview, and validation), `/reset-password`, and the 5-step `/onboard/profile` wizard.

## Phase 3: Pluggable AI Engine (`@github/copilot-sdk` & Azure OpenAI)
- **T-301**: Implement `src/lib/ai/types.ts`, `src/lib/ai/providers/copilot-sdk.ts` (using `@github/copilot-sdk`), `src/lib/ai/providers/azure-openai.ts`, and `src/lib/ai/index.ts`.
- **T-302**: Implement `/api/ai/chat`, `/api/ai/actions`, and `/api/ai/tasks` (including automatic file renaming, `/` slash AI generation, 8 built-in AI actions, custom actions, and scheduled AI Agent execution).

## Phase 4: Core Workspace Views, Multi-Modal Viewers & Settings
- **T-401**: Build the Workspace Shell (`/[workspaceSlug]`) with collapsible left navigation rail, floating bottom action bar (`+ Create`, `Search`, `Rue Assistant`), and right-hand `Rue` AI Assistant drawer (Model selector: `Auto`, `GPT-6 Sol`, `GPT-5.6 Terra`, `GPT-5.6 Luna`, `Gemini 4 Argon`, `Grok 4.7`; Actions popover; Web search toggle; contextual resource pills).
- **T-402**: Build `/get-started`, `/home`, `/timeline`, `/spaces`, `/spaces/[spaceId]` (with `Grid`, `Masonry`, `List`, `Compact` view modes, thumbnail size slider, card detail toggles, sorting, and cover customization), `/inbox`, `/tags`, `/shared-with-me`, `/notifications`, and `/bin` (Trash restore & empty).
- **T-403**: Build the URL-driven `?expandedFdocId=<id>` Split-Screen Resource Overlay supporting:
  - Rich Note Editor with `/` slash command menu
  - Spatial Canvas Editor (pan/zoom, sticky notes, text, embedded resources, shapes, connectors)
  - Audio & Voice Note Waveform Player with timestamped comments (`Comment at MM:SS`)
  - Video Player with timeline markers + 2D spatial frame pins
  - Multi-Page PDF Viewer & Image Viewer with zoom controls + numbered spatial comment pins (`pinX`, `pinY`, `page`)
  - Right-hand inspector (`Rue AI Chat`, `Comments`, `Info / Details`, `Share / Publish` popover)
- **T-404**: Build `/connections`, `/tasks` (with `New AI Agent` drawer & `Run now` execution), `/chats`, `/marketplace` (`Fabric apps`, `Connections`, `Templates`, `Import to Fabric`), `/pricing`, and all 12 Settings sub-pages + Admin Invitations & Audit Log console.

## Phase 5: End-to-End Verification & Testing (`verify-and-test`)
- **T-501**: Run production build (`npm run build`) and type-checking.
- **T-502**: Execute comprehensive Playwright E2E test suite verifying invite-only signup, single-use/expired/revoked code rejection, onboarding wizard, all workspace pages, all 4 view modes, all resource creation & viewer modals (`Note`, `Canvas`, `Audio`, `Video`, `PDF`, `Image`, `Link`, `Voice Note`), spatial/timestamped comments, AI Assistant (`Rue`) + Actions + Scheduled Tasks, all Settings tabs, Admin governance + Audit Logs, and responsive layouts.
