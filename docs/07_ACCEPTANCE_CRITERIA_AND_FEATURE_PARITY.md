# 07. Acceptance Criteria and Feature-Parity Matrix

## 1. Feature-Parity Matrix (`https://fabric.so` vs Local Implementation)

| Feature Domain | `https://fabric.so` Observed Capability | Local Implementation Status & Parity Details |
|---|---|---|
| **Authentication & Admission** | `/signin`, `/signup`, `/reset-password` | Full parity + **Invite-Only Admission** (`FBRC-XXXX-XXXX-XXXX` single-use/expiring codes, SHA-256 token hashing, `Admin`/`Editor`/`Viewer` RBAC, revocation, `AuditLog`, CLI bootstrap `npm run bootstrap:admin`) |
| **5-Step Onboarding Wizard** | `/onboard/profile` (Workspace type -> Use cases -> Customize `Rue` -> Attribution -> Plan tier) | Full 5-step interactive wizard saving preferences, customizing `Rue` (name, color, shape, personality), and redirecting to `/[workspaceSlug]/get-started` |
| **Left Navigation Rail** | Collapsible rail with Workspace switcher, `+`, `Get started`, `Timeline`, `Spaces`, `Connections`, `Chats`, `Tasks`, `Tags`, `Shared with me`, `Marketplace`, `Notifications`, `Trash`, `Settings` | 1:1 navigation structure, collapsible rail, keyboard shortcuts, and mobile/tablet responsive drawer |
| **Floating Bottom Action Bar** | `+` Create menu (`Note`, `Canvas`, `Meeting or voice note`, `Upload`, `Link`, `Create new space`), `Search` (`Cmd+K`), `Assistant` drawer toggle | 1:1 floating bar with all 6 creation flows, global semantic/color/filter search modal, and `Rue` Assistant toggle |
| **View Modes & Sorting** | `Grid`, `Masonry`, `List`, `Compact` + Thumbnail size slider + Card details toggles + Sort by `Date added`, `Name`, `Last modified`, `Size`, `Kind` | All 4 view modes, thumbnail size control, card metadata toggles, and 5 sort fields with asc/desc direction |
| **Rich Note Editor (`?expandedFdocId`)** | Rich blocks, cover header, tags, description, and `/` slash menu (`AI`, `Heading 1-3`, `Lists`, `To-do`, `Quote`, `Callout`, `Code`, `Divider`, `Table`) | Full rich editor with interactive `/` slash command menu, AI inline generation, auto-saving, tags, and cover banner |
| **Spatial Canvas (`?expandedFdocId`)** | Infinite whiteboard with Select, Pan, Add resource, Sticky note, Text, Shapes, Connectors, Zoom | Interactive pan/zoom canvas with draggable cards, sticky notes, embedded workspace resources, connectors, and persistence |
| **Audio & Voice Note Player** | Waveform player with `-10s/+10s`, speed (`0.5x–2x`), loop, recorder, and timestamped comments (`Comment at 00:00`) | Interactive waveform player + live browser Voice Note recorder + timestamped waveform comment pins |
| **PDF, Video & Image Viewers** | Multi-page PDF viewer, HD Video player, Zoomable Image viewer with spatial `(x, y, page)` pins & timeline markers | Interactive PDF page viewer, Video player, and Zoomable Image viewer with click-to-place numbered spatial pins & timestamp anchors |
| **AI Assistant (`Rue`) & Actions** | Pluggable models (`Auto`, `GPT-6 Sol`, `GPT-5.6 Terra`, `GPT-5.6 Luna`, `Gemini 4 Argon`, `Grok 4.7`) + 8 built-in Actions + custom actions | Powered by pluggable `@github/copilot-sdk` default + `AzureOpenAIProvider` adapter, with model selector, 8 built-in actions, custom actions, and resource citations |
| **Scheduled AI Tasks / Agents** | `/tasks` (`All`, `Active`, `Paused`, `Drafts`) + `New AI Agent` drawer (schedule, scope, personality, instructions) | Full `/tasks` page, `New AI Agent` drawer, status filters, and `Run now` execution generating workspace report notes |
| **Settings (12 Sub-pages + Admin)** | `Account`, `Usage and Billing`, `Preferences`, `Automatic renaming`, `Your AIs`, `Your Actions`, `Import`, `Export`, `Keyboard shortcuts`, `Invite a friend`, `Redeem or gift`, `API keys` | All 12 Settings sub-pages implemented + **Admin Governance (`Invitations`, `Users & Roles`, `Audit Logs`)** |

---

## 2. Acceptance Criteria Checklist

- [ ] **AC-1 (Invite-Only Security)**: Uninvited registration attempts on `/signup` or `/api/auth/register` are rejected (`403`). Valid single-use invitation codes succeed once, assign the configured role (`Admin`, `Editor`, `Viewer`), cannot be reused, cannot be used if expired or revoked, and record `AuditLog` entries.
- [ ] **AC-2 (CLI Admin Bootstrap)**: Running `npm run bootstrap:admin` provisions the initial Admin account and sample invitation codes without exposing any public HTTP bootstrap endpoint.
- [ ] **AC-3 (Dual Database Support)**: Local development runs cleanly against SQLite (`prisma/schema.prisma`), and production schema (`prisma/schema.postgres.prisma`) + driver adapter (`@prisma/adapter-pg`) are ready for PostgreSQL.
- [ ] **AC-4 (Pluggable AI Layer)**: `src/lib/ai/` implements `@github/copilot-sdk` as default provider and `azure-openai` as pluggable provider, switchable via `AI_PROVIDER` environment variable or workspace settings.
- [ ] **AC-5 (Multimodal Resource Lifecycle)**: Users can create, view, edit, tag, search, comment on (with spatial pins and timestamps), share, soft-delete to `/bin`, and restore Notes, Canvases, Links, Voice Notes, Uploads, PDFs, Videos, Audio, Images, and Spaces.
- [ ] **AC-6 (End-to-End Verification)**: All pages, modals, settings tabs, RBAC flows, and AI capabilities pass automated Playwright E2E tests.
