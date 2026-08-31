import React, { useState, useEffect } from 'react';
import { LeadTable } from './LeadTable';
import { useLeadStore } from '../../stores/leadStore';
import { confirm } from '../../stores/confirmStore';
import { PillTab } from '../GlobalComponents/PillTab';
import { Plus, Mail, BookUser, Filter, Search, UserPlus, Settings, Bot } from 'lucide-react';
import { ImportModal } from './ImportModal';
import { EmailComposerModal } from './EmailComposerModal';
import { AddLeadModal } from './AddLeadModal';

interface LeadsPageProps {
  onNavigate?: (view: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onNavigate }) => {
  const {
    leads,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addLead,
    selectedLeadIds,
    bulkUpdateLeads,
    bulkPromoteLeads,
    bulkDeleteLeads,
    deselectAllLeads
  } = useLeadStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkMailModalOpen, setIsBulkMailModalOpen] = useState(false);
  const [singleMailLeadId, setSingleMailLeadId] = useState<string | null>(null);

  // Derive the shared status of all selected leads (blank if mixed)
  const safeLeads = leads || [];
  const selectedLeads = safeLeads.filter(l => (selectedLeadIds || []).includes(l.id));
  const uniqueStatuses = Array.from(new Set(selectedLeads.map(l => l.status)));
  const sharedStatus = uniqueStatuses.length === 1 ? uniqueStatuses[0] : '';

  const [zoom, setZoom] = useState(() => {
    try {
      const saved = localStorage.getItem('flowstudio-leads-zoom');
      return saved ? parseFloat(saved) : 1.0;
    } catch (e) {
      return 1.0;
    }
  });

  useEffect(() => {
    localStorage.setItem('flowstudio-leads-zoom', zoom.toString());
  }, [zoom]);

  // Safe Arrays Guardrail (kept for stats below)

  // Statistics summaries
  const totalCount = safeLeads.length;
  const newCount = safeLeads.filter(l => l.status === 'New').length;
  const contactedCount = safeLeads.filter(l => l.status === 'Contacted').length;
  const proposalCount = safeLeads.filter(l => l.status === 'Proposal Sent').length;
  const archivedCount = safeLeads.filter(l => l.status === 'Archived').length;

  const handleCreateNewClick = () => {
    setIsAddModalOpen(true);
  };

  // Nav pill categories
  const statuses: { value: typeof statusFilter; label: string; count: number }[] = [
    { value: 'All', label: 'All Leads', count: totalCount },
    { value: 'New', label: 'New', count: newCount },
    { value: 'Contacted', label: 'Contacted', count: contactedCount },
    { value: 'Proposal Sent', label: 'Proposal Sent', count: proposalCount },
    { value: 'Archived', label: 'Archived', count: archivedCount }
  ];

  return (
    <div className="flex flex-col h-full bg-[#fcfdfd] overflow-hidden relative">

      {/* Header Banner */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-2 w-1/3">
          <BookUser className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Leads Database Manager</h2>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative group w-full max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              placeholder="Search leads directory..."
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
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-1/3">

          <button
            onClick={() => onNavigate?.('email-drafts')}
            className="text-black hover:text-slate-800 transition-colors outline-none shrink-0 flex items-center justify-center p-1"
            title="Email Drafts"
          >
            <Settings className="w-[22px] h-[22px] shrink-0" />
          </button>

          <button
            onClick={() => onNavigate?.('lead-generator')}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-2 outline-none border border-indigo-200 shrink-0 cursor-pointer"
          >
            <Bot className="w-4 h-4 shrink-0 text-indigo-600" />
            Lead Scraper
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-800 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-2 outline-none border border-slate-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            Import Leads
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 outline-none border border-slate-950 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            Add Lead
          </button>
        </div>
      </header>

      {/* LeadTable container content */}
      <section className="flex-1 flex flex-col min-h-0 bg-white pl-8 pr-0 pt-6">

        {/* Nav Pill Group categories switch filters */}
        <section className="mb-6 shrink-0 flex items-center bg-white/50 pr-8">

          {/* Signature Nav Pill Switch Wrapper */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {statuses.map((tab) => (
              <PillTab
                key={tab.value}
                label={tab.label}
                isActive={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                counter={tab.count}
              />
            ))}
          </div>
        </section>

        <LeadTable
          zoom={zoom}
          onZoomChange={setZoom}
          onMailClick={(id) => setSingleMailLeadId(id)}
        />
      </section>

      {/* Floating Bulk Action Toolbar */}
      {selectedLeadIds && selectedLeadIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in shadow-2xl border border-white/10 bg-slate-950 backdrop-blur-md text-white rounded-2xl px-4 py-2.5 flex items-center gap-3">
          {/* Selected count */}
          <span className="bg-blue-600 text-white font-mono px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0">
            {selectedLeadIds.length} Selected
          </span>

          <div className="w-px h-5 bg-white/15 shrink-0" />

          {/* Set Status */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">Set Status</span>
            <div className="relative">
              <select
                value={sharedStatus}
                onChange={(e) => {
                  if (e.target.value) {
                    bulkUpdateLeads(selectedLeadIds, { status: e.target.value as any });
                  }
                }}
                className="appearance-none bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white/30 min-w-[120px]"
              >
                <option value="" disabled hidden />
                <option value="New" className="text-slate-800 bg-white font-semibold">New</option>
                <option value="Contacted" className="text-slate-800 bg-white font-semibold">Contacted</option>
                <option value="Proposal Sent" className="text-slate-800 bg-white font-semibold">Proposal Sent</option>
                <option value="Archived" className="text-slate-800 bg-white font-semibold">Archived</option>
              </select>
              {/* custom arrow */}
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-white/15 shrink-0" />

          <button
            onClick={() => setIsBulkMailModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            Bulk Mail
          </button>

          <div className="w-px h-5 bg-white/15 shrink-0" />

          <button
            onClick={async () => {
              const ok = await confirm.show({
                title: 'Convert Leads to Clients?',
                message: `Convert ${selectedLeadIds.length} selected leads to Active Clients?`,
                type: 'info',
                confirmText: 'Convert'
              });
              if (ok) {
                bulkPromoteLeads(selectedLeadIds);
              }
            }}
            className="bg-white hover:bg-white/90 text-black font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            Convert to Client
          </button>

          <button
            onClick={async () => {
              const ok = await confirm.danger(
                `Delete ${selectedLeadIds.length} Leads?`,
                'These leads will be deleted from the database.'
              );
              if (ok) {
                bulkDeleteLeads(selectedLeadIds);
              }
            }}
            className="bg-red-500 hover:bg-red-400 text-white font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
            Delete
          </button>

          <button
            onClick={deselectAllLeads}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="Clear Selection"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Import / Manual Entry Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(importedLeads) => {
          // 1. Add all imported leads
          importedLeads.forEach(lead => addLead(lead));

          // 2. Automatically add columns that have imported data and aren't visible
          const columnsInStore = useLeadStore.getState().columns;
          const currentColumnIds = new Set(columnsInStore.map(c => c.id));

          const potentialColumns = [
            { id: 'company', title: 'Company' },
            { id: 'estimated_value', title: 'Forecast Value' },
            { id: 'source', title: 'Origin Source' },
            { id: 'tags', title: 'Classification Tags' }
          ];

          potentialColumns.forEach(col => {
            if (!currentColumnIds.has(col.id)) {
              const hasData = importedLeads.some(lead => {
                const val = (lead as any)[col.id];
                return val !== undefined && val !== null && val !== '' && (Array.isArray(val) ? val.length > 0 : true);
              });
              if (hasData) {
                useLeadStore.getState().addColumn(col.id, col.title);
              }
            }
          });
        }}
        onAddManual={handleCreateNewClick}
      />

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {isBulkMailModalOpen && selectedLeadIds.length > 0 && (
        <EmailComposerModal
          onClose={() => setIsBulkMailModalOpen(false)}
          leadIds={selectedLeadIds}
          onSuccess={() => {
            setIsBulkMailModalOpen(false);
            deselectAllLeads();
          }}
        />
      )}

      {singleMailLeadId && (
        <EmailComposerModal
          onClose={() => setSingleMailLeadId(null)}
          leadIds={[singleMailLeadId]}
          onSuccess={() => {
            setSingleMailLeadId(null);
          }}
        />
      )}

    </div>
  );
};
export default LeadsPage;
