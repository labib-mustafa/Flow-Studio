/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Projects } from './components/Projects/ProjectOverview/Projects';
import { NewProject } from './components/Projects/NewProject/NewProject';
import { ProjectDetailsLayout } from './components/Projects/ProjectDetails/ProjectDetailsLayout';
import { TaskPage } from './components/GlobalComponents/Pages/TaskPage/TaskPage';
import { FilesPage } from './components/Projects/ProjectDetails/Files/FilesPage';
import { NotesPage } from './components/Projects/ProjectDetails/NotesPage/NotesPage';
import { MoodboardPage } from './components/Projects/ProjectDetails/MoodboardPage/MoodboardPage';
import { OverviewPage } from './components/Projects/ProjectDetails/OverviewPage/OverviewPage';
import { ClientsPage } from './components/Clients/ClientsPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { DevSettingsWorkspace } from './components/Settings/DevSettingsWorkspace';
import { SettingsProvider } from './context/SettingsContext';
import { useProjectStore } from './stores/projectStore';
import { useTeamStore } from './stores/teamStore';

import { LeadsPage } from './components/Leads/LeadsPage';
import { ApifyLeadGeneratorPage } from './components/Leads/ApifyLeadGeneratorPage';
import { EmailDraftsPage } from './components/Leads/EmailDraftsPage';
import { SentEmailsPage } from './components/Leads/SentEmailsPage';
import { TeamPage } from './components/Team/TeamPage';
import { MemberDetailsPage } from './components/Team/MemberDetailsPage';
import { DataPage } from './components/Data/DataPage';
import { BillingPage } from './components/Billing/BillingPage';
import { ComingSoon } from './components/GlobalComponents/ComingSoon';
import { NewInvoicePage } from './components/Billing/NewInvoicePage';
import { ReportsPage } from './components/Reports/ReportsPage';
import { TimePage } from './components/Time/TimePage';
import { CalendarPage } from './components/Calendar/CalendarPage';
import { useTrashStore } from './stores/trashStore';
import { useSettings } from './hooks/useSettings';
import { TabbedFileExplorer } from './components/GlobalComponents/FileExplorer/TabbedFileExplorer';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './components/Auth/LoginPage';
import { useDevStore } from './stores/devStore';
import { SplashScreenModal } from './components/GlobalComponents/SplashScreenModal';
import { Sparkles } from 'lucide-react';
import { useAppReady } from './hooks/useAppReady';
import { toast } from './stores/toastStore';
import { ToastContainer } from './components/GlobalComponents/ToastContainer';
import { ConfirmDialogModal } from './components/GlobalComponents/ConfirmDialogModal';
import { PromptModal } from './components/GlobalComponents/PromptModal';
import { CommandPalette } from './components/GlobalComponents/CommandPalette/CommandPalette';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const disableLogin = useDevStore((state) => state.flags.disableLogin);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Temporarily disabled login page by user request
  if (false && !user && !disableLogin) {
    return <LoginPage />;
  }

  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

function AppContent() {
  const appReady = useAppReady();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [userSidebarPreference, setUserSidebarPreference] = useState(false);
  const [isNotesFullScreen, setIsNotesFullScreen] = useState(false);
  const [hasAutoCollapsedNotes, setHasAutoCollapsedNotes] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedMemberIdForDetails, setSelectedMemberIdForDetails] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync currentView to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('last_viewed_page', currentView);
  }, [currentView]);

  const { settings } = useSettings();
  const currentProject = useProjectStore(state => state.currentProject);
  const cleanupExpiredItems = useTrashStore(state => state.cleanupExpiredItems);
  const isTrashHydrated = useTrashStore(state => state._hasHydrated);

  // Dynamic Apple Document Title
  useEffect(() => {
    let title = 'Flow Studio';
    if (currentView.startsWith('project-') && currentProject) {
      const projName = currentProject.title || currentProject.name || 'Project';
      const sub = currentView.replace('project-', '');
      const subTitle = sub.charAt(0).toUpperCase() + sub.slice(1);
      title = `${projName} • ${subTitle} — Flow Studio`;
    } else {
      const viewNames: Record<string, string> = {
        dashboard: 'Dashboard',
        projects: 'Projects',
        'new-project': 'New Project',
        clients: 'Clients',
        leads: 'Leads CRM',
        'lead-generator': 'Lead Scraper',
        team: 'Team Directory',
        'member-details': 'Team Member',
        files: 'File Explorer',
        calendar: 'Calendar',
        time: 'Time Tracking',
        billing: 'Billing & Invoices',
        'new-invoice': 'New Invoice',
        data: 'Data & Trash',
        settings: 'Settings',
        'dev-settings': 'Developer Settings',
      };
      const name = viewNames[currentView] || 'Studio';
      title = `${name} — Flow Studio`;
    }
    document.title = title;
  }, [currentView, currentProject]);

  // Auto-cleanup expired trash items on load, but ONLY after hydration completes
  useEffect(() => {
    if (isTrashHydrated && settings.trashSettings?.retentionDays !== undefined) {
      cleanupExpiredItems(settings.trashSettings.retentionDays);
    }
  }, [settings.trashSettings?.retentionDays, cleanupExpiredItems, isTrashHydrated]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K -> Spotlight Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Cmd+N / Ctrl+N -> New Project (only if not in an input/textarea)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setEditingProject(null);
          setCurrentView('new-project');
        }
      }
      
      // Cmd+, / Ctrl+, -> Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setCurrentView('settings');
      }

      // Escape -> close modals, or go back if in full screen notes
      if (e.key === 'Escape') {
        if (isNotesFullScreen) {
          setIsNotesFullScreen(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNotesFullScreen]);

  useEffect(() => {
    if (currentView === 'project-notes' && !hasAutoCollapsedNotes) {
      setIsProjectSidebarOpen(false);
      setHasAutoCollapsedNotes(true);
    } else if (currentView !== 'project-notes' && hasAutoCollapsedNotes) {
      setHasAutoCollapsedNotes(false);
    }
  }, [currentView, hasAutoCollapsedNotes]);

  // Block rendering until all critical stores are hydrated from disk
  if (!appReady) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-medium tracking-wide">Loading workspace…</span>
        </div>
      </div>
    );
  }

  const handleNotesFullScreen = (isFull: boolean) => {
    setIsNotesFullScreen(isFull);
    if (isFull) {
      setIsProjectSidebarOpen(false);
    } else {
      setIsProjectSidebarOpen(userSidebarPreference);
    }
  };

  const handleManualSidebarToggle = (isOpen: boolean) => {
    setIsProjectSidebarOpen(isOpen);
    setUserSidebarPreference(isOpen);
  };

  const handleEditSidebarToggle = (isEditSidebarOpen: boolean) => {
    if (isEditSidebarOpen) {
      setIsProjectSidebarOpen(false);
    } else {
      setIsProjectSidebarOpen(userSidebarPreference);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(view) => setCurrentView(view)}
            onProjectClick={(project) => {
              useProjectStore.getState().setCurrentProject(project);
              setCurrentView('project-overview');
            }}
            onNewProject={() => {
              setEditingProject(null);
              setCurrentView('new-project');
            }}
          />
        );
      case 'projects':
        return <Projects
          onNewProject={() => {
            setEditingProject(null);
            setCurrentView('new-project');
          }}
          onProjectClick={() => setCurrentView('project-overview')}
          onEditProject={(project) => {
            setEditingProject(project);
            setCurrentView('new-project');
          }}
        />;
      case 'new-project':
        return <NewProject
          project={editingProject}
          onBack={() => setCurrentView('projects')}
          onSave={(data) => {
            const { assignedMembers, ...projectData } = data;
            let projectId = editingProject?.id;
            if (editingProject && editingProject.id) {
              useProjectStore.getState().updateProject(editingProject.id, projectData);
              // Rename folder
              const isDesktop = (window as any).electronAPI?.isDesktop;
              if (isDesktop) {
                (window as any).electronAPI.projects.renameFolder(editingProject.id, projectData.title || projectData.name);
              } else {
                fetch('/api/projects/rename-folder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId: editingProject.id, newProjectName: projectData.title || projectData.name }),
                }).catch((err) => {
                  toast.error('Failed to rename project folder', 'Please check your connection and try again.');
                });
              }
            } else {
              projectId = Math.random().toString(36).substr(2, 9);
              useProjectStore.getState().addProject({
                ...projectData,
                id: projectId,
                image: '',
                category: '',
                status: projectData.status || 'Planning',
                statusColor: '',
                progress: 0,
                deadline: projectData.deadline || '',
                client: projectData.client || ''
              });

              // Create folder
              const isDesktop = (window as any).electronAPI?.isDesktop;
              if (isDesktop) {
                (window as any).electronAPI.projects.createFolder(projectId, projectData.title || projectData.name);
              } else {
                fetch('/api/projects/create-folder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId, projectName: projectData.title || projectData.name }),
                }).catch((err) => {
                  toast.error('Failed to create project folder', 'Please check your connection and try again.');
                });
              }
            }

            if (projectId) {
              const assignedList = Array.isArray(assignedMembers) ? assignedMembers : (assignedMembers ? [assignedMembers] : []);
              const { members, updateMember } = useTeamStore.getState();
              members.forEach(member => {
                const isAssigned = assignedList.includes(member.id);
                const currentProjects = member.assignedProjects || [];
                const hasProject = currentProjects.includes(projectId);

                if (isAssigned && !hasProject) {
                  updateMember(member.id, { assignedProjects: [...currentProjects, projectId] });
                } else if (!isAssigned && hasProject) {
                  updateMember(member.id, { assignedProjects: currentProjects.filter(id => id !== projectId) });
                }
              });
            }

            setCurrentView('projects');
          }}
        />;
      case 'project-overview':
        return (
          <ProjectDetailsLayout
            onBack={() => setCurrentView('projects')}
            currentTab="overview"
            onTabChange={(tab) => setCurrentView(`project-${tab}`)}
            isSidebarExpanded={isProjectSidebarOpen}
            onSidebarToggle={handleManualSidebarToggle}
          >
            <OverviewPage />
          </ProjectDetailsLayout>
        );
      case 'project-tasks':
        return (
          <ProjectDetailsLayout
            onBack={() => setCurrentView('projects')}
            currentTab="tasks"
            onTabChange={(tab) => setCurrentView(`project-${tab}`)}
            isSidebarExpanded={isProjectSidebarOpen}
            onSidebarToggle={handleManualSidebarToggle}
          >
            <TaskPage 
              projectId={currentProject?.id}
              onTabChange={(tab) => setCurrentView(`project-${tab}`)} 
            />
          </ProjectDetailsLayout>
        );
      case 'project-files':
        return (
          <ProjectDetailsLayout
            onBack={() => setCurrentView('projects')}
            currentTab="files"
            onTabChange={(tab) => setCurrentView(`project-${tab}`)}
            isSidebarExpanded={isProjectSidebarOpen}
            onSidebarToggle={handleManualSidebarToggle}
          >
            <FilesPage onTabChange={(tab) => setCurrentView(`project-${tab}`)} />
          </ProjectDetailsLayout>
        );
      case 'project-notes':
        return (
          <ProjectDetailsLayout
            onBack={() => setCurrentView('projects')}
            currentTab="notes"
            onTabChange={(tab) => setCurrentView(`project-${tab}`)}
            isSidebarExpanded={isProjectSidebarOpen}
            onSidebarToggle={handleManualSidebarToggle}
          >
            <NotesPage
              onTabChange={(tab) => setCurrentView(`project-${tab}`)}
              onFullScreenToggle={handleNotesFullScreen}
            />
          </ProjectDetailsLayout>
        );
      case 'project-moodboard':
        return (
          <ProjectDetailsLayout
            onBack={() => setCurrentView('projects')}
            currentTab="moodboard"
            onTabChange={(tab) => setCurrentView(`project-${tab}`)}
            isSidebarExpanded={isProjectSidebarOpen}
            onSidebarToggle={handleManualSidebarToggle}
          >
            <MoodboardPage
              onTabChange={(tab) => setCurrentView(`project-${tab}`)}
              onEditSidebarToggle={handleEditSidebarToggle}
            />
          </ProjectDetailsLayout>
        );
      case 'leads':
        return <LeadsPage onNavigate={(view) => setCurrentView(view)} />;
      case 'lead-generator':
        return <ApifyLeadGeneratorPage onNavigate={(view) => setCurrentView(view)} />;
      case 'email-drafts':
        return <EmailDraftsPage onBack={() => setCurrentView('leads')} />;
      case 'sent-emails':
        return <SentEmailsPage onBack={() => setCurrentView('leads')} />;
      case 'clients':
        return <ClientsPage
          onNewProject={(clientName) => {
            setEditingProject({ client: clientName });
            setCurrentView('new-project');
          }}
          onEditProject={(project) => {
            setEditingProject(project);
            setCurrentView('new-project');
          }}
          onProjectClick={(project) => {
            useProjectStore.getState().setCurrentProject(project);
            setCurrentView('project-overview');
          }}
        />;
      case 'team':
        return (
          <TeamPage
            onSelectMember={(memberId) => {
              setSelectedMemberIdForDetails(memberId);
              setCurrentView('member-details');
            }}
          />
        );
      case 'member-details':
        return (
          <MemberDetailsPage
            memberId={selectedMemberIdForDetails}
            onBack={() => setCurrentView('team')}
            onProjectClick={() => setCurrentView('project-overview')}
          />
        );
      case 'files':
        return (
          <TabbedFileExplorer sessionId="GLOBAL" rootPath="GLOBAL" />
        );
      case 'settings':
        return <SettingsPage />;
      case 'dev-settings':
        return <DevSettingsWorkspace />;
      case 'data':
        return <DataPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'time':
        return <TimePage />;
      case 'billing':
        return <BillingPage onNewInvoice={() => setCurrentView('new-invoice')} />;
      case 'new-invoice':
        return (
          <NewInvoicePage
            onBack={() => setCurrentView('billing')}
            onSave={() => setCurrentView('billing')}
          />
        );
      case 'reports':
        return (
          <ComingSoon
            title="Analytics & Reports"
            description="We are crafting beautiful, actionable insights for your agency. Advanced reporting is coming in the next major update."
          />
        );
      default:
        return <Projects
          onNewProject={() => setCurrentView('new-project')}
          onProjectClick={() => setCurrentView('project-overview')}
        />;
    }
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen flex transition-colors duration-300 font-sans overflow-hidden h-screen">
      {/* Sidebar Container */}
      <div className="h-full flex-shrink-0">
        <Sidebar
          activeTab={currentView.startsWith('project-') || currentView === 'new-project' ? 'projects' : currentView === 'member-details' ? 'team' : currentView}
          onTabChange={setCurrentView}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      </div>

      {/* Main Content Area - Instantaneous Navigation */}
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Global Toast, Confirm, Prompt & Spotlight Overlays */}
      <ToastContainer />
      <ConfirmDialogModal />
      <PromptModal />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        onNewProject={() => {
          setEditingProject(null);
          setCurrentView('new-project');
        }}
      />
    </div>
  );
}
