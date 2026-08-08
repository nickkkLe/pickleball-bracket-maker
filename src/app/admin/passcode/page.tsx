import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PasscodeForm } from "./PasscodeForm";

export default async function AdminPasscodePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-14">
      <div className="mb-6 text-center">
        <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Admin access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the admin passcode to continue.</p>
      </div>
      <Card>
        <CardContent>
          <PasscodeForm next={next && next.startsWith("/") ? next : "/admin"} />
        </CardContent>
      </Card>
    </div>
  );
}
