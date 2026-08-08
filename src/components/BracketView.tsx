import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import type { MatchView } from "@/lib/tournamentData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BracketColumns, type ConnectorItem } from "@/components/BracketConnectors";

function StatusBadge({ m }: { m: MatchView }) {
  if (m.status === "COMPLETE") {
    return (
      <Badge variant="secondary" className="text-[10px]">
        Final
      </Badge>
    );
  }
  if (m.player1 && m.player2) {
    return (
      <Badge className="bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-400" variant="outline">
        In progress
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      Waiting
    </Badge>
  );
}

function PlayerRow({
  player,
  score,
  isWinner,
  isComplete,
  highlight,
}: {
  player: { id: string; name: string; seed: number } | null;
  score: number | null;
  isWinner: boolean;
  isComplete: boolean;
  highlight?: string;
}) {
  const isBye = player === null && isComplete;
  const isTbd = player === null && !isComplete;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-1.5 text-sm",
        isComplete && !isWinner && !isBye && "text-muted-foreground",
        player?.id === highlight && "bg-primary/5"
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {player && <span className="w-4 shrink-0 text-[10px] font-medium text-muted-foreground tabular-nums">{player.seed}</span>}
        <span className={cn("truncate font-medium", isTbd && "text-muted-foreground/60 italic")}>
          {player ? player.name : isBye ? "Bye" : "TBD"}
        </span>
      </span>
      {score !== null && <span className={cn("shrink-0 font-mono text-xs tabular-nums", isWinner && "font-bold text-foreground")}>{score}</span>}
    </div>
  );
}

function MatchCard({ match, highlightPlayerId, renderActions }: { match: MatchView; highlightPlayerId?: string; renderActions?: (m: MatchView) => ReactNode }) {
  const isComplete = match.status === "COMPLETE";
  const isHighlighted = match.player1?.id === highlightPlayerId || match.player2?.id === highlightPlayerId;
  const actions = renderActions?.(match);

  return (
    <div
      className={cn(
        "w-64 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        isHighlighted ? "border-primary ring-1 ring-primary/30" : "border-border"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-2.5 py-1">
        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          {match.isBracketReset ? (
            "Bracket reset"
          ) : match.court ? (
            <>
              <MapPin className="size-3" />
              Court {match.court}
            </>
          ) : (
            " "
          )}
        </span>
        <StatusBadge m={match} />
      </div>
      <div className="divide-y divide-border/70">
        <PlayerRow player={match.player1} score={match.player1Score} isWinner={match.winnerId === match.player1?.id} isComplete={isComplete} highlight={highlightPlayerId} />
        <PlayerRow player={match.player2} score={match.player2Score} isWinner={match.winnerId === match.player2?.id} isComplete={isComplete} highlight={highlightPlayerId} />
      </div>
      {actions && <div className="border-t border-border/70 bg-muted/20 p-2">{actions}</div>}
    </div>
  );
}

function roundLabel(side: string | null, round: number, roundsInSide: number): string {
  if (side === "GRAND_FINAL") return round === 2 ? "Bracket Reset" : "Grand Final";
  const fromEnd = roundsInSide - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Quarterfinal";
  return `Round ${round}`;
}

function BracketSection({
  title,
  matches,
  highlightPlayerId,
  renderActions,
}: {
  title: string | null;
  matches: MatchView[];
  highlightPlayerId?: string;
  renderActions?: (m: MatchView) => ReactNode;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const side = matches[0]?.bracketSide ?? null;
  const roundLabels = Object.fromEntries(rounds.map((r) => [r, roundLabel(side, r, rounds.length)]));

  const items: ConnectorItem[] = matches.map((m) => ({
    id: m.id,
    round: m.round,
    position: m.position,
    nextMatchId: m.nextMatchId,
    content: <MatchCard match={m} highlightPlayerId={highlightPlayerId} renderActions={renderActions} />,
  }));

  return (
    <div>
      {title && <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>}
      <BracketColumns items={items} roundLabels={roundLabels} />
    </div>
  );
}

export function BracketView({
  matches,
  highlightPlayerId,
  renderActions,
}: {
  matches: MatchView[];
  highlightPlayerId?: string;
  renderActions?: (m: MatchView) => ReactNode;
}) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">No bracket yet.</p>;
  }

  const isSingle = matches.every((m) => m.bracketSide === null);
  if (isSingle) {
    return <BracketSection title={null} matches={matches} highlightPlayerId={highlightPlayerId} renderActions={renderActions} />;
  }

  const winners = matches.filter((m) => m.bracketSide === "WINNERS");
  const losers = matches.filter((m) => m.bracketSide === "LOSERS");
  const grandFinal = matches.filter((m) => m.bracketSide === "GRAND_FINAL");

  return (
    <div className="space-y-8">
      {winners.length > 0 && <BracketSection title="Winners Bracket" matches={winners} highlightPlayerId={highlightPlayerId} renderActions={renderActions} />}
      {grandFinal.length > 0 && <BracketSection title="Grand Final" matches={grandFinal} highlightPlayerId={highlightPlayerId} renderActions={renderActions} />}
      {losers.length > 0 && <BracketSection title="Losers Bracket" matches={losers} highlightPlayerId={highlightPlayerId} renderActions={renderActions} />}
    </div>
  );
}
