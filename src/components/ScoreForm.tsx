"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportActionError } from "@/lib/actionError";

export function ScoreForm({
  matchId,
  player1Name,
  player2Name,
  action,
}: {
  matchId: string;
  player1Name: string;
  player2Name: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          try {
            await action(formData);
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
      className="space-y-2"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-2">
        <span className="w-28 truncate text-xs text-muted-foreground">{player1Name}</span>
        <Input name="player1Score" type="number" required min={0} inputMode="numeric" className="h-8 w-16 text-center" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-28 truncate text-xs text-muted-foreground">{player2Name}</span>
        <Input name="player2Score" type="number" required min={0} inputMode="numeric" className="h-8 w-16 text-center" />
      </div>
      <Button type="submit" disabled={pending} size="sm" className="w-full">
        {pending ? "Saving…" : "Submit score"}
      </Button>
    </form>
  );
}
