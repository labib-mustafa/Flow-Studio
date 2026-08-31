
# React + Electron Hybrid File System Development Roadmap

## Architecture

Frontend:
- React + TypeScript
- React Router
- Existing UI component library
- Existing theme and state management

Desktop Layer:
- Electron Main Process
- Electron Preload (contextBridge)
- IPC

Backend:
- Node.js APIs (`fs/promises`, `path`, `os`)
- Windows APIs only when necessary
- Never access Node directly from React.

Flow:

React UI
↓
IPC API exposed by preload
↓
Electron Main
↓
FileSystemService
↓
Windows File System

## Global Prompt (prepend to every phase)

We are extending an existing hybrid desktop application built with React for the frontend and Electron as the desktop wrapper.

Do not rewrite unrelated code.
Inspect and reuse the existing project architecture, React components, routing, styling, hooks, stores, utilities and Electron configuration.
The React application must never access Node.js APIs directly.
All filesystem functionality must go through:
React → preload (contextBridge) → IPC → Electron Main → FileSystemService.
Use TypeScript throughout.
No mock data, placeholders, TODOs or duplicated services.
Every phase must compile and be fully functional before moving to the next.

## Phase 1
Create the Electron filesystem architecture, preload API, IPC handlers, FileSystemService, drive detection, and a working "This PC" page.

Definition of Done:
- Drives load from the real machine.
- React communicates only through preload APIs.
- Errors and loading states are handled.

## Phase 2
Implement directory browsing:
breadcrumbs, address bar, back/forward/up, refresh, list/details/icon views, sorting, selection, keyboard navigation.

## Phase 3
Implement real file operations:
copy, move, rename, recycle bin delete, permanent delete, new folder, properties, open with default application.

## Phase 4
Performance:
virtualized React lists, lazy loading, async directory scanning, caching, cancellation, background work.

## Phase 5
Search and live updates:
recursive search, filters, filesystem watchers, automatic UI refresh.

## Phase 6
Native Windows integration:
native icons, thumbnails, drag & drop, context menus, clipboard integration.

## Phase 7
Polish:
animations, accessibility, edge cases, memory review, testing, cleanup, production readiness.

For every phase require:
- Summary of changes
- Files created/modified
- Manual test checklist
- Risks and follow-up work
