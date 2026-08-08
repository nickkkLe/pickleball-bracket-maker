import { prisma } from "@/lib/prisma";

export interface DivisionSummary {
  id: string;
  name: string;
  slug: string;
  adminToken: string;
  format: string;
  status: string;
  playerCount: number;
  checkedInCount: number;
}

export interface EventData {
  event: { id: string; name: string; slug: string; adminToken: string };
  divisions: DivisionSummary[];
}

async function loadEvent(where: { slug: string } | { adminToken: string }): Promise<EventData | null> {
  const event = await prisma.event.findUnique({ where });
  if (!event) return null;

  const divisions = await prisma.tournament.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
  });

  const players = await prisma.player.findMany({
    where: { tournamentId: { in: divisions.map((d) => d.id) } },
    select: { tournamentId: true, checkedIn: true },
  });

  const counts = new Map<string, { total: number; checkedIn: number }>();
  for (const p of players) {
    const c = counts.get(p.tournamentId) ?? { total: 0, checkedIn: 0 };
    c.total += 1;
    if (p.checkedIn) c.checkedIn += 1;
    counts.set(p.tournamentId, c);
  }

  return {
    event: { id: event.id, name: event.name, slug: event.slug, adminToken: event.adminToken },
    divisions: divisions.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      adminToken: d.adminToken,
      format: d.format,
      status: d.status,
      playerCount: counts.get(d.id)?.total ?? 0,
      checkedInCount: counts.get(d.id)?.checkedIn ?? 0,
    })),
  };
}

export function loadEventBySlug(slug: string) {
  return loadEvent({ slug });
}

export function loadEventByAdminToken(adminToken: string) {
  return loadEvent({ adminToken });
}

export async function listAllEvents(): Promise<EventData[]> {
  const [events, divisions] = await Promise.all([
    prisma.event.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tournament.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const players = await prisma.player.findMany({
    where: { tournamentId: { in: divisions.map((d) => d.id) } },
    select: { tournamentId: true, checkedIn: true },
  });

  const counts = new Map<string, { total: number; checkedIn: number }>();
  for (const p of players) {
    const c = counts.get(p.tournamentId) ?? { total: 0, checkedIn: 0 };
    c.total += 1;
    if (p.checkedIn) c.checkedIn += 1;
    counts.set(p.tournamentId, c);
  }

  const divisionsByEvent = new Map<string, DivisionSummary[]>();
  for (const d of divisions) {
    const list = divisionsByEvent.get(d.eventId) ?? [];
    list.push({
      id: d.id,
      name: d.name,
      slug: d.slug,
      adminToken: d.adminToken,
      format: d.format,
      status: d.status,
      playerCount: counts.get(d.id)?.total ?? 0,
      checkedInCount: counts.get(d.id)?.checkedIn ?? 0,
    });
    divisionsByEvent.set(d.eventId, list);
  }

  return events.map((event) => ({
    event: { id: event.id, name: event.name, slug: event.slug, adminToken: event.adminToken },
    divisions: divisionsByEvent.get(event.id) ?? [],
  }));
}
