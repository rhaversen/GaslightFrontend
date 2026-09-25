# Gaslight Interface — Production Readiness Plan

Source of truth for desired views: `outline.md` (this repo).
Scope of this plan: the **interface** (GaslightFrontend), including the backend surface it needs to become fully production ready.

---

## 1. Where we are today

### 1.1 Existing routes (App Router)

| Route | Status vs `outline.md` |
|---|---|
| `/` | Landing with countdown timer, Vanta background, games section. `tournamentInProgress` is hardcoded `false` (TODO). |
| `/games` | Browse exists, but only one implicit ordering (active strategies). Outline wants: *active in, most recent, most popular, most tokens per strategy*. |
| `/games/[gameId]` | Shows summary, submissions-over-time graph, stats, latest tournament, user activity, description. Outline wants leaderboards, per-standing time-series graphs, relationship lists (users, strategies, tournaments, posts). |
| `/tournaments` | Filter-by-game dropdown works. Outline wants browse tabs: *active in, one per game, filtered by game, highest participation*. |
| `/tournaments/[tournamentId]` | Good detail page: paginated standings, statistics, disqualifications, current-user display. Outline additionally wants leaderboards (*most wins, fewest tokens, most recent*). |
| `/users` | Flat unsorted list. Outline wants: *most recent, most popular, most wins, highest engagement*. |
| `/users/[userId]` | Profile + username/password editing. Outline wants games (joined/won), strategies (recent, most tokens), posts list. |
| `/users/[userId]/strategies` | List per game with active-toggle. Matches outline reasonably. |
| `/strategies` (browse) | **Missing entirely.** Outline wants: *yours, most recent, highest ranking*. |
| `/strategies/[strategyId]` | Minimal: title + game name + modify link. Outline wants owner, game, tournaments list with ranking, participation-to-standing ratio. |
| `/strategies/new`, `/strategies/[strategyId]/edit` | Work (Monaco editor, create/update). |
| `/login`, `/signup` | Work. |
| Posts, Throne, Head-to-Head | **Missing entirely** (no backend model, no routes, no UI). |

### 1.2 Structural weaknesses (blockers for "production ready")

1. **No data layer.** Every page hand-rolls `axios` + `useEffect` + `useState`. `@tanstack/react-query` is installed and only used for the current-user query. Result: no caching, no retries, no deduplication, N+1 request storms (games page fires 2 requests *per game*), and duplicated loading/error logic per page.
2. **No API client module.** `process.env.NEXT_PUBLIC_API_URL` + raw axios calls are scattered across ~15 files; types are duplicated locally in some places (`any[]` for games in `strategies/new`).
3. **No route-level resilience.** Zero `error.tsx`, `loading.tsx`, `not-found.tsx`, or `global-error.tsx` files. Failures surface as raw console errors and blank/broken sections.
4. **No tests.** No vitest/jest in `package.json`, no test files, no test step in CI.
5. **No frontend observability.** CI passes `SENTRY_AUTH_TOKEN` but `@sentry/nextjs` is not a dependency; nothing reports client errors or web vitals.
6. **Inconsistent design language.** Some pages are dark (`bg-gradient-to-br from-gray-900...`), most are light `bg-white` cards; two competing headers (`components/Header.tsx` dead vs `components/header/Header.tsx` live); inline SVG icons duplicated with `lib/icons.tsx`; ad-hoc buttons/labels everywhere. No design tokens, no dark-mode support.
7. **Text corruption artifacts.** Dozens of strings contain stray `\r` (e.g. `{'Tournaments\r'}`) across 16 files — cosmetic but immediately visible to users.
8. **Accessibility gaps.** Only a handful of `aria-*` attributes; light-gray-on-white text (`text-gray-500` on cards), no skip links, no focus management, Vanta/`framer-motion` animations without `prefers-reduced-motion` handling.
9. **SEO/metadata.** Only `games/[gameId]/layout.tsx` sets metadata/canonical. No per-page titles/descriptions, OG images, `sitemap.ts`, `robots.ts`.
10. **Performance.** Monaco, shiki, three/vanta all load eagerly on relevant pages without dynamic imports; no skeletons (plain "Loading..." text); `lodash` imported but barely used; no bundle budget or Lighthouse gate.
11. **Dead/duplicated code.** `components/Header.tsx` (unused), legacy `LoadingPlaceholder*` duplication, `useLogout` mixed with manual axios in pages.
12. **Backend gaps for outlined views.** No sort/filter options for users/games/strategies browse; no wins/leaderboard aggregation endpoints; no per-standing time-series endpoint; no posts/comments; no dominance/momentum metrics.

---

## 2. Target state

The interface is production ready when:

- **Every view in `outline.md` exists** with its listed browse tabs, relationship sections, leaderboards, and graphs, backed by purpose-built endpoints.
- **One typed API layer** (`lib/api/`) — every call goes through a typed axios client consumed by react-query hooks; no page-level fetch code.
- **Every route** has loading skeletons, an error boundary with recovery action, and a real 404 state.
- **One design system** — dark-first theme tokens, shared `Card`, `Button`, `Badge`, `StatPill`, `Tabs`, `SortableTable`, `Select`, `Skeleton`, chart kit; the landing dark look becomes the app-wide theme.
- **CI enforces** lint + typecheck + spellcheck + unit tests + build; Lighthouse/perf budgets reported; Sentry active on client and server.
- **A11y** passes WCAG AA contrast and keyboard navigation on all primary flows.

---

## 3. Plan

### Phase 0 — Production hygiene (no new features)

Goal: make what exists today shippable.

1. **Text cleanup:** strip all `\r` artifacts; add a lint rule to catch them going forward.
2. **Delete dead code:** `components/Header.tsx`, unused imports, duplicate loading placeholders.
3. **API layer:** create `lib/api/client.ts` (axios instance with `withCredentials`, base URL, typed error normalization) and one module + react-query hook per resource (`useGames`, `useTournaments`, `useSubmissions`, `useUsers`). Migrate pages one by one; delete page-level `useEffect` fetching.
4. **Route boundaries:** add root `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`; per-section skeletons; route the existing `ErrorProvider`/`ErrorWindow` into query error handling.
5. **Theme unification:** pick the dark landing aesthetic as the single theme; define Tailwind tokens (`bg-surface`, `text-primary`, `border-subtle`, gradients, glow) in `globals.css`; convert pages progressively; remove the light `bg-white` cards and the dark pages' divergent grays.
6. **Shared UI kit:** extract `Card`, `StatPill`, `SectionHeading`, `Tabs`, `SortableTable`, `Skeleton`, `EmptyState`, `BackButton` into `components/ui/`; replace inline duplicates.
7. **Metadata & SEO:** per-page `generateMetadata` (title/description), root OG/Twitter defaults, `sitemap.ts`, `robots.ts`.
8. **A11y pass:** contrast fixes, focus-visible states, keyboard-operable custom controls, `aria-label`s on icon buttons, `prefers-reduced-motion` guards for Vanta/framer-motion, skip-to-content link.
9. **Testing baseline:** add vitest + React Testing Library; smoke tests for every route (renders, no console errors), unit tests for `lib/scoreUtils`, `lib/dateUtils`, `lib/timeUtils`; wire into CI.
10. **Observability:** add `@sentry/nextjs` (client + server config exists in CI already), report query failures, add web vitals logging.
11. **Perf:** `next/dynamic` for Monaco/shiki/three/vanta; route-level code splitting; replace "Loading..." strings with skeletons; remove unused deps if confirmed unused.

Deliverable: app that looks, behaves, and fails gracefully like a product, with CI gates — before adding outlined features.

### Phase 1 — Backend surface for outlined views

Goal: endpoints so the outlined views don't require client-side stitching.

1. **Browse/sort params** (each a query param on existing list routes):
   - `games`: `sort=recent|popular|tokensPerStrategy`, `activeForUser=<id>`.
   - `users`: `sort=recent|popular|wins|engagement`.
   - `submissions` (strategies): `sort=recent|tokens|ranking`, `user=`, `game=`.
   - `tournaments`: `sort=recent|participation`, `onePerGame=true`.
2. **Wins aggregation:** `GET /v1/users/:id/wins` (per game: best placement, latest win, strategies created, tournaments entered) and leaderboard params on `games/:id` (`leaderboard=wins|tokens|recent|engagement`, `limit`).
3. **History endpoint for graphs:** `GET /v1/games/:id/history?metric=tokens|score|standings` returning, per standing, the series needed by the three outlined graphs (lines starting when the standing appears, user lines highlighted). One round-trip instead of shipping all tournaments + client math.
4. **Strategy detail enrichment:** tournaments a submission entered with `placement`, `participationToStanding` ratio (or data to compute it).
5. **Posts domain:** `Post` model (author, game, title, body, timestamps), `Comment` model (author, post, body), CRUD routes with auth, `sort=recent|popular` on both. (Also used later by Throne/user pages.)
6. **Metrics for Throne:** computed daily per user/strategy: dominance score (win rate + activity + peak), current/longest streaks (momentum), win rate (consistency), activity frequency, peak placement. Expose as `GET /v1/throne?metric=...&period=...` and per-user history for trend lines.
7. **Pagination contract:** every list route returns `{ items, total }` (or consistent `X-Total-Count`) so infinite scroll can replace unbounded client lists.
8. **Realtime:** expose the existing Socket.io tournament events contract (`webSockets/TournamentHandlers.ts`) so the frontend can subscribe: `tournament:started`, `tournament:completed`, `evaluation:updated`.

### Phase 2 — Outlined views

Goal: close every gap in the route table in §1.1, in dependency order.

1. **Strategies browse page** (`/strategies`) — tabs: *yours, most recent, highest ranking*; cards reuse `StrategyCard`.
2. **Users browse** (`/users`) — tabs: *most recent, most popular, most wins, highest engagement*; switch to the shared table/list component with skeletons + infinite scroll.
3. **Games browse** (`/games`) — tabs: *active in, most recent, most popular, most tokens per strategy*; per-game stat pills from Phase 1 sort params.
4. **Tournaments browse** (`/tournaments`) — tabs: *you're active in, one per game, highest participation*; keep game filter; unify the `LatestTournaments`/`SingleGameTournaments` split under one component with variants.
5. **Game detail** (`/games/[gameId]`) — add: leaderboard section (most wins, fewest tokens, most recent, engagement, top-10 over time), tournaments list (recent, participation over time), relationship lists (users, strategies), and the three outlined time-series graphs (tokens per standing, standings count per standing, raw score per standing — user lines highlighted/crossing).
6. **Tournament detail** (`/tournaments/[tournamentId]`) — add leaderboard widgets (most wins overall for the game, fewest tokens, most recent) above standings; link game.
7. **Strategy detail** (`/strategies/[strategyId]`) — full outline: owner, game, tournaments entered with ranking + participation-to-standing ratio, evaluation details surfaced cleanly (reuse `EvaluationResults`).
8. **User detail** (`/users/[userId]`) — add games-joined and games-won lists (best/latest rank, strategy count, tournament count per game), strategy lists (recent, most tokens) as tabs, posts list once Posts exist.
9. **Chart kit:** generalize `SubmissionsGraph` into `components/charts/` (`TimeSeriesLineChart` with per-line start + user highlighting, `StreamGraph` for the "Missing" idea in the outline, tooltip/legend shared). All game graphs build on it.

### Phase 3 — New domains: Posts, Throne, Head-to-Head

1. **Posts:** `/posts` browse (recent, popular) and `/posts/[postId]` with comments (recent, popular); author/game links; composer for signed-in users; link posts from user and game pages.
2. **Throne** (`/throne`): leaderboard by dominance score; metric cards (momentum, consistency, activity, peak); historical ranking trend lines (reuse chart kit); entry points from header/nav.
3. **Head-to-Head** (`/matchup`): pick two users/strategies (or arrive via "compare" buttons on user/strategy pages); side-by-side metric comparison and overlaid trend lines.
4. **Streamgraph ("Missing" section of outline):** design spike then implement as the signature visualization on Throne/game pages — lines emerging from the x-axis pushing others up, spacing driven by a secondary metric, user's line highlighted.

### Phase 4 — Realtime, state polish, hardening

1. **Socket.io client integration:** live "tournament in progress" on landing (replacing the hardcoded `false`), live standings updates on tournament detail, live evaluation status on strategy pages; graceful reconnect + offline fallback.
2. **Interaction polish:** optimistic updates for active-strategy toggling and post/comment creation; toasts via the existing error window pattern; consistent empty states for every list.
3. **Auth UX:** route guards for owner-only pages, session-expiry handling in the API client (single 401 interceptor), confirm email flow once backend confirmation ships.
4. **E2E:** Playwright covering signup → create strategy → edit → activate → tournament view → profile edit; run in CI nightly + pre-release.
5. **Quality gates in CI:** `lint`, `tsc --noEmit`, `cspell`, vitest, `next build`, Lighthouse CI budget, bundle-size budget.
6. **k8s/ops:** verify health/readiness probes, confirm Sentry releases/DSN wiring for the web container, error-rate alerting.

---

## 4. Suggested milestones

| Milestone | Content | Exit criteria |
|---|---|---|
| M1 | Phase 0 complete | All routes render through the API layer; error/loading/404 everywhere; dark theme tokens applied; CI runs tests + build green; `\r` artifacts gone; Sentry live |
| M2 | Phase 1 complete | All new endpoints documented in route JSDoc and covered by backend tests |
| M3 | Phase 2 complete | Every row in the §1.1 table matches `outline.md`; chart kit ships the three game graphs |
| M4 | Phase 3 complete | Posts, Throne, Head-to-Head live |
| M5 | Phase 4 complete | Realtime active, E2E green, Lighthouse ≥ 90 on all routes, a11y AA passes on primary flows |

---

## 5. Notes & decisions to make

- **Data ownership (per `outline.md`):** wins live on user *and* game pages as different perspectives — implement as aggregations from tournaments/standings, never duplicated state; each view owns its perspective.
- **Pagination style:** prefer cursor or offset params already used by standings (`limitStandings`/`skipStandings`); standardize naming across resources before M3.
- **Engagement metric definition** (outline uses it for games, users, tournaments) must be pinned down once — e.g. tournaments entered + posts + comments in a window — and reused everywhere.
- **Dominance score formula** needs a documented, versioned definition (backend) so the Throne page can display "how it's calculated".
- **Dark theme is the recommendation** (landing + tournaments already dark, Vanta only works on dark); keep a light variant only if a tokens-based theme makes it nearly free.
