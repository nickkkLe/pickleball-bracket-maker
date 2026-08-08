"use client";

import { useState, useTransition } from "react";
import { ScoreForm } from "@/components/ScoreForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MatchView } from "@/lib/tournamentData";

export function AdminMatchActions({
  match,
  recordScore,
  editScore,
  setCourt,
}: {
  match: MatchView;
  recordScore: (formData: FormData) => Promise<void>;
  editScore: (formData: FormData) => Promise<void>;
  setCourt: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const canScore = match.status !== "COMPLETE" && match.player1 && match.player2;
  const canEdit = match.status === "COMPLETE" && match.player1 && match.player2;

  return (
    <div className="space-y-2">
      {canScore && <ScoreForm matchId={match.id} player1Name={match.player1!.name} player2Name={match.player2!.name} action={recordScore} />}

      {canEdit && !editing && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Final: {match.player1Score}-{match.player2Score}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setEditing(true)}>
            Edit score
          </Button>
        </div>
      )}

      {canEdit && editing && (
        <ScoreForm
          matchId={match.id}
          player1Name={match.player1!.name}
          player2Name={match.player2!.name}
          action={editScore}
          defaultPlayer1Score={match.player1Score}
          defaultPlayer2Score={match.player2Score}
          submitLabel="Save correction"
          savingLabel="Saving…"
          onSuccess={() => setEditing(false)}
        />
      )}

      <form action={(fd) => startTransition(() => setCourt(fd))} className="flex items-center gap-1.5">
        <input type="hidden" name="matchId" value={match.id} />
        <Input key={match.court ?? ""} name="court" defaultValue={match.court ?? ""} placeholder="Court" className="h-7 min-w-0 flex-1 text-xs" />
        <Button type="submit" variant="outline" size="sm" disabled={pending} className="h-7 text-[11px]">
          Set
        </Button>
      </form>
    </div>
  );
}
