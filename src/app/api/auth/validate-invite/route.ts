import { NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/invitations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode : '';
    const email = typeof body.email === 'string' ? body.email : undefined;

    const result = await validateInvitationCode(inviteCode, email);
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      role: result.invitation.role,
      invitedEmail: result.invitation.invitedEmail,
      expiresAt: result.invitation.expiresAt,
      codePrefix: result.invitation.codePrefix,
    });
  } catch (err) {
    console.error('[validate-invite]', err);
    return NextResponse.json({ valid: false, reason: 'Failed to validate invitation code.' }, { status: 500 });
  }
}
