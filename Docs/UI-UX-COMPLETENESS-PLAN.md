# Flow Studio — UI/UX Completeness & Consistency Plan

> Audit date: 2026-09-25 · Scope: `src/` (232 TS/TSX files) + repo config
> Goal: make the app *feel* complete, and make consistency enforceable instead of aspirational.

---

## 0. Executive summary

The app does not feel incomplete because features are missing. It feels incomplete because **four competing design palettes live in the same codebase, and none of them is enforced**. `Docs/DESIGN.md` describes a Cal.com monochrome system (`#111111` primary). The running code ships a blue primary (`#1978e5`), a purple dashboard accent (`#3713ec`), and a ClickUp purple (`#7b68ee`). Every screen is internally polished; the seams *between* screens are what the user reads as "unfinished".

So the work is not "add more UI". It is three things, in this order:

1. **Collapse 4 palettes into 1 enforced token layer** (removes the inconsistency the user can feel).
2. **Build the ~12 missing primitives** so new screens can't invent their own button (stops the drift from re-accumulating).
3. **Close the state-coverage and honesty gaps** (empty / loading / error / partial / first-run) — this is what actually converts "demo" into "complete".

Everything below is grounded in measurements from the current tree, not in general advice.

---

## 1. Measured evidence

### 1.1 Competing primaries in one codebase

| Value | Occurrences in `src/` | What it claims to be |
|---|---|---|
| `#111111` | 209 | Primary — per `Docs/DESIGN.md` |
| `#1978e5` | 32 | Primary — per `src/index.css` `@theme` |
| `#7b68ee` | 33 | ClickUp purple (task list, column resize, drop indicator) |
| `#3713ec` | 1 | `--color-dash-primary` (Dashboard) |

Four primaries, zero of them authoritative. A user moving Dashboard → Projects → Tasks sees three different "brand" colors for the same interaction model.

### 1.2 Dark-surface drift

| Class | Occurrences |
|---|---|
| `bg-slate-900` | 98 |
| `bg-black` | 63 |
| `bg-slate-950` | 27 |

Three different near-blacks are used as "the dark surface" with no rule for which. `Docs/DESIGN.md` §4.6 specifies the active pill as `bg-slate-950`; the code mostly ships `bg-slate-900`.

### 1.3 Radius drift

| Class | Occurrences |
|---|---|
| `rounded-xl` | 549 |
| `rounded-lg` | 381 |
| `rounded-md` | 209 |
| `rounded-2xl` | 189 |

`Docs/DESIGN.md` §4 defines `rounded-lg` (8px) for buttons/inputs and `rounded-xl` (12px) for cards. `rounded-2xl` (16px) appears 189 times without ever being documented. There is no `rounded-full` vs `rounded-xl` decision rule for pills, so the same "pill" is rendered at two radii across pages.

### 1.4 Dead token pipeline (root cause #1)

- `tailwind.config.js` has an **empty `theme.extend: {}`**.
- `src/index.css` uses Tailwind v4 syntax (`@import "tailwindcss"` + `@theme`) and **no `@config` directive**.

**Therefore `tailwind.config.js` is never read.** Tokens can only come from `@theme` in CSS — but `Docs/DESIGN.md` documents the palette in prose and hex, and never names the `@theme` variables. So the documented system and the enforced system are different files that never meet. This is why drift was inevitable.

`bg-primary` (62 uses) and `text-primary` (97 uses) *do* resolve — to `#1978e5` from `@theme`, i.e. the blue. So 159 call sites believe they are using "the brand primary" while `Docs/DESIGN.md` says the brand primary is `#111111`. **The token layer is working against the documented design.**

### 1.5 Documentation that contradicts the code

| Claim | Reality |
|---|---|
| `Docs/DESIGN.md` §11: dark mode "Implemented via CSS variables in `src/index.css` toggled by `SettingsContext.tsx`" | **Not implemented.** Zero hits for `documentElement.classList`, `classList.add('dark')`, or `darkMode` anywhere in `src/`. `dark:` appears 32 times in 232 files (almost all inside the AI Copilot's intentionally dark chat panel). `SettingsContext` has one unrelated boolean, `darkCanvas`. |
| Backend port | `flowstudio.config.json` → **3011**; `vite.config.ts` fallback → **3009**; `README.md` → **3010**. Three values. |
| `src/components/` layout in `README.md` | Omits `Calendar/`, `Data/`, `Reports/`, `Team/`, `Time/`, `TestItFirst/`, and `GlobalComponents/AICopilot/` entirely. |

Documentation that lies is worse than no documentation: it is the mechanism by which the next contributor re-introduces drift.

### 1.6 Primitive layer is missing, not thin

- `src/components/ui/` contains **3 files**: `CellPopover.tsx`, `DatePickerInput.tsx`, `Skeleton.tsx`.
- There is **no** `Button`, `Input`, `Select`, `Dialog`, `Popover`, `Badge`, `Tabs`, `Tooltip`, or `EmptyState` in `ui/`.
- Shared UI instead accumulates in `src/components/GlobalComponents/` (a folder that also holds dev tooling, file explorer, and the AI Copilot) — so "shared" and "feature" are not distinguishable, and there is no obvious place for a new primitive to live.

Consequence: 232 files each restyle buttons, inputs, popovers, and modals by hand. That is the drift engine.

### 1.7 Duplicated and dead code

- Duplicate component pairs: `Data/DataLocationTab.tsx` **and** `Settings/DataLocationTab.tsx`; `GlobalComponents/modals/AddBookmarkModal.tsx` **and** `Projects/ProjectDetails/MoodboardPage/AddBookmarkModal.tsx`.
- Four separate empty-state implementations: `GlobalComponents/EmptyState.tsx`, `EmptyFileState.tsx`, `Clients/EmptySearchState.tsx`, `GlobalComponents/ComingSoon.tsx`.
- `EmptyState.tsx` has a live bug: `primaryAction` is declared in `EmptyStateProps` and **never rendered** (only `secondaryAction` is), and the root `id` is hardcoded to `"lead-empty-state"` while the `id` prop (default `'empty-state'`) is ignored. On every non-Leads page, the primary CTA silently does not appear.
- Root-level sprawl that reads as "unfinished project": `Flow-Studio-v1.0.0-Windows-x64.zip`, `FlowStudio-Windows-x64/`, `FlowStudio-Production/`, `Labib778/`, `Stitch/`, `Test it First/`, `build-release/`, `release/`, `dist-server/`, `test-results/`, `moveable-debug.txt`, `firebase-debug.log`, and a stray file named `0`.
- `components/uilayouts/` at repo root is outside the Vite `resolve.alias` (`'@' → project root`) and unused by `src/`.

### 1.8 No quality gate

- **0** test files (`*.test.*` / `*.spec.*` — no matches).
- **No** ESLint, Prettier, Biome, or `.editorconfig` config anywhere in the repo.
- **No** CI workflow (`.yml`/`.yaml` — no matches).
- `npm run lint` is just `tsc --noEmit` — it type-checks, it does not lint.
- **59** `TODO` occurrences.

The reason consistency decays is structural: nothing fails when it decays.

### 1.9 Data honesty

`MOCK_DATA_REPORT.md` catalogs **25 hardcoded mock structures**, several of which are *fallback render paths that a real user will hit*: `NotificationDropdown.tsx` hardcodes 3 notifications; `Dashboard/Renewals.tsx` hardcodes Adobe/Figma/Slack as literal JSX; `TaskPage/FilesTab.tsx` hardcodes `brand_guide.pdf`; `billingStore.ts` seeds balance `12400` and cardholder `"Bruce Wayne"`; `teamStore.ts` seeds `John Doe`.

A user who opens Notifications on day 1 sees fabricated alerts. That single experience does more damage to "this app is complete" than any missing feature. Honesty of state is a UX requirement, not a data-migration chore.

### 1.10 What is already strong (do not rebuild)

- **Skeleton coverage is genuinely good**: 13 feature skeletons + `PageSkeletonRouter.tsx` + `ui/Skeleton.tsx`.
- **Motion language is coherent** and documented (`AnimatePresence` tab swaps, `duration: 0.15`, `ease: [0.16, 1, 0.3, 1]` for drawers).
- **Scrollbars unified** at 5px, `#cbd5e1` → `#94a3b8` hover, plus a dark variant.
- **Dev tooling exists** (`DevSettingsWorkspace`, `WithDevHoverBounds`) — this is a real asset for the enforcement phase.

The app is well-built. It needs consolidation, not reinvention.

---

## 2. Root causes

| # | Cause | Symptom the user feels |
|---|---|---|
| R1 | Two token files, neither authoritative (`tailwind.config.js` dead, `@theme` never documented) | Different primary colour per screen |
| R2 | No `ui/` primitive layer | Same control styled 5 ways; new screens invent buttons |
| R3 | Docs describe a system the code doesn't implement (dark mode, `#111111`, `rounded-lg`) | Contributors "fix" screens toward a system that doesn't exist |
| R4 | No enforcement (no lint, no CI, no visual regression) | Drift returns within weeks of any cleanup |
| R5 | No state-coverage contract (empty/error/partial/first-run undefined) | Screens look designed with fake data, hollow with real data |

R1–R4 cause the *inconsistency*. R5 causes the *incompleteness*.

---

## 3. Definition of "feels complete"

Write this into `Docs/DESIGN.md` so "complete" is testable, not a vibe:

A screen is **complete** only when all seven hold:

1. **Empty** — explains what this is and offers the one action that creates the first item.
2. **Loading** — a skeleton shaped like the real content (not a spinner in the middle of a blank page).
3. **Error** — states what failed, in plain language, with a retry.
4. **Partial** — works with 1 item and with 20,000 (virtualized where applicable).
5. **No dead ends** — every empty/locked/disabled control says why, or is not rendered.
6. **Honest data** — never shows fabricated content on a real user's screen.
7. **Consistent shell** — same tokens, radius, motion curve, and feedback as every other screen.

Screens failing #6 today: Notifications, Dashboard→Renewals, Files tab, Billing, Team (per §1.9).

---

## 4. The plan

### Phase 0 — Freeze one source of truth (½ day)

**0.1** Delete `tailwind.config.js` (it is dead code under Tailwind v4 + no `@config`) **or** convert it to the real config and add `@config "../tailwind.config.js"`. Pick one; do not leave both.

**0.2** Rewrite `src/index.css` `@theme` to be the *only* palette. Keep semantic names so intent is readable at the call site.

> **Decision required before this step.** The code ships a blue brand primary (`#1978e5`, 32 raw uses + 159 `bg-primary`/`text-primary` call sites) while `Docs/DESIGN.md` specifies near-black (`#111111`). These produce visibly different products. Pick one deliberately — this is a brand call, not a refactor. The snippet below assumes the documented monochrome direction and should be adjusted if blue is the real brand.

```css
@theme {
  /* action layer — monochrome, per Docs/DESIGN.md */
  --color-primary: #111111;
  --color-primary-active: #242424;
  --color-accent: #3b82f6;

  /* surfaces */
  --color-canvas: #ffffff;
  --color-surface-soft: #f8f9fa;
  --color-surface-card: #f5f5f5;
  --color-surface-dark: #101010;   /* the ONE dark surface */
  --color-hairline: #e5e7eb;

  /* text */
  --color-ink: #111111;
  --color-body: #6b7280;

  /* semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* priority flags (keep — already correct in Docs/DESIGN.md §2) */
  --color-priority-urgent: #f04f5e;
  --color-priority-high: #f5a133;
  --color-priority-normal: #3ba2f7;
  --color-priority-low: #94a3b8;
}
```

**0.3** Move the ClickUp purple `#7b68ee` (33 hits) and dashboard purple `#3713ec` (1 hit) into **named tokens** so their use is intentional and greppable — or delete them. `#7b68ee` is currently the drag/drop indicator colour, which is legitimate; it must simply stop being a raw hex.

**0.4** Fix the port contradiction: make `flowstudio.config.json` authoritative, delete the `3009` fallback in `vite.config.ts`, correct `README.md` to 3011.

**0.5** Fix `Docs/DESIGN.md`: remove the false dark-mode claim (§11) or mark it "Planned — not implemented"; reconcile §4 button/input radii with the real distribution.

**Exit criteria:** `grep -rn "#[0-9a-fA-F]\{6\}" src/` returns only `@theme` and intentional flag/status maps.

---

### Phase 1 — Build the primitive layer (R2; ~1 week)

Create `src/components/ui/` as the *only* home for primitives, with a `variants` API (`class-variance-authority` and `clsx` + `tailwind-merge` are already dependencies — no new packages needed).

Target set (in build order — each one unlocks deleting hand-rolled styles):

| Primitive | Replaces (approx.) | Notes |
|---|---|---|
| `Button` | every inline button in 232 files | variants `primary \| secondary \| ghost \| destructive`, sizes `sm \| md \| icon`; guarantees the `active:scale-95` tactile feedback is uniform |
| `Input`, `Textarea` | onboarding wizard, billing, leads, notes | fixes the `focus:border-slate-900 focus:ring-1` inconsistency |
| `Select` | `CustomSelect.tsx` + remaining native `<select>` | keep the existing Framer Motion menu; make it the only dropdown |
| `Popover` / `DropdownMenu` | `CellPopover`, `DropdownMenu`, `ColumnHeaderMenu`, `DueDateDropdown`, … | **this is the biggest single win** — `PROJECT_SUMMARY.md` documents repeated "double border / clipping / padding" fixes because each popover re-implements its shell |
| `Modal` | 10+ hand-rolled modals | must own the already-invented scroll-lock + `bg-slate-950/60` overlay so it stops being re-derived |
| `Badge` / `StatusPill` | status pills across tasks, clients, leads | drives from `statusColor` maps, not ad-hoc classes |
| `Tabs` | `PillTab.tsx` + per-page tab groups | enforce the documented `bg-slate-900 text-white` ⇄ `border-slate-200 text-slate-500` swap with matched metrics (the "no layout jitter" fix, once) |
| `EmptyState` | the 4 existing variants | fix the `primaryAction` never-rendered bug; props: `icon, title, description, primaryAction, secondaryAction` |
| `Skeleton` | `ui/Skeleton.tsx` + 13 feature skeletons | expose `text \| card \| row \| table` shapes so new pages compose instead of inventing |
| `ErrorState` | *does not exist* | retry affordance; this is a genuine hole |
| `Tooltip` | `WithDevHoverBounds`, misc hover popups | one delay/placement contract |
| `IconButton` | circular 36×36 buttons | enforce the documented touch target |

**Rule to add to `AGENTS.md` (and a real `AGENTS.md` for coding — see Phase 3.4):** "Feature code imports primitives from `src/components/ui`. A raw `<button>` with more than two style classes in a feature file is a defect."

**Exit criteria:** Tasks, Clients, and Leads pages contain zero hand-rolled buttons/popovers/modals. Deleting `GlobalComponents/CustomSelect.tsx` and the duplicate `AddBookmarkModal` / `DataLocationTab` copies is safe.

---

### Phase 2 — State coverage & honesty (R5; ~1 week, highest perceived impact)

**2.1** Purge fallback mock data that a real user can reach (`MOCK_DATA_REPORT.md` §13, §14, §9, §15, §24). Replace with real empty states driven by the store. Priority order:
1. `NotificationDropdown.tsx` (visible on every screen, fabricated)
2. `Dashboard/Renewals.tsx` (generic UI, fabricated)
3. `TaskPage/FilesTab.tsx` (generic UI, fabricated)
4. `billingStore.ts` "Bruce Wayne" + card `**** 1436`
5. `teamStore.ts` "John Doe"

Keep seeding only behind an explicit "Load demo data" action, so the app can still be demoed without lying by default.

**2.2** Add `ErrorState` + error boundaries per route. Today a thrown render error blanks the app.

**2.3** Audit every list/grid for the 7-point contract in §3. Use the existing `PageSkeletonRouter` as the loading template.

**2.4** Destructive-action clarity: confirm the `ConfirmDialogModal` is used by *every* delete (client, project, task, column, note, moodboard item) — `PROJECT_SUMMARY.md` shows this was added piecemeal.

**2.5** Keyboard & focus. Measured: `focus:` utilities are used **622** times — focus *styling* is genuinely good. The real gap is elsewhere:

| Signal | Occurrences | Reading |
|---|---|---|
| `focus:` | 622 | Focus rings are styled everywhere — keep |
| `focus-visible:` | **0** | Rings also fire on mouse click, so the app shows keyboard affordance to mouse users — reads as slightly "off", not as broken |
| `aria-` | **29** (in only **6** of 232 files) | Screen-reader semantics effectively absent |
| `role=` | **4** | Almost no landmark/dialog semantics |
| `tabIndex` | **2** | Custom composite widgets (task grid, moodboard, popovers) are not programmatically focusable |

So: swap `focus:` → `focus-visible:` on the pointer-driven controls (one sed pass, big polish win), then add `aria-label`/`role`/`aria-expanded` to popovers, modals, and the sidebar. Also verify `Esc` closes every popover/sidebar/modal and focus returns to the trigger on close — with `tabIndex` at 2, this is currently unlikely to be uniform. This is the difference between "looks complete" and "feels complete" for power users, and it is also the cheapest WCAG-AA win available.

**2.6** First-run experience: one-time onboarding state (name/workspace/data location) so `Documents/FlowStudio-Data/` is explained rather than assumed. The `SplashScreenModal` is the natural host.

**Exit criteria:** a brand-new install shows zero fabricated content; every empty list has a next action; every failure has a retry.

---

### Phase 3 — Make it enforceable (R4; ~2 days, prevents regression)

**3.1** Add ESLint (`eslint-config-next`-style flat config is not applicable — use `typescript-eslint` + `eslint-plugin-react-hooks`) with two custom guardrails:
- `no-restricted-syntax` / a small custom rule flagging hex literals (`#[0-9a-fA-F]{3,8}`) in `className` outside `src/index.css` and designated status maps.
- `no-restricted-imports` banning direct imports that bypass `src/components/ui` for the primitives you have built.

**3.2** Add Prettier + `.editorconfig` (2-space, single quotes, LF — match existing files). Normalize once, then never discuss formatting again.

**3.3** Add CI (GitHub Actions) running: `tsc --noEmit` → `eslint` → `prettier --check` → `vite build`. Keep it to one job; the value is a red X on drift, not coverage theatre.

**3.4** Rewrite repo-root `AGENTS.md`. It currently contains the *in-app AI Co-Pilot system protocol* (workflows A/B/C, moodboard JSON schemas), not contributor/agent instructions. Any tool or developer that reads `AGENTS.md` — including AI agents — gets the wrong context. Move that content to `Docs/COPILOT-PROTOCOL.md` and write a real `AGENTS.md` covering: build/test commands, where primitives live, token rules, and the §3 completeness contract.

**3.5** Visual regression on the 8 highest-traffic screens (Dashboard, Projects, Project Details ×5 tabs, Clients, Leads, Tasks) via Playwright screenshots. Playwright is not currently a dependency; add it in this phase, not earlier.

**3.6** Repo hygiene: move `Flow-Studio-*.zip`, `FlowStudio-Windows-x64/`, `FlowStudio-Production/`, `Labib778/`, `Stitch/`, `Test it First/`, `build-release/`, `release/`, `test-results/`, `moveable-debug.txt`, `firebase-debug.log`, and the file named `0` out of the tracked tree (or into `.gitignore` + a single `artifacts/` folder). Perceived completeness starts at the repository boundary.

**Exit criteria:** CI fails when a raw hex or an un-primitived button is added.

---

### Phase 4 — Density & shell polish (optional, after 0–3)

Only once the above is in place:
- One documented radius scale: pill controls `rounded-full`; inputs/buttons `rounded-lg`; cards `rounded-xl`. Decide what `rounded-2xl` (189 uses) is for, or remove it.
- One "active pill" spec: pick `bg-slate-900` **or** `bg-slate-950`, update `Docs/DESIGN.md` to match reality, apply once.
- Sidebar + page-header rhythm unified across the 8 top-level views (`Calendar`, `Data`, `Reports`, `Team`, `Time` are the least-consistent, being the newest).
- Dark mode: implement for real (`.dark` class on `documentElement`, tokens already structured for it in Phase 0) or delete the section from the docs. Do not leave it half-documented.

---

## 5. Progress metrics (re-measure after each phase)

| Metric | Baseline (2026-09-25) | Target |
|---|---|---|
| Raw hex literals in `src/` (excl. `@theme` + status maps) | 275 (`#111111` 209 + `#7b68ee` 33 + `#1978e5` 32 + `#3713ec` 1) | 0 |
| Distinct primary colours in use | 4 | 1 |
| Files in `src/components/ui/` | 3 | 15+ |
| Duplicate component pairs | 2 | 0 |
| Empty-state implementations | 4 | 1 |
| Fabricated fallbacks reachable by a real user | 5+ | 0 |
| Test files | 0 | >0 (smoke + visual) |
| Lint/format/CI configs | 0 | 3 |
| `aria-` occurrences / files containing them | 29 / 6 of 232 | every popover, modal, icon button |
| `focus-visible:` usages (vs `focus:` 622) | 0 | pointer controls migrated |
| Docs statements contradicting code | 3 (dark mode, port, primary) | 0 |

---

## 6. Sequenced recommendation

Do **Phase 0 → 1 → 3.1/3.3 → 2** in that order, not in numeric order.

Rationale: Phase 0 makes the target unambiguous; Phase 1 removes the hand-rolling that generates most drift; Phase 3.1/3.3 locks it before the churn of Phase 2 touches dozens of screens; Phase 2 then delivers the change the *user* actually notices. Phase 3.4 (`AGENTS.md`) is worth doing immediately — it is 30 minutes and it stops every future agent session from re-deriving a palette.

Estimated effort: Phase 0 ~½ day · Phase 1 ~5–7 days · Phase 3 ~2 days · Phase 2 ~5–7 days. Roughly three working weeks for "complete + consistent", versus unbounded time spent polishing individual screens that keep drifting apart.
