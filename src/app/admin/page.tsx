import { listAllEvents } from "@/lib/eventData";
import { AllTournamentsList } from "@/components/AllTournamentsList";

// This lists live tournament data — never prerender/cache it statically.
export const dynamic = "force-dynamic";

export default async function AllTournamentsPage() {
  const events = await listAllEvents();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">All tournaments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {events.length} {events.length === 1 ? "event" : "events"} across everyone who has created one.
        </p>
      </div>

      <AllTournamentsList events={events} />
    </div>
  );
}
