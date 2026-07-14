import React, { useState, useEffect } from 'react';
import { useTrashStore, TrashItemType, TrashItem } from '../../stores/trashStore';
import { useSettings } from '../../hooks/useSettings';
import { PillTab } from '../GlobalComponents/PillTab';
import { Database, Trash2, Settings2, FolderKanban, Users, CheckSquare, Briefcase, FileUser, Search } from 'lucide-react';
import { DataLocationTab } from './DataLocationTab';

import {
  TrashProjectGrid,
  TrashTeamGrid,
  TrashLeadTable,
  TrashClientGrid,
  TrashTaskTable
} from './TrashViews';

import { ProjectDetailsLayout } from '../Projects/ProjectDetails/ProjectDetailsLayout';
import { OverviewPage } from '../Projects/ProjectDetails/OverviewPage/OverviewPage';
import { TaskPage } from '../GlobalComponents/Pages/TaskPage/TaskPage';
import { FilesPage } from '../Projects/ProjectDetails/Files/FilesPage';
import { NotesPage } from '../Projects/ProjectDetails/NotesPage/NotesPage';
import { MoodboardPage } from '../Projects/ProjectDetails/MoodboardPage/MoodboardPage';
import { ClientDetailsPage } from '../Clients/ClientsDetails/ClientDetailsPage';
import { MemberDetailsPage } from '../Team/MemberDetailsPage';
import { useProjectStore } from '../../stores/projectStore';
import { useClientStore } from '../../stores/clientStore';
import { useTeamStore } from '../../stores/teamStore';

export const DataPage: React.FC = () => {
  const { trashItems, restoreItem, permanentlyDeleteItem, emptyTrash } = useTrashStore();
  const { settings, updateSettings } = useSettings();
  const [filterType, setFilterType] = useState<TrashItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'location' | 'trash'>('trash');

  const [viewingItem, setViewingItem] = useState<TrashItem | null>(null);
  const [projectTab, setProjectTab] = useState<'overview' | 'tasks' | 'files' | 'notes' | 'moodboard'>('overview');

  useEffect(() => {
    let originalCurrentProject: any = null;
    let originalSelectedClientId: any = null;

    if (viewingItem) {
      if (viewingItem.type === 'project') {
        originalCurrentProject = useProjectStore.getState().currentProject;
        useProjectStore.setState(s => ({ projects: [...s.projects, viewingItem.data], currentProject: viewingItem.data }));
      } else if (viewingItem.type === 'client') {
        originalSelectedClientId = useClientStore.getState().selectedClientId;
        useClientStore.setState(s => ({ clients: [...s.clients, viewingItem.data], selectedClientId: viewingItem.data.id }));
      } else if (viewingItem.type === 'team-member') {
        useTeamStore.setState(s => ({ members: [...s.members, viewingItem.data] }));
      }
    }

    return () => {
      if (viewingItem) {
        if (viewingItem.type === 'project') {
          useProjectStore.setState(s => ({ projects: s.projects.filter(p => p.id !== viewingItem.data.id), currentProject: originalCurrentProject || s.currentProject }));
        } else if (viewingItem.type === 'client') {
          useClientStore.setState(s => ({ clients: s.clients.filter(c => c.id !== viewingItem.data.id), selectedClientId: originalSelectedClientId || s.selectedClientId }));
        } else if (viewingItem.type === 'team-member') {
          useTeamStore.setState(s => ({ members: s.members.filter(m => m.id !== viewingItem.data.id) }));
        }
      }
    };
  }, [viewingItem]);

  if (viewingItem) {
    if (viewingItem.type === 'project') {
      return (
        <div className="h-full w-full bg-white flex flex-col relative">
          <ProjectDetailsLayout
            onBack={() => setViewingItem(null)}
            currentTab={projectTab}
            onTabChange={(tab) => setProjectTab(tab as any)}
          >
            {projectTab === 'overview' && <OverviewPage />}
            {projectTab === 'tasks' && <TaskPage onTabChange={(tab) => setProjectTab(tab as any)} />}
            {projectTab === 'files' && <FilesPage onTabChange={(tab) => setProjectTab(tab as any)} />}
            {projectTab === 'notes' && <NotesPage onTabChange={(tab) => setProjectTab(tab as any)} onFullScreenToggle={() => { }} />}
            {projectTab === 'moodboard' && <MoodboardPage onTabChange={(tab) => setProjectTab(tab as any)} onEditSidebarToggle={() => { }} />}
          </ProjectDetailsLayout>
        </div>
      );
    } else if (viewingItem.type === 'client') {
      return (
        <div className="h-full w-full bg-white flex flex-col relative">
          <ClientDetailsPage onBack={() => setViewingItem(null)} />
        </div>
      );
    } else if (viewingItem.type === 'team-member') {
      return (
        <div className="h-full w-full bg-white flex flex-col relative">
          <MemberDetailsPage memberId={viewingItem.data.id} onBack={() => setViewingItem(null)} />
        </div>
      );
    }
  }

  const retentionDays = settings.trashSettings?.retentionDays ?? 30;

  const handleRetentionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      trashSettings: {
        ...settings.trashSettings,
        retentionDays: parseInt(e.target.value, 10)
      }
    });
  };

  const safeTrashItems = (trashItems || []).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projects = safeTrashItems.filter(i => i.type === 'project');
  const clients = safeTrashItems.filter(i => i.type === 'client');
  const leads = safeTrashItems.filter(i => i.type === 'lead');
  const tasks = safeTrashItems.filter(i => i.type === 'task');
  const teamMembers = safeTrashItems.filter(i => i.type === 'team-member');

  const pillTabs: { value: TrashItemType | 'all'; label: string; count: number; icon: string }[] = [
    { value: 'all', label: 'All Items', count: safeTrashItems.length, icon: 'apps' },
    { value: 'project', label: 'Projects', count: projects.length, icon: 'folder' },
    { value: 'client', label: 'Clients', count: clients.length, icon: 'domain' },
    { value: 'lead', label: 'Leads', count: leads.length, icon: 'person' },
    { value: 'task', label: 'Tasks', count: tasks.length, icon: 'check_circle' },
    { value: 'team-member', label: 'Team', count: teamMembers.length, icon: 'group' },
  ];

  // Helper to render section headers in 'All' view
  const SectionHeader = ({ title, icon: Icon, count }: { title: string, icon: any, count: number }) => (
    <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0 pb-2 border-b border-slate-100">
      <Icon className="size-4 text-slate-400" />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{count}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7] overflow-hidden relative">

      {/* Header Banner */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4 w-auto lg:w-1/3">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-slate-900 shrink-0" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Data Management</h2>
          </div>

          {/* Main Tab Switcher (Segmented Control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/60 rounded-xl shrink-0">
            <button
              onClick={() => setActiveMainTab('trash')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeMainTab === 'trash'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Trash Bin
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeMainTab === 'trash' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                {trashItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveMainTab('location')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeMainTab === 'location'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">folder_shared</span>
              Data Location
            </button>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center min-w-0">
          {activeMainTab === 'trash' && (
            <div className="relative group w-full max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input
                type="text"
                placeholder="Search trash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center hover:text-slate-700 text-slate-400"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-auto lg:w-1/3">
          {activeMainTab === 'trash' && (
            <>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-[34px] shrink-0 shadow-sm">
                <Settings2 className="size-3.5 text-slate-500" />
                <label className="text-[11px] font-bold text-slate-700 tracking-wide uppercase">Auto-Delete:</label>
                <select
                  value={retentionDays}
                  onChange={handleRetentionChange}
                  className="bg-transparent text-slate-900 text-xs font-bold outline-none cursor-pointer border-none py-0 pl-1 pr-0"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              <button
                onClick={emptyTrash}
                disabled={trashItems.length === 0}
                className="bg-red-50 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-red-600 border border-red-200 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-2 outline-none shrink-0 cursor-pointer"
              >
                <Trash2 className="size-3.5 shrink-0" />
                Empty Trash
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col min-h-0 bg-[#f5f5f7] px-8 pt-6">

        {activeMainTab === 'location' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-8 px-8 pb-10">
            <DataLocationTab />
          </div>
        ) : (
          <>
            {/* Nav Pill Group categories filter */}
            <section className="mb-6 shrink-0 flex items-center border-b border-slate-100/70 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {pillTabs.map((tab) => (
                  <PillTab
                    key={tab.value}
                    label={tab.label}
                    isActive={filterType === tab.value}
                    onClick={() => setFilterType(tab.value)}
                    counter={tab.count}
                    icon={tab.icon}
                  />
                ))}
              </div>
            </section>

            {/* Dynamic Trash UI Rendering */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-8 px-8 pb-10">
              {safeTrashItems.length === 0 || (filterType !== 'all' && safeTrashItems.filter(i => i.type === filterType).length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="size-16 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center mb-4">
                    <Trash2 className="size-6 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700 mb-1">Trash is empty</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-sm">
                    {filterType === 'all'
                      ? "Deleted items will appear here before being permanently removed."
                      : `No deleted ${filterType}s found in the trash.`}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">

                  {/* Projects */}
                  {(filterType === 'all' || filterType === 'project') && projects.length > 0 && (
                    <div>
                      {filterType === 'all' && <SectionHeader title="Deleted Projects" icon={FolderKanban} count={projects.length} />}
                      <TrashProjectGrid
                        items={filterType === 'all' ? projects.slice(0, 4) : projects}
                        onRestore={restoreItem}
                        onDelete={permanentlyDeleteItem}
                        onView={setViewingItem}
                      />
                      {filterType === 'all' && projects.length > 4 && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => setFilterType('project')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-sm"
                          >
                            See more
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clients */}
                  {(filterType === 'all' || filterType === 'client') && clients.length > 0 && (
                    <div className={filterType === 'all' ? 'mt-6' : ''}>
                      {filterType === 'all' && <SectionHeader title="Deleted Clients" icon={Briefcase} count={clients.length} />}
                      <TrashClientGrid
                        items={filterType === 'all' ? clients.slice(0, 5) : clients}
                        onRestore={restoreItem}
                        onDelete={permanentlyDeleteItem}
                        onView={setViewingItem}
                      />
                    </div>
                  )}

                  {/* Leads */}
                  {(filterType === 'all' || filterType === 'lead') && leads.length > 0 && (
                    <div className={filterType === 'all' ? 'mt-6' : ''}>
                      {filterType === 'all' && <SectionHeader title="Deleted Leads" icon={FileUser} count={leads.length} />}
                      <TrashLeadTable
                        items={filterType === 'all' ? leads.slice(0, 5) : leads}
                        onRestore={restoreItem}
                        onDelete={permanentlyDeleteItem}
                      />
                    </div>
                  )}

                  {/* Tasks */}
                  {(filterType === 'all' || filterType === 'task') && tasks.length > 0 && (
                    <div className={filterType === 'all' ? 'mt-6' : ''}>
                      {filterType === 'all' && <SectionHeader title="Deleted Tasks" icon={CheckSquare} count={tasks.length} />}
                      <TrashTaskTable items={tasks} onRestore={restoreItem} onDelete={permanentlyDeleteItem} />
                    </div>
                  )}

                  {/* Team Members */}
                  {(filterType === 'all' || filterType === 'team-member') && teamMembers.length > 0 && (
                    <div className={filterType === 'all' ? 'mt-6' : ''}>
                      {filterType === 'all' && <SectionHeader title="Deleted Team Members" icon={Users} count={teamMembers.length} />}
                      <TrashTeamGrid
                        items={filterType === 'all' ? teamMembers.slice(0, 5) : teamMembers}
                        onRestore={restoreItem}
                        onDelete={permanentlyDeleteItem}
                        onView={setViewingItem}
                      />
                    </div>
                  )}

                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
