import { Trophy } from "lucide-react";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { YourDashboards } from "@/components/YourDashboards";
import { createTournament } from "@/app/actions";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-14 sm:py-20">
      <YourDashboards />
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Trophy className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Run a tournament from your phone</h1>
        <p className="mx-auto mt-2.5 max-w-md text-sm text-muted-foreground sm:text-base">
          Set the format, seed your players, share one link. Players check themselves in and enter their own
          scores — you just watch the bracket fill in. Need more than one bracket (e.g. Men&apos;s, Women&apos;s,
          Mixed)? Add more from the dashboard after creating your first one.
        </p>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="sr-only">New tournament</CardHeader>
        <CardContent>
          <CreateTournamentForm action={createTournament} />
        </CardContent>
      </Card>
    </div>
  );
}
