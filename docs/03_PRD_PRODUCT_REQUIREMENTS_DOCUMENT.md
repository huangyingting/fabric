# 03. Product Requirements Document (PRD)

## 1. Product Vision & Overview

**Fabric Workspace** is an AI-native self-organizing workspace and second brain that unifies notes, spatial canvases, web links, PDFs, images, audio/voice notes, videos, and external app connections into one searchable knowledge graph powered by a customizable AI assistant (**Rue**) and scheduled AI agents. Access is governed by an enterprise-grade **invite-only admission and role-based access control (RBAC)** system.

---

## 2. User Roles & Personas

1. **Admin (`Admin`)**
   - Full access to all workspace features plus the **Admin Governance Console** (creating single-use/expiring invitation codes, revoking pending invitations, changing user roles, and inspecting the security audit log).
2. **Editor (`Editor`)**
   - Standard invited user who can complete onboarding, manage spaces, create/edit/delete resources, annotate media, configure their AI assistant (`Rue`), create custom AI actions, and run scheduled AI tasks/agents.
3. **Viewer (`Viewer`)**
   - Read-only collaborator who can browse spaces, view resources, use search, and read comments/annotations, while mutating API endpoints enforce role-based restrictions.

---

## 3. Core Functional Requirements

### FR-1: Invite-Only Authentication & Onboarding
- **FR-1.1**: Public registration (`/signup`) requires a valid, unrevoked, unexpired, single-use invitation code (`FBRC-XXXX-XXXX-XXXX`).
- **FR-1.2**: Users sign in via `/signin` with Email + Password (`NextAuth` Credentials provider) and can change their password from Settings.
- **FR-1.3**: First-time users are guided through the 5-step **Onboarding Wizard** (`/onboard/profile`):
  1. Workspace Type (`Personal workspace` vs `Team workspace`)
  2. Use-Case Selection (`Organize projects`, `Take notes`, `Save links & articles`, `AI research`, `Design moodboards`, `Archive documents`)
  3. Customize AI Assistant (`Name` default `Rue`, Avatar color & shape, Personality: `Balanced`, `Warm`, `Direct`, `Concise`, `Sassy`)
  4. Attribution Survey
  5. Plan Tier Overview (`Continue with free plan` or upgrade preview)

### FR-2: Unified Navigation & Workspace Shell
- **FR-2.1**: Collapsible left navigation rail (`/[workspaceSlug]/*`) with:
  - Workspace Switcher + Plan badge (`Fabric Free` / `Pro`) + `Upgrade` CTA
  - `+ Create new` button
  - `Get started` interactive onboarding checklist (`/get-started`)
  - `Home` dashboard (`/home`) with time-of-day greeting, quick filters, Spaces row, and Recent resources
  - `Timeline` (`/timeline`) with `My activity` / `All activity` and `Recent files` / `Activity feed` views
  - `Spaces` (`/spaces` and `/spaces/[spaceId]`) with nested folders, custom cover banners, icons, and 4 view modes (`Grid`, `Masonry`, `List`, `Compact`) + thumbnail size slider & card detail toggles
  - `Inbox` (`/inbox`) quick-capture folder
  - `Connections` (`/connections`) with 12 app integrations (`Google Drive`, `Notion`, `Gmail`, `Slack`, `Dropbox`, `OneDrive`, `GitHub`, `Linear`, `Figma`, `Readwise`, `X / Twitter`, `Raindrop`), file importers, and MCP server connectors
  - `Chats` (`/chats`) persistent AI chat thread history
  - `Tasks` (`/tasks`) scheduled AI Agents & recurring workflows (`All`, `Active`, `Paused`, `Drafts`)
  - `Tags` (`/tags`) color-coded tags with resource counts and tag filtering
  - `Shared with me` (`/shared-with-me`)
  - `Fabric Marketplace` (`/marketplace` & `/marketplace/import`)
  - `Notifications` (`/notifications`) with unread badges and mark-all-read
  - `Trash` (`/bin`) soft-deleted resources with Restore and Permanent Delete / Empty Trash
  - `Settings` (`/settings/*`) with all 12 Fabric settings tabs + **Admin Invitations & Audit Log** tab
- **FR-2.2**: Floating Bottom Action Bar on workspace views:
  - `+` Create Menu (`Note`, `Canvas`, `Meeting or voice note`, `Upload`, `Link`, `Create new space`)
  - `🔍 Search` (`Cmd+K` semantic + keyword + color + kind filter modal)
  - `Rue Assistant` toggle button opening the right-hand contextual AI drawer

### FR-3: Multi-Modal Resource Viewers & Editors (`?expandedFdocId=<id>`)
- **FR-3.1**: **Rich Note Editor (`notepad`)** with title, cover banner, tags, description, Markdown/block editing, and interactive `/` slash command menu (`Ask AI`, `Summarize`, `Continue writing`, `Heading 1/2/3`, `Bullet list`, `Numbered list`, `To-do list`, `Quote`, `Callout`, `Code block`, `Divider`, `Table`).
- **FR-3.2**: **Spatial Canvas Editor (`canvas`)** with pan/zoom infinite board, sticky notes, text blocks, embedded workspace resources, shapes, and connector edges.
- **FR-3.3**: **Audio & Voice Note Player (`audio`, `voice_note`)** with interactive waveform visualization, play/pause, `-10s/+10s` skip, playback speed (`0.5x`–`2x`), loop toggle, transcript view, and timestamped comments (`Comment at MM:SS`).
- **FR-3.4**: **Video Player (`video`)** with playback controls, timeline comment markers (`MM:SS`), and click-to-pin 2D frame annotations (`x, y`).
- **FR-3.5**: **Multi-Page PDF Viewer (`document`)** & **Image Viewer (`image`)** with zoom/fit controls, page navigation, and numbered spatial pin annotations (`x, y, page`) synced with the right-hand `Comments` thread list.
- **FR-3.6**: **Right-Hand Resource Inspector** with 3 tabs (`Rue AI Chat`, `Comments`, `Info / Details`) plus `Share / Publish` popover (public share link toggle, password protection toggle, permission selector).

### FR-4: Pluggable AI Capability (`@github/copilot-sdk` + Azure OpenAI)
- **FR-4.1**: Pluggable backend AI engine supporting `@github/copilot-sdk` (`copilot-sdk`) by default and switchable to `azure-openai` via configuration or UI settings.
- **FR-4.2**: Model selector in the AI Assistant (`Auto`, `GPT-6 Sol`, `GPT-5.6 Terra`, `GPT-5.6 Luna`, `Gemini 4 Argon`, `Grok 4.7`).
- **FR-4.3**: 8 built-in AI Actions (`Summarize`, `List points`, `Explain like I'm five`, `Tidy up formatting`, `Tweet`, `To-do list`, `Email`, `Compact`) plus user-created Custom Actions in `/settings/your-actions`.
- **FR-4.4**: Automatic AI file renaming & auto-tagging configurable in `/settings/automatic-renaming`.
- **FR-4.5**: Scheduled AI Agents (`/tasks`) that can be executed on demand (`Run now`) or on a schedule (`Daily`, `Weekly`, `Monthly`) against workspace resources and store generated output notes/reports in the workspace.
