"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { newPlayerCode } from "@/lib/ids";
import { generateInitialBracket, generatePlayoffBracket, BracketGenerationError } from "@/lib/bracket/generate";
import { recordMatchResult, editMatchResult, MatchResultError } from "@/lib/bracket/progress";
import { logAudit } from "@/lib/audit";

async function requireAdmin(tournamentId: string, adminToken: string) {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!t || t.adminToken !== adminToken) throw new Error("Not authorized");
  return t;
}

function refresh(adminToken: string, slug: string) {
  revalidatePath(`/admin/${adminToken}`);
  revalidatePath(`/t/${slug}`);
}

async function uniqueCode(tournamentId: string): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = newPlayerCode();
    const exists = await prisma.player.findUnique({ where: { tournamentId_code: { tournamentId, code } } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique player code, try again");
}

export async function addPlayer(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw && String(ratingRaw).trim() !== "" ? Number(ratingRaw) : null;

  const count = await prisma.player.count({ where: { tournamentId } });
  const code = await uniqueCode(tournamentId);
  await prisma.player.create({
    data: { tournamentId, name, rating: rating !== null && Number.isFinite(rating) ? rating : null, seed: count + 1, code },
  });
  await logAudit(tournamentId, "admin", "player.add", `Added player "${name}"`);
  refresh(adminToken, t.slug);
}

export async function addPlayersFromCsv(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const text = String(formData.get("csv") || "");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let seed = await prisma.player.count({ where: { tournamentId } });
  let added = 0;
  for (const line of lines) {
    const [namePart, ratingPart] = line.split(",");
    const name = (namePart || "").trim();
    if (!name) continue;
    const ratingNum = ratingPart ? Number(ratingPart.trim()) : NaN;
    seed += 1;
    const code = await uniqueCode(tournamentId);
    await prisma.player.create({
      data: { tournamentId, name, rating: Number.isFinite(ratingNum) ? ratingNum : null, seed, code },
    });
    added += 1;
  }
  if (added > 0) await logAudit(tournamentId, "admin", "player.import", `Imported ${added} player${added === 1 ? "" : "s"} from CSV`);
  refresh(adminToken, t.slug);
}

export async function removePlayer(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  if (t.status !== "DRAFT" && t.status !== "CHECK_IN") {
    throw new Error("Players can't be removed after the bracket has been generated");
  }
  const playerId = String(formData.get("playerId"));
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  await prisma.player.delete({ where: { id: playerId } });

  const remaining = await prisma.player.findMany({ where: { tournamentId }, orderBy: { seed: "asc" } });
  await prisma.$transaction(remaining.map((p, i) => prisma.player.update({ where: { id: p.id }, data: { seed: i + 1 } })));
  await logAudit(tournamentId, "admin", "player.remove", `Removed player "${player.name}"`);
  refresh(adminToken, t.slug);
}

export async function setPlayerSeed(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const playerId = String(formData.get("playerId"));
  const newPos = Number(formData.get("seed"));
  if (!Number.isFinite(newPos)) return;

  const players = await prisma.player.findMany({ where: { tournamentId }, orderBy: { seed: "asc" } });
  const idx = players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  const [moved] = players.splice(idx, 1);
  const clamped = Math.max(1, Math.min(players.length + 1, Math.round(newPos)));
  players.splice(clamped - 1, 0, moved);

  await prisma.$transaction(players.map((p, i) => prisma.player.update({ where: { id: p.id }, data: { seed: i + 1 } })));
  await logAudit(tournamentId, "admin", "player.reseed", `Moved "${moved.name}" to seed #${clamped}`);
  refresh(adminToken, t.slug);
}

export async function randomizeSeeds(tournamentId: string, adminToken: string) {
  const t = await requireAdmin(tournamentId, adminToken);
  const players = await prisma.player.findMany({ where: { tournamentId } });
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  await prisma.$transaction(shuffled.map((p, i) => prisma.player.update({ where: { id: p.id }, data: { seed: i + 1 } })));
  await logAudit(tournamentId, "admin", "player.reseed", "Randomized player seeding");
  refresh(adminToken, t.slug);
}

export async function seedByRating(tournamentId: string, adminToken: string) {
  const t = await requireAdmin(tournamentId, adminToken);
  const players = await prisma.player.findMany({ where: { tournamentId } });
  const sorted = [...players].sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
  await prisma.$transaction(sorted.map((p, i) => prisma.player.update({ where: { id: p.id }, data: { seed: i + 1 } })));
  await logAudit(tournamentId, "admin", "player.reseed", "Re-seeded players by rating");
  refresh(adminToken, t.slug);
}

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  format: z.enum(["SINGLE_ELIM", "DOUBLE_ELIM", "ROUND_ROBIN", "POOL_PLAY"]),
  pointsToWin: z.coerce.number().int().min(1).max(99),
  winByTwo: z.coerce.boolean(),
  gamesPerMatch: z.coerce.number().int().min(1).max(5),
  poolCount: z.coerce.number().int().min(1).max(32),
  advancePerPool: z.coerce.number().int().min(1).max(8),
  playoffFormat: z.enum(["SINGLE_ELIM", "DOUBLE_ELIM"]),
});

export async function updateSettings(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  if (t.status !== "DRAFT") throw new Error("Settings can only be changed before check-in opens");

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    format: formData.get("format"),
    pointsToWin: formData.get("pointsToWin") || 11,
    winByTwo: formData.get("winByTwo") === "on",
    gamesPerMatch: formData.get("gamesPerMatch") || 1,
    poolCount: formData.get("poolCount") || 1,
    advancePerPool: formData.get("advancePerPool") || 2,
    playoffFormat: formData.get("playoffFormat") || "SINGLE_ELIM",
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  const data = parsed.data;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      name: data.name,
      format: data.format,
      pointsToWin: data.pointsToWin,
      winByTwo: data.winByTwo,
      gamesPerMatch: data.gamesPerMatch,
      poolCount: data.format === "ROUND_ROBIN" || data.format === "POOL_PLAY" ? data.poolCount : 1,
      advancePerPool: data.advancePerPool,
      playoffFormat: data.playoffFormat,
    },
  });
  await logAudit(tournamentId, "admin", "settings.update", `Updated settings (format: ${data.format})`);
  refresh(adminToken, t.slug);
}

export async function openCheckIn(tournamentId: string, adminToken: string) {
  const t = await requireAdmin(tournamentId, adminToken);
  if (t.status !== "DRAFT") throw new Error("Check-in is already open");
  const count = await prisma.player.count({ where: { tournamentId } });
  if (count < 2) throw new Error("Add at least 2 players first");
  await prisma.tournament.update({ where: { id: tournamentId }, data: { status: "CHECK_IN" } });
  await logAudit(tournamentId, "admin", "checkin.open", "Opened check-in");
  refresh(adminToken, t.slug);
}

export async function adminToggleCheckIn(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const playerId = String(formData.get("playerId"));
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  await prisma.player.update({
    where: { id: playerId },
    data: { checkedIn: !player.checkedIn, checkedInAt: !player.checkedIn ? new Date() : null },
  });
  await logAudit(tournamentId, "admin", "checkin.toggle", `${player.checkedIn ? "Checked out" : "Checked in"} "${player.name}"`);
  refresh(adminToken, t.slug);
}

export async function generateBracketAction(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const checkedInOnly = formData.get("checkedInOnly") === "on";
  try {
    await generateInitialBracket(tournamentId, { checkedInOnly });
  } catch (err) {
    if (err instanceof BracketGenerationError) throw new Error(err.message);
    throw err;
  }
  await logAudit(tournamentId, "admin", "bracket.generate", `Generated the bracket (${checkedInOnly ? "checked-in players only" : "all players"})`);
  refresh(adminToken, t.slug);
}

export async function generatePlayoffAction(tournamentId: string, adminToken: string) {
  const t = await requireAdmin(tournamentId, adminToken);
  try {
    await generatePlayoffBracket(tournamentId);
  } catch (err) {
    if (err instanceof BracketGenerationError) throw new Error(err.message);
    throw err;
  }
  await logAudit(tournamentId, "admin", "bracket.generate", "Generated the playoff bracket from pool standings");
  refresh(adminToken, t.slug);
}

async function matchupLabel(match: { player1Id: string | null; player2Id: string | null }): Promise<string> {
  const ids = [match.player1Id, match.player2Id].filter((id): id is string => Boolean(id));
  const players = await prisma.player.findMany({ where: { id: { in: ids } } });
  const byId = new Map(players.map((p) => [p.id, p.name]));
  const p1 = match.player1Id ? (byId.get(match.player1Id) ?? "?") : "?";
  const p2 = match.player2Id ? (byId.get(match.player2Id) ?? "?") : "?";
  return `${p1} vs ${p2}`;
}

export async function adminRecordScore(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const matchId = String(formData.get("matchId"));
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.tournamentId !== tournamentId) throw new Error("Not authorized");

  const player1Score = Number(formData.get("player1Score"));
  const player2Score = Number(formData.get("player2Score"));
  try {
    await recordMatchResult({ matchId, player1Score, player2Score });
  } catch (err) {
    if (err instanceof MatchResultError) throw new Error(err.message);
    throw err;
  }
  const label = await matchupLabel(match);
  await logAudit(tournamentId, "admin", "score.record", `Recorded score for ${label}: ${player1Score}-${player2Score}`);
  refresh(adminToken, t.slug);
}

export async function adminEditScore(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const matchId = String(formData.get("matchId"));
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.tournamentId !== tournamentId) throw new Error("Not authorized");

  const player1Score = Number(formData.get("player1Score"));
  const player2Score = Number(formData.get("player2Score"));
  try {
    await editMatchResult({ matchId, player1Score, player2Score });
  } catch (err) {
    if (err instanceof MatchResultError) throw new Error(err.message);
    throw err;
  }
  const label = await matchupLabel(match);
  await logAudit(
    tournamentId,
    "admin",
    "score.edit",
    `Edited score for ${label}: was ${match.player1Score}-${match.player2Score}, now ${player1Score}-${player2Score}`
  );
  refresh(adminToken, t.slug);
}

export async function adminSetCourt(tournamentId: string, adminToken: string, formData: FormData) {
  const t = await requireAdmin(tournamentId, adminToken);
  const matchId = String(formData.get("matchId"));
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.tournamentId !== tournamentId) throw new Error("Not authorized");
  const court = String(formData.get("court") || "").trim();
  await prisma.match.update({ where: { id: matchId }, data: { court: court || null } });
  refresh(adminToken, t.slug);
}

export async function deleteDivision(tournamentId: string, adminToken: string) {
  const t = await requireAdmin(tournamentId, adminToken);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: t.eventId } });

  await prisma.tournament.delete({ where: { id: tournamentId } });

  const remaining = await prisma.tournament.count({ where: { eventId: event.id } });
  if (remaining === 0) {
    await prisma.event.delete({ where: { id: event.id } });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/e/${event.adminToken}`);
  revalidatePath(`/e/${event.slug}`);
  revalidatePath(`/t/${t.slug}`);
}
