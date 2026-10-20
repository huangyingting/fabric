# 04. System Architecture and Data Model

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                        Browser Client (React 19 / Next.js 16)                     |
|                                                                                   |
|  +--------------------+  +------------------------------+  +-------------------+  |
|  | Collapsible Rail   |  | Main Workspace Viewport      |  | Contextual Right  |  |
|  | - Spaces / Inbox   |  | - Home / Timeline / Spaces   |  | Drawer (Rue AI)   |  |
|  | - Connections      |  | - Connections / Tasks / Tags |  | - Model Selector  |  |
|  | - Chats / Tasks    |  | - Marketplace / Trash / Bin  |  | - 8 AI Actions    |  |
|  | - Settings (12+1)  |  | - ?expandedFdocId=<id> Modal |  | - Citation Links  |  |
|  +--------------------+  +------------------------------+  +-------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / JSON REST APIs
                                          v
+-----------------------------------------------------------------------------------+
|                     Next.js App Router Backend (Route Handlers)                   |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  | Auth & Governance      |  | Resource & Workspace   |  | Pluggable AI Layer  |  |
|  | - NextAuth JWT Session |  | - Polymorphic CRUD     |  | - AIProvider Iface  |  |
|  | - Invite-Only Register |  | - Filter / Search /    |  | - CopilotSdkProvider|  |
|  | - SHA-256 Invite Codes |  |   Sort / Tagging       |  |   (@github/copilot) |  |
|  | - RBAC & Audit Logger  |  | - Spatial/Time Comments|  | - AzureOpenAIAdapter|  |
|  +------------------------+  +------------------------+  +---------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          | Prisma 7 Driver Adapter
                                          v
+-----------------------------------------------------------------------------------+
|         Persistence Layer: SQLite (Local Dev) / PostgreSQL (Production)           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Complete Prisma Data Model (`prisma/schema.prisma`)

### 2.1 Identity, Invite-Only Admission & Audit Domain
- **`User`**
  - `id` (`String @id @default(cuid())`)
  - `email` (`String @unique`)
  - `name` (`String?`)
  - `image` (`String?`)
  - `role` (`String @default("Editor")`) — `"Admin" | "Editor" | "Viewer"`
  - `hasFinishedOnboarding` (`Boolean @default(false)`)
  - `onboardingData` (`String?`) — JSON survey preferences & use-cases
  - `preferences` (`String?`) — JSON UI theme, default view mode, auto-renaming settings
  - `createdAt`, `updatedAt`
- **`PasswordCredential`**
  - `id`, `userId` (`@unique`), `passwordHash` (`bcrypt`), `createdAt`, `updatedAt`
- **`AccountInvitation`**
  - `id` (`String @id @default(cuid())`)
  - `codePrefix` (`String`) — Display prefix e.g. `FBRC-7K9M`
  - `tokenHash` (`String @unique`) — SHA-256 digest of raw invitation code
  - `invitedEmail` (`String?`) — Optional email lock
  - `role` (`String @default("Editor")`) — Role granted upon redemption (`Admin`, `Editor`, `Viewer`)
  - `status` (`String @default("PENDING")`) — `"PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED"`
  - `maxUses` (`Int @default(1)`)
  - `useCount` (`Int @default(0)`)
  - `expiresAt` (`DateTime`)
  - `createdById` (`String`), `acceptedById` (`String?`), `acceptedAt` (`DateTime?`), `revokedAt` (`DateTime?`)
  - `note` (`String?`)
  - `createdAt`, `updatedAt`
- **`AuditLog`**
  - `id` (`String @id @default(cuid())`)
  - `actorId` (`String?`), `actorEmail` (`String?`)
  - `action` (`String`) — e.g. `INVITE_CREATED`, `INVITE_ACCEPTED`, `INVITE_REVOKED`, `INVITE_REJECTED`, `USER_LOGIN`, `USER_ROLE_CHANGED`, `RESOURCE_CREATED`, `RESOURCE_DELETED`, `AI_TASK_EXECUTED`
  - `targetType` (`String?`), `targetId` (`String?`)
  - `metadata` (`String?`) — JSON details
  - `ipAddress` (`String?`)
  - `createdAt` (`DateTime @default(now())`)

### 2.2 Workspace, Resource Graph, Tags & Multimodal Annotations
- **`Workspace`**
  - `id` (`String @id @default(cuid())`)
  - `slug` (`String @unique`) — e.g. `powlowskijoshuah-cq1od1`
  - `name` (`String`)
  - `type` (`String @default("personal")`) — `"personal" | "team"`
  - `planTier` (`String @default("free")`) — `"free" | "pro" | "max" | "teams"`
  - `referralCode` (`String @unique`)
  - `storageUsedBytes` (`Int @default(0)`)
  - `storageLimitBytes` (`Int @default(1073741824)`)
  - `aiCreditsUsed` (`Int @default(0)`)
  - `aiCreditsLimit` (`Int @default(1000)`)
  - `ownerId` (`String`)
  - `settings` (`String?`) — JSON workspace settings (`autoRenameEnabled`, `aiProvider`, etc.)
  - `createdAt`, `updatedAt`
- **`Resource`**
  - `id` (`String @id @default(cuid())`)
  - `workspaceId` (`String`)
  - `parentId` (`String?`) — Self-relation for Spaces & nested folders
  - `root` (`String @default("SPACE")`) — `"SPACE" | "INBOX" | "PRIVATE"`
  - `kind` (`String`) — `"folder" | "notepad" | "canvas" | "link" | "document" | "image" | "video" | "audio" | "voice_note"`
  - `name` (`String`)
  - `description` (`String?`)
  - `mimeType` (`String`)
  - `extension` (`String?`)
  - `size` (`Int @default(0)`)
  - `url` (`String?`) — External URL or asset URL
  - `originUrl` (`String?`)
  - `thumbnail` (`String?`)
  - `cover` (`String?`)
  - `icon` (`String?`)
  - `content` (`String?`) — Rich Markdown / block document content
  - `data` (`String?`) — JSON payload (canvas nodes/edges, media duration, waveform peaks, PDF pages, color palette)
  - `isShared` (`Boolean @default(false)`)
  - `isPinned` (`Boolean @default(false)`)
  - `isLocked` (`Boolean @default(false)`)
  - `isPasswordProtected` (`Boolean @default(false)`)
  - `sharePermission` (`String @default("viewer")`)
  - `shareToken` (`String?`)
  - `createdById` (`String`)
  - `createdAt` (`DateTime @default(now())`)
  - `modifiedAt` (`DateTime @updatedAt`)
  - `deletedAt` (`DateTime?`) — Soft delete for `/bin` Trash
- **`Tag` & `ResourceTag`**
  - `Tag`: `id`, `workspaceId`, `name`, `color`, `createdAt`
  - `ResourceTag`: `id`, `resourceId`, `tagId` (`@@unique([resourceId, tagId])`)
- **`Comment`**
  - `id` (`String @id @default(cuid())`)
  - `resourceId` (`String`)
  - `authorId` (`String`)
  - `body` (`String`)
  - `timestamp` (`Float?`) — Audio/video timestamp anchor in seconds
  - `page` (`Int?`) — PDF page number anchor (`1..N`)
  - `pinX` (`Float?`) — Spatial horizontal coordinate (`0..100`%)
  - `pinY` (`Float?`) — Spatial vertical coordinate (`0..100`%)
  - `resolved` (`Boolean @default(false)`)
  - `createdAt`, `updatedAt`

### 2.3 AI Assistants, Actions, Chat Threads, Scheduled Tasks, Connections, Notifications & API Keys
- **`AiAgent`**
  - `id`, `workspaceId`, `name` (`Rue`), `emailAddress` (`rue.<user>@ai.fabric.so`), `personality` (`balanced`), `color` (`#45BAF9`), `shape` (`Int`), `instructions` (`String?`), `isDefault` (`Boolean @default(false)`)
- **`AiAction`**
  - `id`, `workspaceId`, `name`, `prompt`, `icon`, `isBuiltIn` (`Boolean @default(false)`), `createdAt`
- **`AiChatThread` & `AiChatMessage`**
  - Contextual chat threads (`workspaceId`, `agentId`, `resourceId?`, `model`, `title`) and messages (`role`, `content`, `citations` JSON, `createdAt`).
- **`AiTask` (Scheduled AI Agents / Tasks)**
  - `id`, `workspaceId`, `name`, `instructions`, `frequency` (`manual | daily | weekly | monthly`), `day` (`String?`), `hour` (`String?`), `accessScope` (`all | selected`), `focusResourceIds` (`String?`), `personality` (`String @default("balanced")`), `status` (`active | paused | draft`), `lastRunAt` (`DateTime?`), `lastResultResourceId` (`String?`), `createdAt`, `updatedAt`
- **`Connection`**
  - `id`, `workspaceId`, `provider` (`google-drive`, `notion`, `gmail`, `slack`, `github`, `linear`, `figma`, `dropbox`, `onedrive`, `readwise`, `twitter`, `raindrop`, `mcp`), `name`, `category` (`app | importer | mcp`), `status` (`connected | disconnected`), `syncedCount` (`Int @default(0)`), `lastSyncedAt` (`DateTime?`), `config` (`String?`)
- **`Notification`**
  - `id`, `workspaceId`, `userId`, `title`, `body`, `type`, `linkUrl`, `isRead` (`Boolean @default(false)`), `createdAt`
- **`ApiKey`**
  - `id`, `workspaceId`, `userId`, `name`, `keyPrefix`, `keyHash`, `lastUsedAt`, `createdAt`
