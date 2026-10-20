import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAccountInvitation, UserRole } from '@/lib/invitations';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const invitations = await prisma.accountInvitation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      acceptedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const normalized = invitations.map((inv) => ({
    ...inv,
    codeHint: inv.codePrefix,
    email: inv.invitedEmail,
  }));

  return NextResponse.json({ invitations: normalized });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const role: UserRole = ['Admin', 'Editor', 'Viewer'].includes(body.role) ? body.role : 'Editor';
  const expiresInHours = Math.max(1, Number(body.expiresInHours || 72));
  const rawEmail = body.invitedEmail || body.email;
  const invitedEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : null;
  const note = body.note ? String(body.note).trim() : null;

  const { invitation, rawCode } = await createAccountInvitation({
    createdById: session.user.id,
    createdByEmail: session.user.email,
    invitedEmail,
    role,
    expiresInHours,
    maxUses: 1,
    note,
  });

  return NextResponse.json(
    {
      invitation: {
        ...invitation,
        codeHint: invitation.codePrefix,
        email: invitation.invitedEmail,
      },
      rawCode,
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const { id, action } = body;
  if (!id || action !== 'revoke') {
    return NextResponse.json({ error: 'Invitation id and action="revoke" required.' }, { status: 400 });
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'INVITE_REVOKED',
    targetType: 'AccountInvitation',
    targetId: updated.id,
    metadata: { codePrefix: updated.codePrefix, invitedEmail: updated.invitedEmail },
  });

  return NextResponse.json({ invitation: updated });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Invitation id required.' }, { status: 400 });
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'INVITE_REVOKED',
    targetType: 'AccountInvitation',
    targetId: updated.id,
    metadata: { codePrefix: updated.codePrefix, invitedEmail: updated.invitedEmail },
  });

  return NextResponse.json({ invitation: updated });
}
