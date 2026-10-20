import crypto from 'node:crypto';
import { prisma } from './prisma';
import { recordAuditLog } from './audit';

export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashInvitationToken(rawCode: string): string {
  const normalized = normalizeInviteCode(rawCode);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function generateRawInviteCode(): { rawCode: string; codePrefix: string; tokenHash: string } {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const segment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => alphabet[b % alphabet.length])
      .join('');
  const seg1 = segment(4);
  const seg2 = segment(4);
  const seg3 = segment(4);
  const rawCode = `FBRC-${seg1}-${seg2}-${seg3}`;
  const codePrefix = `FBRC-${seg1}`;
  const tokenHash = hashInvitationToken(rawCode);
  return { rawCode, codePrefix, tokenHash };
}

export interface CreateInvitationParams {
  createdById: string;
  createdByEmail?: string | null;
  invitedEmail?: string | null;
  role?: UserRole;
  expiresInHours?: number;
  maxUses?: number;
  note?: string | null;
  fixedRawCode?: string;
}

export async function createAccountInvitation(params: CreateInvitationParams) {
  const { rawCode, codePrefix, tokenHash } = params.fixedRawCode
    ? {
        rawCode: normalizeInviteCode(params.fixedRawCode),
        codePrefix: normalizeInviteCode(params.fixedRawCode).slice(0, 9),
        tokenHash: hashInvitationToken(params.fixedRawCode),
      }
    : generateRawInviteCode();

  const expiresInHours = params.expiresInHours ?? 72;
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);
  const role: UserRole = params.role ?? 'Editor';
  const invitedEmail = params.invitedEmail ? params.invitedEmail.trim().toLowerCase() : null;

  const invitation = await prisma.accountInvitation.upsert({
    where: { tokenHash },
    update: {
      invitedEmail,
      role,
      status: 'PENDING',
      maxUses: params.maxUses ?? 1,
      useCount: 0,
      expiresAt,
      revokedAt: null,
      acceptedAt: null,
      acceptedById: null,
      note: params.note ?? null,
    },
    create: {
      codePrefix,
      tokenHash,
      invitedEmail,
      role,
      status: 'PENDING',
      maxUses: params.maxUses ?? 1,
      useCount: 0,
      expiresAt,
      createdById: params.createdById,
      note: params.note ?? null,
    },
  });

  await recordAuditLog({
    actorId: params.createdById,
    actorEmail: params.createdByEmail ?? null,
    action: 'INVITE_CREATED',
    targetType: 'AccountInvitation',
    targetId: invitation.id,
    metadata: {
      codePrefix: invitation.codePrefix,
      role: invitation.role,
      invitedEmail: invitation.invitedEmail,
      expiresAt: invitation.expiresAt.toISOString(),
      maxUses: invitation.maxUses,
    },
  });

  return { invitation, rawCode };
}

export async function validateInvitationCode(rawCode: string, candidateEmail?: string) {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false as const, reason: 'Invitation code is required.' };
  }
  const tokenHash = hashInvitationToken(rawCode);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
  });

  if (!invitation) {
    return { valid: false as const, reason: 'Invalid invitation code.' };
  }

  if (invitation.status === 'REVOKED' || invitation.revokedAt) {
    return { valid: false as const, reason: 'This invitation code has been revoked.' };
  }

  if (invitation.status === 'ACCEPTED' || invitation.useCount >= invitation.maxUses) {
    return { valid: false as const, reason: 'This invitation code has already been used.' };
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    if (invitation.status === 'PENDING') {
      await prisma.accountInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { valid: false as const, reason: 'This invitation code has expired.' };
  }

  if (
    invitation.invitedEmail &&
    candidateEmail &&
    invitation.invitedEmail.toLowerCase() !== candidateEmail.trim().toLowerCase()
  ) {
    return {
      valid: false as const,
      reason: `This invitation is restricted to ${invitation.invitedEmail}.`,
    };
  }

  return {
    valid: true as const,
    invitation,
  };
}
