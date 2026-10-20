import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashInvitationToken, validateInvitationCode } from '@/lib/invitations';
import { ensureUserWorkspace } from '@/lib/workspace-provisioning';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const name = (body.name || '').trim() || email.split('@')[0];
    const inviteCode = (body.inviteCode || '').trim();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Valid email and a password of at least 8 characters are required.' },
        { status: 400 }
      );
    }

    const admissionMode = (process.env.ACCOUNT_ADMISSION_MODE || 'invitation-only').toLowerCase();
    if (admissionMode !== 'open') {
      const validation = await validateInvitationCode(inviteCode, email);
      if (!validation.valid) {
        await recordAuditLog({
          actorEmail: email,
          action: 'INVITE_REJECTED',
          targetType: 'AccountInvitation',
          metadata: { reason: validation.reason, codePrefix: inviteCode.slice(0, 9) },
        });
        return NextResponse.json({ error: validation.reason }, { status: 403 });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const tokenHash = inviteCode ? hashInvitationToken(inviteCode) : null;

    const created = await prisma.$transaction(async (tx) => {
      let assignedRole = 'Editor';
      let invitationId: string | null = null;

      if (tokenHash) {
        const inv = await tx.accountInvitation.findUnique({ where: { tokenHash } });
        if (!inv || inv.status !== 'PENDING' || inv.useCount >= inv.maxUses || inv.expiresAt <= new Date()) {
          throw new Error('Invitation code is no longer valid.');
        }
        assignedRole = inv.role;
        invitationId = inv.id;
      }

      const newUser = await tx.user.create({
        data: {
          email,
          name,
          role: assignedRole,
          hasFinishedOnboarding: false,
          passwordCredential: {
            create: { passwordHash },
          },
        },
      });

      if (invitationId) {
        await tx.accountInvitation.update({
          where: { id: invitationId },
          data: {
            useCount: { increment: 1 },
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            acceptedById: newUser.id,
          },
        });
      }

      return { newUser, invitationId, assignedRole };
    });

    const workspace = await ensureUserWorkspace(created.newUser.id, created.newUser.name, created.newUser.email);

    await recordAuditLog({
      actorId: created.newUser.id,
      actorEmail: created.newUser.email,
      action: 'INVITE_ACCEPTED',
      targetType: 'AccountInvitation',
      targetId: created.invitationId,
      metadata: {
        role: created.assignedRole,
        workspaceSlug: workspace.slug,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: created.newUser.id,
          email: created.newUser.email,
          name: created.newUser.name,
          role: created.newUser.role,
          defaultWorkspaceSlug: workspace.slug,
          hasFinishedOnboarding: false,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register user.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
