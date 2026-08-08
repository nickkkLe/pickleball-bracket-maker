import { prisma } from "@/lib/prisma";
import { newId } from "@/lib/ids";
import { generateSingleElimination, generateDoubleElimination } from "./elimination";
import { assignPools, generatePoolMatches } from "./roundRobin";
import { computeStandings } from "./standings";
import type { MatchDraft, SeededPlayer } from "./types";

export class BracketGenerationError extends Error {}

function poolName(index: number): string {
  let n = index;
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Pool ${name}`;
}

function toMatchCreateData(drafts: MatchDraft[]) {
  return drafts.map((d) => ({
    id: d.id,
    tournamentId: d.tournamentId,
    stage: d.stage,
    bracketSide: d.bracketSide,
    round: d.round,
    position: d.position,
    poolId: d.poolId,
    player1Id: d.player1Id,
    player2Id: d.player2Id,
    winnerId: d.winnerId,
    status: d.status,
    nextMatchId: d.nextMatchId,
    nextMatchSlot: d.nextMatchSlot,
    nextLoserMatchId: d.nextLoserMatchId,
    nextLoserMatchSlot: d.nextLoserMatchSlot,
    isBracketReset: d.isBracketReset,
  }));
}

/** Generates the initial matches for a tournament: an elimination bracket for
 * SINGLE_ELIM/DOUBLE_ELIM, or pools for ROUND_ROBIN/POOL_PLAY. */
export async function generateInitialBracket(tournamentId: string, opts: { checkedInOnly: boolean }) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new BracketGenerationError("Tournament not found");
    if (tournament.status !== "DRAFT" && tournament.status !== "CHECK_IN") {
      throw new BracketGenerationError("Bracket has already been generated for this tournament");
    }

    const players = await tx.player.findMany({
      where: { tournamentId, ...(opts.checkedInOnly ? { checkedIn: true } : {}) },
      orderBy: { seed: "asc" },
    });
    if (players.length < 2) {
      throw new BracketGenerationError("Need at least 2 players to generate a bracket");
    }

    const seeded: SeededPlayer[] = players.map((p, i) => ({ id: p.id, seed: i + 1 }));

    if (tournament.format === "SINGLE_ELIM" || tournament.format === "DOUBLE_ELIM") {
      const drafts =
        tournament.format === "SINGLE_ELIM"
          ? generateSingleElimination(tournamentId, seeded)
          : generateDoubleElimination(tournamentId, seeded);
      await tx.match.createMany({ data: toMatchCreateData(drafts) });
    } else {
      const orderedIds = seeded.map((p) => p.id);
      const pools = assignPools(orderedIds, tournament.poolCount);
      const allDrafts: MatchDraft[] = [];
      for (let i = 0; i < pools.length; i++) {
        const pool = await tx.pool.create({ data: { id: newId(), tournamentId, name: poolName(i) } });
        await tx.player.updateMany({ where: { id: { in: pools[i] } }, data: { poolId: pool.id } });
        allDrafts.push(...generatePoolMatches(tournamentId, pool.id, pools[i]));
      }
      await tx.match.createMany({ data: toMatchCreateData(allDrafts) });
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "IN_PROGRESS" } });
    return tx.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
  });
}

/** For POOL_PLAY tournaments: once pool play is complete, seed the top
 * finishers from each pool into an elimination bracket. */
export async function generatePlayoffBracket(tournamentId: string) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new BracketGenerationError("Tournament not found");
    if (tournament.format !== "POOL_PLAY") {
      throw new BracketGenerationError("Only pool-play tournaments have a separate playoff stage");
    }

    const existingPlayoff = await tx.match.count({ where: { tournamentId, stage: "BRACKET" } });
    if (existingPlayoff > 0) {
      throw new BracketGenerationError("Playoff bracket has already been generated");
    }

    const pools = await tx.pool.findMany({ where: { tournamentId }, include: { players: true } });
    const poolMatches = await tx.match.findMany({ where: { tournamentId, stage: "POOL" } });

    const incomplete = poolMatches.filter((m) => m.status !== "COMPLETE");
    if (incomplete.length > 0) {
      throw new BracketGenerationError("All pool matches must be completed before generating the playoff bracket");
    }

    type Advancer = { playerId: string; finishRank: number; winPct: number; pointDiff: number };
    const advancers: Advancer[] = [];
    for (const pool of pools) {
      const standings = computeStandings(
        pool.players.map((p) => p.id),
        poolMatches.filter((m) => m.poolId === pool.id)
      );
      standings.slice(0, tournament.advancePerPool).forEach((s, idx) => {
        advancers.push({ playerId: s.playerId, finishRank: idx, winPct: s.winPct, pointDiff: s.pointDiff });
      });
    }

    if (advancers.length < 2) {
      throw new BracketGenerationError("Not enough advancing players to build a playoff bracket");
    }

    advancers.sort((a, b) => a.finishRank - b.finishRank || b.winPct - a.winPct || b.pointDiff - a.pointDiff);
    const seeded: SeededPlayer[] = advancers.map((a, i) => ({ id: a.playerId, seed: i + 1 }));

    const drafts =
      tournament.playoffFormat === "DOUBLE_ELIM"
        ? generateDoubleElimination(tournamentId, seeded)
        : generateSingleElimination(tournamentId, seeded);

    await tx.match.createMany({ data: toMatchCreateData(drafts) });
    return tx.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
  });
}
