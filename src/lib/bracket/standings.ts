export interface StandingsMatchInput {
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  player1Score: number | null;
  player2Score: number | null;
  status: string;
}

export interface StandingRow {
  playerId: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  played: number;
  winPct: number;
}

export function computeStandings(playerIds: string[], matches: StandingsMatchInput[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const id of playerIds) {
    rows.set(id, { playerId: id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, played: 0, winPct: 0 });
  }

  for (const m of matches) {
    if (m.status !== "COMPLETE" || !m.winnerId || !m.player1Id || !m.player2Id) continue;
    const p1 = rows.get(m.player1Id);
    const p2 = rows.get(m.player2Id);
    const s1 = m.player1Score ?? 0;
    const s2 = m.player2Score ?? 0;
    if (p1) {
      p1.played += 1;
      p1.pointsFor += s1;
      p1.pointsAgainst += s2;
      if (m.winnerId === m.player1Id) p1.wins += 1;
      else p1.losses += 1;
    }
    if (p2) {
      p2.played += 1;
      p2.pointsFor += s2;
      p2.pointsAgainst += s1;
      if (m.winnerId === m.player2Id) p2.wins += 1;
      else p2.losses += 1;
    }
  }

  const result = [...rows.values()].map((r) => ({
    ...r,
    pointDiff: r.pointsFor - r.pointsAgainst,
    winPct: r.played > 0 ? r.wins / r.played : 0,
  }));

  result.sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff || b.pointsFor - a.pointsFor);

  return result;
}
