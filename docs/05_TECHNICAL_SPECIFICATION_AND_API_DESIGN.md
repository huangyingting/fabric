# 05. Technical Specification and API Design

## 1. Pluggable AI Capability Specification (`src/lib/ai/`)

### 1.1 Provider Interface (`src/lib/ai/types.ts`)
```ts
export type AIProviderName = 'copilot-sdk' | 'azure-openai';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  personality?: 'balanced' | 'warm' | 'direct' | 'concise' | 'sassy';
  workspaceContext?: {
    workspaceName: string;
    assistantName: string;
    focusedResources?: Array<{ id: string; name: string; kind: string; content?: string | null; description?: string | null }>;
  };
  webSearch?: boolean;
}

export interface AICompletionResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  citations: Array<{ resourceId: string; resourceName: string; snippet: string }>;
}

export interface AIProvider {
  readonly name: AIProviderName;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}
```

### 1.2 Copilot SDK Provider (`src/lib/ai/providers/copilot-sdk.ts`)
- Uses `@github/copilot-sdk` (`CopilotClient`) to create a session and invoke the selected Copilot model (`gpt-6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gemini-4-argon`, `grok-4.7`, or default `auto`).
- Grounds prompts in the active workspace's focused resources (`?expandedFdocId` or searched workspace resources) and applies the user's assistant persona (`Rue` + personality system prompt).
- Includes a deterministic contextual synthesis fallback when running in an offline or non-authenticated CI test container so automated E2E tests and local evaluations always succeed deterministically.

### 1.3 Azure OpenAI Provider (`src/lib/ai/providers/azure-openai.ts`)
- Uses standard Azure OpenAI REST Chat Completions endpoint:
  `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`
- Activated automatically when `AI_PROVIDER="azure-openai"` or switched dynamically in Workspace AI Settings.

---

## 2. Invite-Only Admission & RBAC Specification

### 2.1 Admission Mode & Token Hashing
- Environment variable `ACCOUNT_ADMISSION_MODE` defaults to `"invitation-only"`.
- Invitation codes follow the human-friendly format `FBRC-XXXX-XXXX-XXXX` (alphanumeric uppercase).
- Only `SHA-256(normalizedCode)` is stored in `AccountInvitation.tokenHash`.
- Validation rules enforced in `/api/auth/register`:
  1. `status === 'PENDING'`
  2. `expiresAt > new Date()` (otherwise atomically marked `EXPIRED` and rejected)
  3. `useCount < maxUses`
  4. If `invitedEmail` is set on the invitation, it must match `email.toLowerCase()`
- Upon valid registration:
  - Creates `User` (`role = invitation.role`) + `PasswordCredential` (`bcrypt.hash(password, 10)`)
  - Atomically increments `useCount`, sets `status = 'ACCEPTED'`, `acceptedById`, `acceptedAt`
  - Provisions default Workspace, Example Space with sample multimodal resources (Note, Quote Note, Canvas, PDF, Video, Audio, Images), Inbox, Default Tags, Default AI Assistant `Rue`, and 8 built-in AI Actions
  - Appends `INVITE_ACCEPTED` and `USER_REGISTERED` entries to `AuditLog`

---

## 3. REST API Contract (`src/app/api/*`)

| Endpoint | Method(s) | Auth / Role | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | `GET, POST` | Public | NextAuth.js Credentials provider & JWT session handler |
| `/api/auth/register` | `POST` | Public (Invite Code Required) | Validates single-use/expiring invitation code, creates user + workspace, logs audit event |
| `/api/auth/validate-invite` | `POST` | Public | Pre-validates an invitation code and returns assigned role / email lock status |
| `/api/onboard` | `POST` | Authenticated | Saves 5-step onboarding wizard choices, customizes `Rue`, marks `hasFinishedOnboarding = true` |
| `/api/workspaces` | `GET, POST, PATCH` | Authenticated | Lists workspaces, creates new workspace, or updates workspace settings / plan tier |
| `/api/resources` | `GET, POST` | Authenticated (`Editor+` for `POST`) | Filters resources (`workspaceSlug`, `parentId`, `root`, `kind`, `tagId`, `search`, `trashed`, `shared`, `sortBy`, `sortDir`) or creates new resource (Note, Canvas, Link, Voice Note, Upload, Space/Folder) |
| `/api/resources/[id]` | `GET, PATCH, DELETE` | Authenticated (`Editor+` for mutate) | Fetches resource with tags/comments, updates content/canvas/metadata/sharing/trash state, or permanently deletes |
| `/api/resources/trash` | `POST` | `Editor+` | Restores all or empties trash (`/bin`) |
| `/api/comments` | `GET, POST, PATCH, DELETE` | Authenticated | Lists or creates comments with optional `timestamp` (audio/video), `page` (PDF), and spatial `(pinX, pinY)` coordinates |
| `/api/tags` | `GET, POST, PATCH, DELETE` | Authenticated | Lists tags with resource counts, creates/renames/recolors/deletes tags, attaches/detaches resource tags |
| `/api/ai/chat` | `GET, POST, DELETE` | Authenticated | Lists AI chat threads/messages, sends prompt to pluggable AI provider (`@github/copilot-sdk` or `azure-openai`) with workspace/resource grounding |
| `/api/ai/actions` | `GET, POST, DELETE` | Authenticated | Lists built-in + custom AI actions, creates custom action, or runs an action against a resource/text |
| `/api/ai/tasks` | `GET, POST, PATCH, DELETE` | Authenticated | Manages scheduled AI Agents/Tasks (`All`, `Active`, `Paused`, `Drafts`) and triggers immediate execution (`runNow: true`) |
| `/api/connections` | `GET, POST, PATCH` | Authenticated | Connects/disconnects external apps (`Google Drive`, `Notion`, `Slack`, `GitHub`, etc.), runs file/markdown/bookmark importers, and manages MCP connectors |
| `/api/notifications` | `GET, PATCH` | Authenticated | Lists workspace notifications and marks notifications read |
| `/api/settings/api-keys` | `GET, POST, DELETE` | Authenticated | Generates and revokes workspace API keys (`fbrc_live_...`) |
| `/api/admin/invitations` | `GET, POST, PATCH` | `Admin` | Lists invitations, generates single-use/expiring invitation codes with role (`Admin`/`Editor`/`Viewer`), revokes pending invitations |
| `/api/admin/users` | `GET, PATCH` | `Admin` | Lists users and updates user roles (`Admin`, `Editor`, `Viewer`) with audit logging |
| `/api/admin/audit-logs` | `GET` | `Admin` | Paginated query over security and workspace `AuditLog` entries |
