import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { createAccountInvitation } from '../src/lib/invitations';
import { ensureUserWorkspace } from '../src/lib/workspace-provisioning';
import { recordAuditLog } from '../src/lib/audit';

export async function runBootstrapAdmin() {
  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@fabric.local').trim().toLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || 'Joshuah Powlowski';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'Admin',
      hasFinishedOnboarding: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: 'Admin',
      hasFinishedOnboarding: true,
      onboardingData: JSON.stringify({
        workspaceType: 'personal',
        useCases: ['Organize projects', 'Take notes', 'AI research', 'Save links & articles'],
        assistantName: 'Rue',
        assistantPersonality: 'balanced',
        attribution: 'Search engine',
        planSelected: 'free',
      }),
      preferences: JSON.stringify({
        theme: 'light',
        defaultViewMode: 'grid',
        autoRenameEnabled: true,
      }),
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: adminUser.id },
    update: { passwordHash },
    create: { userId: adminUser.id, passwordHash },
  });

  const workspace = await ensureUserWorkspace(
    adminUser.id,
    adminName,
    adminEmail,
    'powlowskijoshuah-cq1od1'
  );

  // Create deterministic sample invitations for testing and team onboarding
  const editorInvite = await createAccountInvitation({
    createdById: adminUser.id,
    createdByEmail: adminEmail,
    role: 'Editor',
    expiresInHours: 168,
    maxUses: 1,
    note: 'Default Editor single-use invitation code',
    fixedRawCode: 'FBRC-EDIT-2025-OPEN',
  });

  const viewerInvite = await createAccountInvitation({
    createdById: adminUser.id,
    createdByEmail: adminEmail,
    role: 'Viewer',
    expiresInHours: 168,
    maxUses: 1,
    note: 'Default Viewer single-use invitation code',
    fixedRawCode: 'FBRC-VIEW-2025-READ',
  });

  const adminInvite = await createAccountInvitation({
    createdById: adminUser.id,
    createdByEmail: adminEmail,
    role: 'Admin',
    expiresInHours: 168,
    maxUses: 1,
    note: 'Co-Admin single-use invitation code',
    fixedRawCode: 'FBRC-ADMN-2025-ROOT',
  });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminEmail,
    action: 'BOOTSTRAP_ADMIN_COMPLETED',
    targetType: 'User',
    targetId: adminUser.id,
    metadata: {
      workspaceSlug: workspace.slug,
      seededInvitations: [editorInvite.rawCode, viewerInvite.rawCode, adminInvite.rawCode],
    },
  });

  console.log('============================================================');
  console.log('Fabric Workspace Bootstrap Admin Completed');
  console.log(`  Admin Email      : ${adminEmail}`);
  console.log(`  Admin Password   : ${adminPassword}`);
  console.log(`  Admin Role       : ${adminUser.role}`);
  console.log(`  Workspace Slug   : ${workspace.slug}`);
  console.log(`  Editor Invite    : ${editorInvite.rawCode}`);
  console.log(`  Viewer Invite    : ${viewerInvite.rawCode}`);
  console.log(`  Admin Invite     : ${adminInvite.rawCode}`);
  console.log('============================================================');

  return { adminUser, workspace, editorInvite, viewerInvite, adminInvite };
}

if (require.main === module) {
  runBootstrapAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
