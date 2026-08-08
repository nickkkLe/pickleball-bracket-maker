# Pickleball Bracket Maker

Create a tournament, seed your players, and share one link. Players check themselves in and enter their own match scores from their phones — the bracket, pool standings, and seeding update live for everyone watching.

## Features

- **Multiple brackets per event**: one event (e.g. "Club Championship") can hold several brackets/divisions (Men's Doubles, Mixed Doubles, skill levels, etc.), each independently seeded and scored. A QR code on the event dashboard links to a public page where players pick which bracket they're in; if an event only has one bracket, that picker step is skipped automatically.
- **Four formats per bracket**: single elimination, double elimination, round robin (1+ pools), and pool play + an elimination playoff bracket.
- **Flexible seeding**: add players manually, bulk-import via CSV (`name, rating`), randomize, or seed by rating. Seeds are editable up to the moment the bracket is generated.
- **No-login check-in**: players get a short code (and a personal link) from the organizer. They enter it once, check in, and see their own upcoming match.
- **Self-serve scoring**: whichever player is in a match can submit its score from their own page; the admin dashboard can also enter or override any score. A double-elimination bracket's winners/losers routing — including byes and the losers-bracket "bracket reset" game — is handled automatically.
- **Live-ish updates**: pages poll lightly in the background so the bracket, standings, and check-in list stay current without anyone refreshing.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4
- [Prisma ORM 7](https://www.prisma.io) with the `pg` driver adapter, targeting Postgres
- Deploys to [Vercel](https://vercel.com); the free tier of [Neon](https://neon.tech) (or Vercel's own Postgres integration, which is Neon under the hood) works well for the database

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a Postgres database for local dev. The easiest option — no Docker, no separate signup — is Prisma's own local dev server:

   ```bash
   npx prisma dev
   ```

   This prints a connection string; put it in `.env` as `DATABASE_URL`. (A `.env` pointed at a local instance is already set up if you're continuing from this session.) Alternatively, point `DATABASE_URL` at any Postgres instance, including a free Neon project — see below.

3. Apply the schema:

   ```bash
   npm run db:migrate
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Deploying to Vercel + Neon

1. **Push this repo to GitHub** (or GitLab/Bitbucket).

2. **Create a Neon database**: go to [neon.tech](https://neon.tech), create a free project, and copy the connection string it gives you (use the pooled connection string — Neon labels it for you). Alternatively, in Vercel: Project → Storage → Create Database → Postgres, which provisions the same thing and wires the env var for you automatically.

3. **Import the project into Vercel** (vercel.com/new) and set these Environment Variables:
   - `DATABASE_URL` — the Neon connection string from step 2 (skip this if you used Vercel's own Postgres integration; it sets this for you).
   - `NEXT_PUBLIC_SITE_URL` — your production URL, e.g. `https://your-project.vercel.app` (used to build the shareable link shown on the admin dashboard; the app still works without it, it just falls back to a relative link).
   - `ADMIN_PASSCODE` — change this from the default (`pickleball`) before sharing your deployed URL publicly. Every `/admin/*` page is gated behind this single shared passcode (see [Known limitations](#known-limitations)).

4. **Run the migration against production** once, from your machine, pointed at the same `DATABASE_URL` you gave Vercel:

   ```bash
   DATABASE_URL="<your neon connection string>" npm run db:deploy
   ```

   (`db:deploy` runs `prisma migrate deploy`, which applies existing migrations without generating new ones — the right command for production.)

5. **Deploy.** Vercel's build runs `prisma generate && next build` automatically (see `package.json`). Every subsequent `git push` redeploys.

If you add or change anything in `prisma/schema.prisma` later, run `npm run db:migrate` locally to create a new migration file, commit it, then run `npm run db:deploy` against production before or right after deploying the code that depends on it.

## How it's organized

Every tournament you create belongs to an **event** — that's what lets one physical event (e.g. a club championship) hold multiple brackets (Men's Doubles, Mixed Doubles, etc.). Creating your first bracket from the home page creates both automatically; add more brackets to the same event from its event dashboard.

- **Event dashboard** — `/admin/e/[eventAdminToken]`. Shows the QR code and public link for the whole event, lists every bracket in it, and has a form to add another bracket. Reach it from any of its brackets' admin pages via "Manage all brackets" / "Add another bracket".
- **Bracket admin dashboard** — `/admin/[adminToken]`. The link is generated when a bracket is created and isn't shown anywhere public; treat it like a password. From here you manage players, open check-in, generate the bracket, and enter/override scores.
- **Public event page** — `/e/[slug]`. What the QR code points to. Lists every bracket in the event so a player can pick which one they're in; if the event only has one bracket, this redirects straight to it.
- **Public bracket page** — `/t/[slug]`. Share this (or the event page) with players and spectators. Shows seeding/roster, standings, and the live bracket. Has a box for players to enter their code.
- **Player page** — `/t/[slug]/p/[code]`. A player's own view: check in, see their current match and court, submit their score, and see their result history. Only someone who knows a player's code can check them in or submit scores for their matches — the server verifies the code owns the match before accepting a score, both from this page and if called directly. A player entered in more than one bracket at the same event gets a separate code per bracket.

## Known limitations

- **Scores can't be edited once a match is marked final.** Correcting a bad entry isn't supported yet — un-doing a completed match would need to walk back anything that already advanced because of it (byes it triggered, a bracket-reset game it caused, and so on). If this matters for your event, the safest fix today is to edit the row directly in the database.
- **No dispute/confirmation step.** Either player's score submission is taken as final immediately; there's no "both players confirm" flow. For casual/rec play this is usually fine — for anything higher-stakes, an admin can act as the sole scorekeeper instead of opening scoring to players.
- **Court assignment is manual and freeform** (a plain text field per match) — there's no court-count setting or auto-assignment.
- **The admin passcode is one shared word, not per-tournament auth.** It's a light deterrent (set via `ADMIN_PASSCODE`, defaults to `pickleball`) that gates the whole `/admin` area behind a single "quick screen" — anyone who has the passcode and finds/guesses an admin URL can manage that tournament. The tournament-specific admin link itself (a long random token) is still the real access control; the passcode is an extra speed bump on top, not a replacement for it.
