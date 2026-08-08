"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordMatchResult, MatchResultError } from "@/lib/bracket/progress";
import { logAudit } from "@/lib/audit";

async function findPlayerByCode(slug: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament) throw new Error("Tournament not found");
  const player = await prisma.player.findUnique({ where: { tournamentId_code: { tournamentId: tournament.id, code } } });
  if (!player) throw new Error("That code doesn't match anyone in this tournament");
  return { tournament, player };
}

export async function goToPlayerPage(slug: string, formData: FormData) {
  const code = String(formData.get("code") || "");
  const { player } = await findPlayerByCode(slug, code);
  redirect(`/t/${slug}/p/${player.code}`);
}

export async function playerCheckIn(slug: string, code: string) {
  const { tournament, player } = await findPlayerByCode(slug, code);
  if (!player.checkedIn) {
    await prisma.player.update({ where: { id: player.id }, data: { checkedIn: true, checkedInAt: new Date() } });
    await logAudit(tournament.id, "player", "checkin", `"${player.name}" checked in`);
  }
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/p/${player.code}`);
}

export async function playerRecordScore(slug: string, code: string, formData: FormData) {
  const { tournament, player } = await findPlayerByCode(slug, code);
  const matchId = String(formData.get("matchId"));
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.tournamentId !== tournament.id) throw new Error("Not authorized");
  if (match.player1Id !== player.id && match.player2Id !== player.id) {
    throw new Error("This isn't your match");
  }

  const player1Score = Number(formData.get("player1Score"));
  const player2Score = Number(formData.get("player2Score"));
  try {
    await recordMatchResult({ matchId, player1Score, player2Score });
  } catch (err) {
    if (err instanceof MatchResultError) throw new Error(err.message);
    throw err;
  }
  const opponentId = match.player1Id === player.id ? match.player2Id : match.player1Id;
  const opponent = opponentId ? await prisma.player.findUnique({ where: { id: opponentId } }) : null;
  await logAudit(
    tournament.id,
    "player",
    "score.record",
    `"${player.name}" reported a score vs "${opponent?.name ?? "?"}": ${player1Score}-${player2Score}`
  );
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/p/${player.code}`);
}
