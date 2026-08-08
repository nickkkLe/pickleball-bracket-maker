"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { reportActionError } from "@/lib/actionError";

type FormAction = (formData: FormData) => Promise<void>;
type PlainAction = () => Promise<void>;

export function ActionButton({
  action,
  children,
  confirmMessage,
  variant = "default",
}: {
  action: PlainAction;
  children: React.ReactNode;
  confirmMessage?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            await action();
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
    >
      {pending ? "Working…" : children}
    </Button>
  );
}

export function GenerateBracketForm({ action }: { action: FormAction }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          try {
            await action(fd);
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Checkbox id="checkedInOnly" name="checkedInOnly" defaultChecked />
        <Label htmlFor="checkedInOnly">Only include checked-in players</Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate bracket & start"}
      </Button>
    </form>
  );
}
