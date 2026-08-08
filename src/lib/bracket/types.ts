export type BracketSide = "WINNERS" | "LOSERS" | "GRAND_FINAL";
export type MatchStageKind = "POOL" | "BRACKET";
export type MatchStatusKind = "PENDING" | "READY" | "COMPLETE";

export interface MatchDraft {
  id: string;
  tournamentId: string;
  stage: MatchStageKind;
  bracketSide: BracketSide | null;
  round: number;
  position: number;
  poolId: string | null;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  status: MatchStatusKind;
  nextMatchId: string | null;
  nextMatchSlot: number | null;
  nextLoserMatchId: string | null;
  nextLoserMatchSlot: number | null;
  isBracketReset: boolean;
}

export interface SeededPlayer {
  id: string;
  seed: number;
}
