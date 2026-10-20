import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@fabric.local';
const ADMIN_PASSWORD = 'AdminPassword123!';
const WORKSPACE_SLUG = 'powlowskijoshuah-cq1od1';

test.describe('Fabric Application — Full Feature & Combination E2E Verification', () => {
  test('1. Public routes, Pricing, Marketplace, Reset Password, 404 & Auth Error states', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByTestId('public-pricing-page')).toBeVisible();
    await expect(page.getByText('Simple, transparent pricing')).toBeVisible();

    await page.goto('/marketplace');
    await expect(page.getByTestId('public-marketplace-page')).toBeVisible();

    await page.goto('/reset-password');
    await expect(page.getByText('Reset your password')).toBeVisible();
    await page.locator('input[type="email"]').fill('user@fabric.local');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Password reset instructions queued')).toBeVisible();

    await page.goto('/unknown/route/404-page-check');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    // Invalid sign-in error state
    await page.goto('/signin');
    await page.getByTestId('signin-email').fill('wrong@fabric.local');
    await page.getByTestId('signin-password').fill('WrongPassword!');
    await page.getByTestId('signin-submit').click();
    await expect(page.getByTestId('signin-error')).toBeVisible();

    // Invalid invitation code error state on /signup
    await page.goto('/signup');
    await page.getByTestId('signup-invite-code').fill('FBRC-INVALID-0000');
    await page.getByTestId('validate-invite-btn').click();
    await expect(page.getByTestId('invite-validation-status')).toContainText(/invalid/i);
  });

  test('2. Admin Login, Invite-Only Code Generation, Revocation, Single-Use Registration & 5-Step Onboarding Wizard', async ({
    browser,
  }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Sign in as bootstrap Admin
    await adminPage.goto('/signin');
    await adminPage.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await adminPage.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await adminPage.getByTestId('signin-submit').click();
    await adminPage.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    // Navigate to Admin Invitations Settings
    await adminPage.goto(`/${WORKSPACE_SLUG}/settings/invitations`);
    await expect(adminPage.getByTestId('admin-invitations-panel')).toBeVisible();

    // 2a. Generate a code and immediately REVOKE it
    await adminPage.getByTestId('invite-role-select').selectOption('Viewer');
    await adminPage.getByTestId('generate-invite-btn').click();
    await expect(adminPage.getByTestId('generated-invite-code-value')).toBeVisible();
    const revokedCode = (await adminPage.getByTestId('generated-invite-code-value').innerText()).trim();

    // Revoke the top pending invitation row
    const revokeButtons = adminPage.locator('[data-testid^="revoke-invite-"]');
    await revokeButtons.first().click();

    // 2b. Generate a fresh Editor single-use code for our new user registration
    await adminPage.getByTestId('invite-role-select').selectOption('Editor');
    await adminPage.getByTestId('generate-invite-btn').click();
    await expect(adminPage.getByTestId('generated-invite-code-value')).not.toHaveText(revokedCode);
    const validEditorCode = (await adminPage.getByTestId('generated-invite-code-value').innerText()).trim();
    expect(validEditorCode).toMatch(/^FBRC-/);

    // 2c. Open a separate browser context for New User Signup
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();

    // Verify revoked code is rejected
    await userPage.goto('/signup');
    await userPage.getByTestId('signup-invite-code').fill(revokedCode);
    await userPage.getByTestId('validate-invite-btn').click();
    await expect(userPage.getByTestId('invite-validation-status')).toContainText(/revoked/i);

    // Register with valid single-use Editor code
    const uniqueEmail = `editor.${Date.now()}@fabric.local`;
    await userPage.getByTestId('signup-invite-code').fill(validEditorCode);
    await userPage.getByTestId('validate-invite-btn').click();
    await expect(userPage.getByTestId('invite-validation-status')).toContainText(/valid/i);

    await userPage.getByTestId('signup-name').fill('Alex Rivera');
    await userPage.getByTestId('signup-email').fill(uniqueEmail);
    await userPage.getByTestId('signup-password').fill('EditorPass123!');
    await userPage.getByTestId('signup-submit').click();

    // 2d. Walk through all 5 steps of `/onboard/profile`
    await userPage.waitForURL('**/onboard/profile**');
    // Step 1: Personal vs Team workspace
    await expect(userPage.getByTestId('onboard-step-1')).toBeVisible();
    await userPage.getByTestId('onboard-personal-btn').click();
    await userPage.getByTestId('onboard-next-1').click();
    // Step 2: Use cases
    await expect(userPage.getByTestId('onboard-step-2')).toBeVisible();
    await userPage.getByTestId('onboard-next-2').click();
    // Step 3: Meet your AI assistant
    await expect(userPage.getByTestId('onboard-step-3')).toBeVisible();
    await userPage.getByTestId('onboard-assistant-name').fill('Rue');
    await userPage.getByTestId('onboard-next-3').click();
    // Step 4: Attribution
    await expect(userPage.getByTestId('onboard-step-4')).toBeVisible();
    await userPage.getByTestId('onboard-next-4').click();
    // Step 5: Plan tier selection & workspace provisioning
    await expect(userPage.getByTestId('onboard-step-5')).toBeVisible();
    await userPage.getByTestId('onboard-finish-btn').click();

    await userPage.waitForURL('**/get-started**');
    await expect(userPage.getByTestId('get-started-page')).toBeVisible();
    await expect(userPage.getByTestId('user-role-badge')).toContainText('Editor');

    // 2e. Verify single-use code cannot be reused a second time
    const thirdContext = await browser.newContext();
    const thirdPage = await thirdContext.newPage();
    await thirdPage.goto('/signup');
    await thirdPage.getByTestId('signup-invite-code').fill(validEditorCode);
    await thirdPage.getByTestId('validate-invite-btn').click();
    await expect(thirdPage.getByTestId('invite-validation-status')).toContainText(/already|used|invalid/i);

    await thirdContext.close();
    await userContext.close();
    await adminContext.close();
  });

  test('3. Workspace Navigation, All 4 View Modes, Multimodal Viewers (?expandedFdocId), Slash Commands & Create Flows', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await page.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('signin-submit').click();
    await page.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    // Home page & all 4 View Modes (Grid, Masonry, List, Compact)
    await page.goto(`/${WORKSPACE_SLUG}/home`);
    await expect(page.getByTestId('workspace-home-page')).toBeVisible();

    await page.getByTestId('view-mode-button').click();
    for (const mode of ['masonry', 'list', 'compact', 'grid'] as const) {
      await page.getByTestId(`view-option-${mode}`).click();
      await expect(page.getByTestId(`resource-view-${mode}`)).toBeVisible();
    }
    await page.getByTestId('view-mode-button').click();

    // Open Example space & verify multimodal resources
    await page.getByTestId('nav-spaces').click();
    await expect(page.getByTestId('spaces-page')).toBeVisible();
    await page.locator('[data-testid^="space-directory-card-"]').first().click();
    await expect(page.getByTestId('space-detail-page')).toBeVisible();

    // Open the first resource in ?expandedFdocId=<id> modal
    await page.locator('[data-testid^="resource-card-"]').first().click();
    await expect(page.getByTestId('expanded-resource-modal')).toBeVisible();
    expect(page.url()).toContain('expandedFdocId=');

    // Test right-hand panel tabs (AI Assistant, Comments, Info) & Share popover
    await page.getByTestId('viewer-tab-comments').click();
    await page.getByTestId('comment-input').fill('Verified spatial & timestamped comment from Playwright E2E');
    await page.getByTestId('comment-submit').click();
    await expect(page.getByText('Verified spatial & timestamped comment from Playwright E2E').first()).toBeVisible();

    await page.getByTestId('viewer-tab-info').click();
    await expect(page.getByTestId('inspector-info-panel')).toBeVisible();

    await page.getByTestId('viewer-share-btn').click();
    await expect(page.getByTestId('viewer-share-popover')).toBeVisible();

    await page.getByTestId('close-expanded-resource').click();
    await expect(page.getByTestId('expanded-resource-modal')).toBeHidden();

    // Create a Note from bottom floating bar & test `/` slash command menu
    await page.getByTestId('bottom-create-btn').click();
    await expect(page.getByTestId('create-menu-popover')).toBeVisible();
    await page.getByTestId('create-option-note').click();
    await expect(page.getByTestId('expanded-resource-modal')).toBeVisible();
    await expect(page.getByTestId('note-content-textarea')).toBeVisible();
    await page.getByTestId('open-slash-menu-btn').click();
    await expect(page.getByTestId('slash-command-menu')).toBeVisible();
    await page.getByTestId('slash-cmd-h1').click();
    await page.getByTestId('close-expanded-resource').click();

    // Create a Spatial Canvas from bottom floating bar & add a canvas node
    await page.getByTestId('bottom-create-btn').click();
    await page.getByTestId('create-option-canvas').click();
    await expect(page.getByTestId('canvas-editor')).toBeVisible();
    await page.getByTestId('canvas-add-sticky').click();
    await page.getByTestId('close-expanded-resource').click();

    // Create a Web Link via modal
    await page.getByTestId('bottom-create-btn').click();
    await page.getByTestId('create-option-link').click();
    await expect(page.getByTestId('create-link-modal')).toBeVisible();
    await page.getByTestId('link-url-input').fill('https://github.com/features/copilot');
    await page.getByTestId('link-title-input').fill('GitHub Copilot Official');
    await page.getByTestId('save-link-submit').click();
    await expect(page.getByTestId('expanded-resource-modal')).toBeVisible();
    await page.getByTestId('close-expanded-resource').click();

    // Global Search modal (Cmd+K / bottom-search-btn)
    await page.getByTestId('bottom-search-btn').click();
    await expect(page.getByTestId('global-search-modal')).toBeVisible();
    await page.getByTestId('global-search-input').fill('Copilot');
    await expect(page.locator('[data-testid^="search-result-"]').first()).toBeVisible();
    await page.getByTestId('close-search-modal').click();
  });

  test('4. Pluggable AI Assistant (Copilot SDK & Azure OpenAI), AI Actions, Scheduled AI Agents & All Workspace Routes', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await page.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('signin-submit').click();
    await page.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    // Open Rue AI Assistant Drawer & switch between Copilot SDK and Azure OpenAI
    await page.getByTestId('bottom-assistant-btn').click();
    await expect(page.getByTestId('rue-assistant-drawer')).toBeVisible();

    await page.getByTestId('assistant-model-selector-btn').click();
    await expect(page.getByTestId('assistant-model-popover')).toBeVisible();
    await page.getByTestId('provider-azure-openai').click();
    await expect(page.getByTestId('active-ai-provider')).toContainText(/Azure OpenAI/i);
    await page.getByTestId('provider-copilot-sdk').click();
    await expect(page.getByTestId('active-ai-provider')).toContainText(/@github\/copilot-sdk/i);
    await page.getByTestId('assistant-model-selector-btn').click();

    // Send a prompt to Rue AI Assistant
    await page.getByTestId('assistant-chat-input').fill('Summarize key themes in my workspace.');
    await page.getByTestId('assistant-chat-send').click();
    await expect(page.getByTestId('assistant-messages')).toContainText('Summarize key themes');
    await page.getByTestId('close-assistant-drawer').click();

    // Visit Timeline, Inbox, Connections, Chats, Tasks, Tags, Shared with me, Marketplace, Notifications, Trash
    await page.getByTestId('nav-timeline').click();
    await expect(page.getByTestId('timeline-page')).toBeVisible();

    await page.getByTestId('nav-inbox').click();
    await expect(page.getByTestId('inbox-page')).toBeVisible();

    await page.getByTestId('nav-connections').click();
    await expect(page.getByTestId('connections-page')).toBeVisible();
    await page.locator('[data-testid^="connection-toggle-"]').first().click();

    await page.getByTestId('nav-chats').click();
    await expect(page.getByTestId('chats-page')).toBeVisible();

    // Scheduled AI Agents (Tasks): Create & Run Now
    await page.getByTestId('nav-tasks').click();
    await expect(page.getByTestId('tasks-page')).toBeVisible();
    await page.getByTestId('new-ai-agent-btn').click();
    await expect(page.getByTestId('new-ai-agent-drawer')).toBeVisible();
    await page.getByTestId('agent-title-input').fill('E2E Daily Synthesis Agent');
    await page.getByTestId('agent-prompt-input').fill('Synthesize all recent workspace notes and action items.');
    await page.getByTestId('save-ai-agent-submit').click();
    await expect(page.getByText('E2E Daily Synthesis Agent').first()).toBeVisible();

    // Click Run now on the first Scheduled AI Task
    await page.locator('[data-testid^="run-task-now-"]').first().click();
    await expect(page.getByTestId('agent-run-output-banner')).toBeVisible();

    // Tags page: Create a tag
    await page.getByTestId('nav-tags').click();
    await expect(page.getByTestId('tags-page')).toBeVisible();
    await page.getByTestId('new-tag-input').fill('e2e-verified');
    await page.getByTestId('create-tag-btn').click();
    await expect(page.getByTestId('tag-pill-e2e-verified')).toBeVisible();

    await page.getByTestId('nav-shared').click();
    await expect(page.getByTestId('shared-with-me-page')).toBeVisible();

    await page.getByTestId('nav-marketplace').click();
    await expect(page.getByTestId('marketplace-page')).toBeVisible();

    await page.getByTestId('nav-notifications').click();
    await expect(page.getByTestId('notifications-page')).toBeVisible();
    await page.getByTestId('mark-all-read-btn').click();

    await page.getByTestId('nav-bin').click();
    await expect(page.getByTestId('bin-page')).toBeVisible();
  });

  test('5. All 15 Settings & Admin Governance Sections + Responsive Mobile Drawer Layout', async ({ page }) => {
    await page.goto('/signin');
    await page.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await page.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('signin-submit').click();
    await page.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    const sections = [
      'account',
      'preferences',
      'ais',
      'ai-actions',
      'profile',
      'workspace',
      'members',
      'billing',
      'usage',
      'import',
      'mcp',
      'api-keys',
      'invitations',
      'users',
      'audit-logs',
    ];

    for (const sec of sections) {
      await page.goto(`/${WORKSPACE_SLUG}/settings/${sec}`);
      await expect(page.getByTestId(`settings-page-${sec}`)).toBeVisible();
    }

    // Generate an API key in api-keys section
    await page.goto(`/${WORKSPACE_SLUG}/settings/api-keys`);
    await page.getByTestId('api-key-name-input').fill('Playwright CLI Key');
    await page.getByTestId('create-api-key-btn').click();
    await expect(page.getByTestId('generated-api-key-banner')).toBeVisible();

    // Verify Audit Logs contain recorded actions
    await page.goto(`/${WORKSPACE_SLUG}/settings/audit-logs`);
    await expect(page.getByTestId('admin-audit-logs-panel')).toBeVisible();
    await expect(page.locator('[data-testid^="audit-log-entry-"]').first()).toBeVisible();

    // Verify Mobile Viewport (390x844) & Mobile Navigation Drawer
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${WORKSPACE_SLUG}/home`);
    await expect(page.getByTestId('mobile-menu-button')).toBeVisible();
    await page.getByTestId('mobile-menu-button').click();
    await expect(page.getByTestId('nav-spaces').last()).toBeVisible();
  });

  test('6. Multimodal Media Viewers (PDF, Video, Audio, Image), Trash/Restore Lifecycle & Viewer RBAC Read-Only Enforcement', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/signin');
    await page.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await page.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('signin-submit').click();
    await page.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    // Fetch workspace resources via API to inspect every canonical multimodal kind directly via ?expandedFdocId=<id>
    const resData = await page.evaluate(async (slug) => {
      const r = await fetch(`/api/resources?workspaceSlug=${slug}`);
      return r.json();
    }, WORKSPACE_SLUG);

    const resources: Array<{ id: string; kind: string; name: string }> = resData.resources || [];
    const pdfRes = resources.find((r) => r.kind === 'document');
    const videoRes = resources.find((r) => r.kind === 'video');
    const audioRes = resources.find((r) => r.kind === 'audio');
    const imageRes = resources.find((r) => r.kind === 'image');

    expect(pdfRes).toBeTruthy();
    expect(videoRes).toBeTruthy();
    expect(audioRes).toBeTruthy();
    expect(imageRes).toBeTruthy();

    // 6a. PDF Viewer + Multi-page navigation + Spatial Pin
    await page.goto(`/${WORKSPACE_SLUG}/home?expandedFdocId=${pdfRes!.id}`);
    await expect(page.getByTestId('pdf-viewer')).toBeVisible();
    await page.getByTestId('pdf-next-page').click();
    await expect(page.getByTestId('pdf-page-indicator')).toContainText('Page 2');

    // 6b. Video Viewer + Spatial/Timestamp surface
    await page.goto(`/${WORKSPACE_SLUG}/home?expandedFdocId=${videoRes!.id}`);
    await expect(page.getByTestId('video-viewer')).toBeVisible();
    await expect(page.getByTestId('video-frame-surface')).toBeVisible();

    // 6c. Audio Waveform Viewer + Play toggle
    await page.goto(`/${WORKSPACE_SLUG}/home?expandedFdocId=${audioRes!.id}`);
    await expect(page.getByTestId('audio-waveform-viewer')).toBeVisible();
    await expect(page.getByTestId('waveform-bars')).toBeVisible();
    await page.getByTestId('audio-play-toggle').click();

    // 6d. High-Res Image Viewer + Spatial Pin surface
    await page.goto(`/${WORKSPACE_SLUG}/home?expandedFdocId=${imageRes!.id}`);
    await expect(page.getByTestId('image-viewer')).toBeVisible();
    await expect(page.getByTestId('image-pin-surface')).toBeVisible();

    // 6e. Move a resource to Trash & Restore it from /bin
    await page.getByTestId('viewer-tab-info').click();
    await page.getByTestId('info-move-to-trash').click();
    await page.goto(`/${WORKSPACE_SLUG}/bin`);
    await expect(page.getByTestId('bin-page')).toBeVisible();
    await page.getByTestId(`restore-resource-${imageRes!.id}`).click();

    // 6f. Verify Viewer Role Read-Only Enforcement
    // Generate a Viewer invite code as Admin
    const viewerInvite = await page.evaluate(async () => {
      const r = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Viewer', expiresInHours: 48 }),
      });
      return r.json();
    });

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto('/signup');
    await viewerPage.getByTestId('signup-invite-code').fill(viewerInvite.rawCode);
    await viewerPage.getByTestId('signup-name').fill('ReadOnly Viewer');
    await viewerPage.getByTestId('signup-email').fill(`viewer.${Date.now()}@fabric.local`);
    await viewerPage.getByTestId('signup-password').fill('ViewerPass123!');
    await viewerPage.getByTestId('signup-submit').click();
    await viewerPage.waitForURL('**/onboard/profile**');

    // Attempt to create a resource or access Admin Invitations as Viewer -> 403 Forbidden
    const viewerWriteAttempt = await viewerPage.evaluate(async (slug) => {
      const createRes = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceSlug: slug, kind: 'notepad', name: 'Blocked Note' }),
      });
      const adminRes = await fetch('/api/admin/invitations');
      return { createStatus: createRes.status, adminStatus: adminRes.status };
    }, WORKSPACE_SLUG);

    expect(viewerWriteAttempt.createStatus).toBe(403);
    expect(viewerWriteAttempt.adminStatus).toBe(403);

    await viewerContext.close();
    await context.close();
  });

  test('7. Production Readiness: Healthcheck, Security Headers, Bearer API Key Auth, Multipart Upload, Public Share Gate & Account Revocation/Password Reset', async ({
    browser,
    request,
  }) => {
    // 7a. Healthcheck & Security Headers
    const healthRes = await request.get('/api/health');
    expect(healthRes.status()).toBe(200);
    expect(healthRes.headers()['x-content-type-options']).toBe('nosniff');
    expect(healthRes.headers()['x-frame-options']).toBe('SAMEORIGIN');
    const healthJson = await healthRes.json();
    expect(healthJson.status).toBe('ok');
    expect(healthJson.database.connected).toBe(true);

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/signin');
    await page.getByTestId('signin-email').fill(ADMIN_EMAIL);
    await page.getByTestId('signin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('signin-submit').click();
    await page.waitForURL(`**/${WORKSPACE_SLUG}/**`);

    // 7b. Personal API Key Generation & Bearer Authentication
    const apiKeyData = await page.evaluate(async () => {
      const r = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Production Automation Bearer Key' }),
      });
      return r.json();
    });
    expect(apiKeyData.rawKey).toMatch(/^fbrc_live_/);

    // Call /api/resources using ONLY the Bearer API Key (no session cookies)
    const bearerRes = await request.get(`/api/resources?workspaceSlug=${WORKSPACE_SLUG}`, {
      headers: { Authorization: `Bearer ${apiKeyData.rawKey}` },
    });
    expect(bearerRes.status()).toBe(200);
    const bearerJson = await bearerRes.json();
    expect(Array.isArray(bearerJson.resources)).toBe(true);
    expect(bearerJson.resources.length).toBeGreaterThan(0);

    // 7c. Multipart Binary File Upload via POST /api/uploads
    const uploadRes = await request.post('/api/uploads', {
      headers: { Authorization: `Bearer ${apiKeyData.rawKey}` },
      multipart: {
        workspaceSlug: WORKSPACE_SLUG,
        title: 'Production Architecture Runbook.md',
        file: {
          name: 'runbook.md',
          mimeType: 'text/markdown',
          buffer: Buffer.from('# Production Runbook\n\nVerified multipart binary upload and text indexing.'),
        },
      },
    });
    expect(uploadRes.status()).toBe(201);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.resource.url).toMatch(/^\/uploads\//);
    expect(uploadJson.resource.content).toContain('Verified multipart binary upload');

    // 7d. Public Share URL & Password Protection Gate
    const sharedResourceId = uploadJson.resource.id;
    const sharePatch = await page.evaluate(async (id) => {
      const r = await fetch(`/api/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: true,
          isPasswordProtected: true,
          sharePassword: 'secret-share-pass',
        }),
      });
      return r.json();
    }, sharedResourceId);
    const shareToken = sharePatch.resource.shareToken || sharedResourceId;

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`/share/${shareToken}`);
    await expect(anonPage.getByTestId('share-password-gate')).toBeVisible();
    await anonPage.getByTestId('share-password-input').fill('secret-share-pass');
    await anonPage.getByTestId('share-unlock-btn').click();
    await expect(anonPage.getByTestId('public-share-viewer')).toBeVisible();
    await expect(anonPage.getByTestId('shared-resource-title')).toContainText('Production Architecture Runbook.md');

    // 7e. User Revocation & Password Reset Recovery Flow
    const usersList = await page.evaluate(async () => {
      const r = await fetch('/api/admin/users');
      return r.json();
    });
    const nonAdminUser = (usersList.users as Array<{ id: string; email: string }>).find(
      (u) => u.email !== ADMIN_EMAIL
    );
    expect(nonAdminUser).toBeTruthy();

    // Revoke non-admin user via Settings -> Users & Roles UI
    await page.goto(`/${WORKSPACE_SLUG}/settings/users`);
    await page.getByTestId(`toggle-revoke-${nonAdminUser!.email}`).click();
    await expect(page.getByTestId(`admin-user-row-${nonAdminUser!.email}`)).toContainText('REVOKED');

    // Restore non-admin user
    await page.getByTestId(`toggle-revoke-${nonAdminUser!.email}`).click();
    await expect(page.getByTestId(`toggle-revoke-${nonAdminUser!.email}`)).toContainText('Revoke Access');

    // Complete self-service Password Reset flow on /reset-password
    await anonPage.goto('/reset-password');
    await anonPage.getByTestId('reset-email-input').fill(nonAdminUser!.email);
    await anonPage.getByTestId('send-reset-link-btn').click();
    await expect(anonPage.getByTestId('reset-token-input')).toBeVisible();
    await anonPage.getByTestId('reset-new-password-input').fill('NewResetPassword789!');
    await anonPage.getByTestId('confirm-password-reset-btn').click();
    await expect(anonPage.getByTestId('password-reset-completed')).toBeVisible();

    await anonContext.close();
    await context.close();
  });
});
