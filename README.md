<div align="center">
  <h1>🎨 Flow Studio</h1>
  <p><strong>All-in-One Design, Moodboard & Project Management Desktop Suite</strong></p>
  <p>A fast, local-first hybrid desktop application built with React 19, TypeScript, Electron, and Express.</p>
</div>

---

## 🌟 Key Features

* **🎨 Infinite Moodboard Canvas**: Hardware-accelerated GPU canvas powered by `react-moveable` + `react-selecto` with image color extraction, smart alignment, section artboard frames, and non-destructive image cropping.
* **📁 Tabbed File Explorer**: Integrated Windows-style file system explorer with instant preview and local storage mapping.
* **📋 Project & Task Management**: Interactive Kanban and table workflows with custom fields, priorities, assignees, and universal confirmation modals.
* **🎯 Lead Generation & Scraper**: Apify-powered multi-platform scraping (Google Maps, Instagram, LinkedIn, Google Search) with email drafting.
* **💳 Billing & Finance**: Dynamic invoice builder, payment history, card generator, and PDF exports.
* **🔒 100% Local-First & Private**: All data is stored in human-readable JSON files on your local drive (`~/Documents/FlowStudio-Data/`).

---

## 🚀 Quick Start for New Developers

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
* [Git](https://git-scm.com/)

---

### 2. Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/labib-mustafa/Flow-Studio.git
cd Flow-Studio

# 2. Install project dependencies
npm install --legacy-peer-deps

# 3. Create your local environment file (optional for local mock mode)
cp .env.example .env
```

---

### 3. Running Development Mode

You have two ways to run Flow Studio in development:

#### Option A: Full Desktop App (Recommended)
Runs the local Express API server, Vite frontend (HMR), and Electron desktop shell concurrently:
```bash
npm run dev
```
*(On Windows, you can also simply double-click `Start Dev Mode.bat` or `Start Flow Studio.bat`)*

#### Option B: Browser-Only Mode
If you want to test in Google Chrome / browser without the Electron shell:
```bash
# Terminal 1: Run the Backend API server (Port 3010)
npm run dev:server

# Terminal 2: Run Vite Dev Server (Port 3000)
npm run dev:vite
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Backend Server + Vite + Electron Desktop App concurrently |
| `npm run dev:server` | Starts the Express backend server with hot-reloading (`tsx watch server.ts`) |
| `npm run dev:vite` | Starts Vite frontend dev server at `http://localhost:3000` |
| `npm run build` | Builds the production React frontend bundle into `dist/` |
| `npm run build:server`| Compiles the backend server into `dist-server/server.cjs` |
| `npm run package` | Builds and packages the standalone Windows desktop installer (`.exe`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## 📂 Project Architecture

```text
Flow-Studio/
├── main.cjs                   # Electron main process (Window management & IPC)
├── preload.cjs                # Electron preload bridge
├── server.ts                  # Local Express backend (File system & JSON stores)
├── public/                    # Static assets, logos, and splash screen
├── src/
│   ├── App.tsx                # Main routing & application layout
│   ├── components/
│   │   ├── Projects/          # Project overview, details, and project creation
│   │   │   └── ProjectDetails/
│   │   │       ├── MoodboardPage/ # Infinite canvas moodboard engine
│   │   │       ├── NotesPage/     # Rich text project notes editor
│   │   │       └── Files/         # Project files & explorer
│   │   ├── GlobalComponents/  # Toast notifications, confirmation modals, UI components
│   │   ├── Leads/             # Lead tables, email composer & scraper views
│   │   ├── Billing/           # Invoices, payments, and billing dashboard
│   │   └── Team/              # Team members and role management
│   ├── stores/                # Zustand stores with debounced file persistence
│   └── lib/                   # File storage adapter & Firebase utilities
└── package.json
```

---

## 💡 Developer Tips:
* **Click-to-Code**: Hold `Alt` (Windows) or `Option` (Mac) and click any component in your browser to jump directly to its source code file in your IDE.
* **Data Location**: App data is automatically saved in `~/Documents/FlowStudio-Data/` as clean JSON files.
