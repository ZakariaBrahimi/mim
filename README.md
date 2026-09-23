# MizaniyaPay Product Roadmap

A fintech-grade, 3-month product delivery roadmap for MizaniyaPay — a Gantt-style
timeline across Mobile App, Partner Platform, Payment Gateway, Admin Dashboard,
Agent Network and Mizaniya Market, backed by live ClickUp data (with a full
mock mode so the app runs and looks realistic with zero configuration).

**Live deployment:** https://mizaniyapay-roadmap.vercel.app — connected to
the real MizaniyaPay ClickUp workspace, with two tabs:

- **Q4 2026 Roadmap** — Product Backlog + whichever sprint is current
- **Design Roadmap** — the Design list only

Most tickets in this workspace have no due date set, so the app
auto-schedules those (dashed bars, an "Estimated" badge in the drawer) into
the target window instead of showing an empty roadmap — see "Auto-scheduling"
below.

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
  types.ts                     # RoadmapItem, Milestone, Member, Product, RoadmapView, filters…
  status-config.ts             # Status/priority → color + label mapping
  roadmap-stats.ts             # Pure functions deriving all analytics from RoadmapItem[]
  date-utils.ts                # Gantt math, Q4 window, sprint-name date parsing
  clickup/
    client.ts                  # ClickUp API v2 fetch wrapper + current-sprint resolution
    types.ts                   # ClickUp API response shapes
    mapper.ts                  # ClickUp task -> RoadmapItem, product/status mapping
    auto-schedule.ts            # Synthetic dates for tasks with none set
    mock-data.ts                # Realistic MizaniyaPay seed dataset (products, members, items, milestones)
    data-source.ts              # Per-view (q4/design) fetch + live/mock fallback

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
| `CLICKUP_BACKLOG_LIST_ID` | List ID for the Q4 roadmap's backlog source. Default: `901212762115` ("Product Backlog") |
| `CLICKUP_SPRINT_FOLDER_ID` | Folder holding the dated `Sprint NN (M/D - M/D)` lists, scanned to auto-detect the current sprint. Default: `901212077700` ("Sprint Folder") |
| `CLICKUP_CURRENT_SPRINT_LIST_ID` | Optional: force a specific sprint instead of auto-detecting |
| `CLICKUP_DESIGN_LIST_ID` | List ID for the Design Roadmap tab. Default: `901213045864` ("Design") |

### The two roadmap views

The dashboard has two tabs, each backed by its own ClickUp lists
(`lib/clickup/data-source.ts`):

- **Q4 2026 Roadmap** — `CLICKUP_BACKLOG_LIST_ID` + whichever sprint list's
  parsed date range contains today (`resolveCurrentSprint` in `client.ts`,
  which re-detects automatically every sprint — no env var to update).
- **Design Roadmap** — `CLICKUP_DESIGN_LIST_ID` only.

`GET /api/clickup/tasks?view=q4|design` serves both; `useRoadmapItems(view)`
drives the tab switch client-side.

### Real ClickUp structure

MizaniyaPay's workspace doesn't use one Space per product — it categorizes
tasks with a **workspace-level `Product` dropdown custom field**, confirmed
against the live workspace with these options:

`Admin` · `Client App` · `Partner` · `Market` · `Market Admin` · `Website` ·
`Payment Gataway` (sic) · `MTP`

`lib/clickup/mapper.ts` (`PRODUCT_FIELD_TO_KEY`) maps each option to a
roadmap product — e.g. `Client App` → **Mobile App**, `Payment Gataway` →
**Payment Gateway**. When that field can't be resolved on a task (common on
backlog/sprint/design tickets), `inferProductFromTitle` falls back to
parsing MizaniyaPay's consistent `"[Type] - Product - description"` title
convention, so tasks are never silently dropped from the roadmap for lack of
product classification — anything that matches neither lands in a catch-all
**General** bucket rather than disappearing.

The `Release Version` short-text field, if set, becomes the roadmap item's
version tag (e.g. `v1.4`).

### Auto-scheduling

Most tasks in `Product Backlog` and `Design` have **no due date at all** —
they're an unscheduled backlog, not a dated release plan. Rather than show
an empty Gantt, `lib/clickup/auto-schedule.ts` assigns synthetic dates to
any task missing one:

- **Sprint-sourced tasks** get the sprint's own date range (parsed from its
  list name, e.g. `Sprint 26 (9/23 - 10/6)`).
- **Backlog/Design tasks** get spread across Q4 2026 (`getQ4Window` in
  `date-utils.ts`), highest priority first, each with a 10-day default
  duration.

Tasks that already have a real due date in ClickUp are left untouched.
Auto-scheduled items render with a dashed border on their Gantt bar and an
"Estimated — no date set in ClickUp" badge in the detail drawer
(`item.isAutoScheduled`), so it's always clear which dates are real vs.
inferred. Add real due dates in ClickUp to replace the estimate — the app
picks them up on the next fetch.

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
