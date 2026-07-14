# Flow Studio — Codebase Dependency & Architecture Map

This documentation contains a meticulous static analysis of the **Flow Studio** full-stack repository, tracing every single page component, routing hook, shared state manager, global utility function, and drawing calculation with live exact line numbers.

---

## 1. Page Component Mapping

These components represent the primary visual entry points routed, loaded, and displayed dynamically inside the central viewport.

### Component: `App` (Navigation Router Engine)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/main.tsx` | Line 3 | **Imported** | `import App from './App.tsx';` |
| `/src/main.tsx` | Line 7 | **Called/Rendered** | `<App />` (Wrapped in `<StrictMode>`) |
| `/src/App.tsx` | Line 21 | **Exported** | `export default function App() { ... }` |

### Component: `Dashboard`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/Dashboard.tsx` | Line 9 | **Exported** | `export const Dashboard: React.FC = () => { ... }` |
| `/src/App.tsx` | Line 8 | **Imported** | `import { Dashboard } from './components/Dashboard/Dashboard';` |
| `/src/App.tsx` | Line 70 | **Called/Rendered** | `return <Dashboard />;` |

### Component: `Projects` (Portfolio Gallery Tab)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 38 | **Exported** | `export const Projects: React.FC<ProjectsProps> = ({ onNewProject, onProjectClick }) => { ... }` |
| `/src/App.tsx` | Line 9 | **Imported** | `import { Projects } from './components/Projects/ProjectOverview/Projects';` |
| `/src/App.tsx` | Line 72 | **Called/Rendered** | `return <Projects onNewProject={() => setCurrentView('new-project')} ... />` |
| `/src/App.tsx` | Line 149 | **Called/Rendered** | `return <Projects onNewProject={() => setCurrentView('new-project')} ... />` (Fallback Tab) |

### Component: `NewProject` (Project Creation Wizard)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/NewProject/NewProject.tsx` | Line 9 | **Exported** | `export const NewProject: React.FC<NewProjectProps> = ({ onBack }) => { ... }` |
| `/src/App.tsx` | Line 10 | **Imported** | `import { NewProject } from './components/Projects/NewProject/NewProject';` |
| `/src/App.tsx` | Line 77 | **Called/Rendered** | `return <NewProject onBack={() => setCurrentView('projects')} />;` |

### Component: `ProjectDetailsLayout` (Workspace Navigation Frame)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/ProjectDetailsLayout.tsx` | Line 14 | **Exported** | `export const ProjectDetailsLayout: React.FC<ProjectDetailsLayoutProps> = ({ onBack, currentTab, onTabChange, children, isSidebarExpanded = true, onSidebarToggle }) => { ... }` |
| `/src/App.tsx` | Line 11 | **Imported** | `import { ProjectDetailsLayout } from './components/Projects/ProjectDetails/ProjectDetailsLayout';` |
| `/src/App.tsx` | Lines 80-86 | **Called/Rendered** | `<ProjectDetailsLayout onBack={() => setCurrentView('projects')} currentTab="overview" ... >` |
| `/src/App.tsx` | Lines 92-98 | **Called/Rendered** | `<ProjectDetailsLayout onBack={() => setCurrentView('projects')} currentTab="tasks" ... >` |
| `/src/App.tsx` | Lines 104-110 | **Called/Rendered** | `<ProjectDetailsLayout onBack={() => setCurrentView('projects')} currentTab="files" ... >` |
| `/src/App.tsx` | Lines 116-122 | **Called/Rendered** | `<ProjectDetailsLayout onBack={() => setCurrentView('projects')} currentTab="notes" ... >` |
| `/src/App.tsx` | Lines 131-137 | **Called/Rendered** | `<ProjectDetailsLayout onBack={() => setCurrentView('projects')} currentTab="moodboard" ... >` |

### Component: `OverviewPage` (Project Progression Insights)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/OverviewPage/OverviewPage.tsx` | Line 18 | **Exported** | `export const OverviewPage: React.FC = () => { ... }` |
| `/src/App.tsx` | Line 16 | **Imported** | `import { OverviewPage } from './components/Projects/ProjectDetails/OverviewPage/OverviewPage';` |
| `/src/App.tsx` | Line 87 | **Called/Rendered** | `<OverviewPage />` |

### Component: `TaskPage` (Kanban Task Board)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 10 | **Exported** | `export const TaskPage: React.FC<TaskPageProps> = ({ onTabChange }) => { ... }` |
| `/src/App.tsx` | Line 12 | **Imported** | `import { TaskPage } from './components/GlobalComponents/Pages/TaskPage/TaskPage';` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 6 | **Imported** | `import { TaskPage } from '../../GlobalComponents/Pages/TaskPage/TaskPage';` |
| `/src/App.tsx` | Line 99 | **Called/Rendered** | `<TaskPage onTabChange={(tab) => setCurrentView(\`project-\${tab}\`)} />` |

### Component: `FilesPage` (Product Assets Directory)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/Files/FilesPage.tsx` | Line 17 | **Exported** | `export const FilesPage: React.FC<FilesPageProps> = ({ onTabChange }) => { ... }` |
| `/src/App.tsx` | Line 13 | **Imported** | `import { FilesPage } from './components/Projects/ProjectDetails/Files/FilesPage';` |
| `/src/App.tsx` | Line 111 | **Called/Rendered** | `<FilesPage onTabChange={(tab) => setCurrentView(\`project-\${tab}\`)} />` |

### Component: `NotesPage` (Shared Client Meeting Notebook)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 21 | **Exported** | `export const NotesPage: React.FC<NotesPageProps> = ({ onTabChange, onFullScreenToggle }) => { ... }` |
| `/src/App.tsx` | Line 14 | **Imported** | `import { NotesPage } from './components/Projects/ProjectDetails/NotesPage/NotesPage';` |
| `/src/App.tsx` | Line 123 | **Called/Rendered** | `<NotesPage onTabChange={(tab) => setCurrentView(\`project-\${tab}\`)} onFullScreenToggle={...} />` |

### Component: `MoodboardPage` (Infinite Vector Interactive Canvas)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 20 | **Exported** | `export const MoodboardPage: React.FC<MoodboardPageProps> = ({ onTabChange, onEditSidebarToggle }) => { ... }` |
| `/src/App.tsx` | Line 15 | **Imported** | `import { MoodboardPage } from './components/Projects/ProjectDetails/MoodboardPage/MoodboardPage';` |
| `/src/App.tsx` | Line 138 | **Called/Rendered** | `<MoodboardPage onTabChange={(tab) => setCurrentView(\`project-\${tab}\`)} onEditSidebarToggle={...} />` |

### Component: `ClientsPage` (Corporate CRM Directory)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Clients/ClientsPage.tsx` | Line 34 | **Exported** | `export const ClientsPage: React.FC = () => { ... }` |
| `/src/App.tsx` | Line 17 | **Imported** | `import { ClientsPage } from './components/Clients/ClientsPage';` |
| `/src/App.tsx` | Line 145 | **Called/Rendered** | `<ClientsPage />` |

### Component: `LeadsPage` (Kanban Grid Interface)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Leads/LeadsPage.tsx` | Line 6 | **Exported** | `export const LeadsPage: React.FC = () => { ... }` |
| `/src/App.tsx` | Line 22 | **Imported** | `import { LeadsPage } from './components/Leads/LeadsPage';` |
| `/src/App.tsx` | Line 171 | **Called/Rendered** | `<LeadsPage />` |

### Component: `SettingsPage` (System Workspace Preferences)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Settings/SettingsPage.tsx` | Line 9 | **Exported** | `export const SettingsPage: React.FC = () => { ... }` |
| `/src/App.tsx` | Line 18 | **Imported** | `import { SettingsPage } from './components/Settings/SettingsPage';` |
| `/src/App.tsx` | Line 147 | **Called/Rendered** | `<SettingsPage />` |

---

## 2. Core Components Mapping

These child elements structure our page columns, dashboard graphs, navigation sidebar sections, modal forms, and slides.

### Entity: `Sidebar`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Sidebar/Sidebar.tsx` | Line 12 | **Exported** | `export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => { ... }` |
| `/src/App.tsx` | Line 7 | **Imported** | `import { Sidebar } from './components/Sidebar/Sidebar';` |
| `/src/App.tsx` | Line 160 | **Called/Rendered** | `<Sidebar activeTab={...} onTabChange={setCurrentView} />` |

### Entity: `SidebarSection`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Sidebar/SidebarSection.tsx` | Line 9 | **Exported** | `export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, isCollapsed }) => { ... }` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 3 | **Imported** | `import { SidebarSection } from './SidebarSection';` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 64 | **Called/Rendered** | `<SidebarSection title="Main Menu" isCollapsed={isCollapsed}>` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 90 | **Called/Rendered** | `<SidebarSection title="Management" isCollapsed={isCollapsed}>` |

### Entity: `SidebarItem`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Sidebar/SidebarItem.tsx` | Line 14 | **Exported** | `export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, ... }) => { ... }` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 2 | **Imported** | `import { SidebarItem } from './SidebarItem';` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 65 | **Called/Rendered** | `<SidebarItem icon="dashboard" label="Dashboard" ... />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 73 | **Called/Rendered** | `<SidebarItem icon="folder" label="Projects" ... />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 80 | **Called/Rendered** | `<SidebarItem icon="groups" label="Clients" ... />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 87 | **Called/Rendered** | `<SidebarItem icon="filter_alt" label="Leads" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 91 | **Called/Rendered** | `<SidebarItem icon="calendar_month" label="Calendar" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 92 | **Called/Rendered** | `<SidebarItem icon="schedule" label="Time" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 93 | **Called/Rendered** | `<SidebarItem icon="receipt_long" label="Billing" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx" ` | Line 94 | **Called/Rendered** | `<SidebarItem icon="description" label="Reports" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 95 | **Called/Rendered** | `<SidebarItem icon="database" label="Data" isCollapsed={isCollapsed} />` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 100 | **Called/Rendered** | `<SidebarItem icon="settings" label="Settings" ... />` |

### Entity: `UserProfile`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Sidebar/UserProfile.tsx` | Line 12 | **Exported** | `export const UserProfile: React.FC<UserProfileProps> = ({ name, role, ... }) => { ... }` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 4 | **Imported** | `import { UserProfile } from './UserProfile';` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 108 | **Called/Rendered** | `<UserProfile name="Alex Rivera" role="Creative Director" ... />` |

### Entity: `DashboardHeader`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/DashboardHeader.tsx` | Line 3 | **Exported** | `export const DashboardHeader: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 2 | **Imported** | `import { DashboardHeader } from './DashboardHeader';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 14 | **Called/Rendered** | `<DashboardHeader />` |

### Entity: `StatCards`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/StatCards.tsx` | Line 3 | **Exported** | `export const StatCards: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 3 | **Imported** | `import { StatCards } from './StatCards';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 15 | **Called/Rendered** | `<StatCards />` |

### Entity: `OngoingProjects`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/OngoingProjects.tsx` | Line 3 | **Exported** | `export const OngoingProjects: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 4 | **Imported** | `import { OngoingProjects } from './OngoingProjects';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 17 | **Called/Rendered** | `<OngoingProjects />` |

### Entity: `Renewals`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/Renewals.tsx` | Line 3 | **Exported** | `export const Renewals: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 5 | **Imported** | `import { Renewals } from './Renewals';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 18 | **Called/Rendered** | `<Renewals />` |

### Entity: `ActivityGraph` (Dynamic Recharts Visualizer)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/ActivityGraph.tsx` | Line 3 | **Exported** | `export const ActivityGraph: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 6 | **Imported** | `import { ActivityGraph } from './ActivityGraph';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 20 | **Called/Rendered** | `<ActivityGraph />` |

### Entity: `RightPanel` (Emergency Tasks Drawer)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Dashboard/RightPanel.tsx` | Line 3 | **Exported** | `export const RightPanel: React.FC = () => { ... }` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 7 | **Imported** | `import { RightPanel } from './RightPanel';` |
| `/src/components/Dashboard/Dashboard.tsx` | Line 23 | **Called/Rendered** | `<RightPanel />` |

### Entity: `ProjectsHeader`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectOverview/ProjectsHeader.tsx` | Line 19 | **Exported** | `export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ ... }) => { ... }` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 2 | **Imported** | `import { ProjectsHeader } from './ProjectsHeader';` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 87 | **Called/Rendered** | `<ProjectsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} ... />` |

### Entity: `ProjectTabs`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectOverview/ProjectTabs.tsx` | Line 11 | **Exported** | `export const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeTab, onTabChange, counts }) => { ... }` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 3 | **Imported** | `import { ProjectTabs, ProjectTab } from './ProjectTabs';` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 93 | **Called/Rendered** | `<ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />` |

### Entity: `ProjectCard`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectOverview/ProjectCard.tsx` | Line 16 | **Exported** | `export const ProjectCard: React.FC<ProjectCardProps> = ({ ... }) => { ... }` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 4 | **Imported** | `import { ProjectCard } from './ProjectCard';` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 103 | **Called/Rendered** | `<ProjectCard key={index} {...project} onClick={onProjectClick} />` |

### Component: `PillTab` (Global Components)
| File Path | Line Number | Action Type | Code Context / Snippet |
|-----------|-------------|-------------|-------------------------|
| `/src/components/GlobalComponents/PillTab.tsx` | Line 11 | **Exported** | `export const PillTab: React.FC<PillTabProps> = ({ label, icon, isActive, onClick, counter }) => { ... }` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 16 | **Imported** | `import { PillTab } from '../../GlobalComponents/PillTab';` |
| `/src/components/Clients/ClientsPage.tsx` | Line 35 | **Imported** | `import { PillTab } from '../GlobalComponents/PillTab';` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 6 | **Imported** | `import { PillTab } from '../../../GlobalComponents/PillTab';` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 8 | **Imported** | `import { PillTab } from '../../GlobalComponents/PillTab';` |

### Entity: `InlineEditCell` (Inline Data Editor)
| File Path | Line Number | Action Type | Code Context / Snippet |
|-----------|-------------|-------------|-------------------------|
| `/src/components/Leads/InlineEditCell.tsx` | Line 13 | **Exported** | `export const InlineEditCell: React.FC<InlineEditCellProps> = ({ ... }) => { ... }` |
| `/src/components/Leads/LeadTable.tsx` | Line 4 | **Imported** | `import { InlineEditCell } from './InlineEditCell';` |
| `/src/components/Leads/LeadTable.tsx` | Line 213 | **Called/Rendered** | `<InlineEditCell value={lead.name} onSave={(val) => updateLead(lead.id, { name: val, contactPerson: val })} ... />` |

### Entity: `ProjectHeader` (Workspace Summary Toolbar)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 10 | **Exported** | `export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ currentTab, onTabChange }) => { ... }` |
| `/src/components/Projects/ProjectDetails/ProjectDetailsLayout.tsx` | Line 2 | **Imported** | `import { ProjectHeader } from './GlobalComponents/ProjectHeader';` |
| `/src/components/Projects/ProjectDetails/ProjectDetailsLayout.tsx` | Line 31 | **Called/Rendered** | `<ProjectHeader currentTab={currentTab} onTabChange={onTabChange} />` |

### Entity: `ProjectSidebar`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectSidebar.tsx` | Line 8 | **Exported** | `export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isExpanded = false, onToggle }) => { ... }` |
| `/src/components/Projects/ProjectDetails/ProjectDetailsLayout.tsx` | Line 3 | **Imported** | `import { ProjectSidebar } from './GlobalComponents/ProjectSidebar';` |
| `/src/components/Projects/ProjectDetails/ProjectDetailsLayout.tsx` | Line 42 | **Called/Rendered** | `<ProjectSidebar isExpanded={isSidebarExpanded} onToggle={onSidebarToggle} />` |

### Entity: `TemplateSelector`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/NewProject/TemplateSelector.tsx` | Line 62 | **Exported** | `export const TemplateSelector: React.FC = () => { ... }` |
| `/src/components/Projects/NewProject/NewProject.tsx` | Line 2 | **Imported** | `import { TemplateSelector } from './TemplateSelector';` |
| `/src/components/Projects/NewProject/NewProject.tsx` | Line 39 | **Called/Rendered** | `<TemplateSelector />` |

### Entity: `ProjectForm`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/NewProject/ProjectForm.tsx` | Line 8 | **Exported** | `export const ProjectForm: React.FC<ProjectFormProps> = ({ onCancel, onSubmit }) => { ... }` |
| `/src/components/Projects/NewProject/NewProject.tsx` | Line 3 | **Imported** | `import { ProjectForm } from './ProjectForm';` |
| `/src/components/Projects/NewProject/NewProject.tsx` | Line 44 | **Called/Rendered** | `<ProjectForm onCancel={onBack} onSubmit={() => console.log('Create project')} />` |

### Entity: `TaskList`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 117 | **Exported** | `export const TaskList: React.FC<TaskListProps> = ({ onAddTask, onTaskClick, tasks }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 2 | **Imported** | `import { TaskList } from './TaskList';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 41 | **Called/Rendered** | `<TaskList onAddTask={handleAddTask} onTaskClick={handleEditTask} tasks={tasks} />` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 1210 | **Custom Handler** | `onContextMenu={handleContextMenu}` triggers fixed Overlay menu displaying list of all hidden columns to allow 1-click unhide |

### Entity: `ColumnHeaderMenu`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/ColumnHeaderMenu.tsx` | Line 12 | **Exported** | `export const ColumnHeaderMenu: React.FC<ColumnHeaderMenuProps> = ({ ... }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line X | **Imported** | `import { ColumnHeaderMenu } from './ColumnHeaderMenu';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line Y | **Called/Rendered** | `<ColumnHeaderMenu columnId={columnId} colKey={colKey} ... />` |

### Entity: `Task Dropdowns` (Due Date, Priority, Status, Assignee)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/DueDateDropdown.tsx` | Line 40 | **Exported** | `export const DueDateDropdown: React.FC<DueDateDropdownProps> = ({ task, ... }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/PriorityDropdown.tsx` | Line 10 | **Exported** | `export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({ task, ... }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/AssigneeDropdown.tsx` | Line 10 | **Exported** | `export const AssigneeDropdown: React.FC<AssigneeDropdownProps> = ({ task, ... }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/StatusDropdown.tsx` | Line 10 | **Exported** | `export const StatusDropdown: React.FC<StatusDropdownProps> = ({ task, ... }) => { ... }` |

### Entity: `TaskModal`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/Modals/TaskModal.tsx` | Line 20 | **Exported** | `export const TaskModal: React.FC<TaskModalProps> = ({ ... }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 3 | **Imported** | `import { TaskModal } from './Modals/TaskModal';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 47 | **Called/Rendered** | `<TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} onDelete={handleDeleteTask} task={selectedTask} ... />` |

### Entity: `TaskCommentsPopover`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx` | Line 59 | **Exported** | `export const TaskCommentsPopover: React.FC<TaskCommentsPopoverProps> = ({ task }) => { ... }` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 7 | **Imported** | `import { TaskCommentsPopover } from './TaskCommentsPopover';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 475 | **Called/Rendered** | `<TaskCommentsPopover task={task} />` |

### Entity: `UploadFilesModal` (Drag-and-Drop Form)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/Files/Modals/UploadFilesModal.tsx` | Line 9 | **Exported** | `export const UploadFilesModal: React.FC<UploadFilesModalProps> = ({ isOpen, onClose }) => { ... }` |
| `/src/components/Projects/ProjectDetails/Files/FilesPage.tsx` | Line 2 | **Imported** | `import { UploadFilesModal } from './Modals/UploadFilesModal';` |
| `/src/components/Projects/ProjectDetails/Files/FilesPage.tsx" ` | Line 243 | **Called/Rendered** | `<UploadFilesModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />` |

### Entity: `AddNewClientPage` (3-Step CRM Registration Wizard)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Clients/AddNewClient/AddNewClientPage.tsx` | Line 11 | **Exported** | `export const AddNewClientPage: React.FC<AddNewClientPageProps> = ({ isOpen, onClose }) => { ... }` |
| `/src/components/Clients/ClientsPage.tsx` | Line 4 | **Imported** | `import { AddNewClientPage } from './AddNewClient/AddNewClientPage';` |
| `/src/components/Clients/ClientsPage.tsx` | Line 748 | **Called/Rendered** | `<AddNewClientPage isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />` |

### Entity: `ClientDetailsPage` (Enterprise Activity & Metrics Panel)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 34 | **Exported** | `export const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({ onBack }) => { ... }` |
| `/src/components/Clients/ClientsPage.tsx` | Line 5 | **Imported** | `import { ClientDetailsPage } from './ClientsDetails/ClientDetailsPage';` |
| `/src/components/Clients/ClientsPage.tsx` | Line 247 | **Called/Rendered** | `return <ClientDetailsPage onBack={() => setIsDetailViewOpen(false)} />;` |

### Entity: `ManageTagsSidebar` (Custom Tags/Labels Editor)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Clients/Sidebars/ManageTagsSidebar.tsx` | Line 12 | **Exported** | `export const ManageTagsSidebar: React.FC<ManageTagsSidebarProps> = ({ ... }) => { ... }` |
| `/src/components/Clients/AddNewClient/AddNewClientPage.tsx` | Line 4 | **Imported** | `import { ManageTagsSidebar } from '../Sidebars/ManageTagsSidebar';` |
| `/src/components/Clients/AddNewClient/AddNewClientPage.tsx` | Line 906 | **Called/Rendered** | `<ManageTagsSidebar isOpen={isManageTagsSidebarOpen} onClose={...} />` |

### Entity: `AssignedExpertsSidebar` (Expert Assignment slider)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Sidebars/AssignedExpertsSidebar.tsx` | Line 23 | **Exported** | `export const AssignedExpertsSidebar: React.FC<AssignedExpertsSidebarProps> = ({ ... }) => { ... }` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 4 | **Imported** | `import { AssignedExpertsSidebar, Expert } from '../../GlobalComponents/Sidebars/AssignedExpertsSidebar';` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 1928 | **Called/Rendered** | `<AssignedExpertsSidebar isOpen={isAssignExpertsOpen} onClose={...} />` |

### Entity: `MoodboardItem`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 47 | **Exported** | `export const MoodboardItem: React.FC<MoodboardItemProps> = ({ item, isSelected, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 6 | **Imported** | `import { MoodboardItem, MoodboardItemData } from './MoodboardItem';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 789 | **Called/Rendered** | `<MoodboardItem key={item.id} item={item} isSelected={...} />` |

### Entity: `DrawingOverlay`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 19 | **Exported** | `export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ activeTool, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 12 | **Imported** | `import { DrawingOverlay } from './DrawingOverlay';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1160 | **Called/Rendered** | `<DrawingOverlay activeTool={activeTool} onAddArrow={...} />` |

### Entity: `FloatingPropertyBar`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/MoodboardPage/FloatingPropertyBar.tsx` | Line 15 | **Exported** | `export const FloatingPropertyBar: React.FC<FloatingPropertyBarProps> = ({ items, onUpdate, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 7 | **Imported** | `import { FloatingPropertyBar } from './FloatingPropertyBar';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 809 | **Called/Rendered** | `<FloatingPropertyBar items={selectedItems} onUpdate={...} />` |

### Entity: `AddImageModal`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/modals/AddImageModal.tsx` | Line 13 | **Exported** | `export const AddImageModal: React.FC<AddImageModalProps> = ({ isOpen, onClose, onAdd }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 8 | **Imported** | `import { AddImageModal } from '../../../GlobalComponents/modals/AddImageModal';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1377 | **Called/Rendered** | `<AddImageModal isOpen={isAddImageModalOpen} onClose={...} />` |

### Entity: `AddStylesModal`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/AddStylesModal.tsx` | Line 23 | **Exported** | `export const AddStylesModal: React.FC<AddStylesModalProps> = ({ isOpen, onClose, anchorPos, onSave }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 9 | **Imported** | `import { AddStylesModal, QueueItem } from '../../../GlobalComponents/AddStylesModal';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1388 | **Called/Rendered** | `<AddStylesModal isOpen={isAddStylesModalOpen} onClose={() => setIsAddStylesModalOpen(false)} ... />` |

### Entity: `EditTypographySidebar`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Sidebars/EditTypographySidebar.tsx` | Line 34 | **Exported** | `export const EditTypographySidebar: React.FC<EditTypographySidebarProps> = ({ isOpen, onClose, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 10 | **Imported** | `import { EditTypographySidebar } from '../../../GlobalComponents/Sidebars/EditTypographySidebar';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1395 | **Called/Rendered** | `<EditTypographySidebar isOpen={isTypographySidebarOpen} onClose={...} />` |

### Entity: `EditColorSidebar`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Sidebars/EditColorSidebar.tsx` | Line 82 | **Exported** | `export const EditColorSidebar: React.FC<EditColorSidebarProps> = ({ isOpen, onClose, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 11 | **Imported** | `import { EditColorSidebar } from '../../../GlobalComponents/Sidebars/EditColorSidebar';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1401 | **Called/Rendered** | `<EditColorSidebar isOpen={isColorSidebarOpen} onClose={...} />` |

### Entity: `CustomSelect`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/CustomSelect.tsx` | Line 13 | **Exported** | `export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, ... }) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/FloatingPropertyBar.tsx` | Line 3 | **Imported** | `import { CustomSelect } from '../../../GlobalComponents/CustomSelect';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/FloatingPropertyBar.tsx` | Line 115 | **Called/Rendered** | `<CustomSelect options={fontFamilies} ... />` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/FloatingPropertyBar.tsx` | Line 127 | **Called/Rendered** | `<CustomSelect options={fontSizes} ... />` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/FloatingPropertyBar.tsx" ` | Line 133 | **Called/Rendered** | `<CustomSelect options={lineHeights} ... />` |
| `/src/components/GlobalComponents/Sidebars/EditTypographySidebar.tsx` | Line 2 | **Imported** | `import { CustomSelect } from '../CustomSelect';` |
| `/src/components/GlobalComponents/Sidebars/EditTypographySidebar.tsx` | Line 127 | **Called/Rendered** | `<CustomSelect options={fontFamilies} ... />` |
| `/src/components/GlobalComponents/Sidebars/EditTypographySidebar.tsx` | Line 135 | **Called/Rendered** | `<CustomSelect options={fontSizes} ... />` |

### Entity: `DropdownMenu` (Portal-Ready Dropdown Renderer)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/DropdownMenu.tsx` | Line 25 | **Exported** | `export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, options, onClick, ... }) => { ... }` |
| `/src/components/Sidebar/UserProfile.tsx` | Line 2 | **Imported** | `import { DropdownMenu, DropdownOption } from '../GlobalComponents/DropdownMenu';` |
| `/src/components/Sidebar/UserProfile.tsx` | Line 55 | **Called/Rendered** | `<DropdownMenu trigger={...} options={options} ... />` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 5 | **Imported** | `import { DropdownMenu, DropdownOption } from '../../../GlobalComponents/DropdownMenu';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 1412 | **Called/Rendered** | `<DropdownMenu trigger={...} options={menuOptions} isOpen={...} />` |
| `/src/components/GlobalComponents/CustomSelect.tsx` | Line 2 | **Imported** | `import { DropdownMenu, DropdownOption } from './DropdownMenu';` |
| `/src/components/GlobalComponents/CustomSelect.tsx` | Line 60 | **Called/Rendered** | `<DropdownMenu trigger={...} options={options} ... />` |

### Entity: `Settings Tabs` (Tab Panel Divisions)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Settings/GeneralTab.tsx` | Line 4 | **Exported** | `export const GeneralTab: React.FC = () => { ... }` |
| `/src/components/Settings/NotificationsTab.tsx` | Line 4 | **Exported** | `export const NotificationsTab: React.FC = () => { ... }` |
| `/src/components/Settings/DefaultsTab.tsx` | Line 4 | **Exported** | `export const DefaultsTab: React.FC = () => { ... }` |
| `/src/components/Settings/DataLocationTab.tsx` | Line 5 | **Exported** | `export const DataLocationTab: React.FC = () => { ... }` |
| `/src/components/Settings/SettingsPage.tsx` | Line 2 | **Imported** | `import { GeneralTab } from './GeneralTab';` |
| `/src/components/Settings/SettingsPage.tsx` | Line 3 | **Imported** | `import { NotificationsTab } from './NotificationsTab';` |
| `/src/components/Settings/SettingsPage.tsx` | Line 4 | **Imported** | `import { DefaultsTab } from './DefaultsTab';` |
| `/src/components/Settings/SettingsPage.tsx` | Line 5 | **Imported** | `import { DataLocationTab } from './DataLocationTab';` |
| `/src/components/Settings/SettingsPage.tsx` | Line 69 | **Called/Rendered** | `{activeTab === 'general' && <GeneralTab />}` |
| `/src/components/Settings/SettingsPage.tsx` | Line 70 | **Called/Rendered** | `{activeTab === 'notifications' && <NotificationsTab />}` |
| `/src/components/Settings/SettingsPage.tsx` | Line 71 | **Called/Rendered** | `{activeTab === 'defaults' && <DefaultsTab />}` |
| `/src/components/Settings/SettingsPage.tsx` | Line 72 | **Called/Rendered** | `{activeTab === 'data-location' && <DataLocationTab />}` |

---

## 3. Global Functions & Custom Hooks Mapping

This section catalogs shared stores (Zustand state triggers), business metadata managers, contexts, and helper APIs.

### Entity: `useMoodboardStore` (Zustand)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/stores/moodboardStore.ts` | Line 128 | **Exported** | `export const useMoodboardStore = create<MoodboardState>()( ... )` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 13 | **Imported** | `import { useMoodboardStore } from '../../../../stores/moodboardStore';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 28 | **Called/Invoked** | `const { items, history, ... } = useMoodboardStore();` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardPage.tsx` | Line 219 | **Called/Invoked** | `useMoodboardStore.getState().saveToHistory(newItems);` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 4 | **Imported** | `import { useMoodboardStore } from '../../../../stores/moodboardStore';` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 13 | **Called/Invoked** | `const { items: moodboardItems } = useMoodboardStore();` |

### Entity: `useProjectStore` (Zustand)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/stores/projectStore.ts` | Line 20 | **Exported** | `export const useProjectStore = create<ProjectState>()( ... )` |
| `/src/components/Projects/ProjectDetails/OverviewPage/OverviewPage.tsx` | Line 2 | **Imported** | `import { useProjectStore } from '../../../../stores/projectStore';` |
| `/src/components/Projects/ProjectDetails/OverviewPage/OverviewPage.tsx` | Line 19 | **Called/Invoked** | `const { currentProject, updateProject } = useProjectStore();` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 2 | **Imported** | `import { useProjectStore } from '../../../../stores/projectStore';` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 11 | **Called/Invoked** | `const { currentProject } = useProjectStore();` |
| `/src/components/Projects/ProjectDetails/Files/FilesPage.tsx` | Line 4 | **Imported** | `import { useProjectStore } from '../../../../stores/projectStore';` |
| `/src/components/Projects/ProjectDetails/Files/FilesPage.tsx` | Line 18 | **Called/Invoked** | `const { currentProject } = useProjectStore();` |

### Entity: `useClientStore` (Zustand)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/stores/clientStore.ts` | Line 433 | **Exported** | `export const useClientStore = create<ClientState>()( ... )` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 2 | **Imported** | `import { useClientStore, Client, ClientNote, ProjectHistoryItem } from '../../../stores/clientStore';` |
| `/src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | Line 44 | **Called/Invoked** | `const { clients, activeClient, ... } = useClientStore();` |
| `/src/components/Clients/ClientsPage.tsx` | Line 2 | **Imported** | `import { useClientStore, Client, ClientNote, ProjectHistoryItem } from '../../stores/clientStore';` |
| `/src/components/Clients/ClientsPage.tsx` | Line 50 | **Called/Invoked** | `const { clients, activeClient, ... } = useClientStore();` |
| `/src/components/Clients/AddNewClient/AddNewClientPage.tsx` | Line 3 | **Imported** | `import { useClientStore } from '../../../stores/clientStore';` |
| `/src/components/Clients/AddNewClient/AddNewClientPage.tsx` | Line 12 | **Called/Invoked** | `const addClient = useClientStore(state => state.addClient);` |

### Entity: `useTaskStore` (Zustand)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/stores/taskStore.ts` | Line 24 | **Exported** | `export const useTaskStore = create<TaskState>()( ... )` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 4 | **Imported** | `import { useTaskStore, Task } from '../../../../stores/taskStore';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskPage.tsx` | Line 13 | **Called/Invoked** | `const { tasks, addTask, updateTask, deleteTask } = useTaskStore();` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 2 | **Imported** | `import { Task, useTaskStore } from '../../../../stores/taskStore';` |
| `/src/components/GlobalComponents/Pages/TaskPage/TaskList.tsx` | Line 10 | **Called/Invoked** | `const { updateTask } = useTaskStore();` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 3 | **Imported** | `import { useTaskStore } from '../../../../stores/taskStore';` |
| `/src/components/Projects/ProjectDetails/GlobalComponents/ProjectHeader.tsx` | Line 12 | **Called/Invoked** | `const { tasks } = useTaskStore();` |
| `/src/components/Projects/ProjectDetails/OverviewPage/OverviewPage.tsx` | Line 3 | **Imported** | `import { useTaskStore } from '../../../../stores/taskStore';` |
| `/src/components/Projects/ProjectDetails/OverviewPage/OverviewPage.tsx` | Line 21 | **Called/Invoked** | `const { tasks } = useTaskStore();` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 5 | **Imported** | `import { useTaskStore } from '../../../stores/taskStore';` |
| `/src/components/Projects/ProjectOverview/Projects.tsx` | Line 20 | **Called/Invoked** | `const { tasks } = useTaskStore();` |

### Entity: `useLeadStore` (Zustand)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/stores/leadStore.ts` | Line 93 | **Exported** | `export const useLeadStore = create<LeadState>()( ... )` |
| `/src/components/Leads/LeadTable.tsx` | Line 2 | **Imported** | `import { useLeadStore, Lead, ColumnLabels } from '../../stores/leadStore';` |
| `/src/components/Leads/LeadTable.tsx` | Line 61 | **Called/Invoked** | `const { leads, columnLabels, ... } = useLeadStore();` |
| `/src/components/Leads/LeadsHeader.tsx` | Line 2 | **Imported** | `import { useLeadStore } from '../../stores/leadStore';` |
| `/src/components/Leads/LeadsHeader.tsx` | Line 5 | **Called/Invoked** | `const { leads, searchQuery, ... } = useLeadStore();` |

### Entity: `useSettings` (Context State Retriever Hook)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/hooks/useSettings.ts` | Line 5 | **Exported** | `export const useSettings = () => { ... }` |
| `/src/components/Settings/GeneralTab.tsx` | Line 2 | **Imported** | `import { useSettings } from '../../hooks/useSettings';` |
| `/src/components/Settings/GeneralTab.tsx` | Line 5 | **Called/Invoked** | `const { settings, updateSettings } = useSettings();` |
| `/src/components/Settings/DefaultsTab.tsx` | Line 2 | **Imported** | `import { useSettings } from '../../hooks/useSettings';` |
| `/src/components/Settings/DefaultsTab.tsx" ` | Line 5 | **Called/Invoked** | `const { settings, updateSettings } = useSettings();` |
| `/src/components/Settings/NotificationsTab.tsx` | Line 2 | **Imported** | `import { useSettings } from '../../hooks/useSettings';` |
| `/src/components/Settings/NotificationsTab.tsx` | Line 5 | **Called/Invoked** | `const { settings, updateSettings } = useSettings();` |
| `/src/components/Settings/DataLocationTab.tsx` | Line 2 | **Imported** | `import { useSettings } from '../../hooks/useSettings';` |
| `/src/components/Settings/DataLocationTab.tsx` | Line 6 | **Called/Invoked** | `const { settings, updateSettings, resetSettings } = useSettings();` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 5 | **Imported** | `import { useSettings } from '../../hooks/useSettings';` |
| `/src/components/Sidebar/Sidebar.tsx` | Line 14 | **Called/Invoked** | `const { settings } = useSettings();` |

### Entity: `SettingsProvider`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/context/SettingsContext.tsx` | Line 69 | **Exported** | `export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => { ... }` |
| `/src/App.tsx` | Line 19 | **Imported** | `import { SettingsProvider } from './context/SettingsContext';` |
| `/src/App.tsx` | Line 23 | **Called/Rendered** | `<SettingsProvider>` |

### Entity: `useSettingsContext`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/context/SettingsContext.tsx` | Line 135 | **Exported** | `export const useSettingsContext = () => { ... }` |
| `/src/hooks/useSettings.ts` | Line 1 | **Imported** | `import { useSettingsContext } from '../context/SettingsContext';` |
| `/src/hooks/useSettings.ts` | Line 6 | **Called/Invoked** | `return useSettingsContext();` |

### Entity: `getSmoothPath` (Mathematical Brush Vector Converter)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/drawingUtils.ts` | Line 1 | **Exported** | `export const getSmoothPath = (points: {x: number, y: number}[], smoothing: number = 50) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 2 | **Imported** | `import { getSmoothPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 125 | **Called/Invoked** | `d={getSmoothPath(currentPath, pencilSmoothing)}` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 4 | **Imported** | `import { getSmoothPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 468 | **Called/Invoked** | `<path d={getSmoothPath(item.points || [], item.smoothing ?? 20)} />` |

### Entity: `getArrowHeadPath`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/drawingUtils.ts` | Line 33 | **Exported** | `export const getArrowHeadPath = (start: ..., end: ...) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 2 | **Imported** | `import { ..., getArrowHeadPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 145 | **Called/Invoked** | `d={getArrowHeadPath(startPoint, currentPath[currentPath.length - 1], ...)}` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 4 | **Imported** | `import { ..., getArrowHeadPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 402 | **Called/Invoked** | `d={getArrowHeadPath(start, end, arrowSize, headStyle, controlPoint)}` |

### Entity: `getArrowTailPath`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/drawingUtils.ts` | Line 65 | **Exported** | `export const getArrowTailPath = (start: ..., end: ...) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 2 | **Imported** | `import { ..., getArrowTailPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx" ` | Line 4 | **Imported** | `import { ..., getArrowTailPath, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 413 | **Called/Invoked** | `d={getArrowTailPath(start, end, arrowSize, tailStyle, controlPoint)}` |

### Entity: `getShortenedLineEnd`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/drawingUtils.ts` | Line 124 | **Exported** | `export const getShortenedLineEnd = (start: ..., end: ...) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 2 | **Imported** | `import { ..., getShortenedLineEnd, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Lines 138-139 | **Called/Invoked** | `x2={getShortenedLineEnd(...).x} y2={getShortenedLineEnd(...).y}` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 4 | **Imported** | `import { ..., getShortenedLineEnd, ... } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 244 | **Called/Invoked** | `const shortenedEnd = headStyle !== 'none' ? getShortenedLineEnd(...) : end;` |

### Entity: `getShortenedLineStart`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/drawingUtils.ts" ` | Line 96 | **Exported** | `export const getShortenedLineStart = (start: ..., end: ...) => { ... }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/DrawingOverlay.tsx` | Line 2 | **Imported** | `import { ..., getShortenedLineStart } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 4 | **Imported** | `import { ..., getShortenedLineStart } from '../../../../utils/drawingUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 245 | **Called/Invoked** | `const shortenedStart = tailStyle !== 'none' ? getShortenedLineStart(...) : start;` |

### Entity: `getReadableTextColor` (WCAG Contrast Optimizer)
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/colorUtils.ts` | Line 67 | **Exported** | `export function getReadableTextColor(bgHex: string): { color: string; contrast: number; textShadow: string }` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 3 | **Imported** | `import { getReadableTextColor } from '../../../../utils/colorUtils';` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Lines 70-71 | **Called/Invoked** | `color: getReadableTextColor(item.color || '#fffbeb').color` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Lines 93-94 | **Called/Invoked** | `color: getReadableTextColor(item.color || '#fffbeb').color` |
| `/src/components/Projects/ProjectDetails/MoodboardPage/MoodboardItem.tsx` | Line 168 | **Called/Invoked** | `const { color: textColor, textShadow } = getReadableTextColor(color);` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 5 | **Imported** | `import { ..., getReadableTextColor, ... } from '../../../../utils/colorUtils';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 387 | **Called/Invoked** | `const caretColor = getReadableTextColor(hexBg);` |

### Entity: `ensureContrast`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/colorUtils.ts` | Line 137 | **Exported** | `export function ensureContrast(textColor: string, bgColor: string, minRatio: number = 4.5): string` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 5 | **Imported** | `import { ..., ensureContrast, ... } from '../../../../utils/colorUtils';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 447 | **Called/Invoked** | `htmlEl.style.color = ensureContrast(hexText, hexBg);` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 774 | **Called/Invoked** | `finalColor = ensureContrast(color, currentBg);` |

### Entity: `createHighlightColor`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/colorUtils.ts` | Line 154 | **Exported** | `export function createHighlightColor(bgColor: string): { ... }` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 5 | **Imported** | `import { createHighlightColor, ... } from '../../../../utils/colorUtils';` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 5 | **Imported** | `import { createHighlightColor, ... } from '../../../utils/colorUtils';` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 82 | **Called/Invoked** | `onSelect(createHighlightColor(color));` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 115 | **Called/Invoked** | `onSelect(createHighlightColor(color));` |

### Entity: `getLuminance`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/colorUtils.ts` | Line 39 | **Exported** | `export function getLuminance(hex: string): number` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 5 | **Imported** | `import { ..., getLuminance } from '../../../../utils/colorUtils';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 1136 | **Called/Invoked** | `getLuminance(commandStates.foreColor) > 0.85` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 1173 | **Called/Invoked** | `getLuminance(commandStates.hiliteColor) > 0.85` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 11 | **Imported** | `import { ..., getLuminance } from '../../../utils/colorUtils';` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 122 | **Called/Invoked** | `getLuminance(color) > 0.85 ? ...` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 379 | **Called/Invoked** | `getLuminance(hex) > 0.85 ? ...` |

### Entity: `rgbToHexStr`
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/colorUtils.ts` | Line 253 | **Exported** | `export function rgbToHexStr(rgb: string): string | null` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 5 | **Imported** | `import { ..., rgbToHexStr, ... } from '../../../../utils/colorUtils';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 291 | **Called/Invoked** | `const hex = rgbToHexStr(foundColor);` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 386 | **Called/Invoked** | `const hexBg = rgbToHexStr(foundBg) || '#FFFFFF';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 444 | **Called/Invoked** | `const hexBg = rgbToHexStr(bgColor);` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 445 | **Called/Invoked** | `const hexText = rgbToHexStr(textColor);` |

---

## 4. Static Code Analysis: Pre-Seeded & Standalone Expansion Modules

These are highly mature files designed as independent utilities or modular visual building blocks. They are defined and exported within the codebase, standing ready for future layout routes and third-party API hookups.

### Component/Utility: `BlockEditor` (Brand Style Builder)
*The BlockEditor system provides interactive tools to test client stylesheets. It is pre-built, and its highly optimized inner **`ColorPicker`** represents a major cross-file module loaded in the notes platform editor.*
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/BlockEditor/BlockEditor.tsx` | Line 9 | **Exported** | `export const BlockEditor: React.FC = () => { ... }` |
| `/src/components/BlockEditor/ColorPicker/ColorPicker.tsx` | Line 46 | **Exported** | `export const ColorPicker: React.FC<ColorPickerProps> = ({ onSelect, onClose, activeColor }) => { ... }` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 4 | **Imported** | `import { ColorPicker } from '../../../BlockEditor/ColorPicker/ColorPicker';` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 1142 | **Called/Rendered** | `<ColorPicker onSelect={...} onClose={...} />` |
| `/src/components/Projects/ProjectDetails/NotesPage/NotesPage.tsx` | Line 1181 | **Called/Rendered** | `<ColorPicker onSelect={...} onClose={...} />` |

### Component: `FilesList` (Task references file tracker drawer)
*FilesList is a standalone module designed to list active project attachments side-by-side with assignment rows.*
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/GlobalComponents/Pages/TaskPage/FilesList.tsx` | Line 7 | **Exported** | `export const FilesList: React.FC<FilesListProps> = ({ onTabChange }) => { ... }` |

### Component: `FileCard` (Interactive File Assets Grid Cell)
*FileCard is a beautiful layout card ready to render interactive elements like downloads or renaming, serving as the foundational item structure for the assets pipeline.*
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/components/Projects/ProjectDetails/Files/FileCard.tsx` | Line 13 | **Exported** | `export const FileCard: React.FC<FileCardProps> = ({ file, onRename, onMove, onDelete, onClick, getFileIcon }) => { ... }` |

### Utility: `getFileIcon` (File MIME-type parser mapping)
*A utility module mapping file extensions and formats (PDF, ZIP, DOCX) to Lucide workspace indicators.*
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/utils/fileIcons.ts` | Line 1 | **Exported** | `export const getFileIcon = (fileName: string) => { ... }` |

### Classes: `CanvasEngine`, `ProjectManager`, `UndoManager`
*Pre-built, performance-critical modules loaded with core mathematical drawing renderers and coordinate calculation handlers. They are designed to extend our canvas brush path caching during active moodboard operations.*
| File Path | Line Number | Action Type | Code Context / Snippet |
| :--- | :--- | :--- | :--- |
| `/src/engine/CanvasEngine.ts` | Line 13 | **Exported** | `export class CanvasEngine { ... }` |
| `/src/engine/ProjectManager.ts` | Line 1 | **Exported** | `export class ProjectManager { ... }` |
| `/src/engine/UndoManager.ts` | Line 8 | **Exported** | `export class UndoManager { ... }` |
