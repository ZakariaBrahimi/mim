# MizaniyaPay Product Roadmap

A fintech-grade, 3-month product delivery roadmap for MizaniyaPay — a Gantt-style
timeline across Mobile App, Partner Platform, Payment Gateway, Admin Dashboard,
Agent Network and Mizaniya Market, backed by live ClickUp data (with a full
mock mode so the app runs and looks realistic with zero configuration).

**Live deployment:** https://mizaniyapay-roadmap.vercel.app — currently
connected to the real MizaniyaPay ClickUp workspace and scoped to
`Release Pipeline`. The timeline window is data-driven (`computeDisplayRange`
in `lib/date-utils.ts`), not hardcoded, so as of now it's showing that list's
actual date range: already-shipped tasks from around June 2026, since that's
the only list with due dates consistently set today. To see genuinely
forward-looking work, add due dates (and ideally start dates) to tasks in
`Features Hub` or `Product Management Space` — the app will pick them up on
the next fetch with no code changes.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + hand-rolled shadcn/ui-style primitives (`components/ui`)
- **TanStack Query** for data fetching/caching/optimistic updates
- **Recharts** for the velocity chart and progress donut
- **Lucide** icons
- **Next.js API routes** as a thin backend — no database

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see "ClickUp integration" below
npm run dev
```

Open http://localhost:3000. With no `.env.local`, the app runs entirely on
the bundled MizaniyaPay seed data (see "Mock mode").

## Architecture

```
app/
  page.tsx                     # Dashboard: composes toolbar, Gantt, analytics, drawer
  layout.tsx                   # Root layout, fonts, QueryProvider
  globals.css                  # Design tokens (CSS vars) + Tailwind layers
  api/clickup/
    tasks/route.ts             # GET roadmap items (mapped ClickUp tasks or mock)
    tasks/[id]/route.ts        # PATCH start/due date or status (drag-and-drop, status update)
    lists/route.ts             # GET ClickUp lists (live mode only)
    milestones/route.ts        # GET curated release milestones
    members/route.ts           # GET workspace members / mock team

components/
  layout/                      # AppSidebar, AppHeader (chrome around the dashboard)
  roadmap/
    roadmap-toolbar.tsx        # Date range / product / team / status filters + CSV export
    roadmap-gantt.tsx          # Product tree + timeline grid, grouping/collapsing
    roadmap-bar.tsx            # Draggable, clickable Gantt bar (per roadmap item)
    milestone-marker.tsx       # Dashed vertical release-milestone markers
    roadmap-drawer.tsx         # Right-hand detail panel (description, tasks, comments…)
    product-icon.tsx
  analytics/
    delivery-overview-cards.tsx
    roadmap-progress-donut.tsx
    velocity-chart.tsx
    product-health.tsx
    upcoming-releases.tsx / key-milestones.tsx / risks-panel.tsx / team-workload.tsx / quick-stats.tsx
  ui/                          # button, card, badge, avatar, select, sheet, tabs, progress, …

lib/
  types.ts                     # RoadmapItem, Milestone, Member, Product, filters…
  status-config.ts             # Status/priority → color + label mapping
  roadmap-stats.ts             # Pure functions deriving all analytics from RoadmapItem[]
  date-utils.ts                # Gantt math: bar positioning, month buckets, formatting
  clickup/
    client.ts                  # Thin ClickUp API v2 fetch wrapper
    types.ts                   # ClickUp API response shapes
    mapper.ts                  # ClickUp task -> RoadmapItem, status/space/priority mapping
    mock-data.ts                # Realistic MizaniyaPay seed dataset (products, members, items, milestones)
    data-source.ts              # Chooses live ClickUp vs. mock per request, with graceful fallback

hooks/
  use-roadmap-data.ts           # useRoadmapItems / useMilestones / useMembers (TanStack Query)
  use-update-roadmap-item.ts    # Drag-and-drop date mutation (optimistic)
  use-update-roadmap-status.ts  # Status update + local comment mutations (optimistic)

providers/query-provider.tsx    # QueryClientProvider + TooltipProvider
```

### Data flow

1. `lib/clickup/data-source.ts` is the single entry point every API route calls.
   It checks whether `CLICKUP_API_TOKEN` / `CLICKUP_WORKSPACE_ID` are set.
2. **Live mode**: fetches every space → list → task from ClickUp
   (`lib/clickup/client.ts`), then `mapper.ts` filters tasks down to the ones
   flagged for the roadmap and converts them into the app's `RoadmapItem` shape.
3. **Mock mode** (no credentials, or a live call throws): falls back to the
   curated dataset in `lib/clickup/mock-data.ts` and tells the UI why
   (`meta.reason`), surfaced as a banner on the dashboard.
4. The client fetches `/api/clickup/*` via TanStack Query hooks; all
   filtering (product/team/status), grouping, and analytics are derived
   client-side with memoized selectors in `lib/roadmap-stats.ts`.

## ClickUp integration

### Environment variables

| Variable | Description |
| --- | --- |
| `CLICKUP_API_TOKEN` | Personal API token (`pk_...`) from ClickUp → Settings → Apps |
| `CLICKUP_WORKSPACE_ID` | The MizaniyaPay workspace ("Team") ID — `90121232813` |
| `CLICKUP_LIST_IDS` | Optional comma-separated List IDs to scope the sync to (see below) |

### Real ClickUp structure

MizaniyaPay's workspace doesn't use one Space per product — it categorizes
tasks with a **workspace-level `Product` dropdown custom field**, confirmed
against the live workspace with these options:

`Admin` · `Client App` · `Partner` · `Market` · `Market Admin` · `Website` ·
`Payment Gataway` (sic) · `MTP`

`lib/clickup/mapper.ts` (`PRODUCT_FIELD_TO_KEY`) maps each option to a
roadmap product — e.g. `Client App` → **Mobile App**, `Payment Gataway` →
**Payment Gateway**. Add an entry there if new options are added to the
field.

### Roadmap eligibility

A task is pulled onto the roadmap when it has the `Product` field set **and**
a due date — most tickets in this workspace are granular dev tasks (bugs,
small stories) without dates, so only the subset your team has actually
scheduled will appear. If a task has a due date but no start date, the app
backfills a 10-day lead time so the Gantt bar still renders with a sensible
width (`DEFAULT_DURATION_DAYS` in `mapper.ts`).

The `Release Version` short-text field, if set, becomes the roadmap item's
version tag (e.g. `v1.4`).

### Scoping the sync with `CLICKUP_LIST_IDS`

The full workspace has 30+ lists — a year of sprint boards, doc spaces, and a
100+-item raw product backlog — which is too much (and too slow) to crawl on
every request, and would flood a PM-level roadmap with individual dev
tickets. Set `CLICKUP_LIST_IDS` to the lists that actually represent
scheduled, feature-level work; for MizaniyaPay that's:

| List | ID | Why |
| --- | --- | --- |
| Release Pipeline | `901213119469` | Shipped/queued work with due dates |
| Features Hub | `901217505734` | Feature-level planning list |
| Product Management Space | `901218217445` | PM-curated roadmap items |

Leave `CLICKUP_LIST_IDS` unset to fall back to a full workspace crawl
(`fetchAllLists` in `client.ts`, including folder-nested lists) — useful for
exploring, but slower and much noisier.

### Status mapping

ClickUp statuses are mapped to the roadmap's fixed status set (`STATUS_MAP` in
`mapper.ts`): Backlog, Todo, In Progress, Review, QA Testing, Ready
Deployment, Production, Blocked — including this workspace's real status
names (`needs refinement`, `ready for planning`, `draft`, `planned`, `ready
for deployment`, `complete`, …). Tasks with a `canceled`/`cancelled` status
are excluded entirely. Unrecognized statuses default to Backlog — add an
entry to `STATUS_MAP` for any other custom status names your workspace uses.

### Drag-and-drop → ClickUp sync

Dragging a roadmap bar calls `PATCH /api/clickup/tasks/[id]` with the new
start/due dates. In live mode this proxies to ClickUp's task update endpoint
(`PUT /api/v2/task/:id`); in mock mode it just acknowledges the change so the
UI updates optimistically without a backend to persist it.

## Mock mode

There is no database — MizaniyaPay's roadmap is meant to be ClickUp's live
data, reshaped for presentation. When ClickUp isn't configured (or a live
call fails for any reason — bad token, network error, missing workspace),
every API route transparently serves the seed data in
`lib/clickup/mock-data.ts`: 29 realistic initiatives across all 6 products,
8 team members, and 8 release milestones spanning Oct–Dec 2026. The
dashboard shows an amber "Showing seed data" banner whenever it's running
this way, so it's always clear which mode is active.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```
