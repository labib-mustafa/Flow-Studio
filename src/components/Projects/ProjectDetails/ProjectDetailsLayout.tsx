import React from 'react';
import { ProjectHeader } from './GlobalComponents/ProjectHeader';
import { motion, AnimatePresence } from 'motion/react';

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

          {/* Tab Content gets injected here */}
          <div id="project-tab-content" className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col overflow-hidden h-full min-w-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
};
