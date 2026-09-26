# Flow Studio — UI/UX Completeness & Consistency Plan

> Audit date: 2026-09-25 · Scope: `src/` (232 TS/TSX files) + repo config
> Goal: make the app *feel* complete, and make consistency enforceable instead of aspirational.

---

## 0. Executive summary

The app does not feel incomplete because features are missing. It feels incomplete because **four competing design palettes live in the same codebase, and none of them is enforced**. `Docs/DESIGN.md` describes a Cal.com monochrome system (`#111111` primary). The running code ships a blue primary (`#1978e5`), a purple dashboard accent (`#3713ec`), and a ClickUp purple (`#7b68ee`). Every screen is internally polished; the seams *between* screens are what the user reads as "unfinished".

So the work is not "add more UI". It is three things, in this order:

1. **Collapse the competing palettes into 1 enforced token layer** — the main theme is **monochrome** (`primary` `#111111`, owning CTAs and active states) with **blue as the single accent** (`--color-accent` `#1978e5`, owning links, icon tints, rings and selection). This removes the inconsistency the user can feel.
2. **Build the ~12 missing primitives** so new screens can't invent their own button (stops the drift from re-accumulating).
3. **Close the state-coverage and honesty gaps** (empty / loading / error / partial / first-run) — this is what actually converts "demo" into "complete".

Everything below is grounded in measurements from the current tree, not in general advice.

---

## 1. Measured evidence

### 1.1 Competing primaries in one codebase

| Value | Occurrences in `src/` | Role after the 2026-09-25 decision |
|---|---|---|
| `#111111` | 209 | **Primary — the main theme is monochrome.** Owns CTAs, active pills, active states. |
| `#1978e5` | 32 raw + ~211 token uses | **Accent (blue).** Owns links, icon tints, rings, selection, focus. Never the CTA. |
| **Tailwind `blue-500/600/700`** | **324 across ~55 files** | **The third blue — the largest single source of drift.** Untokenised. See below. |
| `#3b82f6` | raw hex in a couple of places | Retired from the spec; should fold into `accent`. |
| `#7b68ee` | 33 | Unmanaged purple (task list, column resize, drop indicator) — needs a token. |
| `#3713ec` | 1 | Unmanaged purple (`--color-dash-primary`, Dashboard) — needs a token. |

The primary is settled: `#111111` owns the action layer and blue owns the accent layer.

**The real headline, found only after migrating the tokens:** the app does **not** have four colours, it has **three separate blues** — the token `#1978e5`, Tailwind's `blue-600` `#2563eb`, and the documented `#3b82f6`. The raw `blue-*` family is used **324 times across ~55 files** — 44 sites in `AddNewClientPage` alone, plus `ApifyLeadGeneratorPage` (19), `MemberDetailsPage` (6), `EmailDraftsPage` (8), `FileExplorer` (17), `TeamPage` (6), `ClientDetailsPage` (12). This is concentrated in the **newest** screens (Clients, Leads, Team, Files), which were built while the older screens used the token. It is the clearest mechanical explanation of why the app reads as inconsistent: the same "blue" is three different hex values depending on which screen you are on, and which month it was written.

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

**Correction to an initial reading:** `text-primary` is *not* mis-rendering ink as blue. Sampling 18 call sites (Billing, Invoices, Clients) shows it used consistently as a **blue accent** — icon tints, `bg-primary/10` badge fills, `hover:text-primary` links. The code is internally consistent; the problem is that the *name* `primary` means "blue accent" in code and "near-black ink" in `Docs/DESIGN.md`. A naming collision across two systems, not a rendering bug.

**Undefined token reference — a live defect (4 call sites).** `@theme` defines `--color-primary-hover` (used 3 times), but four call sites reach for `--color-primary-dark`, which does not exist:

| File | Line | Dead class | Effect |
|---|---|---|---|
| `Billing/NewInvoicePage.tsx` | 447 | `hover:text-primary-dark` | no colour change on hover |
| `Billing/NewInvoicePage.tsx` | 530 | `hover:text-primary-dark` | no colour change on hover |
| `GlobalComponents/Sidebars/AssignedExpertsSidebar.tsx` | 190 | `hover:bg-primary-dark` | no background change on hover |
| `Projects/NewProject/ProjectForm.tsx` | 201 | `hover:bg-primary-dark` | no background change on hover |

Tailwind generates no utility for an undefined theme variable, so the class is **silently inert**. A primary button in `ProjectForm` and a link in `NewInvoicePage` therefore have no hover feedback at all. This is precisely the defect class a token audit surfaces and a visual-regression test would catch.

**The light tokens don't match the docs either.** `@theme` defines `--color-background-light: #f6f7f8` and `--color-surface-light: #ffffff`, while `Docs/DESIGN.md` §2 specifies Canvas `#ffffff` and Surface Card `#f5f5f5`. Three different "white-ish" values across two systems.

### 1.5 Documentation that contradicts the code

| Claim | Reality |
|---|---|
| `Docs/DESIGN.md` §11: dark mode "Implemented via CSS variables in `src/index.css` toggled by `SettingsContext.tsx`" | **Never implemented, and now out of scope.** Zero hits for `documentElement.classList`, `classList.add('dark')`, or `darkMode` anywhere in `src/`. The three dark tokens in `@theme` (`--color-background-dark`, `--color-surface-dark`, `--color-border-dark`) are referenced **0** times. **Decision (2026-09-25): Flow Studio is light-theme only.** §11 now states that explicitly instead of promising a feature that will not ship. |
| Backend port | **Correction: not a documentation contradiction — one code bug.** `server.ts` defaults to **3010** and negotiates a fallback chain (`preferred, 3010, 3009, 3011, 3012`), persisting whichever port it wins to the gitignored `flowstudio.config.json` — hence **3011** on this machine, which is expected behaviour, not drift. `README.md` says 3010 and is **correct**. The defect is `vite.config.ts`, which falls back to **3009**: on a fresh clone (where the gitignored config does not exist) Vite proxies `/api` to 3009 while the server binds 3010 first. Fixed 2026-09-25. |
| `src/components/` layout in `README.md` | Omits `Calendar/`, `Data/`, `Reports/`, `Team/`, `Time/`, `TestItFirst/`, and `GlobalComponents/AICopilot/` entirely. |

Documentation that lies is worse than no documentation: it is the mechanism by which the next contributor re-introduces drift.

### 1.6 Primitive layer is missing, not thin

- `src/components/ui/` contains **3 files**: `CellPopover.tsx`, `DatePickerInput.tsx`, `Skeleton.tsx`.
- There is **no** `Button`, `Input`, `Select`, `Dialog`, `Popover`, `Badge`, `Tabs`, `Tooltip`, or `EmptyState` in `ui/`.
- Shared UI instead accumulates in `src/components/GlobalComponents/` (a folder that also holds dev tooling, file explorer, and the AI Copilot) — so "shared" and "feature" are not distinguishable, and there is no obvious place for a new primitive to live.

Consequence: 232 files each restyle buttons, inputs, popovers, and modals by hand. That is the drift engine.

**Corroborated by the type-checker.** 5 of the 16 files failing `npm run lint` are TaskPage popovers — `ColumnHeaderMenu`, `DueDateDropdown`, `StatusConfigPopover`, `TaskCommentsPopover`, `TaskGroupOptionsMenu` — each passing `sideOffset` / `className` / `align` to `CellPopover`, whose `CellPopoverProps` type does not declare them (`TS2322`, `TS2769`). That is precisely the predicted symptom: every popover growing its own shell instead of sharing one. The `Popover` primitive in Phase 1 is therefore not cosmetic — it also removes five compile errors.

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
- **And it currently fails.** `npm run lint` exits **2** with **27 type errors across 16 files** (measured 2026-09-25; codes: TS2322 ×11, TS2339 ×7, TS2769 ×3, TS2345 ×2, TS2367 ×2, TS2307 ×1, TS2741 ×1). None are in files this audit modified.
- **59** `TODO` occurrences.

The reason consistency decays is structural: **the one quality gate that exists is already red**, so nothing fails when it decays. A red build that everyone has learned to ignore is functionally identical to no build at all — which is how 27 errors and four competing palettes accumulated in the same tree.

**Resolved 2026-09-25 — and switching the gate on paid for itself immediately.** All 27 errors are fixed; `npm run lint` exits 0 and CI blocks on `tsc --noEmit` → `eslint` → `vite build` (`format:check` is advisory, since the tree has never been Prettier-formatted). ESLint then surfaced **seven defects that the type-checker could not see**:

| Defect | User-visible impact |
|---|---|
| `main.cjs` `fs:createFile` called `resolveFsPath` / `invalidateCache` from module scope, but both are scoped inside the `FileSystemService` closure | `ReferenceError` on **every create-file action** in the desktop app |
| `FileExplorer` returned a fast path *before* four hooks | "Rendered more hooks than during the previous render" whenever a folder held both images and non-images |
| `ProjectHeader` called four hooks *after* `if (!currentProject) return null` | Same crash on first project load |
| `App.tsx` `default:` rendered `<Projects>` without `onEditProject` | `onEditProject is not a function` on any unrecognised view |
| `NotesPage` assigned the `{color,contrast,textShadow}` object to `style.caretColor` | Caret colour silently never applied |
| `OverviewPage` compared `phase` to `'in_progress'` while the store uses `'inprogress'` | Dead branch — in-progress styling never rendered |
| `teamStore` had `merged.invites = merged.invites` | No-op assignment hiding the real intent |

**Four of these are hard crashes or silently dead UI on ordinary user actions**, and none were visible to `tsc` — nor had any ever been reported. That is the concrete argument for a lint gate, and the reason it should not be traded away later.

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
| R3 | Docs describe a system the code doesn't implement (`#111111`, `rounded-lg`, a dark mode that was never built) | Contributors "fix" screens toward a system that doesn't exist |
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

**Screens failing #6 — re-verified 2026-09-26.** The original list (Notifications, Dashboard→Renewals, Files tab, Billing, Team) came from `MOCK_DATA_REPORT.md`, which is **partially stale** and must not be used as a worklist without re-checking each entry. Re-verification so far:

- `billingStore.ts` is **clean** — `balance: 0`, `nextPaymentDate: ''`, `savedCard` all empty strings, `paymentHistory: []`. The report's "Bruce Wayne" entry no longer exists.
- `Dashboard/Renewals.tsx` reads the real `paymentHistory`; no Adobe/Figma/Slack fallback was found.
- Team's `John Doe` is a form `placeholder` in `EditMemberModal.tsx:581` — correct UX, not fabricated data.
- **The one confirmed real failure was `BillingPage.tsx`** (see §1.4): it generated a random masked card number, defaulted the brand to `Mastercard`, and stamped an expiry three years out on mount, then persisted all of it. **Fixed 2026-09-26** — the fabrication was removed, because every card field already renders a neutral placeholder.

Notifications and the Files tab remain **unverified** — check before changing them.

---

## 4. The plan

### Phase 0 — Freeze one source of truth (½ day)

**0.1** ~~Delete `tailwind.config.js`~~ — **Done 2026-09-26.** Deleted (sent to the Recycle Bin) as dead code: under Tailwind v4 with no `@config` directive it was never read, which is why contributors kept "fixing" screens against a palette that had no effect. The now-dangling `"config"` key in `components.json` was removed in the same change.

**0.2** Rewrite `src/index.css` `@theme` to be the *only* palette. Keep semantic names so intent is readable at the call site.

> **Decided 2026-09-25: monochrome main theme, blue accent.** `Docs/DESIGN.md` corrected to match. **This one is a visible change** — the 25 solid `bg-primary text-white` CTAs move from blue to near-black. The ~211 accent-role utilities (`text-`, `border-`, `ring-`, `shadow-`, `from-primary`, plus the `/5`–`/20` washes) were migrated to `accent` in the same pass, so they keep the identical blue and the diff stays reviewable. Five CTA shadow sites and five CTA hover sites that would otherwise have become "black button, blue glow / blue hover" were corrected to monochrome in the same commit.

```css
@theme {
  /* Monochrome main theme — `primary` owns CTAs and active states */
  --color-primary: #111111;
  --color-primary-hover: #242424;

  /* Blue is the accent — links, icon tints, rings, selection. Never the CTA. */
  --color-accent: #1978e5;
  --color-accent-hover: #1565c0;

  /* surfaces — IMPLEMENTED 2026-09-26. Values deliberately kept identical to the
     previous light tokens, so this rename was visually a no-op. */
  --color-surface-soft: #f6f7f8;   /* was --color-background-light */
  --color-hairline: #e2e8f0;       /* was --color-border-light */
  /* --color-surface-light (#ffffff, 0 references) deleted. */

  /* NOT YET IMPLEMENTED — proposed only. Do not assume these exist: */
  /*  --color-canvas: #ffffff;  --color-surface-card: #f5f5f5;
      --color-surface-dark: #101010;  --color-ink: #111111;  --color-body: #6b7280;
      --color-success / --color-warning / --color-danger;
      Raw #111111 (209 uses) and the semantic hexes are still literals at call sites. */

  /* priority flags (keep — already correct in Docs/DESIGN.md §2) */
  --color-priority-urgent: #f04f5e;
  --color-priority-high: #f5a133;
  --color-priority-normal: #3ba2f7;
  --color-priority-low: #94a3b8;
}
```

**Migration note.** The light tokens must be handled at their call sites before deletion: `--color-border-light` (3 uses) and `--color-background-light` (1 use) need renaming; `--color-surface-light` is unused (0). The three dark tokens (`--color-background-dark`, `--color-surface-dark`, `--color-border-dark`) are unused (0) and were deleted outright per §11 of `Docs/DESIGN.md`.

**Still outstanding — the 324 raw `blue-*` utilities (§1.1).** This is the largest single consistency item in the codebase and it is *not* mechanical: most are legitimate accent roles (icon tints, chips, links) that should become `accent`, but some are CTAs that should become monochrome `primary`, and `AddNewClientPage` (44 sites) needs a per-screen review rather than a blind replace. Sequence it as its own commit per screen group — Clients, Leads, Team, Files — so each is independently reviewable and revertible. `blue-500 #3b82f6`, `blue-600 #2563eb` and `blue-700 #1d4ed8` all collapse onto the single `accent` `#1978e5`.

**Separate open issue.** `Docs/DESIGN.md` §2 also defines a *second* blue, `Brand Accent #3b82f6`, which is visually near-identical to `Primary`. The code reaches for it only as a raw hex, never as a token. Recommendation: collapse it into `Primary` unless a genuinely distinct accent is wanted — dumbing down to one blue removes a whole class of "which blue is this?" decisions.

**0.3** Move the ClickUp purple `#7b68ee` (33 hits) and dashboard purple `#3713ec` (1 hit) into **named tokens** so their use is intentional and greppable — or delete them. `#7b68ee` is currently the drag/drop indicator colour, which is legitimate; it must simply stop being a raw hex. Also delete the three dead dark-mode tokens (`--color-background-dark`, `--color-surface-dark`, `--color-border-dark`) — verified **0** references in `src/`, since dark mode is out of scope.

**0.4** ~~Fix the port contradiction~~ **Done 2026-09-25.** The Vite proxy fallback was `3009` while `server.ts` binds `3010` first (`ports = [preferred, 3010, 3009, 3011, 3012]`), so a fresh clone — where the gitignored `flowstudio.config.json` is absent — proxied `/api` to a port the server would not use. Vite's fallback is now `3010`, matching the server's own default. `README.md` already said 3010 and was correct; it was left alone.

**0.5** Fix `Docs/DESIGN.md`: §11 now carries an explicit light-theme-only statement (dark mode is out of scope — do not add `.dark` variants, dark tokens, or theme-toggle UI); still to do: reconcile §4 button/input radii with the real distribution.

**0.6** Fix the four dead hover classes listed in §1.4 — rename `primary-dark` → `primary-hover`, or define the token. Then add a guard so the class of bug cannot return: assert that every `bg-`/`text-`/`border-`/`ring-` utility referencing a theme token resolves to a variable actually declared in `@theme`.

**Exit criteria:** `grep -rn "#[0-9a-fA-F]\{6\}" src/` returns only `@theme` and intentional flag/status maps; and no utility class references an undeclared token.

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

> **Status 2026-09-25: 3.1, 3.2 and 3.3 are in place.** `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.editorconfig`, `.gitattributes` and the CI workflow now exist, and `npm run lint` is green. 3.4 (`AGENTS.md` split) landed 2026-09-26; 3.5 (visual regression) and 3.6 (repo hygiene) remain. One caveat: the CI workflow file is committed locally but **not yet on the remote** — GitHub rejects pushes containing workflow files unless the token carries the `workflow` scope. Add the scope, then push it.

**3.1** Add ESLint (`eslint-config-next`-style flat config is not applicable — use `typescript-eslint` + `eslint-plugin-react-hooks`) with two custom guardrails:
- `no-restricted-syntax` / a small custom rule flagging hex literals (`#[0-9a-fA-F]{3,8}`) in `className` outside `src/index.css` and designated status maps.
- `no-restricted-imports` banning direct imports that bypass `src/components/ui` for the primitives you have built.

**3.2** Add Prettier + `.editorconfig` (2-space, single quotes, LF — match existing files). Normalize once, then never discuss formatting again.

**3.3** Add CI (GitHub Actions) running: `tsc --noEmit` → `eslint` → `prettier --check` → `vite build`. Keep it to one job; the value is a red X on drift, not coverage theatre.

> **Prerequisite — do this first.** Clear the 27 existing type errors (§1.8). Wiring up CI while `tsc` is already failing ships a red build on day one; the team learns to ignore it and the effort is wasted. Fix the 27, *then* turn the gate on. Five of them disappear for free when the `Popover` primitive lands (§1.6).

**3.4** ~~Rewrite repo-root `AGENTS.md`~~ — **Done 2026-09-26, with a deliberate deviation from the plan above.** `AGENTS.md` now contains real contributor/agent instructions: commands, the backend-port contract, "read before you edit" pointers, the enforced token rules, the §3 completeness contract, the quality gate, and a pointer to the Copilot protocol.

The deviation: **`Docs/COPILOT-PROTOCOL.md` was deliberately *not* created.** Reading the tree first showed the protocol already exists in three places, so moving it would have produced a *fourth* copy — the same duplication failure mode as the three blues:

| Copy | Location | Status |
|---|---|---|
| 1–3. Runtime truth | `server.ts` `systemInstruction` at ~2473, ~2574, ~2644 | **Three separate inline copies of the same Co-Pilot persona** |
| 4. Documentation | `Docs/RULES.md` §2 (context resolution, workflows A/B/C, task schema, moodboard schemas) | Already complete |
| 5. Standards | `Docs/RULES.md` §3 (UI/animation) | `AGENTS.md` §4 was duplicating this |

So `AGENTS.md` now *points* to `Docs/RULES.md` §2/§3 and to `server.ts` as the runtime source of truth. The `graft:` block is preserved verbatim (note: it is duplicated between `AGENTS.md` and `GEMINI.md`).

**New finding:** the three `systemInstruction` blocks in `server.ts` should be consolidated into one shared constant. Three drifting copies of one persona will diverge exactly the way three blues did.

**3.5** Visual regression on the 8 highest-traffic screens (Dashboard, Projects, Project Details ×5 tabs, Clients, Leads, Tasks) via Playwright screenshots. Playwright is not currently a dependency; add it in this phase, not earlier.

**3.6** Repo hygiene: move `Flow-Studio-*.zip`, `FlowStudio-Windows-x64/`, `FlowStudio-Production/`, `Labib778/`, `Stitch/`, `Test it First/`, `build-release/`, `release/`, `test-results/`, `moveable-debug.txt`, `firebase-debug.log`, and the file named `0` out of the tracked tree (or into `.gitignore` + a single `artifacts/` folder). Perceived completeness starts at the repository boundary.

**Exit criteria:** CI fails when a raw hex or an un-primitived button is added.

---

### Phase 4 — Density & shell polish (optional, after 0–3)

Only once the above is in place:
- One documented radius scale: pill controls `rounded-full`; inputs/buttons `rounded-lg`; cards `rounded-xl`. Decide what `rounded-2xl` (189 uses) is for, or remove it.
- One "active pill" spec: pick `bg-slate-900` **or** `bg-slate-950`, update `Docs/DESIGN.md` to match reality, apply once.
- Sidebar + page-header rhythm unified across the 8 top-level views (`Calendar`, `Data`, `Reports`, `Team`, `Time` are the least-consistent, being the newest).


---

## 5. Progress metrics (re-measure after each phase)

| Metric | Baseline (2026-09-25) | Target |
|---|---|---|
| Raw hex literals in `src/` (excl. `@theme` + status maps) | 275 (`#111111` 209 + `#7b68ee` 33 + `#1978e5` 32 + `#3713ec` 1) | 0 |
| Raw Tailwind `blue-*` utilities | **324** across ~55 files | 0 (all on `accent`) |
| Distinct blues in the codebase | 3 (`#1978e5`, `#2563eb`, `#3b82f6`) | 1 |
| Distinct brand colours in use | monochrome primary + 1 accent; 2 unmanaged purples remain | 1 primary + 1 accent + tokenised purples |
| Files in `src/components/ui/` | 3 | 15+ |
| Duplicate component pairs | 2 | 0 |
| Empty-state implementations | 4 | 1 |
| Fabricated fallbacks reachable by a real user | 5+ | 0 |
| Test files | 0 | >0 (smoke + visual) |
| Lint/format/CI configs | 0 → **4 added** (`eslint.config.js`, `.prettierrc`, `.editorconfig`, `.gitattributes`) + CI workflow | 4 |
| Type errors from `npm run lint` | 27 in 16 files → **0** | 0 |
| ESLint errors | 186 → **0** (401 warnings retained) | 0 |
| Real defects found by the new gate | **7** (4 crashes / dead UI) | 0 |
| `aria-` occurrences / files containing them | 29 / 6 of 232 | every popover, modal, icon button |
| `focus-visible:` usages (vs `focus:` 622) | 0 | pointer controls migrated |
| Docs statements contradicting code | 2 (primary, dark mode) — **both resolved 2026-09-25** | 0 |
| Dead token references (`primary-dark`) | 4 call sites — **fixed 2026-09-25** | 0 |
| Vite proxy port ≠ server default | 3009 vs 3010 — **fixed 2026-09-25** | aligned, no drift |

---

## 6. Sequenced recommendation

Do **Phase 0 → 1 → 3.1/3.3 → 2** in that order, not in numeric order.

Rationale: Phase 0 makes the target unambiguous; Phase 1 removes the hand-rolling that generates most drift; Phase 3.1/3.3 locks it before the churn of Phase 2 touches dozens of screens; Phase 2 then delivers the change the *user* actually notices. Phase 3.4 (`AGENTS.md`) is worth doing immediately — it is 30 minutes and it stops every future agent session from re-deriving a palette.

Estimated effort: Phase 0 ~½ day · Phase 1 ~5–7 days · Phase 3 ~2 days · Phase 2 ~5–7 days. Roughly three working weeks for "complete + consistent", versus unbounded time spent polishing individual screens that keep drifting apart.
