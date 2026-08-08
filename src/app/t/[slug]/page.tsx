import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { loadTournamentBySlug, matchesToView } from "@/lib/tournamentData";
import { BracketView } from "@/components/BracketView";
import { PoolStandings } from "@/components/PoolStandings";
import { PoolMatchList } from "@/components/PoolMatchList";
import { LiveRefresher } from "@/components/LiveRefresher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotAvailable } from "@/components/NotAvailable";
import { CodeEntryForm } from "./CodeEntryForm";
import { goToPlayerPage } from "./actions";

const STATUS_META: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  DRAFT: { label: "Not started", variant: "outline" },
  CHECK_IN: { label: "Check-in open", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  COMPLETE: { label: "Complete", variant: "secondary" },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIM: "Single elimination",
  DOUBLE_ELIM: "Double elimination",
  ROUND_ROBIN: "Round robin",
  POOL_PLAY: "Pool play + bracket",
};

export default async function PublicTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadTournamentBySlug(slug);
  if (!data) {
    return <NotAvailable title="This tournament isn't available" description="It may have been deleted, or the link is incorrect." />;
  }

  const { tournament, event, players, playerById, bracketMatches, poolStandings } = data;
  const sortedPlayers = [...players].sort((a, b) => a.seed - b.seed);
  const checkedInCount = players.filter((p) => p.checkedIn).length;
  const status = STATUS_META[tournament.status];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <LiveRefresher />
      <div className="mb-8 text-center">
        {event.divisionCount > 1 && (
          <div>
            <Link href={`/e/${event.slug}`} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3" />
              {event.name} — all brackets
            </Link>
          </div>
        )}
        <Badge variant={status.variant} className="mb-2">
          {status.label}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{tournament.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{FORMAT_LABEL[tournament.format]}</p>
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-muted-foreground" />
            Playing in this tournament?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Enter the code the organizer gave you to check in and enter your scores.</p>
          <CodeEntryForm action={goToPlayerPage.bind(null, slug)} />
        </CardContent>
      </Card>

      {bracketMatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{tournament.format === "POOL_PLAY" ? "Playoff bracket" : "Bracket"}</CardTitle>
          </CardHeader>
          <CardContent>
            <BracketView matches={matchesToView(bracketMatches, playerById)} />
          </CardContent>
        </Card>
      )}

      {poolStandings.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pool standings</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolStandings pools={poolStandings} playerById={playerById} advancePerPool={tournament.format === "POOL_PLAY" ? tournament.advancePerPool : undefined} />
          </CardContent>
        </Card>
      )}

      {data.poolMatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pool matches</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolMatchList pools={data.pools} matches={matchesToView(data.poolMatches, playerById)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tournament.status === "DRAFT" ? "Registered players" : `Roster (${checkedInCount}/${players.length} checked in)`}</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players registered yet.</p>
          ) : (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {sortedPlayers.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground tabular-nums">#{p.seed}</span>
                    <span>{p.name}</span>
                  </span>
                  {tournament.status !== "DRAFT" && (
                    <Badge variant={p.checkedIn ? "secondary" : "outline"} className="text-[10px]">
                      {p.checkedIn ? "Checked in" : "Not yet"}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
