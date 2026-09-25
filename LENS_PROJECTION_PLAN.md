# Lens Projection System — Design Plan

Replaces the page-per-resource model. Pages kept as-is: `/` (landing), `/tournaments`, `/strategies/new`. Everything else (games, users, strategies browse/detail) is deleted and replaced by the view kernel described here.

Everything is **computed on read** via MongoDB aggregation pipelines. No materialized views, no stat fields on documents, no client-side stitching.

---

## 1. The data graph

All relationships, as they exist in Mongoose after the event-model rewrite:

```
User ←— Submission →— Game (user-created)
         ↑
      Grading (tournament, game, user, submission — flat event stream)
         ↑
      Tournament → Game
```

Edges: `Submission.user → User`, `Submission.game → Game`, `Tournament.game → Game`, `Grading.{tournament, game, user, submission}` (forward refs — gradings are the **event stream** and carry their dimensions denormalized so every lens starts from an indexed match), `Game.user → User` (games are user-submitted content, no approval flow; every game has an owner).

Key property: **`Grading` is a star schema** — one fact table with indexed dimensions. "What did user U do, when?" / "What happened in game G, when?" / "What happened to strategy S, when?" are all the same query shape: `match(dimensions) → sort(createdAt) → limit → lookup labels`. Labels (usernames, game names) are mutable and resolved at read time; ids on the event are immutable and copied at write time.

## 2. What a lens is

A lens is a **server-side, registered, typed function** from a scope to a renderable dataset:

```
Lens = {
  id: string                          // 'standings-timeline', 'tournaments-entered', ...
  from: Collection                    // the URL's collection
  cardinality: 'one' | 'many'         // shape of output rows
  dateField: string                   // which timestamp the rows are keyed by
  costClass: 'edge' | 'fanout'       // see §5
  pipeline(scope, params): Aggregation[]
  renderer: 'list' | 'table' | 'timeline' | 'scatter' | 'compare'
  defaults: { window, sort, limit }
}
```

Two scope shapes, both going through the same registry:

1. **Document scope** — `/view/game/:id?lens=tournaments` → "tournaments this game held". One anchor document, rows are the related documents.
2. **Collection scope** — `/view/user?lens=dominance` → "all users ranked by derived metric". No anchor; rows are aggregates over the whole collection.

The same lens definition may only support one or both scopes — declared, not inferred.

**Hard rule (from outline.md):** a lens never reads a stat off a document. "Games won" is always computed from gradings at request time. Nothing can disagree with anything.

## 3. The endpoint

One route, one shape:

```
GET /v1/view/:collection            (collection scope)
GET /v1/view/:collection/:id        (document scope)
     ?lens=<lensId>
     &from=<ISO>&to=<ISO>           // time window, optional
     &me=<userId>                   // highlight parameter
     &sort=<rowField>&dir=asc|desc
     &limit=&skip=
```

Response is always:

```
{
  rows: Array<Row>,        // lens-specific, but always { date, doc|aggregate fields }
  lens: <echoed lens meta>,
  total: number,
  window: { from, to }     // echoed, so the UI can render the picker
}
```

The backend validates `collection` against a registry map — an unknown combination is a 400, not an arbitrary aggregation over user input. Params are zod-validated; lens pipelines are code, not query strings.

## 4. The lens catalogue (v1)

Ordered by dependency. Each is one pipeline against the graph in §1.

| Lens | Scope(s) | Output | Renderer |
|---|---|---|---|
| `tournaments-held` | game (doc) | tournaments for the game, w/ participant counts | timeline |
| `participants` | tournament (doc) | standings of one tournament | table |
| `history` | strategy (doc) | gradings of this submission: date, score, placement, percentile | timeline |
| `in-tournaments` | user (doc) | tournaments the user's active/any strategy entered, w/ placement | timeline |
| `per-game` | user (doc) | the user's record per game: best/latest placement, strategies created, tournaments entered | table |
| `standings-timeline` | game (doc) | per-tournament date → each user's score/percentile (the outline's "lines from the x-axis" graph); `me` highlights one line | timeline-multi |
| `leaderboard` | game (doc), user (coll) | ranked aggregates: most wins, fewest tokens, most recent, engagement — `metric` param | table |
| `dominance` | user (coll), game (doc) | composite (win rate, activity, peak) + momentum (streaks) — defined once, versioned | table |
| `head-to-head` | user (doc, special) | two anchors via `&me=` and a second id: side-by-side metrics + overlaid timelines | compare |
| `browse` | game, user, strategy (coll) | the plain collection lists with sort params (replaces deleted browse pages) | list |
| `games-created` | user (doc) | games the user submitted (their `Game.user` index) — distinct from games they *play in* | list |
| `games-played` | user (doc) | games the user participates in, via distinct `game` on their gradings (their `Grading.user` index) — different list than games-created, exactly because creation and participation are different facts | list |
| `authors` | game (doc) | the user who submitted the game (pivot back to a user from a game) | list |

`standings-timeline` is the flagship: it is one `$match` (game) → `$lookup` gradings → `$unwind` → `$lookup` submissions → `$group` by date+user, and the "user's line" is purely the `me` highlight parameter. Head-to-head is the same lens with two highlighted lines. That is the payoff of the model: outline features become parameters, not pages.

## 5. Cost classes (the part that keeps this honest)

Declared per lens, enforced by review:

- **edge** — traversal along one or two edges with an anchor id (`history`, `participants`, `tournaments-held`, `in-tournaments`). Indexed `$match` first, `$limit` before `$lookup`. Cheap; paginatable.
- **fanout** — aggregation over all gradings of a game or all users (`standings-timeline`, `leaderboard`, `dominance`). No anchor means the pipeline cannot start from an index. Rules: hard `limit` on window span (e.g. max 1 year per request), `allowDiskUse`, cap output rows, and the UI must pass a `from` default (last 90 days) rather than "all time". Collection-scope `dominance` gets a fixed lookback window (e.g. 30 tournaments) rather than infinity.

If a lens can't state its worst-case row count, it doesn't ship.

## 6. Production UX

### 6.1 URLs are state

`/view/game/abc?lens=standings-timeline&from=2026-06-01&me=u42` is shareable, back-button-correct, and the only source of truth for the UI. React Query keys derive from the URL; socket events (`TournamentCreated`) just invalidate the affected keys. No view-local state that isn't in the URL.

### 6.2 The pivot interaction

Every rendered row/document exposes **the lenses that apply to it** — the registry drives the UI. Clicking a user in a standings table doesn't navigate to a hardcoded `/users/:id` page; it opens that user's document view with the current window and `me` preserved. Concretely:

- **Anchor header**: collection icon, document name, date range of available data, and a chip row of available lenses (from the registry, per collection).
- **Lens tabs**: switching lens swaps the renderer, keeps window + `me`.
- **Window picker**: presets (30d / 90d / 1y / all-limited) + custom range; drives `from`/`to`; every timeline and table re-queries.
- **`me` highlight**: when logged in, `me` defaults to you; any row has "highlight" / "compare with" actions (compare = head-to-head lens with both anchors).
- **Pivot menu on rows**: each row lists the lenses whose `from` matches its underlying collection — this is how you move user → strategy → tournament → game without any dedicated page.

### 6.3 Dates everywhere

Every lens rows carry their `dateField`; renderers show absolute date + relative ("3 tournaments ago"), and the window picker constrains all of them identically. Metrics that are window-relative (win rate, momentum) always display their window ("dominance, last 90d") — a number without a window is not shown.

### 6.4 Renderers (closed set)

`list`, `table` (sortable, paginated), `timeline` (one series), `timeline-multi` (the standings graph), `compare` (side-by-side). A lens must map to one of these; if a new lens doesn't fit, that's a design discussion, not a new renderer.

### 6.5 Empty/loading/permission states

Registry-declared defaults: every lens has an empty-state string ("No tournaments in this window — widen the range?"), loading skeleton per renderer, and 404 handling for dead anchor ids. Errors from the API client surface through the existing ErrorWindow.

## 7. What gets deleted

`/games`, `/games/[id]`, `/users`, `/users/[id]`, `/users/[id]/strategies`, `/strategies/[id]`, `/strategies/[id]/edit` navigation entry (editing itself stays reachable), `SubmissionsGraph.tsx` as a standalone (absorbed into `timeline-multi`). Their URLs 301 to the nearest view-kernel equivalent.

## 7b. User-created games

Games are user-submitted content, immediately usable, no moderation:

- **Backend:** `POST /v1/games` (auth required) validates content rules (name/summary/description lengths, `files['main.ts']` present with per-file size caps, batchSize 1–20) and stamps the required `Game.user` — submission is impossible without an authenticated author. `GaslightCodeRunner` already fetches game files from the main service, so a newly submitted game is runnable with no further plumbing.
- **Lens distinction that matters:** "games a user made" (`Game.user` index) and "games a user plays" (distinct `game` over their `Grading.user` stream) are **different lenses over different edges** — the model makes the difference visible instead of conflating them into one "my games" list. A user can view a game they authored but never played, and the pivot menu on a game exposes both `authors` (who made this) and participation lenses (who plays it).
- **Trust boundary note:** since user games execute in the CodeRunner sandbox the same as admin-seeded ones did, the code-runner sandbox review (production-readiness plan) is now *load-bearing before launch*, not optional — user authors are a wider threat surface than game files under our control.

## 8. Build order

1. Registry + `/v1/view` endpoint + zod param validation; lens `browse` only. Frontend `/view/[collection]/[id]?` page with anchor header + lens tabs + window picker.
2. Edge lenses: `history`, `in-tournaments`, `tournaments-held`, `participants`, `games-created`, `games-played`, `authors`. Pivot menu working end-to-end.
3. Fanout lenses: `leaderboard`, `standings-timeline` (with `me`), window enforcement.
4. `dominance` (documented formula), `head-to-head`, `per-game`.
5. Delete old pages, add redirects, absorb `SubmissionsGraph`; game-submission UI on the frontend (form posting to `POST /v1/games`, then pivot into the new game's view).

Steps 1–2 alone replace the majority of the deleted pages; 3–4 are where the outline's novel views arrive.
