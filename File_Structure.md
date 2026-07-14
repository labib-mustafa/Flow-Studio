# Project File Directory & Architecture Map

This documentation delivers a comprehensive directory outline of **Flow Studio**, mapping file pathways, design elements, state stores, and active workspace components.

---

## Workspace Root Folder

Below is the bird's-eye architectural blueprint of the platform, split logically by responsibility:

```
/
├── .env.example                     # Environment variables configuration template
├── .gitignore                       # System-ignored pathways (build directories, node_modules, logs)
├── File_Structure.md                # Mapping doc of the project directory hierarchy and architecture
├── PROJECT_SUMMARY.md               # Summary of the product, design tokens, and functional guidelines
├── codebase_dependency_map.md       # Comprehensive static code analysis and dependency mapping document
├── index.html                       # Base HTML entry document and application viewport container
├── metadata.json                    # Platform configuration, iframe permissions, and app identity
├── package.json                     # System dependencies, core script configurations, and dev servers
├── tailwind.config.js               # Utility-first CSS Tailwind configurations
├── tsconfig.json                    # TypeScript compiler configuration presets
├── vite.config.ts                   # Dev server, bundling configuration, and proxy endpoints
└── src/                             # Main application source folder
    ├── App.tsx                      # Primary routing engine and sidebar interface router
    ├── index.css                    # Unified CSS, custom scrollbars, and Google Fonts imports
    ├── main.tsx                     # Client entry node instantiation
    ├── settings.json                # Pre-seeded global workspace variables
    ├── types.ts                     # Enterprise shared types, models, and interface parameters
    ├── context/                     # Global metadata state provisions
    │   └── SettingsContext.tsx      # Client-side workspace preferences provider
    ├── engine/                      # Performance-critical custom canvas renderers and managers
    │   ├── CanvasEngine.ts          # Dynamic vector drawing and coordinate calculation processor
    │   ├── ProjectManager.ts        # Workflow state mutations, saving, and template actions
    │   └── UndoManager.ts           # Local canvas path memory stacking (Redo/Undo operations)
    ├── hooks/                       # Custom reusable React side-effect hooks
    │   └── useSettings.ts           # Custom settings context state retrieval hook
    ├── stores/                      # Zustand-powered state engines for client-side persistence
    │   ├── clientStore.ts           # Corporate clients database storage and management
    │   ├── moodboardStore.ts        # Moodboard canvas collections, canvas elements, and configurations
    │   ├── projectStore.ts          # Dynamic active project metrics, templates, and portfolios
    │   └── taskStore.ts             # Global tasks repository with list filters and states
    ├── types/                       # Custom global type overrides
    │   └── window.d.ts              # Window declarations for runtime components (e.g., Selecto)
    ├── utils/                       # Common lightweight formatting and conversion helpers
    │   ├── colorUtils.ts            # Formula engine for HEX converters, contrast checks, and dark ratios
    │   ├── drawingUtils.ts          # Mathematical helpers to map brush strokes into smooth SVG cords
    │   └── fileIcons.ts             # Mime-type utility grouping specific files to Lucide graphic icons
    └── components/                  # Domain-driven modular design modules and interface panels
```

---

## UI Components Matrix (`/src/components`)

Our component architecture is modularized strictly into logical feature domains:

### 1. `BlockEditor/` — Visual Brand Style Builder
An interactive testing ground for client brand stylesheets, layouts, and custom typography previews.
*   **`BlockEditor.tsx`**: Visual playground layout for editing layouts, configuring colors, and testing text styles.
*   **`ColorPicker/ColorPicker.tsx`**: Stylized HEX input panel supporting custom user color definitions and quick selectors.

### 2. `Clients/` — CRM Client Hub
Comprehensive company monitoring and relationship panel designed with Cal.com-inspired grayscale aesthetic.
*   **`ClientsPage.tsx`**: Advanced client list board supporting multi-parameter searching, filtering metrics, and quick ratings.
*   **`AddNewClient/AddNewClientPage.tsx`**: A structured, 3-step page-level onboarding wizard for registering comprehensive client profiles, featuring high-density typography and compact 12px vertical padding on step 2 columns for a modern, sleek layout.
*   **`Sidebars/ManageTagsSidebar.tsx`**: An elegant, visual flexbox-driven drawer linking with the step 2 Label button to search, select, build, and archive custom contact communication labels, optimized with full-height stretch scaling and clean sections.
*   **`ClientsDetails/ClientDetailsPage.tsx`**: Clean, high-contrast workspace rendering active task boards, logged notes, corporate file attachments, and financial maturity trackers; now enhanced with an elegant unified Quick Actions Menu supporting Appointment scheduling, dynamic Brand Tags editing, and document attachment modals.

### 3. `Dashboard/` — Operations Center
The executive home view compiling platform productivity, project statuses, and analytics.
*   **`Dashboard.tsx`**: Main landing with personal greeting, activity timelines, and project highlights.
*   **`ActivityGraph.tsx`**: Rich data visualization capturing design activity logs using Recharts trackers.
*   **`DashboardHeader.tsx`**: Top header control presenting notifications, date badges, and system search.
*   **`OngoingProjects.tsx`**: High-priority active design project snapshot cells.
*   **`Renewals.tsx`**: Up-to-date schedule mapping imminent contract renewals.
*   **`StatCards.tsx`**: Visual core KPIs representing contracts volume, due receivables, and productivity scales.
*   **`RightPanel.tsx`**: Collapsible utility sidebar displaying calendar events list and urgent quick-tasks.

### 4. `GlobalComponents/`** — Shared Utility UI
Common layout modifiers, responsive overlays, and custom modals utilized cross-application.
*   **`PillTab.tsx`**: Reusable navigation pill tab components with support for active state and numeric counters.
*   **`AddStylesModal.tsx`**: Structured inputs to inject custom layout typography styles.
*   **`CustomSelect.tsx`**: Highly polished and accessible form select dropdown replacement.
*   **`DropdownMenu.tsx`**: Floating contextual action trigger menus.
*   **`modals/AddImageModal.tsx`**: URL overlay panel helping users insert custom web image pins to the moodboard.
*   **`Pages/`**:
    *   **`TaskPage/`**:
        *   **`TaskPage.tsx`**: Kanban task planner with status summaries.
        *   **`TaskList.tsx`**: Interactive task rows grouped by status columns.
        *   **`ColumnHeaderMenu.tsx`**: Context popover menu for column actions (renaming, hiding, moving, and deletion).
        *   **`FilesList.tsx`**: Project reference file panels for quick sidebar attachments.
        *   **`Modals/TaskModal.tsx`**: Detailed assignments editing modal allowing users to rewrite names, checklist items, links, and phases.
        *   **`PriorityDropdown.tsx`**: Dropdown component to modify task priority states inline.
        *   **`StatusDropdown.tsx`**: Dropdown component to modify task phase states inline.
        *   **`AssigneeDropdown.tsx`**: People directory popover to assign team members to tasks.
        *   **`DueDateDropdown.tsx`**: Dual-column popover featuring presets and a visual calendar grid for modifying task deadlines inline.
        *   **`FieldsSidebar.tsx`**: Sliding right-aligned sidebar providing custom fields creation and existing field category tabs.
        *   **`TaskCommentsPopover.tsx`**: Contextual popover anchored under comments column, loaded with scrollable chat feeds, stateful AI prefix modes, rich text toolbars, and native or multi-cloud attachment options.
*   **`Sidebars/`**:
    *   **`AssignedExpertsSidebar.tsx`**: Draggable and searchable expert team assignments slider supporting user invites, role categories, and instant assignment synchronizations.
    *   **`EditColorSidebar.tsx`**: Sliding inspector editing HEX formulas and custom color labels.
    *   **`EditTypographySidebar.tsx`**: Sliding inspector controlling scaling weights, tracking, and leading values.

### 5. `Projects/` — Design Projects Workspace
Comprehensive portfolio manager enabling step-by-step project setup and deep visual toolboxes.
*   **`NewProject/`**:
    *   **`NewProject.tsx`**: Onboarding wizard orchestrating client, metadata, and template selection.
    *   **`ProjectForm.tsx`**: Dynamic user-input sections capturing brand definitions and milestones.
    *   **`TemplateSelector.tsx`**: Predefined style boilerplates (Modern, Tech, Cozy) for quick builds.
*   **`ProjectOverview/`**:
    *   **`Projects.tsx`**: portfolio control dashboard showing layout tabs and headers.
    *   **`ProjectCard.tsx`**: Rich grid cards representing active metadata, velocity scores, and stars.
    *   **`ProjectTabs.tsx`**: Category filters organizing project status (e.g. Active, Under Review, Draft).
    *   **`ProjectsHeader.tsx`**: Standard portfolio toolbar options with layout triggers and status.
*   **`ProjectDetails/`**:
    *   **`ProjectDetailsLayout.tsx`**: Master detail navigation shell linking Overview, Kanban Tasks, Moodboard, Corporate files, and Discussion logs.
    *   **`OverviewPage/OverviewPage.tsx`**: Rich metrics page illustrating delivery velocities and milestone progression ratios.
    *   **`Files/`**:
        *   **`FilesPage.tsx`**: Corporate file asset pins layout displaying search widgets, category filters, and grid galleries.
        *   **`FileCard.tsx`**: Contextual cards highlighting formats, download metrics, and action options.
        *   **`Modals/UploadFilesModal.tsx`**: Drag-and-drop file uploader simulation displaying live progress bar animations.
    *   **`MoodboardPage/`**:
        *   **`MoodboardPage.tsx`**: Multi-dimensional layout editor featuring infinite canvas bounds, full zooming, pan, and cursor brush strokes.
        *   **`MoodboardItem.tsx`**: Dynamic draggable assets utilizing interactive selection boundaries.
        *   **`DrawingOverlay.tsx`**: SVGRenderer handling brush colors, widths, and continuous path drawing.
        *   **`FloatingPropertyBar.tsx`**: Interactive toolbar controlling brush states, pan/select tools, and layout triggers.
    *   **`NotesPage/NotesPage.tsx`**: Full-fledged shared client meeting notebook presenting rich-text formats, log tags, and comments.

### 6. `Leads/` — Pipeline Database
Spreadsheet-accurate Kanban grid and management system for inbound prospects.
*   **`LeadsPage.tsx`**: High-density flat white interface combining stat-filters, search controls, and inline database updates.
*   **`LeadTable.tsx`**: Seamless custom grid featuring interactive row actions, column headers, stagnant timers, and inline quick-add rows with full inline-editable cells.
*   **`EditableHeaderCell.tsx`**: Intelligent table header component capturing double-clicks to rename columns natively in the Zustand engine.
*   **`InlineEditCell.tsx`**: Universal cell renderer capturing clicks to allow inline native data modification within table cells.

### 7. `Sidebar/` — Navigation Core
Left-aligned, premium navigational anchor anchoring fast page swaps, collapses, and user actions.
*   **`Sidebar.tsx`**: Main frame supporting animated transitions, folder controls, and active states.
*   **`SidebarItem.tsx`**: Custom buttons highlighting specific system sections with count badges.
*   **`SidebarSection.tsx`**: Module categorizations keeping navigation blocks neatly classified.
*   **`UserProfile.tsx`**: Interactive user profile block loaded at the bottom of the navigation drawer.
