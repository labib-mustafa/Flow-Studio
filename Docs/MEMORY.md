# 🧠 Project Memory

### Flow Studio – Context, Progress & Important Notes
This document keeps track of the current state of the project, important context, ongoing work, decisions, and things to remember. It helps maintain continuity across development sessions and when working with AI assistants or new contributors.

---

### Status Dashboard

| Metadata Property | Current State | Progress Bar |
|:---|:---|:---|
| 📅 **Last Updated** | September 20, 2026, 12:35 PM | — |
| 👤 **Current Phase** | Phase 6 & 7 – Desktop Integration & Scraping | — |
| 🔄 **Overall Progress** | **76.3% Completed** | `[==============================----------]` |
| ✨ **Project Status** | In Active Development (v1.0.0 Desktop Suite) | — |

---

### Table of Contents
1. [Current Status](#1-current-status)
2. [Completed Tasks](#2-completed-tasks)
3. [In Progress](#3-in-progress)
4. [Upcoming Tasks](#4-upcoming-tasks)
5. [Important Context](#5-important-context)
6. [Known Issues & Quirks](#6-known-issues--quirks)
7. [Decisions & Notes (ADRs)](#7-decisions--notes-adrs)
8. [Useful Links & Resources](#8-useful-links--resources)
9. [Next Steps](#9-next-steps)
10. [Change Log](#10-change-log)

---

## 1. 🎯 Current Status

* ✅ Project foundation established (React 19, TypeScript, Vite 6, Tailwind CSS 4).
* ✅ Electron 43 desktop shell with instant splash screen window and sandboxed IPC contextBridge.
* ✅ Local Express micro-backend on port 3010 handling atomic JSON file storage in `~/Documents/FlowStudio-Data/`.
* ✅ Infinite Moodboard Canvas engine with `react-moveable` + `react-selecto`, real-time image palette extraction, and SVG drawing overlay.
* ✅ High-density ClickUp-style Task List with frameless spreadsheet layout, phase grouping, priority flags, and dual-column due date calendar.
* ✅ Corporate Client CRM with 3-step onboarding wizard, brand kit sculptor, and micro-interaction workspace.
* ✅ Leads Pipeline database with `InlineEditCell`, financial forecasting, and Apify scraper integration.
* 🔄 Working on: IMAP/SMTP email automation, OS recycle bin deletion in Tabbed File Explorer, and standalone Windows desktop packaging.

---

## 2. ✅ Completed Tasks

| # | Task | Completed On | Notes |
|:---:|:---|:---:|:---|
| 1.1 | Initialize React 19 + TypeScript + Vite | Jun 9, 2026 | Project bootstrapped and migrated to local environment |
| 1.2 | Configure Tailwind CSS 4 & design tokens | Jun 10, 2026 | Cal.com monochrome tokens, 5px scrollbars |
| 1.3 | Create Express local backend (`server.ts`) | Jun 12, 2026 | Local API on port 3010 for disk stores & mail |
| 2.1 | Configure Electron main (`main.cjs`) & IPC | Jun 15, 2026 | Splash screen and contextIsolation enabled |
| 3.1 | Infinite Moodboard canvas engine | Jun 22, 2026 | Hardware-accelerated GPU matrix transforms |
| 3.2 | Image palette extraction via `sharp` | Jun 25, 2026 | Color swatches automatically extracted from images |
| 4.1 | ClickUp-style task spreadsheet grid | Jul 5, 2026 | Flat white canvas with cell hover isolation outlines |
| 4.2 | Phase grouping & drag-and-drop transfer | Jul 8, 2026 | Reorder with drop indicators and group transfer |
| 4.3 | Dual-column due date popover | Jul 14, 2026 | Presets sidebar with interactive 7-day grid |
| 5.1 | Client CRM directory & cards | Jul 20, 2026 | Active/Prospect/Inactive status dots & search |
| 5.2 | 3-Step Client Onboarding Wizard | Jul 28, 2026 | Basics, Presence with tag drawer, Style & Taste |
| 5.3 | Interactive Brand Kit Palette Sculptor | Aug 3, 2026 | Dynamic Google Fonts autocomplete & hex editor |
| 6.1 | Leads pipeline table with inline editing | Aug 12, 2026 | Universal `InlineEditCell` with single-click edit |
| 6.2 | Apify lead scraper integration | Aug 18, 2026 | Google Maps, Instagram, LinkedIn scraper actors |
| 7.1 | Tabbed File Explorer (`TabbedFileExplorer`) | Aug 25, 2026 | Multi-tab Windows-grade file browser interface |
| 8.1 | Dynamic Invoice Builder & PDF Export | Sep 2, 2026 | Pixel-perfect invoices generated via `html2pdf.js` |
| 8.2 | Spotlight Command Palette (`Ctrl+K`) | Sep 10, 2026 | Fuzzy search across projects, clients, and tasks |

---

## 3. 🔄 In Progress

| # | Task | Started On | Expected Completion | Notes |
|:---:|:---|:---:|:---:|:---|
| 6.4 | Cold email drafting & SMTP/IMAP sync | Sep 12, 2026 | Sep 22, 2026 | Mail inbox synchronization and variable templates |
| 7.3 | Real file operations in File Explorer | Sep 14, 2026 | Sep 24, 2026 | Safe delete to OS recycle bin and file renaming |
| 8.3 | Billable project stopwatch & time ledger | Sep 16, 2026 | Sep 25, 2026 | Active timer synchronization with project tasks |
| 9.2 | In-app AI prompt modal & Gemini stream | Sep 17, 2026 | Sep 27, 2026 | Google GenAI SDK integration with streaming chat |
| 10.1| Windows standalone portable packaging | Sep 18, 2026 | Sep 28, 2026 | `scripts/package-app.cjs` packaging verification |

---

## 4. ⏳ Upcoming Tasks

| # | Task | Priority | Target Phase | Notes |
|:---:|:---|:---:|:---:|:---|
| 7.4 | Native filesystem watcher (Chokidar) | `Medium` | Phase 7 | Auto-refresh file explorer upon external file updates |
| 9.3 | Auto-layout Moodboard inspiration generator | `Medium` | Phase 9 | Autonomous web search and canvas placement |
| 10.2| macOS signed `.dmg` release bundle | `High` | Phase 10 | Universal binary packaging for Apple Silicon & Intel |
| 10.3| 20,000+ item performance virtualization | `Medium` | Phase 10 | Memory profiling and TanStack Virtual stress testing |

---

## 5. 💡 Important Context

* **Local-First Architecture:** All user data (projects, tasks, moodboards, clients, leads, invoices) is stored locally on the machine in `~/Documents/FlowStudio-Data/` as human-readable `.json` files.
* **Electron Process Isolation:** React components NEVER import Node.js native modules directly. All desktop features pass through `preload.cjs` (`window.electronAPI`) to `main.cjs` or to the local Express backend on port 3010.
* **Zero Layout Reflow:** The Cal.com pill tabs switcher uses identical 1px border metrics across active (`bg-slate-950 text-white`) and inactive states to guarantee 0px layout jitter during view transitions.
* **Click-to-Code Shortcut:** Holding `Alt` (Windows) or `Option` (Mac) and clicking any component in browser mode navigates directly to its JSX source line in the IDE.

---

## 6. ⚠️ Known Issues & Quirks

1. **`crypto.randomUUID()` in Restricted Frames:** Direct calls fail inside certain sandboxed webviews or non-HTTPS development links. Always use `safeRandomUUID()` fallback helper in `src/utils/`.
2. **Double Scaling on Canvas Zoom:** Moveable digit font sizes previously double-scaled under canvas zooming. Fixed by providing an absolute size override unaffected by Moveable's `var(--zoom)` multiplier.
3. **Array Fallback Necessity:** Legacy JSON stores may omit newly introduced array properties (e.g., `tags`, `brandColors`). Stores must always provide `items || []` defensive fallbacks during `.map()` and `.filter()`.

---

## 7. 📋 Decisions & Notes (ADRs)

* **ADR-001: Local JSON over Cloud SQLite:** Retains complete user data sovereignty, zero database migration lock-in, and instant human readability.
* **ADR-002: DOM Matrix Transform for Canvas:** Chose DOM-based positioning (`react-moveable` + CSS transforms) over WebGL to allow native text selection, rich React components, and HTML image rendering.
* **ADR-003: State-Based View Switching:** Maintained view routing within `App.tsx` instead of `react-router` to eliminate browser history desynchronization inside the Electron desktop window.
* **ADR-004: Floating AI Co-Pilot Modal with Viewport Overlay (z-250):** Elevated modal stacking context above navigation sidebar (z-100) to ensure full-screen backdrop blur. Added header-based dragging, edge resizing, and non-modal companion mode to allow side-by-side creative workflows.
* **ADR-005: Zero-Latency Predictable Task Fast-Paths & Traffic Resilience:** Deterministic commands (`schedule task`, `schedule meeting`, `create project`, `start timer`, `open [view]`) bypass API networks entirely, executing client-side in `<5ms` with zero quota cost and 100% offline availability. For creative synthesis, Gemini 3.6 Flash uses automatic exponential backoff retries and 1-click retry cards to handle momentary peak traffic gracefully.

---

## 8. 🔗 Useful Links & Resources

* **Local Express API:** [http://localhost:3010/api](http://localhost:3010/api)
* **Vite Frontend Dev Server:** [http://localhost:3000](http://localhost:3000)
* **Local Data Directory:** `~/Documents/FlowStudio-Data/`
* **System AppData Directory:** `%APPDATA%/FlowStudio/` (Windows) / `~/Library/Application Support/FlowStudio/` (macOS)
* **Icons Library:** [Lucide Icons](https://lucide.dev/icons)

---

## 9. 🚀 Next Steps

1. Complete real file operations (Recycle Bin deletion and file renaming) in `TabbedFileExplorer`.
2. Finalize IMAP inbox connection test suite in `mailStore.ts`.
3. Validate Windows standalone portable `.exe` build in clean virtual environment.

---

## 10. 📝 Change Log

* **v1.0.0-rc3 (Sep 20, 2026):** Launched **Nova** conversational creative agent: zero-latency fast-path engine for predictable commands (`<5ms` client execution for tasks, meetings, projects, timers, and view transitions), fast-action command toolbar pills, Generative UI tool result cards with direct jump links, automatic peak-demand backoff retries, and 1-click retry UI.
* **v1.0.0-rc2 (Sep 20, 2026):** Upgraded AI Co-Pilot to a draggable, resizable floating modal with full-screen backdrop blur (z-250), Gemini 3.6 engine, sanitized human-readable errors, companion mode toggle, and 1-click project notes extraction.
* **v1.0.0-rc1 (Sep 20, 2026):** Created comprehensive `Docs/` directory including PRD, Architecture, Rules, Design System, Task Tracker, and Project Memory specifications with live SVG color swatches.
* **v0.9.5 (Sep 14, 2026):** Refactored Leads Pipeline with universal `InlineEditCell` and ClickUp-style column resizing.
* **v0.9.0 (Aug 25, 2026):** Added Windows-style `TabbedFileExplorer` with drive detection and native file launch support.
* **v0.8.0 (Aug 3, 2026):** Integrated Brand Kit palette sculptor and Google Fonts typography builder into Client CRM.
* **v0.7.0 (Jul 14, 2026):** Added dual-column ClickUp due date popover and priority flag color synchronization.

---

> *"A well-documented project is a smooth project."*
