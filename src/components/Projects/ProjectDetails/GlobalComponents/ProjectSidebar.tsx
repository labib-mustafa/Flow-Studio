import React, { useState } from 'react';

interface ProjectSidebarProps {
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isExpanded = false, onToggle }) => {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isSidebarExpanded = onToggle ? isExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isSidebarExpanded);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <aside id="project-sidebar" className={`h-full bg-white border-l border-slate-200 flex flex-col relative transition-all duration-300 animate-slide-in-right ${!isSidebarExpanded ? 'w-12' : 'w-80'}`}>
      <button
        onClick={handleToggle}
        className="absolute top-1/2 -translate-y-1/2 -left-3 z-[99999] flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-colors"
      >
        <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${!isSidebarExpanded ? 'rotate-180' : ''}`}>chevron_right</span>
      </button>


      {!isSidebarExpanded && (
        <div
          className="absolute inset-0 flex flex-col items-center pt-8 gap-6 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => handleToggle()}
        >
          <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors" title="Project Team">groups</span>
          <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors" title="Upcoming Events">event</span>
          <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors mt-auto mb-8" title="Help">help</span>
        </div>
      )}
    </aside>
  );
};

