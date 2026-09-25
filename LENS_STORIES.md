# Lens Stories — what the system must support

A stress-test catalogue. Every story is something a real user might want, chosen to be as different from the others as possible. Each story is tagged with its navigation type and, crucially, **what it demands from the lens machinery** — because the stories are only useful if they force out the required capabilities.

Navigation types:
- **[V]** Vertical — drill down into a document's internals
- **[H]** Horizontal — pivot sideways between sibling documents
- **[T]** Temporal — time-windowed, as-of, deltas, sequences
- **[A]** Aggregate — group, rank, derive a metric across many documents
- **[N]** Negative — about *absence*: who isn't there, what stopped
- **[S]** Set — intersections, differences, overlap between two anchors
- **[C]** Chain — follow a sequence of events as a walkable path
- **[M]** Me-centric — the logged-in user as the fixed point

---

## 1. Baseline (must feel instant)

1. **[V]** Show me a game: its author, tournaments, strategies, activity sparkline. *(populated focus card)*
2. **[V]** Show me a user: games created, games played, strategies, per-game best placement. *(populated focus card)*
3. **[V]** Show me a strategy: score/placement/percentile per tournament, as a timeline. *(the `history` lens)*
4. **[V]** Show me a tournament: full standings table, disqualifications, statistics. *(the `participants` lens)*
5. **[A]** Browse games by newest / most active / most strategies. *(sort param on browse)*
6. **[A]** Browse users by most tournaments entered, most wins, most games played. *(leaderboard lens, metric param)*
7. **[H]** From a game, jump to another game by the same author. *(pivot: sibling-by-author)*
8. **[H]** From a strategy, jump to other strategies by the same user in the same game. *(pivot: siblings-by-user+game)*

## 2. Vertical drill-down (deep, not wide)

9. **[V→V→V]** Game → a tournament → a standing → that user's overall record. Three levels, no page change, breadcrumb intact.
10. **[V→V→V→V]** Strategy → its best tournament → the strategy that beat it there → *that* strategy's full history. Four hops; the "who beat me" walk.
11. **[V]** Tournament → "who was new here": participants for whom this was their first-ever grading. *(first-appearance computation)*
12. **[V]** Tournament → score distribution histogram, not just a ranked list. *(distribution output shape)*
13. **[V]** Game → its author's own performance *inside that game* vs their global record. *(scoped vs global metric side-by-side)*
14. **[V]** Strategy → how its tokenCount and execution time evolved across its gradings. *(self-over-time, two series)*
15. **[V]** User → the exact tournaments where they beat a given rival. *(filtered child rows by comparison predicate)*

## 3. Horizontal pivots (sibling to sibling)

16. **[H]** From a user, to the users who most often shared tournaments with them. *(co-occurrence ranking)*
17. **[H]** From a game, to games its participants also play heavily. *(audience overlap across games)*
18. **[H]** From a strategy, to the strategies that were graded in the same tournaments, ranked by how often they placed adjacent. *(same-field ranking)*
19. **[H]** From a tournament, to the previous and next tournament of the same game — flip-book through time. *(adjacent-in-sequence pivot)*
20. **[H]** From a user, to the user with the most similar placement history in a game. *(similarity ranking over series)*
21. **[H]** From a game, to "games this author's players migrated to afterwards". *(chained audience flow)*

## 4. Temporal stories

22. **[T]** Rewind the entire leaderboard to any date: "as of March 1, who led every game?" *(as-of parameter applied to every lens)*
23. **[T]** My percentile drift: score went up, rank went down — show both series so the field's improvement is visible. *(two-series self-vs-field)*
24. **[T]** Biggest single-window jump in placement for any user in a game. *(delta computation over consecutive events)*
25. **[T]** Win streaks: current and longest, per user per game; click a streak to see the exact tournaments composing it. *(run-length + click-through to members)*
26. **[T]** Attendance streaks: consecutive daily tournaments entered. *(run-length over calendar)*
27. **[T]** Pass the torch: the succession chain of champions in a game — each dethroning event linked to the tournament where it happened. *(sequence output; each element pivots)*
28. **[T]** Score inflation: median winning score per tournament over a year. *(grouped trend output)*
29. **[T]** Newcomers over time: how many first-time entrants each tournament drew. *(first-event grouping per period)*
30. **[T]** Comebacks: users returning after a 30+ day gap who then placed top 3. *(gap detection + post-gap performance)*
31. **[T]** The day the champion fell: jump from a streak's end directly to that tournament's standings. *(temporal anchor into vertical)*
32. **[T]** Compare my first ten gradings to my latest ten. *(windowed self-comparison)*
33. **[T]** Seasonality: which day-of-week/month do tournaments have the most participants. *(calendar grouping)*
34. **[T]** A user's career as a single line: every grading on one axis, colored by game. *(multi-series timeline with dimension coloring)*

## 5. Aggregates and derived metrics

35. **[A]** Dominance: composite of win rate, activity, peak — documented and versioned. *(derived metric with formula surface)*
36. **[A]** Momentum: last-10-tournament trend vs previous 10. *(windowed derived metric)*
37. **[A]** Consistency vs peak scatterplot: every user is a dot; outliers labeled. *(scatter output with label param)*
38. **[A]** Do concise strategies win? Average tokenCount of winners vs field, per game. *(correlation output)*
39. **[A]** Heaviness: tokenCount vs avgExecutionTime across all strategies of a game. *(correlation/scatter)*
40. **[A]** Underdog wins: victories from bottom-half percentile positions. *(conditional aggregate)*
41. **[A]** Leader concentration: how many distinct winners a game had in the window — one dynasty or a brawl? *(distinct-count + share, HHI-style)*
42. **[A]** Winning margin: gap between 1st and 2nd per tournament; smallest margins = best races. *(adjacent-pair computation)*
43. **[A]** Grinder vs sniper: rank users by participation and by win rate simultaneously; the quadrants are the story. *(two-metric table with derived classification)*
44. **[A]** A chess-like Elo per user per game, recomputed on read over the event stream. *(expensive derived metric — cost class questions)*
45. **[A]** Cross-game normalization: a user's percentile relative to *their own games' difficulty*. *(percentile-of-percentile)*
46. **[A]** Rising games: rank games by participant growth rate between windows. *(growth-rate over grouped counts)*

## 6. Negative space (the system's blind spots made visible)

47. **[N]** Ghost towns: games with no tournaments in 90 days despite having strategies. *(NOT EXISTS over window)*
48. **[N]** Silent drops: users whose last grading is 60+ days old while their percentile was top 10%. *(last-event + threshold)*
49. **[N]** No-shows: active strategies absent from the last N tournaments of their game. *(set difference, latest-of-each)*
50. **[N]** Games a user *could* enter but never did. *(cross product minus participation — the difference lens)*
51. **[N]** Never met: two users with long careers and zero shared tournaments. *(anti-join between anchors)*
52. **[N]** One-hit wonders: strategies graded exactly once — and which of those won. *(count==1 partition + extreme)*
53. **[N]** The tournament where a user quietly stopped: last grading shown in context. *(terminal event as first-class)*

## 7. Set operations between two anchors

54. **[S]** Head-to-head: two users, all shared tournaments side by side, who won what. *(intersection + paired rows)*
55. **[S]** Overlap percentage of two users' tournament sets. *(set measure)*
56. **[S]** Two strategies: same-tournament results, adjacent placements highlighted. *(paired comparison output)*
57. **[S]** Common games of two users vs games only one plays. *(intersection vs symmetric difference, rendered as lists)*
58. **[S]** Rivalry finder: rank all user pairs by (shared tournaments) × (close scores). *(pairwise aggregate — the cost ceiling test)*
59. **[S]** My tournaments vs a friend's: side-by-side calendars. *(temporal set display)*

## 8. Chains and walks (the graph made explicit)

60. **[C]** Walk the win chain: current champion → who they beat last → who *that* user beat the tournament before. Click to extend the walk. *(interactive path building)*
61. **[C]** Strategy lineage by author: all strategies of a user in chronological order with events between them — the "career mode" view. *(ordered sequence per entity)*
62. **[C]** Hand-off graph of a game's championships as a visual path, not a table. *(graph rendering of sequence)*
63. **[C]** From any grading, "previous grading of this user" / "next grading of this user" as first-class neighbors. *(event adjacency)*
64. **[C]** The story of one game-day: tournament created → gradings recorded → who surfaced as new winner. *(event timeline of a single date across collections)*

## 9. Me-centric personal analytics

65. **[M]** My dashboard: my active strategies, next tournament countdown, last results, streaks. *(pinned multi-lens composition)*
66. **[M]** Opportunity finder: games where my percentile would likely be highest, given current leaders' activity. *(recommendation-shaped derived query)*
67. **[M]** My whole history as one timeline regardless of game, with pivots to every game/tournament on it. *(unified personal event stream)*
68. **[M]** Notify-shaped views: tournaments I haven't seen results for yet. *(seen-state — data-model gap, see §11)*
69. **[M]** My rivals: the users I share the most tournaments with, head-to-head record against each. *(composition of 16 + 54)*
70. **[M]** My games-created vs games-played, side by side, with crossover highlighting. *(the authorship/participation split as a personal view)*

## 10. Authorship and creation

71. **[A]** Author leaderboard: games created, strategies authored, tournaments those strategies entered. *(author aggregate)*
72. **[A]** Author echo: do authors place higher in their own games than in others'? *(self-vs-elsewhere aggregate)*
73. **[H]** From a game, to everything its author ever touched. *(author as hub pivot)*
74. **[T]** Game adoption curve: creation → first strategy → first tournament → 10th regular player. *(milestone sequence)*
75. **[N]** Orphaned games: author never played their own game. *(negative join on creation edge)*
76. **[A]** Whale games: games where one user holds most active strategies. *(share-of-field aggregate)*

## 11. Meta and system stories

77. **[T]** Global event stream: everything that happened on a given day across all games. *(date-first cross-collection view)*
78. **[A]** Biggest tournaments ever: participation ranking with the ability to jump into each. *(aggregate → vertical bridge)*
79. **[N]** Quiet days: days with no tournaments at all — is the pipeline healthy? *(calendar gap detection; doubles as ops health check)*
80. **[A]** Disqualification hall: most-DQ'd submissions, reasons over time. *(non-grading event stream as a lens source)*

---

## What this demands — the capability matrix

| Capability | Forced by stories | Registry implication |
|---|---|---|
| Populated focus (never raw ids) | 1–21, all | every row carries resolved labels + counts |
| Sort/metric parameterization | 5, 6, 35–46 | `metric` param with a per-lens allowed set |
| Time window (from/to) | 22–34, 47–49, 78 | window guards; fanout requires one |
| **As-of rewind** | 22, 31 | `asOf` param: filter event stream, recompute derived state |
| **Derived, versioned metrics** | 35, 36, 44, 45 | metric definitions in code, formula surfaced, cost-classed |
| **Run-length / streaks** | 25, 26, 31 | sequence computation over event stream |
| **First/last/gap events** | 11, 29, 30, 47–49, 53, 74, 75 | first-event, last-event, gap-detection primitives |
| **Set operations on two anchors** | 54–59 | dual-anchor scope (`a`, `b` params) with intersection/difference pipelines |
| **Pairwise aggregates** | 16, 18, 58 | capped pair enumeration (cost!) |
| **Chains / adjacency** | 27, 60–64 | sequence + neighbor params (prev/next of entity) |
| **Distributions & correlations** | 12, 37–39, 42 | histogram/scatter output shapes |
| **Multi-hop traversal** | 9, 10 | composition of lenses client-side *or* 2–3 hop server lenses |
| **Negative queries** | 47–52, 75 | NOT EXISTS / anti-join pipelines |
| **Multi-series timelines** | 14, 23, 34, 62 | timeline-multi with per-series pivot |
| **Non-grading event streams** | 80, 64 | DQ + creation events as lens sources |
| **Seen-state / bookmarks** | 68 | *data-model gap*: needs per-user read markers |
| **Deletion awareness** | (soft-delete) | *data-model gap*: hard deletes erase stories |
| **Pairwise cost ceiling** | 58 | pairwise lenses must cap pairs aggressively |

## Verdicts

- **v1 (registry + explore canvas):** stories 1–21 plus 34, 54, 65, 67, 70 — they cover every navigation type at least once and make the canvas feel alive.
- **v2 (derived metrics + temporal):** 22–46 — the as-of parameter and derived-metric registry are the big lifts.
- **v3 (set ops, chains, negative):** 47–64 — the novel material; needs the primitives above to exist.
- **Requires model additions:** 68 (seen markers), and any soft-delete story — decide explicitly, don't back into them.
- **Explicitly out of scope:** cross-user private data, anything needing data we never recorded (e.g., viewer counts, strategy source diffs).
