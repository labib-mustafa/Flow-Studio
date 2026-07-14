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

      <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 transition-all duration-300 ${!isSidebarExpanded ? 'p-2 opacity-0 invisible' : 'p-8 opacity-100 visible'}`}>
        <div id="project-team-section">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 whitespace-nowrap">Project Team</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img alt="Team member" className="size-10 shrink-0 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB00QNyY2Bv2COapUhsSMilaHA3Tb5Pcbsihh_KNlb9LpcxAQn-kgEsHfYBNF1aB3jM5DjIvbCIImFMjKawloH9NDGrLsvhB9Druhw4uskfgEupWj-xUO1_O8kaT9aXPY_l0obQEArznbEJye6VBTtzm5Lzm6WXYVeXX9T27TuHqH1Ax_mXpBRvZXj5qytD0M385G5XM4u3bBqLZ1bp082zQwJm1cXKlKmHDtVPX6fdplFNM0d-3G1zXw-BXd7z7SsRoWoVp8Z7WPM"/>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">Sarah Jenkins</p>
                <p className="text-xs text-slate-500 truncate">Project Lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <img alt="Team member" className="size-10 shrink-0 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJHHDBvAhb68nyWvJRCFANR2Yi6ZSU5pnLftuW2mP93YBAQh5JYt3nmEbM7lLu0_P5VWvu8DtLn82jY-7Yz3h3Hv8XMSd_72sXuX3fy6UPhbZKWYbPmLHvumdkh_G8guoFfjc76vtA9-wXdPZB9x_17EnKB4SRoQYLPDCZvbVFsrxkUVs5bb_umwsJDpYzxaWU8DHvUjp7WboQE7TFzFM09L9YTCA5gvN6LDooUfm_w8Tf7sTPZZoaVMFXSn45YFxs7f58UKeKDXc"/>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">Marcus Chen</p>
                <p className="text-xs text-slate-500 truncate">Art Director</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="project-events-section">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 whitespace-nowrap">Upcoming Events</h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-primary mb-1">Oct 20, 10:00 AM</p>
            <p className="text-sm font-bold text-slate-900">Design Review Sync</p>
            <p className="text-xs text-slate-500 mt-2">Final presentation of the new color palette to Apex stakeholders.</p>
          </div>
        </div>
        
        <div id="project-help-section" className="mt-auto">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs font-bold text-primary">Need help?</p>
            <p className="text-xs text-slate-600 mt-1">Check out our design system documentation or contact support.</p>
            <a className="inline-block mt-3 text-xs font-black text-primary hover:underline" href="/settings">Settings →</a>
          </div>
        </div>
      </div>
      
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

