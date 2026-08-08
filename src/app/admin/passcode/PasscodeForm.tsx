"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reportActionError } from "@/lib/actionError";
import { submitAdminPasscode } from "./actions";

export function PasscodeForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          try {
            await submitAdminPasscode(fd);
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="passcode">Passcode</Label>
        <Input id="passcode" name="passcode" type="password" required autoFocus className="h-10" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
