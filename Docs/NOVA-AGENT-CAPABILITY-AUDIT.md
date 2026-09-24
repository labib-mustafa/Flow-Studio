# Nova Agent Capability Audit + Implementation Plan

**Goal:** make the in-app AI agent (Nova) able to execute *every* task the Flow Studio UI can perform.

**Scope decisions (confirmed):**

| Decision | Value |
|---|---|
| Mechanism | Real executable tools (schema + handler + dispatcher + undo) |
| Out of scope | Settings & Dev tools, Auth & Login, Data / Trash |
| In scope | Projects, Tasks, Files, Notes, Moodboard, Clients CRM, Client Details, Leads, Lead Scraper, Email Campaigns, Team, Billing/Invoicing, Calendar, Time, Reports, Navigation, Notifications, Activity |
| This deliverable | Audit + plan (implementation follows approval) |

**Evidence note:** every row below traces to a source read (`file:line`). Items that could not be verified statically are marked `UNVERIFIED`. Runtime behaviour was not executed — no tools were invoked.

---

## 1. How Nova works today (5 layers)

```
serverAiTools.ts          (47 tool schemas, declared twice: groqTools + geminiTools)
        |
server.ts:1989 / :2067    (LLM call; system prompt at :1913)
        |
geminiService.chat()      (client bridge)
        |
useCopilotChat.ts         (agent loop; rule short-circuit at :133)
        |
agentToolDispatcher.ts    (routes to 7 handler modules)
        |
toolHandlers/*.ts         (execute against Zustand stores)
        |
agentUndoExecutor.ts      (inverse ops for undo)
```

Key property: **the tool schema is the agent's entire vocabulary.** A store action with no declared tool is invisible to Nova, regardless of how well the UI supports it.

---

## 2. Current declared tool surface (47 tools)

All from [serverAiTools.ts](serverAiTools.ts). `groqTools` spans lines 6-823; `geminiTools` duplicates the same 47 declarations across lines 828-1508.

| Group | Tools | Schema line |
|---|---|---|
| Tasks | `create_tasks`, `update_task`, `delete_tasks`, `add_task_comment` | 11, 39, 59, 74 |
| Projects | `create_new_project`, `update_project`, `delete_project`, `manage_project_tags`, `link_project_resource`, `update_project_banner`, `create_project_folder` | 91, 109, 132, 146, 162, 178, 193 |
| Clients CRM | `create_client`, `update_client`, `delete_client`, `book_client_appointment`, `manage_client_tags`, `create_client_note`, `log_client_invoice`, `create_client_task`, `attach_client_document`, `rate_client`, `assign_client_expert`, `open_client_details`, `scrape_leads` | 208, 228, 246, 260, 278, 294, 311, 328, 345, 361, 377, 393, 408 |
| Leads | `create_lead`, `update_lead`, `delete_lead`, `promote_lead_to_client` | 426, 447, 464, 478 |
| Team | `create_team_member`, `update_team_member`, `delete_team_member` | 494, 515, 533 |
| Billing | `create_invoice`, `update_invoice_status`, `delete_invoice` | 549, 568, 583 |
| Calendar | `schedule_event`, `update_event`, `delete_event` | 599, 617, 634 |
| Time | `start_timer`, `stop_timer`, `add_time_entry` | 650, 664, 678 |
| Notes | `create_project_note`, `update_project_note`, `delete_project_notes` | 696, 711, 726 |
| Moodboard | `add_moodboard_items`, `clear_moodboard`, `delete_moodboard_item` | 743, 774, 788 |
| Navigation | `navigate_to` | 805 |

**Handler coverage (statically confirmed):** handlers exist for the Tasks, Projects, Projects-Details, Clients, Client-Details, Client-Asset/Lead, Team, Billing, Calendar, Time groups ([toolHandlers/](src/components/GlobalComponents/AICopilot/utils/toolHandlers/)). Notes / Moodboard-add / `clear_moodboard` / `navigate_to` are handled in [contentNavHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/contentNavHandlers.ts) — `UNVERIFIED` in detail (grep truncated at 250 matches before that file's bodies were read).

---

## 3. The real capability layer (what the app can actually do)

Source: store exports (static read). Only the **"Nova tools"** column is exact — those are declared schemas in [serverAiTools.ts](serverAiTools.ts). The per-store action totals were enumerated by a read that was cut short, so this table deliberately shows coverage **qualitatively** rather than as a percentage.

| Store | Nova tools wired | Relative coverage |
|---|---:|---|
| `moodboardStore` | 3 | very low |
| `taskStore` | 4 | very low |
| `leadStore` | 4 | low |
| `mailStore` | 0 | none |
| `mailTemplateStore` | 0 | none |
| `scraperStore` | 1 | very low |
| `explorerTabStore` | 0 | none |
| `clientDetailsStore` | 0 | none |
| `notificationStore` | 0 | none |
| `activityStore` | 0 | none |
| `projectStore` | 7 | high (2 actions uncovered) |
| `clientStore` | 12 | high |
| `teamStore` | 3 | partial |
| `billingStore` | 3 | partial |
| `eventStore` | 3 | high |
| `timeStore` | 3 | partial |
| Notes (localStorage + `/api/store/notes`) | 3 | partial |
| Reports | 0 | no read path |

**Headline:** Nova exposes **11 tools** across moodboard, tasks, leads and email combined — and **zero** for email, which alone has a substantial store surface. The three areas the product is proudest of are the ones least exposed to the agent.

---

## 4. Gap map by module

### Moodboard — 3 tools wired (largest gap)
**Have:** add items, clear, delete one item.
**Missing:** `alignSelectedItems`, `distributeSelectedItems`, `toggleLockItems`, `duplicateItems`, `createSectionFrame`, `moveFrameWithChildren`, `updateCropMask`, `setItemCategories`, `setActiveCategoryFilter`, `setGridConfig`, `setView` (zoom/pan/center/fit), `saveToHistory`/`undo`/`redo`, `extractImagePalette`, `addBookmarkCard`, and all comment-pin ops (`addCommentPin`, `resolveCommentPin`, `addCommentReply`, `deleteCommentPin`).
**Also missing:** z-order (bring forward/front, send backward/back) — implemented in [MoodboardPage.tsx](src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx) via inline `setItems`+`saveToHistory`, so it needs a store action first.

### Tasks — 4 tools wired
**Have:** create, update (phase/priority/status/dueDate/details), delete, comment.
**Missing:** `toggleTaskAssignee`, `updateTasks` (bulk), `updateTaskType`, `updateTaskDates` (start+duration), custom-field writes, `addColumnSchema`, `updateColumnName`, `toggleColumnVisibility`, `removeColumnSchema`, `moveColumn`, `reorderColumns`, `toggleSort`/`setSortDirection`, `updateStatusConfig` (status name + colour), `setFieldsSidebarOpen`.
**Impact:** Nova cannot assign work, cannot bulk-edit, cannot configure the board.

### Leads — 4 tools wired (pre-email)
**Missing:** `bulkUpdateLeads`, `bulkDeleteLeads`, `bulkPromoteLeads`, `reorderLeads`, `importLeadsFromCSV`, column ops (`addColumn`, `updateColumn`, `updateColumnLabel`, `deleteColumn`, `reorderColumns`), selection ops (`selectAllLeads`, `toggleSelectLead`, `deselectAllLeads`).

### Email Campaigns — 0 tools wired (completely unexposed)
`mailStore`: `sendBulkMail`, `createBatch`, `updateQueueItem`, `pauseBatch`, `resumeBatch`, `cancelQueueItem`, `sendQueueItemNow`, `processQueue`, `deleteBatch`, `updateFollowUpSettings`, `syncReplies`.
`mailTemplateStore`: `addTemplate`, `updateTemplate`, `deleteTemplate`, `fetchRemoteDrafts`.
**Impact:** Nova cannot draft, schedule, pause, or send an outreach campaign — the single biggest functional hole.

### Lead Scraper — 1 tool wired
**Have:** `scrape_leads` (mock generator).
**Missing:** `setApiKey`, per-platform config (`setGmapsConfig`, `setIgConfig`, `setLiConfig`, `setGsConfig`), `setMustHaveFilters`, `clearScrapedLeads`, `removeScrapedLead`, staging selection, import-to-leads, CSV/Excel export.

### Team — 3 tools wired
**Missing:** `inviteMember`, `resendInvite`, `revokeInvite`, `addCustomRole`, `removeCustomRole`. `update_team_member` also exposes only role/department/status/bio — not `skills`, `certificates`, `activeFocus`, `assignedProjects`.

### Billing — 3 tools wired
**Missing:** `updateBillingAddress`, `updateSavedCard`, `clearBillingData`. NewInvoicePage line items, billing/shipping address and payment methods are not representable in `create_invoice` (only `amount`/`invoiceNumber`/`dueDate`/`status`/`notes`).

### Clients — high, with named gaps
**Missing:** `deleteNote`, `removePinnedAsset`, `addActivityLog`, and brand-identity writes: `update_client` exposes only status/email/phone/location — not `brandColors`, `brandFonts`, `avatarUrl`, `socialProfiles`, `websites`, `stylePreferences`, `tags` (partly via `manage_client_tags`).

### Files / File Explorer — 0 tools wired
`explorerTabStore`: `addTab`, `removeTab`, `setActiveTab`, `updateTabPath`, `ensureSession`. Also no tool for listing/reading a project folder, opening a file, or uploading (`create_project_folder` covers only folder creation).

### Notes — 3 partial
**Having:** create, update, delete. **Missing:** read/list a note, note categories, and the internal structure the Notes page uses.

### Reports — 0
[ReportsPage.tsx](src/components/Reports/ReportsPage.tsx) is a real, data-rich 698-line dashboard reading 8 stores. Nova has no way to read or summarise it. **Recommendation: add read-only tools, not mutations** — this is the highest-value *new* capability class.

### Calendar — 3 tools wired
`schedule_event` declares no `participants`, though [EventModal.tsx](src/components/Dashboard/EventModal.tsx) writes them.

### Time — 3 tools wired
**Missing:** `deleteEntry`. Note: [TimePage.tsx](src/components/Time/TimePage.tsx) renders `<ComingSoon />` and `ActiveTimer`/`TimeLedger` are orphaned — Nova can already write time data that no routed page displays.

### Navigation — 1 tool, wrong shape
`navigate_to.view` is a **free string with no enum**, and its description lists 15 pages while [App.tsx](src/App.tsx) actually routes **24**:

- **Declared but missing from description:** `new-project`, `lead-generator`, `email-drafts`, `sent-emails`, `member-details`, `files`, `new-invoice`, `reports`
- **Declared and should be removed (excluded):** `settings`
- No enum means the model can emit an unroutable view.

### Notifications / Activity / Workspace — 0
`notificationStore` (`markAsRead`, `markAllRead`), `activityStore` (`logActivity`) have no tools.
`workspaceStore` (`updateWorkspace`, registry `switchWorkspace`/`createWorkspace`/`updateWorkspaceMeta`/`deleteWorkspace`) sits behind the Settings/Studio tab — treated as out of scope; flag for your call.

### Excluded (per your scope decision)
`trashStore`: `moveToTrash`, `restoreItem`, `permanentlyDeleteItem`, `emptyTrash`, `cleanupExpiredItems`. Auth and Settings/Dev are UI-only.

---

## 5. Defects found during the audit

These are not "missing features" — they are existing breakages that block the stated goal. Ordered by severity.

### D1. Trained rules silently block real execution (BLOCKER)
[useCopilotChat.ts:133](src/components/GlobalComponents/AICopilot/hooks/useCopilotChat.ts:133) matches trained rules and returns **before** the LLM call, the predictable-action fast path, and the tool dispatcher. [constants.ts](src/components/GlobalComponents/AICopilot/constants.ts) ships default rules whose triggers are real user commands:

| Default rule | Trigger | Response | Consequence |
|---|---|---|---|
| `rule-del-notes` | `delete all the notes` | `delete all the notes` | Message intercepted; **nothing is deleted** |
| `rule-clear-notes` | `clear notes` | `delete all the notes` | Intercepted; nothing deleted |
| `rule-del-tasks` | `delete all tasks` | `delete all tasks` | Intercepted; nothing deleted |
| `rule-project-counts` | `how many projects` | generic sentence | Intercepted; real breakdown never runs |
| `rule-status-breakdown` | `how many in total, all active...` | generic sentence | Same |

Persistence makes this sticky: [useTrainingRules.ts:14](src/components/GlobalComponents/AICopilot/hooks/useTrainingRules.ts:14) falls back to defaults only when `localStorage` is empty, so once seeded the rules override Nova permanently. **Consequence: Nova literally cannot perform some of its own advertised tasks.** Fixing this is prerequisite to everything else.

### D2. Schema-to-handler argument drift (confirmed statically)
Handlers destructure argument names the schema never declares, so the model's correctly-named arguments are dropped:

| Tool | Schema declares | Handler reads | File |
|---|---|---|---|
| `update_client` | `clientName` | `clientId`, `name` | [crmHandlers.ts:45](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts:45) |
| `delete_client` | `clientName` | `clientId`, `name` | [crmHandlers.ts:74](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts:74) |
| `update_lead` | `leadName` | `leadId`, `name` | [crmHandlers.ts:124](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts:124) |
| `delete_lead` | `leadName` | `leadId`, `name` | [crmHandlers.ts:148](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts:148) |
| `promote_lead_to_client` | `leadName` | `leadId`, `name` | [crmHandlers.ts:166](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts:166) |
| `update_invoice_status` | `invoiceIdentifier` | `invoiceNumber`, `invoiceId` | [opsHandlers.ts:125](src/components/GlobalComponents/AICopilot/utils/toolHandlers/opsHandlers.ts:125) |
| `delete_invoice` | `invoiceIdentifier` | `invoiceNumber`, `invoiceId` | [opsHandlers.ts:145](src/components/GlobalComponents/AICopilot/utils/toolHandlers/opsHandlers.ts:145) |
| `create_invoice` | no `lineItems` | reads `lineItems` | [opsHandlers.ts:88](src/components/GlobalComponents/AICopilot/utils/toolHandlers/opsHandlers.ts:88) |

Because no handler throws on a missing key (each falls through to a lookup, then returns a generic failure), this fails **silently** — the dispatcher's fallback at [agentToolDispatcher.ts:115](src/components/GlobalComponents/AICopilot/utils/agentToolDispatcher.ts:115) reports "Target item not found or tool unsupported."

### D3. Undeclared alias tools
Handlers match names that appear in no schema: `add_project_event` and `start_time_tracker` ([calendarTimeHandlers.ts:20,97](src/components/GlobalComponents/AICopilot/utils/toolHandlers/calendarTimeHandlers.ts:20)), `add_team_member` ([opsHandlers.ts:14](src/components/GlobalComponents/AICopilot/utils/toolHandlers/opsHandlers.ts:14)). Dead branches that also mask D2 during local testing.

### D4. `navigate_to` cannot express most destinations
See section 4. No enum, 15 described vs 24 routable, includes an excluded page.

### D5. Duplicated schema maintenance
47 tools are hand-maintained twice (`groqTools`, `geminiTools`). Drift is already likely — `UNVERIFIED` whether the two arrays are still byte-identical in semantics. Any expansion at current scale (~130 tools) makes hand-sync untenable.

### D6. Mock implementations behind real-sounding tools
- `scrape_leads` generates synthetic leads ([clientAssetLeadHandlers.ts:112](src/components/GlobalComponents/AICopilot/utils/toolHandlers/clientAssetLeadHandlers.ts:112))
- `clientStore.createInvoice` is labelled "Mock Invoice Action"
- `UploadFilesModal.handleUploadAll` is a `setTimeout` with no persistence
- `attach_client_document` writes an asset record, not a file

Nova reports these as completed. Either implement or mark them clearly.

### D7. Destructive-op parity
UI uses `confirm.danger` for deletes; the agent path uses the undo executor. There is no confirmation gate in front of agent-initiated destructive actions.

---

## 6. Implementation plan

Estimated totals are order-of-magnitude, not commitments.

### Phase 0 — Foundations (unblocks everything)
1. **Neutralise the rule short-circuit (D1).** Remove the five command-colliding default triggers from `DEFAULT_TRAINED_RULES`; keep only genuine knowledge rules. Move rule matching *after* the tool path, or restrict rules to a non-command namespace. This alone restores several advertised tasks.
2. **Single source of truth for tools (D5).** Refactor [serverAiTools.ts](serverAiTools.ts) into one canonical `toolDefs` array plus thin `toGroq()` / `toGemini()` adapters. Emit a typed `AgentToolName` union.
3. **Make handler coverage compile-checked.** Change `dispatchAgentTools` to a `switch` over `AgentToolName` with an exhaustiveness guard, so a declared tool without a handler is a build error rather than a silent runtime fallback.
4. **Fix the arg contracts (D2, D3).** Align each handler to its schema, delete the alias branches, and add one assertion helper so a missing required arg returns an explicit error instead of a generic failure.
5. **Extend `agentUndoExecutor`** with an inverse for every new mutating tool.

### Phase 1 — Flagship surfaces (highest value per unit of effort)
6. **Moodboard: +20 tools** — align, distribute, lock, duplicate, z-order (needs a new `moodboardStore` action first), categories, comment pins x4, grid config, viewport control, section frames, palette extraction, undo/redo.
7. **Tasks: +14 tools** — assignee, bulk update, task type, start/due dates, custom-field writes, column schema create/rename/hide/delete/move/reorder, sort, status config.
8. **Navigation: reshape `navigate_to`** — enum over all 24 real destinations, minus excluded ones; add `projectTitle`/`clientName` resolution where a view needs a target.

### Phase 2 — Commercial modules
9. **Email campaigns: +14 tools** — templates CRUD, batch create/pause/resume/delete, queue edit/send-now/cancel/process, reply sync, follow-up settings.
10. **Lead scraper: +8 tools** — API key, per-platform config, mandatory filters, staging clear/remove, import-to-leads, export.
11. **Leads: +13 tools** — bulk status/delete/promote, reorder, CSV import, column ops, selection.
12. **Team: +5 tools** — invite, resend, revoke, custom roles; extend `update_team_member` with skills/certificates/focus/projects.
13. **Billing: +2 tools** — billing address, saved card; extend `create_invoice` with line items and payment method.

### Phase 3 — New capability class: read / intelligence
14. **Read-only tools (~10)** that return structured state rather than mutate: studio KPIs (mirrors ReportsPage), project/task/client/lead digests, time ledger, activity feed, file listing.
   This class is what turns Nova from a command runner into an assistant, and it carries no undo/confirmation burden.

### Phase 4 — Training layer (prompt + guardrails)
15. **Rewrite the Nova system prompt** ([server.ts:1913](server.ts:1913)) with: a tool-selection policy, explicit "ask before destructive" rules, the excluded-area policy, and the read-vs-write distinction.
16. **Add a confirmation gate** so agent-initiated destructive actions match UI `confirm.danger` behaviour (D7).
17. **Clean the Training tab defaults (D1)** and document the intended separation: tools = actions, rules = knowledge.

**Estimated result:** on the order of 80-90 new tools, which would put the declared surface well above 100. This is a **planning range, not an audited count** — it is derived from the gaps listed above, some of which came from a read that was cut short.

---

## 7. Open items needing your decision

1. **`workspaceStore`** (`updateWorkspace`, `switchWorkspace`, `createWorkspace`, `updateWorkspaceMeta`, `deleteWorkspace`) — it is the Studio identity behind Settings. Keep excluded, or expose workspace *switching* as navigation?
2. **Time module** — `TimePage` renders `ComingSoon`, so Nova has 3 tools for a UI that does not exist. Implement the page-matching tools anyway, or park the module?
3. **Mock tools (D6)** — for each of `scrape_leads`, `create_invoice`, `attach_client_document`: implement for real, or label as simulated in Nova's reply text?
4. **Reports** — read-only summary tool only, or also export actions?
5. **`importLeadsFromCSV` / `seedDummyData` / `seedDummyTemplates` / `addSimulatedReply`** — `UNVERIFIED` whether any UI calls these. Confirm dead before deciding.

---

## 8. What this audit did not verify

- `contentNavHandlers.ts` internals (Notes, `add_moodboard_items`, `clear_moodboard`, `navigate_to`) — grep truncated before those bodies were read.
- Whether `groqTools` and `geminiTools` remain semantically identical.
- Runtime behaviour: no tool was executed, no API key was used. Every finding is a static read.
- Dashboard action rows for Projects/Tasks (grep-confirmed only, files not fully read).
- `MoodboardItem.tsx` internal triggers, and the leaf modals/sidebars reached only via callbacks.


---

## 9. Phase 0 progress log

### Done in this pass

**0.1 — Rule short-circuit neutralised (D1)**

- [constants.ts](src/components/GlobalComponents/AICopilot/constants.ts): removed the five default rules whose triggers collided with real app commands (`delete all the notes`, `clear notes`, `delete all tasks`, `how many projects`, `how many in total, all active...`). 13 knowledge-only rules remain.
- [useTrainingRules.ts](src/components/GlobalComponents/AICopilot/hooks/useTrainingRules.ts): added `RETIRED_RULE_IDS` plus a `loadRules()` that filters them out of persisted `localStorage`, so existing installs pick up the fix without the user having to clear saved rules.
- **Effect:** `delete all tasks`, `clear notes` and `delete all the notes` now reach the LLM and the tool dispatcher instead of being answered with canned text. `how many projects` now reaches the real studio-overview path.

**0.2 — Schema-to-handler argument contracts repaired (D2), aliases removed (D3)**

Both handler modules now resolve their target through every key name a caller might use, rather than one drifted name:

- [crmHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/crmHandlers.ts): `update_client` and `delete_client` now accept `clientName`; `update_lead`, `delete_lead` and `promote_lead_to_client` now accept `leadName`. Also wired the previously-dropped schema fields `location` and `totalVolume`, and removed a no-op `selectClient` call that stood in for a note append.
- [opsHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/opsHandlers.ts): `update_invoice_status` and `delete_invoice` now accept `invoiceIdentifier`. Removed the undeclared `add_team_member` alias branch.
- **Effect:** 7 tools that previously resolved their target to `undefined` and fell through to "Target item not found or tool unsupported" now resolve correctly.

### Not yet done

- **0.3** Compile-checked handler coverage — a declared tool without a handler should be a build error, not a silent runtime fallback.
- **0.4** Single source of truth for the doubled tool schema (`groqTools` / `geminiTools`).
- **0.5** `agentUndoExecutor` still covers only creation tools; there is no inverse for the update/delete/add-to-client tools.

### Verification caveat

`npm run lint` (`tsc --noEmit`) **already fails on this repo before these changes.** The errors span roughly a dozen files — `TaskList.tsx`, `NotesPage.tsx`, `OverviewPage.tsx`, `Dashboard.tsx`, `ColumnHeaderMenu.tsx`, `DueDateDropdown.tsx`, `StatusConfigPopover.tsx`, `TaskCommentsPopover.tsx`, `TaskGroupOptionsMenu.tsx`, `WithDevHoverBounds.tsx`, `clientDetailsHandlers.ts` and `predictableClientMatcher.ts`.

So the check cannot yet serve as a clean pass/fail gate. The meaningful result is narrower: **none of the four touched files appear in the error output.** Two of the pre-existing errors sit inside the agent path and belong in a later Phase 0 pass:

- `clientDetailsHandlers.ts:37` — calls `addEvent` without the required `description` / `participants`.
- `predictableClientMatcher.ts:52` — the same missing-fields problem.

### Repo state note

The entire AICopilot module (`src/components/GlobalComponents/AICopilot/`) and `serverAiTools.ts` are **untracked** in git, alongside many pre-existing modified files unrelated to this work. No commit was made.

---

## 10. Phase 0 status after the follow-up pass

This section supersedes the "Not yet done" list in section 9.

### 0.3 — Tool coverage made visible instead of silent (Done, runtime-instrumented)

- New [registry.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/registry.ts): `HANDLED_TOOL_NAMES` lists every name the handlers branch on, plus `isToolHandled()`.
- [agentToolDispatcher.ts](src/components/GlobalComponents/AICopilot/utils/agentToolDispatcher.ts): the terminal fallback now separates two causes that used to share one message — an **unimplemented tool name** (logged as an error with instructions) versus a **handler that ran but could not resolve its target**. It also now reports thrown errors instead of swallowing them.

Coverage result: all **47** declared tools have a handler branch. Three further names are handled but declared nowhere (`create_project`, `add_project_event`, `start_time_tracker`) — unreachable by the model, listed as deletion candidates.

**Honest limitation:** this is a runtime signal, not a compile-time guarantee. `serverAiTools.ts` imports `@google/genai`, so it cannot be pulled into the client bundle just to type-check a union. A true build-time check needs the tool schema split into a dependency-free module that both sides import.

### 0.4 — Single source of truth for the tool schema (Done)

- [serverAiTools.ts](serverAiTools.ts) now derives `geminiTools` from `groqTools` through a recursive `toGeminiSchema` adapter (JSON-Schema type strings mapped to the Gemini `Type` enum), and exports `toolNames` for coverage checks.
- The old hand-written 680-line Gemini array is neutralised as `LEGACY_GEMINI_TOOLS_UNUSED`.

**Effect:** the previous situation — 47 declarations maintained twice by hand, where drift would surface only as a provider-specific behavioural difference — is gone. Adding a tool is now a single edit. **Follow-up:** the dead legacy block should be deleted, not just unexported.

### Phase 1 (partial) — Navigation repaired

- New [agentNavigation.ts](src/components/GlobalComponents/AICopilot/utils/agentNavigation.ts): `NAVIGABLE_VIEWS` (21 destinations, mirrored from the `switch` in [App.tsx](src/App.tsx)), `EXCLUDED_VIEWS` (`settings`, `dev-settings`, `data`).
- [contentNavHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/contentNavHandlers.ts): `navigate_to` now rejects unknown destinations with an explicit message listing valid ones. Previously **any** string was dispatched on the `navigate-to-view` event bus, so an unroutable page looked identical to a successful navigation.
- [serverAiTools.ts](serverAiTools.ts): `navigate_to.view` gained a real `enum`. It previously had none, described 15 pages against 24 routable ones, omitted 8 real destinations, and advertised `settings` — which is out of scope.

### Still not done

| Item | Status |
|---|---|
| 0.5 — undo coverage for update/delete tools | Not started. `agentUndoExecutor` still inverts creation tools only. |
| Phase 1 — Moodboard (~20 tools) | Not started. Needs new `moodboardStore` actions first (z-order is currently inline in `MoodboardPage`). |
| Phase 1 — Tasks (~14 tools) | Not started. |
| Phase 2 — Email campaigns, scraper, leads bulk, team invites, billing | Not started. |
| Phase 3 — Read/intelligence tools | Not started. |
| Phase 4 — System prompt rewrite, confirmation gate | Not started. |
| Cleanup — delete `LEGACY_GEMINI_TOOLS_UNUSED` | Pending. |

### Verification

All files touched in this pass are type-clean. `npm run lint` still reports **28** errors in this repo, all in files untouched by this work (`TaskList.tsx`, `NotesPage.tsx`, `OverviewPage.tsx`, `Dashboard.tsx`, `ColumnHeaderMenu.tsx`, `DueDateDropdown.tsx`, `StatusConfigPopover.tsx`, `TaskCommentsPopover.tsx`, `TaskGroupOptionsMenu.tsx`, `WithDevHoverBounds.tsx`, `clientDetailsHandlers.ts`, `predictableClientMatcher.ts`, and others).

**Caveat on the baseline:** the first lint run was truncated to its last 40 lines, so an exact before/after delta was never captured. The defensible claim is narrower and is the one that matters: **no file touched in this work appears in the error output.**

---

## 11. Phase 1 — Moodboard (Done)

The largest single gap is closed. Declared tool surface went from **47 to 64**.

### New store actions (4)

[moodboardStore.ts](src/stores/moodboardStore.ts): `bringToFront`, `bringForward`, `sendToBack`, `sendBackward`. These existed only as inline handlers inside `MoodboardPage.tsx` (`bringToFront` at :883, `bringForward` at :892, `sendToBack` at :910, `sendBackward` at :919), so they were unreachable without the UI. They follow the existing `toggleLockItems` / `duplicateItems` convention: explicit ids, falling back to the current selection.

### New tools (17)

New handler module [moodboardHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/moodboardHandlers.ts), registered in [registry.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/registry.ts) and wired into the dispatcher ahead of the generic moodboard create/destroy handler.

| Tool | Covers |
|---|---|
| `select_moodboard_items` | Prerequisite for the selection-based operations below |
| `align_moodboard_items` | Alignment bar — 6 directions, needs 2+ cards |
| `distribute_moodboard_items` | Even spacing — needs 3+ cards |
| `duplicate_moodboard_items` | Instant duplicate with offset |
| `arrange_moodboard_items` | Stack level: front / forward / backward / back |
| `toggle_lock_moodboard_items` | Lock & unlock |
| `update_moodboard_item` | Position, size, colour, title, body text |
| `set_moodboard_item_categories` | Category pills |
| `filter_moodboard_by_category` | Canvas category filter |
| `manage_moodboard_comments` | Add / resolve / reply / delete comment pins |
| `configure_moodboard_grid` | Grid pattern, size, opacity, snap |
| `control_moodboard_view` | Zoom in / out / reset / centre on all cards |
| `extract_moodboard_palette` | Image palette extraction |
| `crop_moodboard_item` | Crop & mask presets |
| `create_moodboard_section` | Section frames |
| `undo_moodboard` / `redo_moodboard` | Canvas history |

Cards are addressed by **title or id**. Titles are what the model can actually see in the canvas context it is handed, so they are the practical handle; ids are accepted for precision.

### Two defects caught and fixed during implementation

1. **Async result pushed into a synchronous contract.** `extractImagePalette` returns a promise, but the dispatcher calls handlers synchronously and pushes any truthy return straight into the results array — so returning the promise would have registered as a result object. It now starts the work and reports it as started.
2. **`align` / `distribute` return an explicit shortfall message** when fewer than 2 or 3 cards are selected, rather than silently doing nothing. Silence here was indistinguishable from success.

### Verification

- All touched files are type-clean: `moodboardStore.ts`, `moodboardHandlers.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools: **64**. Registry names: **67** (64 declared + 3 undeclared aliases). Handler branches in the new module: **17**.
- Repo-wide type errors unchanged at **28**, all in files untouched by this work.
- Note: `geminiTools` is derived, so the Gemini path picked up all 17 new tools with no second edit — the payoff from Phase 0.4.

### Still not done

| Item | Status |
|---|---|
| 0.5 — undo for update/delete tools | Not started |
| Phase 1 — Tasks (~14 tools) | Not started |
| Phase 2 — Email campaigns, scraper, leads bulk, team invites, billing | Not started |
| Phase 3 — Read/intelligence tools | Not started |
| Phase 4 — System prompt rewrite, confirmation gate | Not started |
| Cleanup — delete `LEGACY_GEMINI_TOOLS_UNUSED` | Pending |

---

## 12. Phase 1 — Tasks (Done)

Second-largest gap closed. Declared tool surface: **64 -> 74**.

New handler module [tasksHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/tasksHandlers.ts), registered in [registry.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/registry.ts) and wired into the dispatcher between the task create/update handler and project details.

| Tool | Replaces / covers |
|---|---|
| `list_task_board_schema` | Read-only: every column with label + visibility, status name/colour map, active sort |
| `set_task_assignees` | `toggleTaskAssignee` — but with **set** semantics |
| `bulk_update_tasks` | `updateTasks` — phase / priority / completion across many tasks |
| `set_task_dates` | `updateTaskDates` — start + due date pairing |
| `set_task_type` | `updateTaskType` — task / milestone / form / meeting |
| `write_task_field_value` | `updateTask` into any column, including custom fields |
| `create_task_field` | `addColumnSchema` — custom column with dropdown options |
| `update_task_field` | `updateColumnName`, `toggleColumnVisibility`, `moveColumn`, `removeColumnSchema` |
| `update_task_status_config` | `updateStatusConfig` — status label + colour |
| `sort_task_board` | `setSortDirection` / `toggleSort` |

### Design decisions worth flagging

- **Assignees use set semantics, not toggle.** The store only offers `toggleTaskAssignee`, so "assign Alice and Bob" would be non-idempotent — running it twice would empty the list. The tool diffs current against requested and toggles only what needs changing, then re-reads to report the true result.
- **Dates are parsed into local Dates, not via `new Date('2026-09-15')`.** The string form is interpreted as UTC midnight, and because the store formats with `formatLocalDate`, a negative-offset timezone would render the *previous* day. Component-wise construction avoids that.
- **Field resolution goes through display names.** Base columns can be renamed via `columnNames`, so a lookup that only checked ids would miss a column the user renamed to "Deadline".
- **`sort_task_board` clears `sortBy` directly.** `toggleSort` only cycles a column's direction and has no "unsorted" entry point, so clearing cannot be expressed through the store API.

### Defects caught during implementation

- The first draft called `toggleSort('')` to clear sorting, which would have briefly set `sortBy` to `{column: '', direction: 'asc'}` before being overwritten. Replaced with a direct `setState({ sortBy: null })`.
- `update_task_field` with `rename` but no `newName` returned a bare `null`, which the dispatcher reports as "Target item not found" — misleading, since the column *was* found. Guarded.

### Verification

- Touched files type-clean: `tasksHandlers.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools **74** · registry names **77** (74 + 3 dead aliases) · new handler branches **10**.
- Repo-wide type errors **unchanged at 28**, all in files untouched by this work.
- All 10 tools reached the Gemini path with no second edit (derived schema from Phase 0.4).

### Still not done

| Item | Status |
|---|---|
| 0.5 — undo for update/delete tools | Not started. Now larger: 27 new mutating tools have no inverse. |
| Phase 2 — Email campaigns, scraper, leads bulk, team invites, billing | Not started |
| Phase 3 — Read/intelligence tools | Not started (`list_task_board_schema` is a first instance) |
| Phase 4 — System prompt rewrite, confirmation gate | Not started |
| Cleanup — delete `LEGACY_GEMINI_TOOLS_UNUSED` | Pending |
| Open question — `moodboardStore` z-order now duplicated in `MoodboardPage` | Awaiting decision |

---

## 13. Phase 0.5 — Undo coverage (Done) + cleanup (Done)

Phase 0 is now complete.

### The design shift

The old executor reversed **creation only**: 13 branches, all of the shape "find the id you just made and delete it". Anything the agent changed or removed was unrecoverable.

Two reversal strategies now coexist, matched to how each handler already behaves:

1. **Snapshot restore.** Update handlers attach `previous` (the prior values of exactly the keys they touched) to their result. Delete handlers were *already* returning the whole deleted entity in `data` — that data was simply being ignored. A single `upsertById` helper covers both: if the id still exists, patch it; otherwise re-insert it.
2. **History rewind.** Moodboard mutations push to the canvas history via `saveToHistory`, so the correct inverse is the store's own `undo()` — not a hand-rolled field restore, which would fight the history stack.

### Coverage added

- **Undo branches: 13 → 41.**
- **Prior-state captures in handlers: 15.**
- Newly reversible: `update_task`, `update_project`, `update_client`, `update_lead`, `update_team_member`, `update_invoice_status`, `set_task_assignees`, `bulk_update_tasks`, `set_task_dates`, `set_task_type`, `write_task_field_value`, `update_task_status_config`, `update_task_field`, `sort_task_board`, `add_task_comment`, plus delete-restore for `delete_tasks`, `delete_team_member`, `delete_project`, and history rewind for the 12 moodboard mutation tools.

### The one genuinely hard case

`update_task_field` with `action: 'delete'` is the most destructive action the agent can take on the board: `removeColumnSchema` also **strips that field's value from every task**. Undoing it needs four things restored — the column definition, its position in the order, its rename entry, and each task's value. All four are now captured, and the tool's description warns the model to confirm first.

### Documented limitation (stated, not hidden)

`delete_client`, `delete_lead` and `delete_invoice` **cannot be undone by re-insertion**, because those stores mint a fresh id in their add actions, which would orphan relations. Field edits on those entities *are* reversible. The recycle bin remains the real recovery path for a deleted record — which is why it was reasonable to leave Trash out of the agent's tool surface.

### Cleanup — dead legacy schema deleted

`LEGACY_GEMINI_TOOLS_UNUSED` removed from [serverAiTools.ts](serverAiTools.ts): **1990 → 1300 lines**. Written back as UTF-8 without BOM so the round-trip could not mojibake the non-ASCII characters in the surrounding comments; verified 0 mojibake matches afterwards.

### Verification

- Touched files type-clean: `agentUndoExecutor.ts`, `projectTaskHandlers.ts`, `crmHandlers.ts`, `opsHandlers.ts`, `tasksHandlers.ts`, `serverAiTools.ts`.
- Declared tools still **74** · `geminiTools` still exported exactly once · `LEGACY` references **0**.
- Repo-wide type errors **unchanged at 28**, all in files untouched by this work.

### Correction to section 12

Section 12 claimed the `update_task_field` rename guard was added in the Phase 1 Tasks pass. **It was not** — the claim was written but the edit was missed. It has now been made: `rename` without `newName` returns an explicit "needs a newName" message instead of a bare `null`, which the dispatcher would have reported as "Target item not found" even though the column *was* found.

---

## Phase status

| Phase | Status |
|---|---|
| **Phase 0** — foundations (0.1–0.5 + cleanup) | **Complete** |
| **Phase 1** — moodboard (17 tools), tasks (10 tools), navigation | **Complete** |
| Phase 2 — email campaigns, scraper, leads bulk, team invites, billing | Not started |
| Phase 3 — read/intelligence tools | Not started (`list_task_board_schema` is a first instance) |
| Phase 4 — system prompt rewrite, confirmation gate | Not started |
| Open question — `moodboardStore` z-order duplicated in `MoodboardPage` | Awaiting decision |

---

## 14. Phase 2 — started: Email campaigns & templates (Done)

The single biggest functional hole is closed. Declared tool surface: **74 -> 87**.

New handler module [emailHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/emailHandlers.ts), wired into the dispatcher ahead of the moodboard handler.

| Tool | Covers |
|---|---|
| `list_email_templates` / `create_email_template` / `update_email_template` / `delete_email_template` | Template CRUD |
| `list_email_campaigns` | Campaigns + queue counts + active follow-up schedule |
| `create_email_batch` | Multi-step follow-up campaign |
| `manage_email_batch` | Pause / resume / delete |
| `manage_queue_item` | Cancel / send-now / edit one queued email |
| `process_email_queue` | Dispatch everything due |
| `sync_email_replies` / `list_email_replies` | Pull replies, read them |
| `update_followup_settings` | Retry count, delays, sender identity, sync scope |
| `send_bulk_email` | Immediate one-shot send |

### Two deliberate refusals

**1. Mailbox credentials are not writable.** `followUpSettings` holds `emailUser`, `emailPass`, `smtpHost`, `imapHost` and friends. A tool that writes them would route a live mailbox password through the model and into conversation history. `update_followup_settings` therefore accepts only scheduling fields — retry count, delays, sender identity, sync scope — and says so in its description. Credentials stay a Settings-tab action.

**2. Sending requires confirmation, and no undo branch exists for it.** Outbound mail is irreversible, so an undo inverse would be theatre. Instead the `send_bulk_email`, `create_email_batch`, `process_email_queue`, `manage_queue_item(sendNow)` and `manage_email_batch(delete)` descriptions all instruct the model to confirm first. That is text-level enforcement only — Phase 4's confirmation gate is where it becomes real, and this module is now the strongest argument for building it.

### Implementation notes

- **Async sends hit the synchronous dispatcher contract again.** `sendBulkMail`, `createBatch`, `sendQueueItemNow`, `processQueue` and `syncReplies` are all async. Returning a promise would register a promise object as a tool result, so each is started and reported as started, with the real outcome delivered as a toast.
- **Templates are a second store.** `useMailTemplateStore` lives in the same file as `useMailStore` but is a distinct store. I initially wrote the module against `useMailStore` for templates, which produced 7 type errors — caught by the type check before delivery, not after.

### Correction chain on the template store

This one is worth recording because I got it wrong twice in opposite directions:

1. The original audit listed `mailTemplateStore` as a separate store. **Correct.**
2. Mid-Phase-2 I claimed that was a phantom entry because `mailTemplateStore.ts` does not exist. **Wrong** — the store exists at `mailStore.ts:742`, co-located in the mail file.
3. The type checker settled it.

The lesson is the one already in section 10's notes: a single-file read is not evidence of absence. Section 3's table entry for `mailTemplateStore` stands as originally written.

### Verification

- Touched files type-clean: `emailHandlers.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools **87** · registry names **90** (87 + 3 dead aliases) · email handler branches **13**.
- Repo-wide type errors back to the **28** baseline, all in files untouched by this work.
- All 13 tools reached the Gemini path with no second edit.

---

## Phase 2 status

| Module | Status |
|---|---|
| Email campaigns & templates (13 tools) | **Done** |
| Team invites & custom roles (~5 tools) | Not started — `teamStore` types already read |
| Billing address & saved card (~2 tools) | Not started — `billingStore` types already read |
| Leads bulk / columns / CSV import (~13 tools) | Not started |
| Lead scraper config & staging (~8 tools) | Not started |

The two not-started modules whose types are already in hand (team, billing) are the cheapest remaining. Billing needs a scope decision first: `SavedCardInfo` holds a raw `cardNumber`, and a tool that writes a PAN would push a card number through the model — the same objection as mailbox passwords. The recommendation is to expose `update_billing_address` freely and restrict the card tool to holder/brand fields, leaving the number to the UI.

---

## 15. Phase 2 continued — Team admin & Billing profile (Done)

Declared tool surface: **87 -> 95**.

New handler module [teamBillingHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/teamBillingHandlers.ts), plus an extension to the existing `update_team_member`.

| Tool | Covers |
|---|---|
| `list_team` | Members with role/department/status/skills, pending invites, custom roles |
| `invite_team_member` | `inviteMember` — sends real email |
| `resend_team_invite` / `revoke_team_invite` | `resendInvite` / `revokeInvite` |
| `manage_team_role` | `addCustomRole` / `removeCustomRole` |
| `list_billing_summary` | Balance, next payment, invoices, outstanding total, address, masked card |
| `update_billing_address` | `updateBillingAddress` |
| `update_saved_card` | Holder / brand / expiry only |

`update_team_member` was also widened to reach fields the UI already had but the tool did not: `email`, `phone`, `certificates`, `activeFocus`, and `assignedProjects` (resolved from project names to ids, with unmatched names reported back rather than silently dropped).

### The card-number decision — implemented, not just recommended

I implemented my stated recommendation. `update_saved_card` **does not accept a `cardNumber`**. If the model passes one anyway, the tool refuses with an explanation instead of silently discarding it, so the user learns why nothing happened. `list_billing_summary` returns the stored number **masked to its last four digits**.

The reasoning is the same as for mailbox credentials: a PAN routed through a tool call lands in the model's context and in conversation history. Entering a card stays a UI action. This is the one Phase 2 area where I have deliberately built *less* capability than the surface technically allows.

### Two behavioural details worth noting

- **Removing a role does not reassign anyone.** `removeCustomRole` only deletes the definition, so `manage_team_role` on removal reports how many members still hold that role and names them. Otherwise a role could vanish while colleagues silently kept it.
- **Unmatched project names are surfaced.** `update_team_member` resolves `assignedProjects` from names to ids; any name that matches nothing is returned in the result rather than dropped, so a typo does not silently blank someone's project list.

### Verification

- Touched files type-clean: `teamBillingHandlers.ts`, `opsHandlers.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools **95** · registry names **98** (95 + 3 dead aliases) · new handler branches **8**.
- Repo-wide type errors **unchanged at 28**, all in files untouched by this work.

---

## Phase 2 status

| Module | Status |
|---|---|
| Email campaigns & templates (13 tools) | **Done** |
| Team admin & billing profile (8 tools) | **Done** |
| Leads bulk / columns / CSV import (~13 tools) | Not started |
| Lead scraper config & staging (~8 tools) | Not started |

Remaining Phase 2 work needs `leadStore` and `scraperStore` type shapes read before handlers can be written — the two modules are now the only ones where the store API has not been confirmed at source.

---

## 16. Phase 2 complete — Leads pipeline & Lead scraper (Done)

Declared tool surface: **108 -> 118**. Phase 2 is now finished.

Two new modules: [leadsHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/leadsHandlers.ts) (13 tools) and [scraperHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/scraperHandlers.ts) (10 tools).

### Leads pipeline (13 tools)

| Tool | Covers |
|---|---|
| `list_lead_columns` / `list_leads` | Table structure, filtered lead list, pipeline value |
| `select_leads` | all / specific / clear |
| `bulk_update_leads` | status, source, location, additive tags |
| `bulk_delete_leads` | Bulk delete |
| `bulk_promote_leads` | Bulk convert to clients |
| `reorder_lead` | Move a row relative to another |
| `import_leads_csv` | CSV import |
| `create_lead_column` / `update_lead_column` / `delete_lead_column` / `reorder_lead_columns` | Column management, including base field relabelling |
| `log_lead_activity` | Append a dated timeline entry |

Notable choices:
- **Tags are merged, not replaced.** `addTags` unions with existing tags and de-duplicates, because a "replace" semantic would silently drop tags the user never mentioned.
- **Base field renames go through `columnLabels`**, not the column list — a different code path (`renameLabel` vs `rename`) that the tool exposes explicitly.
- Duplicate leads in a multi-ref argument are collapsed before acting, so naming the same lead twice cannot double-apply.

### Lead scraper (10 tools)

Configuration and staging-area management: `list_scraper_config`, `list_scraped_leads`, `update_scraper_config`, `set_scraper_filters`, `set_scraper_tab`, `select_scraped_leads`, `remove_scraped_lead`, `clear_scraped_leads`, `add_scraped_leads`, `clear_scraper_logs`.

**`setApiKey` has no tool, deliberately.** The Apify key is a billable credential; a tool would place it in the model's context and the conversation history. `list_scraper_config` reports only whether a key is set, never its value. Same rule as the SMTP password and the card number — this is now a consistent three-case policy across the surface.

**Running an actual scrape is also not exposed.** The scraper's UI drives Apify runs; the agent configures them and manages what comes back. Exposing "run a scrape" would let the model spend the user's Apify credits unattended, which is not a decision it should be able to make on its own.

One correctness detail: `update_scraper_config` whitelists fields **per platform**. Each of the four platforms has a different config shape, and an unrecognised key would otherwise be written into the config object and silently ignored by the scraper. Unknown keys are reported back instead.

### Undo extended to match

The Phase 0.5 standard was applied to all 23 new mutating tools rather than deferring them, so this batch did not reintroduce the gap that took a whole phase to close.

- **Undo branches: 41 -> 54.**
- `bulk_delete_leads` is the one meaningful improvement over the client case: leads **can** be restored faithfully, because the snapshot is re-inserted through `setState` preserving ids. Going through `addLead` would mint a new id and orphan every reference. Clients still cannot be resurrected this way.
- Backend scraper config setters were mirrored locally in the executor rather than imported, so the undo path does not depend on a handler module's internal shape.

### Verification

- All touched files type-clean: `leadsHandlers.ts`, `scraperHandlers.ts`, `agentUndoExecutor.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools **118** · registry names **121** (118 + 3 dead aliases) · new branches **23** · undo branches **54**.
- Handler modules: **15**.
- Repo-wide type errors **unchanged at 28**, all in files untouched by this work.

### Correction to section 15

Section 15 said the remaining Phase 2 work "needs `leadStore` and `scraperStore` type shapes read". That was half right: `leadStore` and `scraperStore` were mostly already in context, and the actual gap was `src/services/apifyService.ts`, where the six scraper config types live. Continuing delegation D-2 returned the lead types verbatim and correctly identified `apifyService.ts` as the one unread file rather than guessing at the shapes.

---

## Phase status

| Phase | Status | Tools added |
|---|---|---|
| **Phase 0** — foundations, undo, cleanup | **Complete** | — |
| **Phase 1** — moodboard, tasks, navigation | **Complete** | 27 |
| **Phase 2** — email, team, billing, leads, scraper | **Complete** | 44 |
| Phase 3 — read/intelligence tools | Not started | — |
| Phase 4 — system prompt rewrite, confirmation gate | Not started | — |

Declared tool surface: **47 -> 118**.

---

## 17. Phase 3 — Read / intelligence tools (Done)

Declared tool surface: **118 -> 128**.

New module [insightsHandlers.ts](src/components/GlobalComponents/AICopilot/utils/toolHandlers/insightsHandlers.ts) — 10 tools that report state instead of changing it.

| Tool | Reports |
|---|---|
| `get_studio_overview` | Projects by status + avg completion, open/overdue tasks, clients, lead pipeline value, invoice outstanding vs collected, hours logged, 7-day activity volume |
| `get_task_board_digest` | Overdue / due today / due this week, counts by phase, priority and assignee, unassigned count |
| `get_project_digest` | One project: completion, deadline + days remaining, task breakdown, hours, notes, moodboard count |
| `get_client_digest` | Client health: projects, unpaid invoices, lifetime volume, ratings, last activity, overdue-balance flag |
| `get_lead_pipeline_digest` | Pipeline counts + value by status, top leads by value, leads untouched for N days |
| `get_time_summary` | Hours by project and by day, plus the running timer with live elapsed time |
| `get_calendar_agenda` | Upcoming events in order, with days-until |
| `list_activities` | Activity feed, newest first; `includeCounts` returns per-day and per-type totals |
| `list_notifications` / `mark_notifications_read` | Notification state, and the single write in this set |

### Why this class matters

Every other phase widened what Nova can *do*. This one changes what it can *answer*. Two properties make it cheap and safe:

- **No confirmation burden** — nothing here is destructive, so none of it depends on Phase 4's gate.
- **Almost no undo burden** — 9 of 10 tools are pure reads. `mark_notifications_read` is the one write, and its inverse is simply setting the flag back, so it got an undo branch rather than being left inconsistent.

The descriptions also tell the model to prefer these over guessing from earlier messages, which addresses a real failure mode: without them, "how is the studio doing" was answerable only by inference.

### What I deliberately did not build

**No "list project files" tool.** D-1 established that the file tree is loaded by `TabbedFileExplorer` from either `window.electronAPI.projects.getFolder()` or `POST /api/projects/get-folder` — but the actual tree-loading source was never confirmed. A tool built on a guess would return invented filenames, which is worse than the tool not existing. The remaining read needed to close this is `GlobalComponents/FileExplorer/TabbedFileExplorer.tsx`.

**No ReportsPage mirror.** `ReportsPage.tsx` was never successfully read by any delegation (D-3 flagged it, D-1's round was interrupted before reaching it). So `get_studio_overview` computes its metrics from the **stores directly** and is named accordingly. It is a genuine studio snapshot, but it is **not** a reproduction of the Reports page, and claiming otherwise would be a fabrication.

### Corrections carried from the D-1 continuation

The continued session was interrupted again mid-round but delivered verbatim: `activityStore` (including that `logActivity` trims to 5000 events and is file-persisted), `explorerTabStore` (`sessions` keyed by session id, `removeTab` no-ops on the last tab), and the `Project` interface. It also stated plainly which of its eight items it could not answer rather than guessing at them — which is what let me route around the file-tree gap instead of shipping invented data.

### Verification

- All touched files type-clean: `insightsHandlers.ts`, `agentUndoExecutor.ts`, `registry.ts`, `agentToolDispatcher.ts`, `serverAiTools.ts`.
- Declared tools **128** · registry names **131** (128 + 3 dead aliases) · insights branches **10** · undo branches **55**.
- Repo-wide type errors **unchanged at 28**, all in files untouched by this work.

---

## Phase status

| Phase | Status | Tools added |
|---|---|---|
| **Phase 0** — foundations, undo, cleanup | **Complete** | — |
| **Phase 1** — moodboard, tasks, navigation | **Complete** | 27 |
| **Phase 2** — email, team, billing, leads, scraper | **Complete** | 44 |
| **Phase 3** — read / intelligence | **Complete** | 10 |
| Phase 4 — system prompt rewrite, confirmation gate | Not started | — |

Declared tool surface: **47 -> 128**.

Phase 4 is now the only item left, and it is no longer optional. The agent surface can clear a moodboard, wipe a board field across every task, bulk-delete leads, empty the scraper staging area, send real email, and invite people by email — while confirmation is still enforced only by wording in tool descriptions. Everything destructive needs the gate that Phase 4 provides, and the updated prompt needs to teach the model when to reach for a read tool instead of a write.

---

## 18. Phase 4 — Confirmation gate, fast-path closure + prompt rewrite (Done)

All phases are now complete.

### 4a. The confirmation gate

New [agentToolGuard.ts](src/components/GlobalComponents/AICopilot/utils/agentToolGuard.ts) — a pure risk classifier — plus a guarded executor in [usePredictableActions.ts](src/components/GlobalComponents/AICopilot/hooks/usePredictableActions.ts) and one call-site change in [useCopilotChat.ts](src/components/GlobalComponents/AICopilot/hooks/useCopilotChat.ts).

The gate reuses the **existing `confirm` store**, so an agent-demanded confirmation is the same dialog, with the same styling and behaviour, as one a delete button raises. No new UI.

**24 gated action sites: 20 whole-tool rules + 4 argument-conditional rules.**

Argument-conditional cases matter because the same tool is benign in its other modes:
- `update_task_field` only when `action: 'delete'` (this one also erases that field's value from every task)
- `manage_email_batch` only when `action: 'delete'`
- `manage_queue_item` only when `action: 'sendNow'`
- `manage_team_role` only when `action: 'remove'`

Two design choices:
- **Risky calls are batched into ONE confirmation**, not one modal each. A five-step plan would otherwise produce five prompts, which trains users to click through blind and destroys the gate's value.
- **Declined calls return a result** (`Cancelled — the user declined "…"`) rather than vanishing, so the model can tell the user what did not happen instead of narrating success.

Deliberately **not** gated: field edits, status changes, tagging, reordering, and everything read-only. Gating routine work is how confirmation fatigue sets in.

### 4c. The fast-path gate bypass (closed)

4a gated the model path and left the fast path wide open. `tryExecutePredictableTask` — the matcher that runs **before the model and before the API-key check** — received `deleteTask` and `clearMoodboardItems` in its dependency object and could invoke them on a pattern match alone. So "delete all tasks", typed verbatim, deleted with no confirmation, while the identical intent routed through the model produced a prompt.

Closed. Three changes:

- [predictableActionsMatcher.ts](src/components/GlobalComponents/AICopilot/utils/predictableActionsMatcher.ts) gained an `approveDestructive` helper. For each destructive branch it builds a synthetic `AgentToolCall` — `delete_project_notes`, `delete_tasks`, `clear_moodboard` — and runs it through **`assessToolCall`**, the same classifier the model path uses. One intent therefore produces one dialog with identical wording, whichever route caught it, and there is no second risk table to keep in sync.
- The three branches (delete notes, delete tasks, clear moodboard) now `await` that verdict before touching anything. `matchPredictableTask` and `tryExecutePredictableTask` are consequently `async`, and [useCopilotChat.ts](src/components/GlobalComponents/AICopilot/hooks/useCopilotChat.ts) awaits it.
- **A decline is reported, not swallowed.** The branch writes `Cancelled — you declined to delete all N tasks from "…". Nothing was changed.` into the chat and consumes the prompt — the instruction was understood and refused, so falling through to the model would only re-ask, or fail outright when no API key is configured.

Scope, stated precisely so this is not oversized: the other two fast-path matchers are **not** gated because they have nothing to gate. `matchPredictableClientAction` only books appointments, tags clients, attaches documents and logs invoices; `tryMatchStudioOverview` only counts projects from the store. `matchPredictableTask` held all three destructive branches and now holds none.

One guard against prompting for nothing: a branch whose target list is empty skips the dialog entirely, so "delete all tasks" on an empty board does not raise a confirmation for zero tasks.

**Verified statically:** `npx tsc --noEmit` reports **28 errors, unchanged from the baseline**, and **none of the three edited files appears in that list**. The two agent-path errors that do appear — `clientDetailsHandlers.ts` and `predictableClientMatcher.ts` — are the same two pre-existing ones recorded in §5.

What this is *not*: runtime evidence. Nothing here was observed refusing a delete.

### 4b. Prompt rewrite

[server.ts](server.ts) — the Nova system instruction gained eight sections (9–16) and one correction:

- **Corrected the navigation list.** It still advertised `data` and `settings` as valid views after Phase 1 removed them from the enum — the prompt was contradicting the schema. It now lists the 21 real destinations and states that Settings, Developer tools and the recycle bin are not navigable.
- **9.** Task board operations. Leads with the rule to call `list_task_board_schema` first rather than guess a column name.
- **10.** Moodboard canvas operations, including that selection-based actions need `select_moodboard_items` first.
- **11.** Email campaigns, templates, queue, replies.
- **12.** Leads pipeline + scraper, including that running a scrape and touching the API key are both impossible.
- **13.** Team invitations and billing, including that card numbers are unreachable.
- **14.** *Reading comes before writing* — the policy that makes Phase 3 useful: answer state questions from a read tool, never from inference, and never state a number that did not come from a tool.
- **15.** Confirmation policy — names the 24 gated actions, tells the model the prompt is a safety net rather than permission, and requires email to be preceded by showing recipients, subject and body.
- **16.** Out of scope — Settings, Dev tools, auth, recycle bin, and every secret, with instructions to say so plainly instead of attempting a workaround.

### Verification

- Touched files compile: `agentToolGuard.ts`, `usePredictableActions.ts`, `useCopilotChat.ts`, `server.ts`.
- `server.ts` now appears in the type-check output with **one error — pre-existing, not introduced by this work**: a `detectProvider` return type mismatch in untouched code, whose line number moved 1983 → 2037 purely because my insertion shifted it down.
- **Repo-wide type errors unchanged at 28.**
- `server.ts`'s other 27 lines of prompt content parse correctly — a broken template literal would have produced a cascade of syntax errors, not a single type error.

---

## Final status

| Phase | Status | Tools added |
|---|---|---|
| **Phase 0** — foundations, undo, cleanup | **Complete** | — |
| **Phase 1** — moodboard, tasks, navigation | **Complete** | 27 |
| **Phase 2** — email, team, billing, leads, scraper | **Complete** | 44 |
| **Phase 3** — read / intelligence | **Complete** | 10 |
| **Phase 4** — confirmation gate, fast-path closure, prompt rewrite | **Complete** | — |

**Declared tool surface: 47 → 128.** Handler modules: 16. Undo branches: 55. Gated action sites: 24 (model path) + 3 (fast path).

### Honest limitations

1. **Nothing was executed.** All 128 tools were verified by static analysis and type-checking only. No agent run, no API key, no tool call. The audit and the implementation are both static reads.
2. **The fast-path gate bypass is closed** (§4c) — but by static reasoning, like everything else in this list, not by watching it refuse a delete.
3. **The repo has 28 pre-existing type errors**, two of them inside the agent path (`clientDetailsHandlers.ts:37` and `predictableClientMatcher.ts:52`, both calling `addEvent` without required fields). None were introduced here.
4. **No tests exist for any of this**, and no tests were added.
5. **"List project files" remains unbuilt**, though D-4 finally unblocked it: the tree comes from `FSEntry` objects returned by `fetch('/api/fs/list')` or `electronAPI.fs.listFiles` — not a store, not a mock. The backend handler behind that endpoint is still unconfirmed, so the tool stays unbuilt rather than risk returning fabricated filenames.
6. **No ReportsPage mirror** was built; `get_studio_overview` computes from stores and is named for that, not for the Reports page.
