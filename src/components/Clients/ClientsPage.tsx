import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useClientStore, Client } from '../../stores/clientStore';
import { confirm } from '../../stores/confirmStore';
import { motion, AnimatePresence } from 'motion/react';
import { AddNewClientPage } from './AddNewClient/AddNewClientPage';
import { ClientDetailsPage } from './ClientsDetails/ClientDetailsPage';
import {
  Search,
  Bell,
  Users,
  UserPlus,
  Folder,
  Star,
  Hourglass,
  MoreHorizontal,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Edit,
  X,
  Eye,
  CheckCircle,
  Calendar,
  DollarSign,
  Briefcase,
  Share2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

import { PillTab } from '../GlobalComponents/PillTab';
import { EmptySearchState } from './EmptySearchState';

interface ClientsPageProps {
  onNewProject?: (clientName: string) => void;
  onEditProject?: (project: any) => void;
  onProjectClick?: (project: any) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  onNewProject,
  onEditProject,
  onProjectClick
}) => {
  const {
    clients,
    notes,
    selectedClientId,
    searchQuery,
    statusFilter,
    addClient,
    updateClient,
    deleteClient,
    selectClient,
    setSearchQuery,
    setStatusFilter,
    addNote,
    deleteNote,
    createInvoice
  } = useClientStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeMenuClient, setActiveMenuClient] = useState<string | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailViewTab, setDetailViewTab] = useState<'overview' | 'tasks' | 'files' | 'financials' | 'notes' | 'projects'>('overview');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Copy feedback state
  const [copyFeedback, setCopyFeedback] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Form states
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBillingEmail, setNewBillingEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Prospect' | 'Inactive'>('Active');

  const [newWebsites, setNewWebsites] = useState('');
  const [newSocialProfiles, setNewSocialProfiles] = useState('');
  const [newTypography, setNewTypography] = useState('');
  const [newColorPalette, setNewColorPalette] = useState('');
  const [newPreferStylesText, setNewPreferStylesText] = useState('');
  const [newPreferStylesImages, setNewPreferStylesImages] = useState('');

  // Edit states are initialized when opening edit modal
  const [editClientData, setEditClientData] = useState<Client | null>(null);

  // Invoice form state
  const [invoiceAmount, setInvoiceAmount] = useState('1500');
  const [invoiceDueDays, setInvoiceDueDays] = useState('14');

  // New Note state
  const [noteType, setNoteType] = useState<'Meeting' | 'Idea' | 'Feedback' | 'Urgent'>('Meeting');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [noteTargetClient, setNoteTargetClient] = useState('');

  // Find currently selected client
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Calculate counts for each client category
  const clientCounts = useMemo(() => {
    return {
      All: clients.length,
      Active: clients.filter(c => c.status === 'Active').length,
      Prospect: clients.filter(c => c.status === 'Prospect').length,
      Inactive: clients.filter(c => c.status === 'Inactive').length,
    };
  }, [clients]);

  // Local debounced search query state
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Filters process
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  // ResizeObserver for dynamic column count in grid
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(320, window.innerWidth - 280);
    }
    return 800;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, [isDetailViewOpen]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isDetailViewOpen]);

  const cols = containerWidth < 550 ? 1 : containerWidth < 850 ? 2 : containerWidth < 1200 ? 3 : 4;

  const chunkedRows = useMemo(() => {
    const chunks: Client[][] = [];
    for (let i = 0; i < filteredClients.length; i += cols) {
      chunks.push(filteredClients.slice(i, i + cols));
    }
    return chunks;
  }, [filteredClients, cols]);

  const rowVirtualizer = useVirtualizer({
    count: chunkedRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 340,
    overscan: 3,
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCompany.trim()) return;

    // Pick a random background accent class for avatar
    const bgClasses = [
      'bg-primary text-white',
      'bg-amber-100 text-amber-600',
      'bg-purple-100 text-purple-600',
      'bg-indigo-100 text-indigo-600',
      'bg-pink-100 text-pink-600',
      'bg-cyan-100 text-cyan-600'
    ];
    const pickedBg = bgClasses[Math.floor(Math.random() * bgClasses.length)];

    const id = addClient({
      name: newName,
      company: newCompany,
      role: newRole || '',
      email: newEmail || '',
      billingEmail: newBillingEmail || '',
      phone: newPhone || '',
      location: newLocation || '',
      websites: newWebsites ? newWebsites.split(',').map(s => s.trim()) : [],
      socialProfiles: newSocialProfiles.split(',').filter(x => x.trim()).map(p => ({ platform: 'Social', url: p.trim() })),
      stylePreferences: {
        description: newPreferStylesText,
        imageUrls: newPreferStylesImages ? newPreferStylesImages.split(',').map(s => s.trim()) : []
      },
      status: newStatus,
      projectsCount: 1,
      rating: 5.0,
      totalVolume: 0,
      outstandingAmount: 0,
      outstandingPending: false,
      outstandingDueDays: 0,
      communicationRating: 4.8,
      speedRating: 4.8,
      avatarBg: pickedBg,
      brandColors: [
        { name: 'Primary', hex: '#3B82F6' },
        { name: 'Dark', hex: '#000000' }
      ],
      brandFonts: [],
      projectHistory: []
    });

    // Reset fields
    setNewName('');
    setNewCompany('');
    setNewRole('');
    setNewEmail('');
    setNewBillingEmail('');
    setNewPhone('');
    setNewLocation('');
    setNewStatus('Active');
    setNewWebsites('');
    setNewSocialProfiles('');
    setNewTypography('');
    setNewColorPalette('');
    setNewPreferStylesText('');
    setNewPreferStylesImages('');
    setIsAddModalOpen(false);
  };

  const openEditModal = (client: Client) => {
    setEditClientData({ ...client });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientData) return;
    updateClient(editClientData.id, editClientData);
    setIsEditModalOpen(false);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const amountNum = parseFloat(invoiceAmount) || 0;
    const dueDaysNum = parseInt(invoiceDueDays) || 7;

    createInvoice(selectedClient.id, amountNum, dueDaysNum);

    // Add automatic transaction note
    addNote({
      clientId: selectedClient.id,
      clientInitials: selectedClient.initials,
      type: 'Urgent',
      content: `Invoiced client ${selectedClient.name} for $${amountNum.toLocaleString()} (Invoice transaction auto-logged). Payment draft outstanding.`,
      authorInitials: 'SYS',
      tags: ['Billing', 'Invoice']
    });

    setIsInvoiceModalOpen(false);
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const initials = noteTargetClient ? (clients.find(c => c.id === noteTargetClient)?.initials || 'SYS') : 'SYS';

    addNote({
      clientId: noteTargetClient || undefined,
      clientInitials: initials,
      type: noteType,
      content: noteContent,
      authorInitials: 'SYS', // System user initials
      tags: noteTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setNoteContent('');
    setNoteTags('');
    setNoteTargetClient('');
    setIsNoteModalOpen(false);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ message: `${label} copied: ${text}`, visible: true });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 2000);
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(1)}k`;
    }
    return `$${val}`;
  };

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = useMemo(() => {
    if (windowWidth < 1024) return '100%';
    if (windowWidth < 1280) return 400;
    return 480;
  }, [windowWidth]);

  if (isDetailViewOpen) {
    return (
      <ClientDetailsPage
        onBack={() => setIsDetailViewOpen(false)}
        onNewProject={onNewProject}
        onEditProject={onEditProject}
        onProjectClick={onProjectClick}
        initialTab={detailViewTab}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f5f7] overflow-hidden relative">
      {/* Header Banner */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0 z-20 relative">
        <div className="flex items-center gap-2 w-1/3">
          <Users className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clients</h2>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative group w-full max-w-[320px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="size-3.5" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value);
              }}
              placeholder="Search directory..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 outline-none border border-slate-950 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Client</span>
          </button>
        </div>
      </header>

      {/* Main Multi-Column Split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Client Stack & Bottom Notes */}
        <div className="flex-1 flex flex-col pt-6 h-full min-h-0 bg-slate-50">
          {/* Status Tabs */}
          <div className="mb-0 flex flex-wrap items-center gap-2 shrink-0 px-6">
            {(['All', 'Active', 'Prospect', 'Inactive'] as const).map(tab => (
              <PillTab
                key={tab}
                label={tab}
                isActive={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
                counter={clientCounts[tab]}
              />
            ))}
          </div>

          {/* Scrollable Clients Grid */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto custom-scrollbar relative pb-24 px-6"
          >
            <AnimatePresence>
              {filteredClients.length === 0 ? (
                <EmptySearchState
                  searchQuery={searchQuery}
                  onClearSearch={() => setLocalSearch('')}
                  onAddClient={() => setIsAddModalOpen(true)}
                />
              ) : (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize() + 24}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const rowItems = chunkedRows[virtualRow.index] || [];
                    return (
                      <div
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start + 24}px)`,
                          display: 'grid',
                          gridTemplateColumns: `repeat(${cols}, 1fr)`,
                          gap: '24px',
                          paddingBottom: '24px',
                          zIndex: rowItems.some(c => c.id === selectedClientId) ? 10 : 1
                        }}
                      >
                        {rowItems.map(client => (
                          <ClientCard
                            key={client.id}
                            client={client}
                            isActiveSelected={client.id === selectedClientId}
                            activeMenuClient={activeMenuClient}
                            setActiveMenuClient={setActiveMenuClient}
                            openEditModal={openEditModal}
                            deleteClient={deleteClient}
                            selectClient={selectClient}
                            setDetailViewTab={setDetailViewTab}
                            setIsDetailViewOpen={setIsDetailViewOpen}
                            formatCurrency={formatCurrency}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar Details Slider panel */}
        <AnimatePresence>
          {selectedClient && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute lg:relative right-0 top-0 h-full bg-white border-l border-slate-200 z-20 overflow-y-auto overflow-x-hidden custom-scrollbar shadow-2xl lg:shadow-none flex-shrink-0"
            >
              <div
                style={{ width: sidebarWidth }}
                className="flex flex-col divide-y divide-slate-100 min-h-full"
              >
                {/* Slided Header Info */}
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="relative">
                      {selectedClient.avatarUrl ? (
                        <img
                          alt={selectedClient.name}
                          src={selectedClient.avatarUrl}
                          className="size-16 rounded-2xl object-cover shadow-md border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`size-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md ${selectedClient.avatarBg || 'bg-slate-900 text-white'}`}>
                          {selectedClient.initials}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${selectedClient.status === 'Active' ? 'bg-emerald-500' : selectedClient.status === 'Prospect' ? 'bg-blue-500' : 'bg-slate-400'
                        }`}></span>
                    </div>

                    {/* Small Action Suite */}
                    <div className="flex gap-1.5">
                      <button className="p-2 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Share Guidelines">
                        <Share2 className="size-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(selectedClient)}
                        className="p-2 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                        title="Amend configuration"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => selectClient(null)}
                        className="p-2 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Close panel"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 leading-none">{selectedClient.name}</h2>
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedClient.role}</p>
                      <span className="size-1 rounded-full bg-slate-300 shrink-0"></span>
                      <div className="relative">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className={`text-[10px] px-2.5 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border cursor-pointer transition-all duration-200 ${selectedClient.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100/50'
                            : selectedClient.status === 'Prospect'
                              ? 'bg-blue-50 text-blue-700 border-blue-250 hover:bg-blue-100/50'
                              : 'bg-slate-50 text-slate-500 border-slate-305 hover:bg-slate-200/50'
                            }`}
                        >
                          <span className={`size-1.5 rounded-full ${selectedClient.status === 'Active' ? 'bg-emerald-500 animate-pulse' : selectedClient.status === 'Prospect' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {selectedClient.status}
                          <span className="material-symbols-outlined text-[14px] leading-none select-none text-slate-400">
                            expand_more
                          </span>
                        </button>

                        {isStatusDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)}></div>
                            <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left">
                              {(['Active', 'Prospect', 'Inactive'] as const).map((statusVal) => (
                                <button
                                  key={statusVal}
                                  onClick={() => {
                                    updateClient(selectedClient.id, { status: statusVal });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 hover:bg-slate-50 ${selectedClient.status === statusVal ? 'bg-slate-50 text-slate-900 font-extrabold' : 'text-slate-500'
                                    }`}
                                >
                                  <span className={`size-1.5 rounded-full ${statusVal === 'Active' ? 'bg-emerald-500' : statusVal === 'Prospect' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                                  {statusVal}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Core triggers list */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${selectedClient.email}`}
                          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                          <Mail className="size-3.5" /> Mail
                        </a>
                        <a
                          href={`tel:${selectedClient.phone}`}
                          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone className="size-3.5" /> Call
                        </a>
                      </div>

                      <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md hover:shadow-blue-600/20"
                      >
                        <DollarSign className="size-3.5" /> Record Invoice
                      </button>

                      <button
                        onClick={() => {
                          setDetailViewTab('overview');
                          setIsDetailViewOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl border border-slate-900 text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-98 shadow-sm"
                      >
                        <Eye className="size-3.5" /> View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main parameters block */}
                <div className="p-8 space-y-8 flex-1 flex flex-col">
                  {/* Contact + Financial Double pack */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact panel */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Indexes</h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <Mail className="size-4 mt-0.5 text-slate-300 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                            <p className="text-xs font-bold text-slate-900 truncate">{selectedClient.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Phone className="size-4 mt-0.5 text-slate-300 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                            <p className="text-xs font-bold text-slate-900">{selectedClient.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <MapPin className="size-4 mt-0.5 text-slate-300 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                            <p className="text-xs font-bold text-slate-900">{selectedClient.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume indexes</h4>
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 flex flex-col justify-center h-[76px]">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Total billing volume</p>
                          <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedClient.totalVolume)}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col justify-center relative h-[76px] overflow-hidden">
                          {selectedClient.outstandingPending && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-white text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <span className="size-1 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending
                              </span>
                            </div>
                          )}
                          <p className="text-[9px] text-amber-600 font-black uppercase tracking-wider mb-1">Outstanding</p>
                          <p className="text-2xl font-black text-amber-700">{formatCurrency(selectedClient.outstandingAmount)}</p>
                          {selectedClient.outstandingPending && (
                            <p className="text-[8px] text-amber-500 font-bold uppercase mt-1">Due in {selectedClient.outstandingDueDays} Days</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Performance section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rating analysis</h4>
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col justify-center items-center md:items-start">
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Entity Rating</span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-3xl font-black text-slate-950 mr-1">
                            {selectedClient.rating !== null ? selectedClient.rating.toFixed(1) : '--'}
                          </span>
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                          Based on {selectedClient.projectsCount} Project{selectedClient.projectsCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="col-span-2 space-y-4 flex flex-col justify-center">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication</span>
                            <span className="text-xs font-bold text-slate-800">{selectedClient.communicationRating.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-slate-900 h-1.5 rounded-full"
                              style={{ width: `${selectedClient.communicationRating * 20}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Velocity Speed</span>
                            <span className="text-xs font-bold text-slate-800">{selectedClient.speedRating.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${selectedClient.speedRating * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Guidelines colors + typography assets */}
                  <div className="space-y-4 flex-1 flex flex-col min-h-[160px]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity asset guides</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-slate-900 transition-colors">See guidelines</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex-1 flex flex-wrap gap-6 items-center justify-start min-h-[100px]">
                      {/* Colors circles listing */}
                      <div className="flex items-center gap-2">
                        {(selectedClient.brandColors || []).map((col, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCopyToClipboard(col.hex, col.name)}
                            className="group relative flex items-center justify-center size-10 rounded-full shadow-inner cursor-pointer active:scale-90 transition-transform"
                            style={{ backgroundColor: col.hex }}
                            title={`${col.name}: ${col.hex} (Click to copy)`}
                          >
                            <span className="absolute bottom-full mb-1.5 scale-0 group-hover:scale-100 transition-transform bg-slate-950 text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md pointer-events-none">
                              {col.name}: {col.hex}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="h-6 w-[1px] bg-slate-200"></div>

                      {/* Font blocks */}
                      <div className="flex flex-wrap gap-2 justify-start">
                        {(selectedClient.brandFonts || []).map((f, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCopyToClipboard(f.fontName, f.style)}
                            className="bg-slate-50 border border-slate-150 rounded-xl px-4 py-3 flex flex-col justify-center items-start text-left cursor-pointer hover:bg-slate-100 active:scale-95 transition-all min-w-[100px]"
                            title={`${f.style}: ${f.fontName} (Click to copy)`}
                          >
                            <span
                              className={`leading-tight truncate max-w-[140px] ${f.style === 'Display' ? 'text-2xl font-black tracking-tighter' :
                                f.style === 'Headlines' ? 'text-lg font-extrabold tracking-tight' :
                                  f.style === 'Body Text' ? 'text-sm font-normal' :
                                    f.style === 'Accents' ? 'text-[10px] font-bold uppercase tracking-widest' :
                                      f.style === 'Captions' ? 'text-xs font-medium text-slate-600' :
                                        'text-xs font-bold leading-none'
                                }`}
                              style={{ fontFamily: `"${f.fontName}", sans-serif` }}
                            >
                              {f.style}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-2">{f.fontName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Historical Project Activity columns */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Ledger</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">Audit log</span>
                    </div>

                    {(!selectedClient.projectHistory || selectedClient.projectHistory.length === 0) ? (
                      <p className="text-xs text-slate-400 font-medium bg-slate-50 border border-dashed border-slate-250 p-4 rounded-xl text-center">
                        No active history trails loaded for this entity.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {(selectedClient.projectHistory || []).map((hist, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl border transition-all ${hist.statusType === 'ongoing'
                              ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                              : hist.statusType === 'upcoming'
                                ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                                : 'bg-white border-slate-200 hover:border-emerald-250 hover:bg-emerald-50/10'
                              }`}
                          >
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-2">
                              {hist.statusType}
                            </p>
                            <h5 className="text-xs font-extrabold text-slate-900 truncate leading-none mb-1">{hist.title}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase truncate mb-3">{hist.phase}</p>

                            <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{hist.dueText}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL SYSTEM: 1. ADD CLIENT */}
      <AnimatePresence>
        {copyFeedback.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[150] px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-bold shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <CheckCircle className="size-4 text-emerald-400" />
            {copyFeedback.message}
          </motion.div>
        )}

        {/* PAGE SYSTEM: 1. ADD NEW CLIENT */}
        {/* PAGE SYSTEM: 1. ADD / EDIT CLIENT */}
        <AddNewClientPage
          isOpen={isAddModalOpen || isEditModalOpen}
          clientToEditId={isEditModalOpen ? editClientData?.id : undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      </AnimatePresence>

      {/* MODAL SYSTEM: 3. CREATE INVOICE */}
      <AnimatePresence>
        {isInvoiceModalOpen && selectedClient && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsInvoiceModalOpen(false)}
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 rounded-3xl"
            >
              <form onSubmit={handleCreateInvoiceSubmit}>
                <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial System</h3>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Record Live Invoice</h2>
                  </div>
                  <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="p-1.5 hover:bg-slate-200 transition-colors bg-slate-100 rounded-lg text-slate-400">
                    <X className="size-4" />
                  </button>
                </header>

                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 leading-none">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Target Client</label>
                    </div>
                    <p className="text-sm font-bold text-slate-900 bg-slate-100 py-3 px-4 rounded-xl">{selectedClient.name} ({selectedClient.company})</p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Invoice Amount ($)</label>
                    <div className="relative">
                      <input
                        className="w-full border border-slate-200 focus:border-slate-900 rounded-xl py-3 pl-10 pr-4 outline-none text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                        value={invoiceAmount}
                        onChange={e => setInvoiceAmount(e.target.value)}
                        placeholder="1500"
                        type="number"
                        required
                        min="1"
                      />
                      <DollarSign className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Due Timeline (Days)</label>
                    <input
                      className="w-full border border-slate-200 focus:border-slate-900 rounded-xl py-3 px-4 outline-none text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                      value={invoiceDueDays}
                      onChange={e => setInvoiceDueDays(e.target.value)}
                      placeholder="14"
                      type="number"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="text-xs font-black uppercase tracking-wider px-4 py-2 hover:text-slate-900 text-slate-400"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Issue Bill
                  </button>
                </footer>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SYSTEM: 4. CREATE SYSTEM NOTE */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsNoteModalOpen(false)}
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 rounded-3xl"
            >
              <form onSubmit={handleCreateNoteSubmit}>
                <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Logging</h3>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Record Live Log</h2>
                  </div>
                  <button type="button" onClick={() => setIsNoteModalOpen(false)} className="p-1.5 hover:bg-slate-200 transition-colors bg-slate-100 rounded-lg text-slate-400">
                    <X className="size-4" />
                  </button>
                </header>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Associate Project Client</label>
                    <select
                      className="w-full border border-slate-200 focus:border-slate-900 rounded-xl py-3 px-4 outline-none text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                      value={noteTargetClient}
                      onChange={e => setNoteTargetClient(e.target.value)}
                    >
                      <option value="">General Log (No specific client)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Log Category</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['Meeting', 'Idea', 'Feedback', 'Urgent'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNoteType(type)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${noteType === type
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-700'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Discussion / note details</label>
                    <textarea
                      className="w-full border border-slate-200 focus:border-slate-900 rounded-xl py-3 px-4 outline-none text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white h-28 resize-none"
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Outline conversation details, agreements, or urgent reminders..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">Descriptors (comma-separated tags)</label>
                    <input
                      className="w-full border border-slate-200 focus:border-slate-900 rounded-xl py-3 px-4 outline-none text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                      value={noteTags}
                      onChange={e => setNoteTags(e.target.value)}
                      placeholder="e.g. Q4-Strategy, Pricing, Redesign"
                      type="text"
                    />
                  </div>
                </div>

                <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="text-xs font-black uppercase tracking-wider px-4 py-2 hover:text-slate-900 text-slate-400"
                  >
                    Abort_Session
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Commit Log Entry
                  </button>
                </footer>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Memoized Cover Illustration Patterns matching test site
const COVER_STYLES = [
  // 01. Ambient Mesh Glow
  {
    bg: 'bg-[#090d16] border-slate-800/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <circle cx="250" cy="35" r="38" fill={color} fillOpacity="0.3" />
        <circle cx="275" cy="65" r="22" fill={color} fillOpacity="0.15" />
      </svg>
    )
  },
  // 02. Monolith Polygon Cutouts
  {
    bg: 'bg-[#0d131f] border-slate-800',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <polygon points="180,-10 340,30 260,120" fill={color} fillOpacity="0.25" />
        <polygon points="220,10 340,90 280,120" fill={color} fillOpacity="0.4" />
      </svg>
    )
  },
  // 03. Topo Contour Lines
  {
    bg: 'bg-[#181104] border-amber-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <path d="M120 10 C180 80, 240 20, 340 70" stroke={color} strokeWidth="1.5" opacity="0.8"/>
        <path d="M140 30 C200 95, 260 35, 340 85" stroke={color} strokeWidth="1.25" opacity="0.6"/>
        <path d="M160 50 C220 110, 280 50, 340 100" stroke={color} strokeWidth="1" opacity="0.4"/>
      </svg>
    )
  },
  // 04. Glassmorphic Panes
  {
    bg: 'bg-[#061816] border-emerald-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <rect x="180" y="20" width="75" height="48" rx="10" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.25"/>
        <rect x="210" y="40" width="75" height="48" rx="10" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1"/>
      </svg>
    )
  },
  // 05. 3D Volumetric Clay Sphere
  {
    bg: 'bg-[#10081d] border-purple-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <circle cx="240" cy="50" r="38" fill={color} fillOpacity="0.35" />
        <circle cx="240" cy="50" r="22" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      </svg>
    )
  },
  // 06. Light Beam Flare Ray
  {
    bg: 'bg-[#0a071b] border-purple-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <polygon points="120,-10 340,60 340,112 180,112" fill={color} fillOpacity="0.35"/>
        <circle cx="280" cy="40" r="6" fill={color}/>
      </svg>
    )
  },
  // 07. Diagonal Duo-Tone Split
  {
    bg: 'bg-[#1c0d02] border-amber-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <polygon points="160,0 320,0 320,112 240,112" fill={color} fillOpacity="0.3"/>
        <line x1="160" y1="0" x2="240" y2="112" stroke={color} strokeWidth="2"/>
      </svg>
    )
  },
  // 08. Botanical Leaf Silhouette
  {
    bg: 'bg-[#091508] border-emerald-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <path d="M250 10 C 280 40, 290 80, 250 105 C 210 80, 220 40, 250 10 Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
        <line x1="250" y1="10" x2="250" y2="105" stroke={color} strokeWidth="1.25"/>
      </svg>
    )
  },
  // 09. Retro Synth Horizon
  {
    bg: 'bg-[#051923] border-cyan-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <line x1="0" y1="70" x2="320" y2="70" stroke={color} strokeWidth="1.5"/>
        <line x1="0" y1="85" x2="320" y2="85" stroke={color} strokeWidth="1" opacity="0.7"/>
        <circle cx="160" cy="70" r="22" fill={color} fillOpacity="0.3"/>
      </svg>
    )
  },
  // 10. Concentric Orbit Radar
  {
    bg: 'bg-[#060f24] border-blue-950/80',
    render: (color: string) => (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 112" fill="none">
        <circle cx="240" cy="50" r="38" stroke={color} strokeWidth="1.5" opacity="0.6"/>
        <circle cx="240" cy="50" r="22" stroke={color} strokeWidth="1" strokeDasharray="3 3"/>
        <circle cx="240" cy="50" r="8" fill={color}/>
      </svg>
    )
  }
];

const VIBRANT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// Pure Hash Lookup Cache to eliminate lag
const illustrationCache = new Map<string, { bg: string; render: (c: string) => React.ReactNode; color: string }>();

function getClientIllustrationMemoized(clientId: string) {
  if (illustrationCache.has(clientId)) {
    return illustrationCache.get(clientId)!;
  }
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const styleObj = COVER_STYLES[absHash % COVER_STYLES.length];
  const color = VIBRANT_COLORS[(absHash >> 3) % VIBRANT_COLORS.length];
  
  const result = {
    bg: styleObj.bg,
    render: styleObj.render,
    color
  };
  illustrationCache.set(clientId, result);
  return result;
}

const ClientCard = React.memo(({
  client,
  isActiveSelected,
  activeMenuClient,
  setActiveMenuClient,
  openEditModal,
  deleteClient,
  selectClient,
  setDetailViewTab,
  setIsDetailViewOpen,
  formatCurrency
}: {
  client: Client;
  isActiveSelected: boolean;
  activeMenuClient: string | null;
  setActiveMenuClient: (id: string | null) => void;
  openEditModal: (c: Client) => void;
  deleteClient: (id: string) => void;
  selectClient: (id: string | null) => void;
  setDetailViewTab: (tab: any) => void;
  setIsDetailViewOpen: (open: boolean) => void;
  formatCurrency: (val: number) => string;
}) => {
  const ongoingCount = client.projectHistory ? client.projectHistory.filter(p => p.statusType === 'ongoing').length : 0;
  const completedCount = client.projectHistory ? client.projectHistory.filter(p => p.statusType === 'completed').length : 0;

  const formatVol = (val: number) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return `$${val}`;
  };

  const ongoingVol = formatVol(client.outstandingAmount || 0);
  const completedVol = formatVol(client.totalVolume || 0);

  // Memoized illustration calculation per client ID for ZERO LAG
  const illustration = React.useMemo(() => getClientIllustrationMemoized(client.id), [client.id]);

  return (
    <div
      onClick={() => selectClient(client.id)}
      onDoubleClick={() => {
        selectClient(client.id);
        setDetailViewTab('overview');
        setIsDetailViewOpen(true);
      }}
      className={`relative bg-white border rounded-3xl p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 group max-w-[360px] w-full mx-auto ${isActiveSelected
        ? 'border-slate-900 ring-1 ring-slate-900 shadow-md'
        : 'border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md'
        }`}
      style={{ minHeight: '390px' }}
    >
      <div className="flex flex-col space-y-4">
        {/* Top Cover Banner matching test site */}
        <div className={`relative h-28 w-full rounded-2xl overflow-hidden ${illustration.bg} border flex items-center justify-center shrink-0`}>
          {illustration.render(illustration.color)}

          {/* Overlapping Avatar Ring */}
          <div className="absolute left-4 bottom-3 z-10">
            <div className="relative size-14">
              {client.avatarUrl ? (
                <img
                  alt={client.name}
                  src={client.avatarUrl}
                  className="size-14 rounded-full object-cover border-2 border-white shadow-xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`size-14 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center border-2 border-white shadow-xs ${client.avatarUrl ? 'hidden' : ''}`}>
                {client.initials}
              </div>
            </div>
          </div>

          {/* Status Tag Pill */}
          <div className="absolute right-3 top-3 z-10">
            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded-full">
              {client.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-1 space-y-3.5">
          {/* Name & Verified Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate" title={client.name}>
                  {client.name}
                </h3>
                {client.status === 'Active' && (
                  <CheckCircle className="size-4 text-blue-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {client.company || 'Client'} • {client.role || 'Executive'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold shrink-0 pt-0.5">
              <CheckCircle className="size-3.5" />
              <span>Verified</span>
            </div>
          </div>

          {/* 3-Column Metrics Box (1:1 with test site) */}
          <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-100 transition-colors">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Client Metrics</span>
            <div className="grid grid-cols-3 divide-x divide-slate-200/70 text-center">
              <div className="px-1">
                <span className="block text-sm font-extrabold text-slate-900 leading-tight">{ongoingCount + completedCount}</span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">Projects</span>
              </div>
              <div className="px-1">
                <span className="block text-sm font-extrabold text-slate-900 leading-tight">{completedVol}</span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">Volume</span>
              </div>
              <div className="px-1">
                <span className={`block text-sm font-extrabold leading-tight ${client.outstandingAmount ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {ongoingVol}
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">Pending</span>
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="flex flex-col gap-2 text-[12px] pt-0.5">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Location</span>
              <span className="text-slate-500 font-bold truncate max-w-[150px]">{client.location || 'United States'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 items-center pt-3 mt-auto">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuClient(activeMenuClient === client.id ? null : client.id);
            }}
            className={`size-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0 ${activeMenuClient === client.id ? 'bg-slate-200 text-slate-900' : ''
              }`}
          >
            <MoreVertical className="size-4" />
          </button>

          {/* Dropdown Menu Overlay */}
          {activeMenuClient === client.id && (
            <>
              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuClient(null); }}></div>
              <div className="absolute left-0 bottom-11 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-1 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(client);
                    setActiveMenuClient(null);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold"
                >
                  <Edit className="size-3.5" /> Edit Profile
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setActiveMenuClient(null);
                    const ok = await confirm.danger(
                      `Delete ${client.name}?`,
                      'This client will be moved to the Trash.'
                    );
                    if (ok) {
                      deleteClient(client.id);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                >
                  <Trash2 className="size-3.5" /> Close Account
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            selectClient(client.id);
            setDetailViewTab('overview');
            setIsDetailViewOpen(true);
          }}
          className="flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-xs font-extrabold shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Eye className="size-4 shrink-0" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
});
