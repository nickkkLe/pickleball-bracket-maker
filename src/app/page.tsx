import Link from "next/link";
import { Trophy, LayoutDashboard, Lock } from "lucide-react";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { YourDashboards } from "@/components/YourDashboards";
import { AllTournamentsList } from "@/components/AllTournamentsList";
import { PublicTournamentsList } from "@/components/PublicTournamentsList";
import { createTournament } from "@/app/actions";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAllEvents, listAllEventsPublic } from "@/lib/eventData";

// This lists live tournament data — never prerender/cache it statically.
export const dynamic = "force-dynamic";

export default async function Home() {
  const isAdmin = await isAdminRequest();

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-14 sm:py-20">
      {isAdmin ? <AdminTournamentsSection /> : <PublicTournamentsSection />}
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
      {isAdmin ? (
        <Card className="shadow-sm">
          <CardHeader className="sr-only">New tournament</CardHeader>
          <CardContent>
            <CreateTournamentForm action={createTournament} />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Lock className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Only the organizer can create a new tournament.</p>
            <Link href="/admin/passcode" className="text-xs font-medium text-primary hover:underline">
              Are you the organizer? Enter the admin passcode
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function AdminTournamentsSection() {
  const events = await listAllEvents();
  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LayoutDashboard className="size-3.5" />
        All tournaments (you&apos;re signed in as admin)
      </h2>
      <AllTournamentsList events={events} />
    </div>
  );
}

async function PublicTournamentsSection() {
  const events = await listAllEventsPublic();
  return (
    <div className="mb-6">
      <YourDashboards />
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LayoutDashboard className="size-3.5" />
        All tournaments
      </h2>
      <PublicTournamentsList events={events} />
    </div>
  );
}
