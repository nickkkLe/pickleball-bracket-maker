import { prisma } from "@/lib/prisma";

export type AuditActor = "admin" | "player" | "system";

export async function logAudit(tournamentId: string, actor: AuditActor, action: string, message: string) {
  await prisma.auditLogEntry.create({ data: { tournamentId, actor, action, message } });
}
