import { MapPin } from "lucide-react";
import { ScoreForm } from "@/components/ScoreForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MatchView } from "@/lib/tournamentData";

export function PlayerScoreCard({
  match,
  myPlayerId,
  recordScore,
}: {
  match: MatchView;
  myPlayerId: string;
  recordScore: (formData: FormData) => Promise<void>;
}) {
  const iAmPlayer1 = match.player1?.id === myPlayerId;
  const opponent = iAmPlayer1 ? match.player2 : match.player1;

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-1.5 text-[10px] text-muted-foreground">
              {match.stage === "POOL" ? "Pool match" : match.bracketSide === "LOSERS" ? "Losers bracket" : match.bracketSide === "GRAND_FINAL" ? "Grand final" : "Bracket"}
            </Badge>
            <p className="text-lg font-semibold">vs {opponent?.name ?? "Bye"}</p>
          </div>
          {match.court && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />
              Court {match.court}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScoreForm
          matchId={match.id}
          player1Name={iAmPlayer1 ? "You" : (match.player1?.name ?? "Player 1")}
          player2Name={!iAmPlayer1 ? "You" : (match.player2?.name ?? "Player 2")}
          action={recordScore}
        />
      </CardContent>
    </Card>
  );
}
