import { prisma } from "@/lib/prisma";
import { computeStandings, type StandingRow } from "@/lib/bracket/standings";
import type { AuditLogEntry, Match, Player, Pool, Tournament } from "@/generated/prisma/client";

export interface MatchView {
  id: string;
  stage: string;
  bracketSide: string | null;
  round: number;
  position: number;
  poolId: string | null;
  player1: { id: string; name: string; seed: number } | null;
  player2: { id: string; name: string; seed: number } | null;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: string | null;
  status: string;
  court: string | null;
  isBracketReset: boolean;
  nextMatchId: string | null;
}

export interface PoolStandingsData {
  pool: Pool;
  standings: StandingRow[];
}

export interface TournamentData {
  tournament: Tournament;
  event: { id: string; name: string; slug: string; adminToken: string; divisionCount: number };
  players: Player[];
  pools: Pool[];
  playerById: Map<string, Player>;
  poolMatches: Match[];
  bracketMatches: Match[];
  poolStandings: PoolStandingsData[];
  auditLog: AuditLogEntry[];
}

function toView(m: Match, playerById: Map<string, Player>): MatchView {
  const p1 = m.player1Id ? playerById.get(m.player1Id) : null;
  const p2 = m.player2Id ? playerById.get(m.player2Id) : null;
  return {
    id: m.id,
    stage: m.stage,
    bracketSide: m.bracketSide,
    round: m.round,
    position: m.position,
    poolId: m.poolId,
    player1: p1 ? { id: p1.id, name: p1.name, seed: p1.seed } : null,
    player2: p2 ? { id: p2.id, name: p2.name, seed: p2.seed } : null,
    player1Score: m.player1Score,
    player2Score: m.player2Score,
    winnerId: m.winnerId,
    status: m.status,
    court: m.court,
    isBracketReset: m.isBracketReset,
    nextMatchId: m.nextMatchId,
  };
}

async function loadTournament(where: { slug: string } | { adminToken: string } | { id: string }): Promise<TournamentData | null> {
  const tournament = await prisma.tournament.findUnique({ where, include: { event: true } });
  if (!tournament) return null;

  const [players, pools, matches, divisionCount, auditLog] = await Promise.all([
    prisma.player.findMany({ where: { tournamentId: tournament.id }, orderBy: { seed: "asc" } }),
    prisma.pool.findMany({ where: { tournamentId: tournament.id }, orderBy: { name: "asc" } }),
    prisma.match.findMany({ where: { tournamentId: tournament.id }, orderBy: [{ round: "asc" }, { position: "asc" }] }),
    prisma.tournament.count({ where: { eventId: tournament.eventId } }),
    prisma.auditLogEntry.findMany({ where: { tournamentId: tournament.id }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const poolMatches = matches.filter((m) => m.stage === "POOL");
  const bracketMatches = matches.filter((m) => m.stage === "BRACKET");

  const poolStandings: PoolStandingsData[] = pools.map((pool) => {
    const poolPlayerIds = players.filter((p) => p.poolId === pool.id).map((p) => p.id);
    const relevantMatches = poolMatches.filter((m) => m.poolId === pool.id);
    return { pool, standings: computeStandings(poolPlayerIds, relevantMatches) };
  });

  const { event: eventRelation, ...tournamentOnly } = tournament;

  return {
    tournament: tournamentOnly,
    event: { id: eventRelation.id, name: eventRelation.name, slug: eventRelation.slug, adminToken: eventRelation.adminToken, divisionCount },
    players,
    pools,
    playerById,
    poolMatches,
    bracketMatches,
    poolStandings,
    auditLog,
  };
}

export function loadTournamentBySlug(slug: string) {
  return loadTournament({ slug });
}

export function loadTournamentByAdminToken(adminToken: string) {
  return loadTournament({ adminToken });
}

export function matchesToView(matches: Match[], playerById: Map<string, Player>): MatchView[] {
  return matches.map((m) => toView(m, playerById));
}
