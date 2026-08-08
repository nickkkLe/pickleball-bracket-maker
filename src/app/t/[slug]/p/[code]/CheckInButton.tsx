"use client";

import { useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reportActionError } from "@/lib/actionError";

export function CheckInButton({ checkedIn, action }: { checkedIn: boolean; action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  if (checkedIn) {
    return (
      <Badge variant="secondary" className="shrink-0 gap-1">
        <CircleCheck className="size-3" />
        Checked in
      </Badge>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      className="shrink-0"
      onClick={() => {
        startTransition(async () => {
          try {
            await action();
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
    >
      {pending ? "Checking in…" : "Check in"}
    </Button>
  );
}
