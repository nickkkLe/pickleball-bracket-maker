import { newId } from "../ids";
import type { MatchDraft } from "./types";

/**
 * Distributes seeded player ids into `poolCount` pools using a snake
 * distribution (1,2,3,3,2,1,...) so pools end up roughly balanced by seed.
 */
export function assignPools(orderedPlayerIds: string[], poolCount: number): string[][] {
  const count = Math.max(1, poolCount);
  const pools: string[][] = Array.from({ length: count }, () => []);
  let dir = 1;
  let idx = 0;
  for (const id of orderedPlayerIds) {
    pools[idx].push(id);
    if (count === 1) continue;
    idx += dir;
    if (idx === count) {
      idx = count - 1;
      dir = -1;
    } else if (idx < 0) {
      idx = 0;
      dir = 1;
    }
  }
  return pools;
}

/**
 * Generates a full round-robin schedule for one pool using the circle
 * method. Odd-sized pools get a bye each round (one player sits out).
 */
export function generatePoolMatches(tournamentId: string, poolId: string, playerIds: string[]): MatchDraft[] {
  if (playerIds.length < 2) return [];

  let arr: (string | null)[] = [...playerIds];
  if (arr.length % 2 !== 0) arr.push(null);
  const n = arr.length;
  const rounds = n - 1;

  const drafts: MatchDraft[] = [];

  for (let r = 0; r < rounds; r++) {
    let position = 0;
    for (let i = 0; i < n / 2; i++) {
      const p1 = arr[i];
      const p2 = arr[n - 1 - i];
      if (p1 !== null && p2 !== null) {
        drafts.push({
          id: newId(),
          tournamentId,
          stage: "POOL",
          bracketSide: null,
          round: r + 1,
          position: position++,
          poolId,
          player1Id: p1,
          player2Id: p2,
          winnerId: null,
          status: "PENDING",
          nextMatchId: null,
          nextMatchSlot: null,
          nextLoserMatchId: null,
          nextLoserMatchSlot: null,
          isBracketReset: false,
        });
      }
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [fixed, ...rest];
  }

  return drafts;
}
