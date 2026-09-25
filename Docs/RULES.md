# 📜 Project Rules & Guidelines

### Flow Studio – Engineering Standards, Agent Protocols & Best Practices
This document outlines the core coding standards, architectural rules, AI agent execution protocols, and UI/UX constraints for developing and maintaining the Flow Studio application.

---

### Table of Contents
1. [Core Architectural & Security Rules](#1-core-architectural--security-rules)
   - [1.1 Strict Process Isolation (Renderer vs. Node.js)](#11-strict-process-isolation-renderer-vs-nodejs)
   - [1.2 Data Integrity & Read-Modify-Write Protocol](#12-data-integrity--read-modify-write-protocol)
   - [1.3 Defensive Array & Schema Hydration](#13-defensive-array--schema-hydration)
2. [Flow Studio AI Design Co-Pilot Protocol](#2-flow-studio-ai-design-co-pilot-protocol)
   - [2.1 Project Context Resolution](#21-project-context-resolution)
   - [2.2 Workflow A: Read, Analyze & Summarize Project Notes](#22-workflow-a-read-analyze--summarize-project-notes)
   - [2.3 Workflow B: Converting Notes into Tasks](#23-workflow-b-converting-notes-into-tasks)
   - [2.4 Workflow C: Curating Inspiration & Populating Moodboard](#24-workflow-c-curating-inspiration--populating-moodboard)
3. [UI Performance & Animation Standards (60FPS)](#3-ui-performance--animation-standards-60fps)
   - [3.1 Cal.com Pill Tabs (Zero Layout Jitter Standard)](#31-calcom-pill-tabs-zero-layout-jitter-standard)
   - [3.2 ClickUp-Style High-Density Data Grids](#32-clickup-style-high-density-data-grids)
   - [3.3 Dynamic 60FPS Toast & Notification Stack](#33-dynamic-60fps-toast--notification-stack)
   - [3.4 React Virtualization & Observer Lifecycle](#34-react-virtualization--observer-lifecycle)
   - [3.5 Modal Viewport Scroll-Locking](#35-modal-viewport-scroll-locking)
   - [3.6 Custom Scrollbar Guidelines](#36-custom-scrollbar-guidelines)
4. [Code Quality & Contribution Standards](#4-code-quality--contribution-standards)
5. [Definition of Done (DoD)](#5-definition-of-done-dod)

---

## 1. Core Architectural & Security Rules

### 1.1 Strict Process Isolation (Renderer vs. Node.js)
* **NEVER** import or call Node.js native APIs (`fs`, `path`, `os`, `child_process`) directly inside any React component or hook.
* All desktop operating system interactions must follow the strict pipeline:  
  `React UI` → `window.electronAPI (preload.cjs contextBridge)` → `ipcMain (main.cjs)` → `Native OS`.
* All data store read/write operations must go through the local Express backend adapter (`http://localhost:3010/api/store/:name`) or through the IPC filesystem bridge.

### 1.2 Data Integrity & Read-Modify-Write Protocol
* Always read the existing `.json` store file first, parse the current state, modify the targeted slice/record, and serialize back safely.
* **Never Overwrite Other Projects:** Operations targeting a specific `projectId` must strictly isolate and modify records matching that ID without altering adjacent project data.
* **Unique ID Generation:** All generated IDs must be universally unique and timestamped:
  ```typescript
  const generateId = (prefix: string) => 
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  ```
* **Cross-Browser UUID Fallback:** Do not rely exclusively on `crypto.randomUUID()`. Always wrap in a robust fallback to ensure immunity in iframe previews or non-secure contexts:
  ```typescript
  export const safeRandomUUID = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      try { return window.crypto.randomUUID(); } catch (e) {}
    }
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  };
  ```

### 1.3 Defensive Array & Schema Hydration
* Never assume array fields in stored entities exist. Always provide default fallbacks when mapping or filtering to prevent `TypeError: Cannot read properties of undefined (reading 'map')`:
  ```typescript
  // CORRECT:
  const tags = (client.tags || []).map(t => ...);
  const colors = (currentProject.brandColors || []).filter(c => ...);

  // FORBIDDEN:
  const tags = client.tags.map(t => ...);
  ```
* Zustand stores using the `persist` middleware must configure custom `merge` functions to ensure legacy records are decorated with complete fallback arrays upon hydration.

---

## 2. Flow Studio AI Design Co-Pilot Protocol

When functioning as or communicating with an AI Agent in Flow Studio, the following protocols are strictly enforced:

### 2.1 Project Context Resolution
When a user requests assistance on a project (e.g., *"I'm working on Rebrand 2026, help me..."*):
1. Locate the project by inspecting `projects.json` in `~/Documents/FlowStudio-Data/projects.json`.
2. Match by `name`, `title`, or `id`.
3. Extract `projectId`, client association, deadlines, and project tags before taking action.

### 2.2 Workflow A: Read, Analyze & Summarize Project Notes
1. Find relevant notes by searching `notes.json` or project-specific storage for keywords.
2. Strip HTML formatting tags (`<p>`, `<h2>`, `<ul>`) to parse clean text.
3. Output a concise **Executive Design Brief** containing:
   * 🎯 **Project Objectives**
   * 🎨 **Visual & Design Directives**
   * 📌 **Key Action Items & Deliverables**

### 2.3 Workflow B: Converting Notes into Tasks
When generating project tasks, strictly follow the Flow Studio `Task` schema:
```json
{
  "id": "task-{timestamp}-{random}",
  "projectId": "{projectId}",
  "title": "Design High-Fidelity Homepage Hero",
  "details": "Create responsive desktop and mobile hero layout featuring new typography guidelines.",
  "dueDate": "2026-09-15",
  "priority": "high",
  "phase": "todo",
  "status": "Incomplete",
  "taskType": "task",
  "assignees": []
}
```
* **Allowed Priorities:** `'urgent'`, `'high'`, `'medium'`, `'low'`, `''` (cleared/none).
* **Allowed Phases:** `'todo'`, `'inprogress'`, `'review'`, `'done'`.

### 2.4 Workflow C: Curating Inspiration & Populating Moodboard
When discovering visual references or populating the infinite canvas:
1. Curate high-resolution reference URLs for the requested design style.
2. Calculate non-overlapping `(x, y)` coordinate grids.
3. Inject structured elements into `moodboard.json` under `state.projectItems[projectId]`:
   * **Image Card:** `{ id, type: "image", x, y, width: 340, height: 240, title, url, category: "Inspiration" }`
   * **Color Swatch:** `{ id, type: "color", x, y, width: 180, height: 180, title, color: "#4F46E5", content: "#4F46E5", category: "Brand Colors" }`
   * **Sticky Note:** `{ id, type: "sticky", x, y, width: 220, height: 200, title, content, color: "#fef3c7", category: "Typography" }`
   * **Web Bookmark:** `{ id, type: "bookmark", x, y, width: 320, height: 140, title, url, category: "References" }`

---

## 3. UI Performance & Animation Standards (60FPS)

### 3.1 Cal.com Pill Tabs (Zero Layout Jitter Standard)
* Navigational tabs must render as sleek, rounded-full pill buttons that swap active states between a dark fill (`bg-slate-900 text-white`) and a lightweight bordered white background (`border-slate-200 text-slate-500`).
* **Zero Micro-Shifting:** Active and resting states must share identical border-sizing (1px), line-height, and padding. Never add a border to the resting state without having an equivalent border (transparent or colored) on the active state.

### 3.2 ClickUp-Style High-Density Data Grids
* Edge-to-edge frameless spreadsheet layout without redundant outer wrapper margins.
* **Unified Modal Bounds:** Popovers and dropdowns (Status, Priority, Due Date, Comments) must attach styling to the outer `CellPopover` host container with exactly 1px border (`border-slate-200`) and 4px padding (`p-1`).
* **Handle-Restricted Dragging:** Drag-and-drop task reordering must activate **only** on hover of the explicit drag handle (`drag_indicator`) to prevent accidental dragging during text selection.

### 3.3 Dynamic 60FPS Toast & Notification Stack
* **Dynamic `scrollHeight` Animation:** Measure `element.scrollHeight` dynamically and animate `maxHeight` to exact pixel values rather than arbitrary caps.
* **Staggered Eviction:** Stagger toast removal by ~100ms to eliminate visual layout reflow jitter.
* **GPU Acceleration:** Apply `will-change: transform, opacity, max-height;` and `transform: translateZ(0);` on all animating toast wrappers.
* **Overflow Restoration:** Keep `overflow: hidden` strictly during transitions, immediately restoring `overflow: visible` once the animation completes.

### 3.4 React Virtualization & Observer Lifecycle
* When implementing `ResizeObserver` or window listeners on containers that conditionally unmount, ensure `useEffect` dependency arrays include the visibility toggles to re-bind upon remounting.
* For lists with dynamic text wrapping, never use fixed static height estimates. Always attach `ref={virtualizer.measureElement}` and `data-index={virtualItem.index}`.

### 3.5 Modal Viewport Scroll-Locking
* All application modal overlays must bind a scroll lock on system mount, saving the previous cursor and document overflow state:
  ```typescript
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  ```
* Modal backdrops must use rich dark overlays (`bg-slate-950/60` or `bg-black/60`) without blurry backdrop filters that cause performance degradation on low-power devices.

### 3.6 Custom Scrollbar Guidelines
* All scrollable panes must use the standardized 5px ultra-thin scrollbar styling.
* Thumb color: `#cbd5e1` (slate-300), hover state: `#94a3b8` (slate-400), background: transparent.

---

## 4. Code Quality & Contribution Standards

1. **Click-to-Code Maintenance:** Do not break the Babel/Locator code inspector. Hold `Alt`/`Option` and click components during local testing to verify clean AST source mapping.
2. **TypeScript Strictness:** Do not introduce un-typed `any` variables into shared stores. Keep canonical domain types in `src/types.ts`.
3. **Preserve Legacy Features:** Never silently delete or alter features during refactoring (e.g. existing custom fields, lead stages, or moodboard export capabilities).
4. **No Mock Fallbacks in Core Logic:** When communicating with the local backend or filesystem, always handle network failure with meaningful toast errors (`toast.error(...)`) rather than silently injecting dummy data.

---

## 5. Definition of Done (DoD)

Before marking any engineering task as complete:
* [ ] TypeScript compilation passes cleanly (`npm run lint` / `tsc --noEmit`).
* [ ] Both Desktop App (`npm run dev`) and Browser-only mode (`npm run dev:vite`) execute without runtime errors.
* [ ] Local data mutations successfully persist to `~/Documents/FlowStudio-Data/`.
* [ ] UI conforms to Cal.com monochrome tokens and 5px scrollbar standards.
* [ ] Documentation in `Docs/` is updated if architectural changes or new features were introduced.
