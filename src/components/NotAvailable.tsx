import Link from "next/link";
import { Ban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NotAvailable({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Ban className="size-5" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Link href="/" className={buttonVariants({ variant: "default" }) + " mt-6"}>
        Go home
      </Link>
    </div>
  );
}
