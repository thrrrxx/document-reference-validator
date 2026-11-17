import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export interface AuditLogInput {
  documentId?: string | null;
  entityType?: string;
  entityId?: string | null;
  action: string;
  performedBy: string;
  actorUserId?: string | null;
  oldValues?: Record<string, unknown> | unknown[] | null;
  newValues?: Record<string, unknown> | unknown[] | null;
  ipAddress?: string | null;
  details?: string | Record<string, unknown> | null;
}

/**
 * Mencatat jejak audit secara append-only dengan dukungan diff (oldValues vs newValues)
 * serta identitas aktor terverifikasi.
 */
export async function recordAuditLog(input: AuditLogInput) {
  const serializedDetails =
    input.details == null
      ? null
      : typeof input.details === 'string'
        ? input.details
        : JSON.stringify(input.details);

  return db.auditLog.create({
    data: {
      documentId: input.documentId ?? null,
      entityType: input.entityType || 'DOCUMENT',
      entityId: input.entityId ?? input.documentId ?? null,
      action: input.action,
      performedBy: input.performedBy,
      actorUserId: input.actorUserId ?? null,
      oldValues: (input.oldValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      newValues: (input.newValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress ?? null,
      details: serializedDetails,
    },
  });
}
