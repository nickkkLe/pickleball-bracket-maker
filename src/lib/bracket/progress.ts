import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { newId } from "@/lib/ids";

type Tx = Prisma.TransactionClient;

export interface GameScore {
  p1: number;
  p2: number;
}

export interface RecordResultInput {
  matchId: string;
  player1Score: number;
  player2Score: number;
  games?: GameScore[];
}

export class MatchResultError extends Error {}

async function hasFeeder(tx: Tx, tournamentId: string, matchId: string, slot: 1 | 2): Promise<boolean> {
  const found = await tx.match.findFirst({
    where: {
      tournamentId,
      OR: [
        { nextMatchId: matchId, nextMatchSlot: slot },
        { nextLoserMatchId: matchId, nextLoserMatchSlot: slot },
      ],
    },
    select: { id: true },
  });
  return found !== null;
}

/** Fills a downstream match's slot with a winner/loser id, then checks whether
 * that downstream match is now a "no opponent will ever arrive" bye and, if
 * so, auto-completes it and cascades further. */
async function fillSlot(tx: Tx, matchId: string, slot: number, playerId: string) {
  await tx.match.update({
    where: { id: matchId },
    data: slot === 1 ? { player1Id: playerId } : { player2Id: playerId },
  });
  await trySettleBye(tx, matchId);
}

async function trySettleBye(tx: Tx, matchId: string) {
  const match = await tx.match.findUnique({ where: { id: matchId } });
  if (!match || match.status === "COMPLETE") return;

  const p1 = match.player1Id;
  const p2 = match.player2Id;
  if (p1 && p2) return; // real match, waiting to be played
  if (!p1 && !p2) return; // nothing to do yet

  const filledSlot = p1 ? 1 : 2;
  const emptySlot = filledSlot === 1 ? 2 : 1;
  const winnerId = (p1 ?? p2) as string;

  const stillExpected = await hasFeeder(tx, match.tournamentId, matchId, emptySlot as 1 | 2);
  if (stillExpected) return;

  await tx.match.update({
    where: { id: matchId },
    data: { status: "COMPLETE", winnerId },
  });

  if (match.nextMatchId && match.nextMatchSlot) {
    await fillSlot(tx, match.nextMatchId, match.nextMatchSlot, winnerId);
  }
  // A bye has no loser, so nextLoserMatchId (if any) is never fired here.

  await maybeHandleGrandFinal(tx, { ...match, winnerId });
}

async function maybeHandleGrandFinal(
  tx: Tx,
  match: { id: string; tournamentId: string; bracketSide: string | null; winnerId: string | null; player1Id: string | null; player2Id: string | null; isBracketReset: boolean }
) {
  if (match.bracketSide !== "GRAND_FINAL" || !match.winnerId) return;

  if (!match.isBracketReset && match.winnerId === match.player2Id) {
    // The losers-bracket finalist (player2, by convention) beat the winners-bracket
    // champion — pickleball's classic double-elim rule: play a second, deciding game.
    const existingReset = await tx.match.findFirst({
      where: { tournamentId: match.tournamentId, bracketSide: "GRAND_FINAL", isBracketReset: true },
    });
    if (!existingReset) {
      await tx.match.create({
        data: {
          id: newId(),
          tournamentId: match.tournamentId,
          stage: "BRACKET",
          bracketSide: "GRAND_FINAL",
          round: 2,
          position: 0,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          status: "PENDING",
          isBracketReset: true,
        },
      });
    }
    return;
  }

  await tx.tournament.update({ where: { id: match.tournamentId }, data: { status: "COMPLETE" } });
}

export async function recordMatchResult(input: RecordResultInput) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: input.matchId } });
    if (!match) throw new MatchResultError("Match not found");
    if (!match.player1Id || !match.player2Id) {
      throw new MatchResultError("Both players must be set before a score can be recorded");
    }
    if (input.player1Score === input.player2Score) {
      throw new MatchResultError("Scores cannot be tied");
    }

    const winnerId = input.player1Score > input.player2Score ? match.player1Id : match.player2Id;
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    const updated = await tx.match.update({
      where: { id: match.id },
      data: {
        player1Score: input.player1Score,
        player2Score: input.player2Score,
        games: input.games ? (input.games as unknown as Prisma.InputJsonValue) : undefined,
        winnerId,
        status: "COMPLETE",
      },
    });

    if (updated.nextMatchId && updated.nextMatchSlot) {
      await fillSlot(tx, updated.nextMatchId, updated.nextMatchSlot, winnerId);
    }
    if (updated.nextLoserMatchId && updated.nextLoserMatchSlot) {
      await fillSlot(tx, updated.nextLoserMatchId, updated.nextLoserMatchSlot, loserId);
    }

    await maybeHandleGrandFinal(tx, updated);

    // If this bracket has no further matches at all (single elim final, or an
    // isolated grand final win), mark the tournament complete. Pool matches
    // don't feed a next match, so they're handled separately below.
    if (updated.stage === "BRACKET" && updated.bracketSide !== "GRAND_FINAL" && !updated.nextMatchId) {
      const remaining = await tx.match.count({
        where: { tournamentId: updated.tournamentId, stage: "BRACKET", status: { not: "COMPLETE" } },
      });
      if (remaining === 0) {
        await tx.tournament.update({ where: { id: updated.tournamentId }, data: { status: "COMPLETE" } });
      }
    }

    // Pure round-robin tournaments have no playoff stage — once every pool
    // match is done, the tournament itself is done.
    if (updated.stage === "POOL") {
      const tournament = await tx.tournament.findUniqueOrThrow({ where: { id: updated.tournamentId } });
      if (tournament.format === "ROUND_ROBIN") {
        const remainingPool = await tx.match.count({
          where: { tournamentId: updated.tournamentId, stage: "POOL", status: { not: "COMPLETE" } },
        });
        if (remainingPool === 0) {
          await tx.tournament.update({ where: { id: updated.tournamentId }, data: { status: "COMPLETE" } });
        }
      }
    }

    return updated;
  });
}
