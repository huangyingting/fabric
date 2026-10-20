# 01. Exploration and Coverage Report (`https://fabric.so`)

## 1. Executive Summary

Using Playwright with authenticated session cookies from `/home/azadmin/fabric/.cred`, we performed an exhaustive, systematic exploration of `https://fabric.so` across **127 Next.js routes** (`_buildManifest.js`), **32+ `/v2/*` REST & Socket.IO endpoints** (`https://api.fabric.so`), and **80+ captured screenshots** (`/home/azadmin/fabric/screenshots/`).

During exploration we:
1. Inspected public and unauthenticated flows (`/signin`, `/signup`, `/reset-password`, `/pricing`, `/marketplace`, `/marketplace/connections`, `/marketplace/templates`).
2. Completed the 5-step authenticated onboarding state machine (`/onboard/profile` -> Personal Workspace creation -> Use-case survey -> Assistant customization -> Attribution survey -> Plan selection -> Workspace redirection), provisioning workspace `powlowskijoshuah-cq1od1` (`id: 679880d3-aabd-4197-9daa-850cb934abb3`) and default AI assistant `Rue` (`rue.joshuah@ai.fabric.so`).
3. Explored every authenticated workspace section (`Get started`, `Home`, `Timeline`, `Spaces`, `Inbox`, `Connections`, `Chats`, `Tasks`, `Tags`, `Shared with me`, `Notifications`, `Trash / Bin`, `Fabric Marketplace`, and all 12 `Settings` sub-pages).
4. Exercised all resource viewers and editors via `?expandedFdocId=<id>` (`Rich Note` with `/` slash commands, `Spatial Canvas`, `Audio` waveform player with timestamped comments, `Video` player with spatial + timestamped comments, `PDF` multi-page viewer with spatial pins, `Image` viewer with spatial pins, `Voice / Meeting Note` recorder, and `Web Link` clipper).
5. Verified responsive layouts at Desktop (`1440x900`), Tablet (`768x1024`), and Mobile (`390x844`) viewports, plus edge/error states (`/smart-collections` 404 screen).

---

## 2. Route & Screenshot Coverage Matrix

| ID | Category | Route / URL Pattern | Screenshot(s) | Observed Behavior & Key Components |
|---|---|---|---|---|
| 01 | Auth / Entry | `https://fabric.so/` | `00_probe_fabric_so.png` | Redirects authenticated incomplete user to `/onboard/profile` or active workspace `/[workspaceSlug]/home` |
| 02 | Public Auth | `/signin`, `/signup`, `/reset-password` | `02_route_signin.png`, `03_route_signup.png`, `04_route_reset_password.png` | Google, Apple, Microsoft OAuth + Email/Password credentials login & registration |
| 03 | Onboarding Step 1 | `/onboard/profile` (Select Type) | `01_route_onboard_profile.png` | Choose **Personal workspace** vs **Team workspace** |
| 04 | Onboarding Step 2 | `/onboard/profile` (Use Cases) | `12_onboard_step1_personal.png`, `13_onboard_step2_survey.png` | Multi-select pills (`Organize projects`, `Take notes`, `Save links & articles`, `AI research`, etc.) |
| 05 | Onboarding Step 3 | `/onboard/profile` (Assistant) | `20_onboard_step3_assistant.png` | Customize AI Assistant name (`Rue`), avatar shape (`1..12`), color (`#45BAF9`), cheeks, and personality (`Balanced`, `Warm`, `Direct`, `Concise`, `Sassy`) |
| 06 | Onboarding Step 4 | `/onboard/profile` (Attribution) | `21_onboard_after_assistant.png` | Attribution survey (`YouTube`, `Search engine`, `Friend or colleague`, `Social media`, etc.) |
| 07 | Onboarding Step 5 | `/onboard/profile` (Plan Offer) | `22_onboard_step5.png`, `23_onboard_step6.png` | Trial / Pro plan upsell with `Continue with free plan` action -> redirects to `/[workspaceSlug]/get-started` |
| 08 | Workspace Onboarding | `/[workspaceSlug]/get-started` | `30_workspace_landing.png`, `31_get_started.png` | Interactive checklist (`Explore your Fabric brain`, `Apps & sources`, `Create your first note`, `Ask your AI assistant`, `Install extension / mobile app`) |
| 09 | Workspace Home | `/[workspaceSlug]/home` | `32_home.png`, `33_home_sidebar_expanded.png` | Time-aware greeting (`Up late, <Name>`), quick filter pills (`Tags`, `Connections`, `Shared with me`), resource grid (`Spaces`, `Recent files`), floating bottom bar (`+`, `Search`, `Assistant`) |
| 10 | Global Create Menu | `/[workspaceSlug]/home` (`+` button) | `34_home_create_menu.png` | Popover with `Note`, `Canvas`, `Meeting or voice note`, `Upload`, `Link`, `Create new space` |
| 11 | Global Search & AI | `/[workspaceSlug]/home` (`Search` / `Cmd+K`) | `35_home_search_assistant.png` | Semantic + keyword + color palette search across workspace & connected apps, plus `Ask AI` tab |
| 12 | Timeline | `/[workspaceSlug]/timeline` | `36_timeline.png` | Activity stream with `My activity` / `All activity` and `Recent files` / `Activity feed` toggles |
| 13 | Spaces Index | `/[workspaceSlug]/spaces` | `37_spaces.png` | Grid/List of root folders (`Example space`, `Inbox`, custom spaces) with item counts & `New space` CTA |
| 14 | Space Detail & View Modes | `/[workspaceSlug]/spaces/[spaceId]` | `38_space_example.png`, `62_example_space_grid.png`, `63_example_space_view_menu.png`, `64_example_space_list_view.png` | Cover image banner, title, description, sort menu (`Date added`, `Name`, `Last modified`, `Size`, `Kind`), View Mode selector (`Grid`, `Masonry`, `List`, `Compact`, thumbnail slider, card metadata toggles) |
| 15 | Connections | `/[workspaceSlug]/connections` | `39_connections.png` | Live connectors (`Google Drive`, `Notion`, `Gmail`, `Slack`, `Dropbox`, `OneDrive`, `GitHub`, `Linear`, `Figma`, `Readwise`, `X/Twitter`, `Raindrop`) + Importers + Custom MCP servers |
| 16 | Scheduled AI Tasks & Agents | `/[workspaceSlug]/tasks` | `40_tasks.png`, `76_tasks_create_modal.png` | Status tabs (`All`, `Active`, `Paused`, `Drafts`), `New AI Agent` drawer (Avatar, Name, Instructions, Schedule: Manual/Daily/Weekly/Monthly, Content Access Scope, Personality, Email inbox toggle) |
| 17 | Tags | `/[workspaceSlug]/tags` | `41_tags.png`, `77_tags_page.png` | Searchable table of color-coded tags with resource counts, create/edit/delete tag actions |
| 18 | Shared With Me | `/[workspaceSlug]/shared-with-me` | `43_shared_with_me.png` | Resources and spaces shared by external or workspace collaborators |
| 19 | Inbox | `/[workspaceSlug]/inbox` | `44_inbox.png` | Quick-capture staging folder (`root: INBOX`) for unsorted notes, web clips, and emailed items |
| 20 | Notifications | `/[workspaceSlug]/notifications` | `45_notifications.png` | Workspace activity notifications (`All`, `Unread`) |
| 21 | Trash / Bin | `/[workspaceSlug]/bin` | `46_bin_trash.png` | Soft-deleted resources (`deletedAt != null`) with `My content` / `Shared with me` tabs, Restore & Empty Trash actions |
| 22 | Marketplace | `/[workspaceSlug]/marketplace`, `/marketplace/import` | `47_marketplace.png`, `56_marketplace_import.png` | Tabs for `Fabric apps` (Web Clipper, iOS, Android, macOS, Windows), `Connections`, `Templates`, and `Import to Fabric` (`Notion`, `Obsidian`, `Roam`, `Evernote`, `Raindrop`, `Pocket`, `Apple Notes`, `Bookmarks HTML`, `Files & Folders`) |
| 23 | Pricing & Plans | `/[workspaceSlug]/pricing` | `48_pricing.png` | Monthly / Yearly billing toggle, `Free`, `Pro`, `Max`, and `Teams` plan tiers |
| 24 | Settings (12 Sub-pages) | `/[workspaceSlug]/settings/*` | `50_settings_account.png` – `61_settings_api_keys.png` | `Account`, `Usage and Billing`, `Preferences`, `Automatic renaming`, `Your AIs`, `Your Actions`, `Import to Fabric`, `Export from Fabric`, `Keyboard shortcuts`, `Invite a friend`, `Redeem or gift Fabric`, `API keys` |
| 25 | Rich Note Viewer & Slash Menu | `?expandedFdocId=<noteId>` | `65_resource_note_welcome.png`, `67_resource_note_quote.png`, `75_create_note.png`, `88_note_slash_commands.png` | Split-screen overlay: Rich block editor on left (`/` slash menu for AI, Headings, Lists, Callout, Code, Quote, Table, Divider, Resource embed) + `Rue` AI Chat / Comments / Info sidebar on right |
| 26 | Spatial Canvas Editor | `?expandedFdocId=<canvasId>` | `74_create_canvas.png` | Infinite pan/zoom whiteboard with Select, Pan, Add workspace resource, Sticky Note, Text, Shapes, Connector arrows, and contextual AI panel |
| 27 | Audio Waveform Player | `?expandedFdocId=<audioId>` | `66_resource_audio_viewer.png` | Interactive waveform scrub bar, playback speed (`0.5x`–`2x`), skip `-10s/+10s`, loop, and timestamp-linked comments (`Comment at 00:00`) |
| 28 | Multi-Page PDF Viewer | `?expandedFdocId=<pdfId>` | `68_resource_pdf_viewer.png` | Page navigation (`Page 1 of 11`), zoom controls, page thumbnails, and numbered spatial comment pins anchored to `(page, x, y)` coordinates |
| 29 | Video Player | `?expandedFdocId=<videoId>` | `69_resource_video_viewer.png` | HD video playback with timeline comment markers (`00:03`) and spatial frame pins (`x, y`) |
| 30 | Image Viewer | `?expandedFdocId=<imageId>` | `70_resource_image_viewer.png` | High-resolution zoomable canvas (`Fit`, `-`, `%`, `+`) with numbered spatial annotation pins |
| 31 | Voice / Meeting Recorder | Create -> `Meeting or voice note` | `73_create_voice_note.png` | Live audio recording widget with timer, waveform, pause/stop, and AI transcription + summary |
| 32 | AI Assistant Model & Action Menus | Assistant Right Drawer | `78_assistant_model_selector.png`, `79_assistant_actions_menu.png` | Model selector (`Auto`, `GPT-6 Sol`, `GPT-5.6 Terra`, `GPT-5.6 Luna`, `Gemini 4 Argon`, `Grok 4.7`) and 8 built-in AI Actions (`Summarize`, `List points`, `Explain like I'm five`, `Tidy up formatting`, `Tweet`, `To-do list`, `Email`, `Compact`) + custom actions |
| 33 | Edge / 404 Error State | `/[workspaceSlug]/smart-collections` | `42_smart_collections.png` | Branded 404 fallback (`404 - Page Not Found`, `Go to Home`) |
| 34 | Responsive Viewports | Tablet (`768x1024`) & Mobile (`390x844`) | `80_responsive_tablet_home.png` – `84_responsive_mobile_settings.png` | Collapsible drawer navigation on mobile/tablet, bottom action bar adaptation, single-column responsive cards |

---

## 3. Observed Backend API Architecture (`https://api.fabric.so/v2/*`)

Every authenticated API request includes cookies (`fbc_sess_live`, `fbc_sess_live:auth`) and the workspace context header `X-Fabric-Workspace: <workspaceSlug>`.

### Core Observed Endpoints
- **Identity & Session**:
  - `GET /v2/user/me` — User profile, onboarding flags (`hasFinishedWelcomeScreen`), plan features, preferences.
  - `GET /v2/workspaces` / `POST /v2/workspaces` — Workspace list and creation (`slug`, `name`, `type`, `planTier`, `referralCode`).
  - `GET /v2/subscriptions` & `GET /v2/workspaces/credits` — Storage bytes used/limit and AI credit balance.
- **Unified Resource Graph**:
  - `POST /v2/resources/filter` — Cursor-paginated resource query supporting `parentId`, `root` (`SPACE`, `INBOX`, `PRIVATE`), `kinds[]`, `tagIds[]`, `isShared`, `trashed`, `search`, `order` (`{ property, direction }`).
  - `POST /v2/resources` / `GET /v2/resources/{id}` / `PATCH /v2/resources/{id}` / `DELETE /v2/resources/{id}` — Polymorphic CRUD across folders/spaces, notes (`notepad`), canvases (`canvas`), links (`bookmark`), documents (`pdf`), images, videos, and audio files.
  - `POST /v2/notepad` / `GET /v2/notepad/{id}` — Rich document block storage and real-time sync.
- **Annotations & Comments**:
  - `GET /v2/comments?resourceId={id}` / `POST /v2/comments` — Supports thread replies, timestamp anchors (`timestamp` in seconds for audio/video), page anchors (`page` for PDF), and spatial 2D coordinates (`x`, `y` normalized `0..1` for images/videos/PDFs/canvases).
- **AI Assistant, Models, Prompts & Scheduled Agents**:
  - `GET /v2/agents` / `POST /v2/agents` / `PATCH /v2/agents/{id}` — Custom and default AI personas (`Rue`) and scheduled background agents (`frequency`, `day`, `hour`, `prompt`, `focusResourceIds`, `accessResourceIds`).
  - `GET /v2/chatbot/models` — Available LLM models (`auto`, `gpt-6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gemini-4-argon`, `grok-4.7`).
  - `GET /v2/chatbot/prompts` / `POST /v2/chatbot/prompts` — Built-in and user-defined AI quick actions.
  - `POST /v2/chatbot/threads` / `POST /v2/chatbot/messages` — Contextual multi-turn AI chat scoped to the active resource (`focusResourceIds`), space, or entire workspace.
- **Tags, Connections, Notifications & API Keys**:
  - `GET /v2/tags` / `POST /v2/tags` / `DELETE /v2/tags/{id}`
  - `GET /v2/connections` / `POST /v2/connections`
  - `GET /v2/notifications` / `PATCH /v2/notifications/read-all`
  - `GET /v2/api-keys` / `POST /v2/api-keys` / `DELETE /v2/api-keys/{id}`
