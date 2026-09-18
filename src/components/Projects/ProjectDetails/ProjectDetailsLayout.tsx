import React from 'react';
import { ProjectHeader } from './GlobalComponents/ProjectHeader';

interface ProjectDetailsLayoutProps {
  onBack: () => void;
  currentTab: 'overview' | 'tasks' | 'files' | 'notes' | 'moodboard';
  onTabChange: (tab: 'overview' | 'tasks' | 'files' | 'notes' | 'moodboard') => void;
  children: React.ReactNode;
  isSidebarExpanded?: boolean;
  onSidebarToggle?: (expanded: boolean) => void;
}

export const ProjectDetailsLayout: React.FC<ProjectDetailsLayoutProps> = ({ onBack, currentTab, onTabChange, children, isSidebarExpanded = false, onSidebarToggle }) => {
  return (
    <div id="project-details-layout" className="flex h-full bg-white overflow-hidden relative">
      <main id="project-main-content" className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col">
        <div id="project-content-wrapper" className="w-full h-full flex flex-col">
          {/* Global Header */}
          <ProjectHeader currentTab={currentTab} onTabChange={onTabChange} onBack={onBack} />

          {/* Tab Content gets injected here - Instantaneous */}
          <div id="project-tab-content" className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
};
