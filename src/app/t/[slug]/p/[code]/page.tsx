import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadTournamentBySlug, matchesToView } from "@/lib/tournamentData";
import { PoolStandings } from "@/components/PoolStandings";
import { LiveRefresher } from "@/components/LiveRefresher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckInButton } from "./CheckInButton";
import { PlayerScoreCard } from "./PlayerScoreCard";
import { playerCheckIn, playerRecordScore } from "../../actions";

export default async function PlayerPage({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const data = await loadTournamentBySlug(slug);
  if (!data) notFound();

  const { tournament, playerById, poolMatches, bracketMatches, poolStandings } = data;
  const player = [...playerById.values()].find((p) => p.code === code);
  if (!player) notFound();

  const allMatches = [...poolMatches, ...bracketMatches];
  const myMatches = allMatches.filter((m) => m.player1Id === player.id || m.player2Id === player.id);
  const myView = matchesToView(myMatches, playerById);

  const readyNow = myView.filter((m) => m.status !== "COMPLETE" && m.player1 && m.player2);
  const waiting = myView.filter((m) => m.status !== "COMPLETE" && !(m.player1 && m.player2));
  const finished = myView.filter((m) => m.status === "COMPLETE").sort((a, b) => b.round - a.round);

  const myPool = player.poolId ? poolStandings.find((ps) => ps.pool.id === player.poolId) : undefined;
  const recordScore = playerRecordScore.bind(null, slug, code) as (fd: FormData) => Promise<void>;

  const wins = finished.filter((m) => m.winnerId === player.id).length;
  const losses = finished.length - wins;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <LiveRefresher />
      <Link href={`/t/${slug}`} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" />
        {tournament.name}
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{player.name}</h1>
          <p className="text-sm text-muted-foreground">
            Seed #{player.seed} {finished.length > 0 && `· ${wins}-${losses}`}
          </p>
        </div>
        <CheckInButton checkedIn={player.checkedIn} action={playerCheckIn.bind(null, slug, code) as () => Promise<void>} />
      </div>

      {readyNow.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Your match</h2>
          {readyNow.map((m) => (
            <PlayerScoreCard key={m.id} match={m} myPlayerId={player.id} recordScore={recordScore} />
          ))}
        </section>
      )}

      {readyNow.length === 0 && waiting.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Up next</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You&apos;re through to {waiting.length === 1 ? "your next match" : "the next round"} — waiting on other results before your opponent is set.
            </p>
          </CardContent>
        </Card>
      )}

      {readyNow.length === 0 && waiting.length === 0 && finished.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">No more matches scheduled for you right now.</p>
          </CardContent>
        </Card>
      )}

      {myPool && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your pool</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolStandings
              pools={[myPool]}
              playerById={playerById}
              advancePerPool={tournament.format === "POOL_PLAY" ? tournament.advancePerPool : undefined}
              highlightPlayerId={player.id}
            />
          </CardContent>
        </Card>
      )}

      {finished.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {finished.map((m) => {
                const opponent = m.player1?.id === player.id ? m.player2 : m.player1;
                const myScore = m.player1?.id === player.id ? m.player1Score : m.player2Score;
                const theirScore = m.player1?.id === player.id ? m.player2Score : m.player1Score;
                const won = m.winnerId === player.id;
                return (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span>
                      {m.stage === "POOL" ? "Pool" : m.bracketSide === "LOSERS" ? "Losers" : m.bracketSide === "GRAND_FINAL" ? "Grand Final" : "Bracket"} vs{" "}
                      {opponent?.name ?? "Bye"}
                    </span>
                    <span className={`font-mono text-xs font-semibold tabular-nums ${won ? "text-foreground" : "text-muted-foreground"}`}>
                      {won ? "W" : "L"} {myScore}–{theirScore}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
