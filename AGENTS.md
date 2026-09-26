# Flow Studio — Contributor & Agent Guide

Flow Studio is a local-first desktop suite for design, moodboarding and project management.
React 19 + TypeScript + Vite 6 + Tailwind v4, wrapped in Electron, with an Express backend.

**This file is for anyone working *on* the repo — humans and AI agents.** It is not the
in-app Copilot's prompt; see [Copilot protocol](#copilot-protocol) at the bottom.

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Full stack: backend + Vite + Electron |
| `npm run dev:vite` | Frontend only (port 3000) |
| `npm run dev:server` | Backend only (`tsx watch server.ts`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `tsc --noEmit && eslint .` — **must exit 0** |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (advisory in CI; the tree has not been reformatted yet) |
| `npm run build` | `vite build` |
| `npm run package:win` / `package:mac` | Electron builder |

**Backend port:** `server.ts` defaults to `3010` and negotiates a fallback chain
(`preferred, 3010, 3009, 3011, 3012`), writing the winner back to the gitignored
`flowstudio.config.json`. `vite.config.ts` proxies `/api` to the same value — keep the two
in step, or a fresh clone proxies to a port the server will not bind.

---

## Read before you edit

| Need | Read |
|---|---|
| Visual system, tokens, components, page templates | [Docs/DESIGN.md](Docs/DESIGN.md) |
| Coding rules, Co-Pilot protocol, UI/animation standards | [Docs/RULES.md](Docs/RULES.md) |
| Known inconsistencies, roadmap, completeness contract | [Docs/UI-UX-COMPLETENESS-PLAN.md](Docs/UI-UX-COMPLETENESS-PLAN.md) |
| Architecture | [Docs/ARCHITECTURE.md](Docs/ARCHITECTURE.md) |
| Feature scope | [Docs/PRD.md](Docs/PRD.md) |

---

## Design system rules — enforced

`src/index.css` `@theme` is the **only** place colours are defined. Everything else refers to
a token by name.

**The palette decision (2026-09-25): the main theme is monochrome, blue is the accent.**

| Token | Value | Owns |
|---|---|---|
| `primary` | `#111111` | CTAs, active pills, active states — the monochrome action layer |
| `primary-hover` | `#242424` | Pressed/hover state of primary actions |
| `accent` | `#0789fd` | Links, icon tints, rings, selection, focus — never the CTA |

`accent` is brighter than the value it replaced, so keep it off small body copy: `text-accent` on
white, and white on `bg-accent`, are both 3.53:1 — under the 4.5:1 AA floor. Links, icons, rings and
tints are unaffected. **A filled accent surface with small white text should use `accent-hover`
(`#0673d5`, 4.75:1 with white).**

Rule of thumb: **if the user clicks it and it commits an action, it is `primary` (monochrome).
If it draws attention, links, or signals selection/focus, it is `accent` (blue).**

Then:

- **No raw hex literals in components.** The only exceptions are the status/priority flag maps that intentionally encode meaning.
- **Never add a `blue-*` Tailwind utility.** Use `accent`. There are ~324 legacy `blue-*` uses awaiting migration (see §1.1 of the plan); do not add more.
- **Light theme only.** No `.dark` variants, no dark surface tokens, no theme toggle. The Copilot chat panel is a permanently dark *component*, not a theme — do not generalise it.
- **Repeated controls live in `src/components/ui`.** A raw `<button>` carrying more than two style classes in a feature file is a defect. Import the primitive.

Adding a new colour means adding a token to `@theme` and to `Docs/DESIGN.md` in the same change.

---

## Completeness contract

A screen is not finished until it handles all five states. This is the single biggest driver of
whether the app *feels* complete:

1. **Loading** — a skeleton shaped like the real content, not a spinner in a void.
2. **Empty** — explains what belongs here and offers the action that creates it.
3. **Error** — plain language, plus a retry.
4. **Partial** — correct with 1 item and with 20,000.
5. **No dead ends** — every affordance either works or is removed.

Fabricated content a user can reach counts as a bug, not a placeholder.

---

## Quality gate

`npm run lint` and `npm run build` are green and blocking in CI. Do not merge red.

ESLint rules are disabled **with a stated reason** in `eslint.config.js`; re-enabling one is a
deliberate decision. `react-hooks/rules-of-hooks`, `no-self-assign`,
`no-constant-binary-expression` and `no-unused-expressions` stay as **errors** — they caught
seven real defects, four of them crashes on ordinary user actions.

---

## Copilot protocol

Do not document it here. Three copies already existed and that duplication is the problem.

- **Runtime source of truth:** `server.ts` — three inline `systemInstruction` blocks (around lines 2473, 2574 and 2644). If you change Copilot behaviour, change it there.
- **Protocol documentation:** [Docs/RULES.md](Docs/RULES.md) §2 (context resolution, workflows A/B/C, task schema, moodboard schemas) and §3 (UI/animation standards).

---

## Session startup

- At the start of a new session, or when asked to resume, check for `.antigravity/ACTIVE_CONTEXT.md`.
- If present, load it silently as working memory before responding.
- Do not re-read stale history or ask the user to restate previous steps.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
