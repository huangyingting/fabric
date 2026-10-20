import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'request', email, token, newPassword } = body;

    if (action === 'confirm') {
      if (!token || !newPassword || String(newPassword).length < 8) {
        return NextResponse.json(
          { error: 'Reset token and a new password of at least 8 characters are required.' },
          { status: 400 }
        );
      }

      const resetTokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');
      const cred = await prisma.passwordCredential.findUnique({
        where: { resetTokenHash },
        include: { user: true },
      });

      if (!cred || !cred.resetTokenExpiresAt || cred.resetTokenExpiresAt.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.passwordCredential.update({
        where: { id: cred.id },
        data: {
          passwordHash,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });

      await recordAuditLog({
        actorId: cred.userId,
        actorEmail: cred.user.email,
        action: 'PASSWORD_RESET_COMPLETED',
        targetType: 'User',
        targetId: cred.userId,
      });

      return NextResponse.json({ ok: true });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { passwordCredential: true },
    });

    if (!user || !user.passwordCredential) {
      await recordAuditLog({
        actorEmail: normalizedEmail,
        action: 'PASSWORD_RESET_REQUESTED',
        targetType: 'User',
        metadata: { found: false },
      });
      return NextResponse.json({ ok: true, queued: true });
    }

    const rawResetToken = `RST-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordCredential.update({
      where: { id: user.passwordCredential.id },
      data: {
        resetTokenHash,
        resetTokenExpiresAt,
      },
    });

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'User',
      targetId: user.id,
      metadata: { expiresAt: resetTokenExpiresAt.toISOString() },
    });

    return NextResponse.json({
      ok: true,
      queued: true,
      resetToken: rawResetToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Password reset failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
