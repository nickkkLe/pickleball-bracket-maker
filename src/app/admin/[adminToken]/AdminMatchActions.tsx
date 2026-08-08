"use client";

import { useTransition } from "react";
import { ScoreForm } from "@/components/ScoreForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MatchView } from "@/lib/tournamentData";

export function AdminMatchActions({
  match,
  recordScore,
  setCourt,
}: {
  match: MatchView;
  recordScore: (formData: FormData) => Promise<void>;
  setCourt: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const canScore = match.status !== "COMPLETE" && match.player1 && match.player2;

  return (
    <div className="space-y-2">
      {canScore && <ScoreForm matchId={match.id} player1Name={match.player1!.name} player2Name={match.player2!.name} action={recordScore} />}
      <form action={(fd) => startTransition(() => setCourt(fd))} className="flex items-center gap-1.5">
        <input type="hidden" name="matchId" value={match.id} />
        <Input name="court" defaultValue={match.court ?? ""} placeholder="Court" className="h-7 min-w-0 flex-1 text-xs" />
        <Button type="submit" variant="outline" size="sm" disabled={pending} className="h-7 text-[11px]">
          Set
        </Button>
      </form>
    </div>
  );
}
