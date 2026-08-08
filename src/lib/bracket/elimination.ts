import { newId } from "../ids";
import { nextPowerOfTwo, seedOrder } from "./seeding";
import type { BracketSide, MatchDraft, SeededPlayer } from "./types";

type Slot =
  | { kind: "DEAD" }
  | { kind: "PENDING" }
  | { kind: "PLAYER"; id: string };

const DEAD: Slot = { kind: "DEAD" };
const PENDING: Slot = { kind: "PENDING" };

function combine(a: Slot, b: Slot): Slot {
  if (a.kind === "DEAD" && b.kind === "DEAD") return DEAD;
  if (a.kind === "DEAD") return b.kind === "PLAYER" ? b : PENDING;
  if (b.kind === "DEAD") return a.kind === "PLAYER" ? a : PENDING;
  return PENDING;
}

function loserOf(a: Slot, b: Slot): Slot {
  if (a.kind === "DEAD" || b.kind === "DEAD") return DEAD;
  return PENDING;
}

type Input = { kind: "seed"; playerId: string | null } | { kind: "ref"; node: Node; which: "winner" | "loser" };

interface Node {
  bracketSide: BracketSide;
  round: number;
  position: number;
  input1: Input;
  input2: Input;
  slot1: Slot;
  slot2: Slot;
  output: Slot;
  loserOutput: Slot;
  winnerConsumer?: { node: Node; slotIndex: 1 | 2 };
  loserConsumer?: { node: Node; slotIndex: 1 | 2 };
}

function resolve(input: Input): Slot {
  if (input.kind === "seed") {
    return input.playerId ? { kind: "PLAYER", id: input.playerId } : DEAD;
  }
  return input.which === "winner" ? input.node.output : input.node.loserOutput;
}

function makeNode(bracketSide: BracketSide, round: number, position: number, input1: Input, input2: Input): Node {
  const slot1 = resolve(input1);
  const slot2 = resolve(input2);
  const node: Node = {
    bracketSide,
    round,
    position,
    input1,
    input2,
    slot1,
    slot2,
    output: combine(slot1, slot2),
    loserOutput: loserOf(slot1, slot2),
  };
  if (input1.kind === "ref") {
    if (input1.which === "winner") input1.node.winnerConsumer = { node, slotIndex: 1 };
    else input1.node.loserConsumer = { node, slotIndex: 1 };
  }
  if (input2.kind === "ref") {
    if (input2.which === "winner") input2.node.winnerConsumer = { node, slotIndex: 2 };
    else input2.node.loserConsumer = { node, slotIndex: 2 };
  }
  return node;
}

/** Builds the winners bracket (also used standalone for single elimination). */
function buildWinnersBracket(tournamentId: string, players: SeededPlayer[], isDoubleElim: boolean) {
  const n = players.length;
  const size = nextPowerOfTwo(n);
  const rounds = Math.log2(size);
  const order = seedOrder(size);
  const bySeed = new Map(players.map((p) => [p.seed, p.id]));
  const playerForSeed = (seed: number): string | null => (seed <= n ? (bySeed.get(seed) ?? null) : null);

  const roundsNodes: Node[][] = [];

  const round1: Node[] = [];
  for (let i = 0; i < size / 2; i++) {
    const seedA = order[2 * i];
    const seedB = order[2 * i + 1];
    round1.push(
      makeNode(
        isDoubleElim ? "WINNERS" : "WINNERS",
        1,
        i,
        { kind: "seed", playerId: playerForSeed(seedA) },
        { kind: "seed", playerId: playerForSeed(seedB) }
      )
    );
  }
  roundsNodes.push(round1);

  for (let r = 2; r <= rounds; r++) {
    const prev = roundsNodes[r - 2];
    const current: Node[] = [];
    for (let i = 0; i < prev.length / 2; i++) {
      current.push(
        makeNode(
          "WINNERS",
          r,
          i,
          { kind: "ref", node: prev[2 * i], which: "winner" },
          { kind: "ref", node: prev[2 * i + 1], which: "winner" }
        )
      );
    }
    roundsNodes.push(current);
  }

  return { roundsNodes, rounds, size };
}

/** Builds the losers bracket for a double-elimination tournament of `rounds` winners rounds. */
function buildLosersBracket(winnersRounds: Node[][], rounds: number) {
  if (rounds < 2) return [] as Node[][];
  const losersRounds: Node[][] = [];

  // LR1: pair up losers of WR1 among themselves.
  const wr1 = winnersRounds[0];
  const lr1: Node[] = [];
  for (let i = 0; i < wr1.length / 2; i++) {
    lr1.push(
      makeNode(
        "LOSERS",
        1,
        i,
        { kind: "ref", node: wr1[2 * i], which: "loser" },
        { kind: "ref", node: wr1[2 * i + 1], which: "loser" }
      )
    );
  }
  losersRounds.push(lr1);

  let prevConsolidation = lr1;
  for (let k = 1; k <= rounds - 2; k++) {
    // Drop-in round: winners of the previous losers round vs losers of WR[k+1].
    const wrLosers = winnersRounds[k]; // WR round k+1 (0-indexed array -> index k)
    const dropIn: Node[] = [];
    for (let i = 0; i < prevConsolidation.length; i++) {
      dropIn.push(
        makeNode(
          "LOSERS",
          losersRounds.length + 1,
          i,
          { kind: "ref", node: prevConsolidation[i], which: "winner" },
          { kind: "ref", node: wrLosers[i], which: "loser" }
        )
      );
    }
    losersRounds.push(dropIn);

    if (k === rounds - 2) break; // this was the losers final

    // Consolidation round: pair up winners of the drop-in round.
    const consolidation: Node[] = [];
    for (let i = 0; i < dropIn.length / 2; i++) {
      consolidation.push(
        makeNode(
          "LOSERS",
          losersRounds.length + 1,
          i,
          { kind: "ref", node: dropIn[2 * i], which: "winner" },
          { kind: "ref", node: dropIn[2 * i + 1], which: "winner" }
        )
      );
    }
    losersRounds.push(consolidation);
    prevConsolidation = consolidation;
  }

  return losersRounds;
}

function nodesToDrafts(
  tournamentId: string,
  allNodes: Node[],
  extra?: (n: Node, id: string) => Partial<MatchDraft>
): { drafts: MatchDraft[]; idOf: Map<Node, string> } {
  const idOf = new Map<Node, string>();
  const drafts: MatchDraft[] = [];

  for (const node of allNodes) {
    if (node.output.kind === "DEAD") continue;
    idOf.set(node, newId());
  }

  for (const node of allNodes) {
    const id = idOf.get(node);
    if (!id) continue;

    const player1Id = node.slot1.kind === "PLAYER" ? node.slot1.id : null;
    const player2Id = node.slot2.kind === "PLAYER" ? node.slot2.id : null;
    const isBye = node.output.kind === "PLAYER";

    const winnerConsumerId = node.winnerConsumer && idOf.get(node.winnerConsumer.node);
    const loserExists = node.loserOutput.kind !== "DEAD";
    const loserConsumerId = loserExists ? node.loserConsumer && idOf.get(node.loserConsumer.node) : undefined;

    drafts.push({
      id,
      tournamentId,
      stage: "BRACKET",
      bracketSide: node.bracketSide,
      round: node.round,
      position: node.position,
      poolId: null,
      player1Id,
      player2Id,
      winnerId: isBye ? (node.output as { kind: "PLAYER"; id: string }).id : null,
      status: isBye ? "COMPLETE" : "PENDING",
      nextMatchId: winnerConsumerId ?? null,
      nextMatchSlot: winnerConsumerId ? node.winnerConsumer!.slotIndex : null,
      nextLoserMatchId: loserConsumerId ?? null,
      nextLoserMatchSlot: loserConsumerId ? node.loserConsumer!.slotIndex : null,
      isBracketReset: false,
      ...(extra ? extra(node, id) : {}),
    });
  }

  return { drafts, idOf };
}

export function generateSingleElimination(tournamentId: string, players: SeededPlayer[]): MatchDraft[] {
  if (players.length < 2) return [];
  const { roundsNodes } = buildWinnersBracket(tournamentId, players, false);
  const allNodes = roundsNodes.flat();
  const { drafts } = nodesToDrafts(tournamentId, allNodes, () => ({ bracketSide: null }));
  return drafts;
}

export function generateDoubleElimination(tournamentId: string, players: SeededPlayer[]): MatchDraft[] {
  if (players.length < 2) return [];
  const { roundsNodes, rounds } = buildWinnersBracket(tournamentId, players, true);

  if (rounds === 1) {
    // Only 2-3 players: winners bracket final IS the only match; run it back
    // as a single grand final if the "loser" of round 1 wants a rematch is
    // overkill for 2 players, so just treat this like single elimination.
    const { drafts } = nodesToDrafts(tournamentId, roundsNodes.flat());
    return drafts;
  }

  const losersRounds = buildLosersBracket(roundsNodes, rounds);
  const wrFinal = roundsNodes[roundsNodes.length - 1][0];
  const lrFinal = losersRounds[losersRounds.length - 1][0];

  const grandFinal = makeNode(
    "GRAND_FINAL",
    1,
    0,
    { kind: "ref", node: wrFinal, which: "winner" },
    { kind: "ref", node: lrFinal, which: "winner" }
  );

  const allNodes = [...roundsNodes.flat(), ...losersRounds.flat(), grandFinal];
  const { drafts } = nodesToDrafts(tournamentId, allNodes);
  return drafts;
}
