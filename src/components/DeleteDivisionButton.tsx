"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { reportActionError } from "@/lib/actionError";

export function DeleteDivisionButton({
  name,
  action,
  redirectTo,
  variant = "icon",
}: {
  name: string;
  action: () => Promise<void>;
  /** Navigate here client-side after a successful delete (e.g. when deleting
   * the bracket whose own admin page you're currently on). Omit when the
   * button lives on a list that should just refresh in place. */
  redirectTo?: string;
  variant?: "icon" | "full";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
      } catch (e) {
        reportActionError(e);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant === "icon" ? (
        <DialogTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${name}`} />}
        >
          <Trash2 className="size-3.5" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
          <Trash2 className="size-3.5" />
          Delete bracket
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{name}&quot;?</DialogTitle>
          <DialogDescription>This permanently deletes this bracket, its players, and all match results. This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
