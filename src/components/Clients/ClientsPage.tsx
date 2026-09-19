import React, { useState, useMemo, useEffect } from 'react';
import { useClientStore, Client } from '../../stores/clientStore';
import { confirm } from '../../stores/confirmStore';
import { sound } from '../../stores/soundStore';
import { motion, AnimatePresence } from 'motion/react';
import { AddNewClientPage } from './AddNewClient/AddNewClientPage';
import { ClientDetailsPage } from './ClientsDetails/ClientDetailsPage';
import { ClientCard } from './ClientCard';
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
import { ClientsSkeleton } from '../GlobalComponents/Skeletons/ClientsSkeleton';

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
    createInvoice,
    _hasHydrated
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

  const totalVolumeSum = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.totalVolume || 0), 0);
  }, [clients]);

  const totalPendingSum = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
  }, [clients]);

  const totalPendingCount = useMemo(() => {
    return clients.filter(c => (c.outstandingAmount || 0) > 0).length;
  }, [clients]);

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

  if (!_hasHydrated) {
    return <ClientsSkeleton />;
  }

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
      <div className="flex-1 flex overflow-hidden relative px-8 py-6">
        {/* Left Side: Client Stack & Summary */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-[#f5f5f7]">

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 mb-3">
            {(['All', 'Active', 'Prospect', 'Inactive'] as const).map(tab => (
              <PillTab
                key={tab}
                label={tab}
                isActive={statusFilter === tab}
                onClick={() => {
                  sound.tick();
                  setStatusFilter(tab);
                }}
                counter={clientCounts[tab]}
              />
            ))}
          </div>

          {/* Scrollable Clients Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <AnimatePresence mode="popLayout">
              {filteredClients.length === 0 ? (
                <EmptySearchState
                  searchQuery={searchQuery}
                  onClearSearch={() => setLocalSearch('')}
                  onAddClient={() => setIsAddModalOpen(true)}
                />
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                >
                  {filteredClients.map((client, index) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      index={index}
                      isSelected={client.id === selectedClientId}
                      onSelect={(id) => {
                        sound.tick();
                        selectClient(selectedClientId === id ? null : id);
                      }}
                      onOpenDetails={(id) => {
                        sound.tick();
                        selectClient(id);
                        setDetailViewTab('overview');
                        setIsDetailViewOpen(true);
                      }}
                      onEdit={openEditModal}
                      onDelete={async (id, name) => {
                        const ok = await confirm.danger(
                          `Delete ${name}?`,
                          'This client will be moved to the Trash.'
                        );
                        if (ok) {
                          sound.delete();
                          deleteClient(id);
                          if (selectedClientId === id) {
                            selectClient(null);
                          }
                        }
                      }}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </motion.div>
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
