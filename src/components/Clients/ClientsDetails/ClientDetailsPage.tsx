import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TabbedFileExplorer } from '../../GlobalComponents/FileExplorer/TabbedFileExplorer';
import { useClientStore, Client, ClientNote, ProjectHistoryItem } from '../../../stores/clientStore';
import { useClientDetailsStore } from '../../../stores/clientDetailsStore';
import { confirm } from '../../../stores/confirmStore';
import { toast } from '../../../stores/toastStore';
import { motion, AnimatePresence } from 'motion/react';
import { AssignedExpertsSidebar, Expert } from '../../GlobalComponents/Sidebars/AssignedExpertsSidebar';
import { ManageTagsSidebar } from '../Sidebars/ManageTagsSidebar';
import { TaskPage } from '../../GlobalComponents/Pages/TaskPage/TaskPage';
import { PillTab } from '../../GlobalComponents/PillTab';
import { InlineEditCell } from '../../Leads/InlineEditCell';
import { ProjectsPage } from '../ProjectsPage/ProjectsPage';
import { ClientsSkeleton } from '../../GlobalComponents/Skeletons/ClientsSkeleton';
import {
  ArrowLeft,
  Search,
  Bell,
  Plus,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  FolderIcon,
  CheckCircle,
  Trash2,
  X,
  FileText,
  FolderArchive,
  Menu,
  ChevronRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  Star,
  Pencil,
  FolderOpen
} from 'lucide-react';

interface ClientDetailsPageProps {
  onBack: () => void;
  onNewProject?: (clientName: string) => void;
  onEditProject?: (project: any) => void;
  onProjectClick?: (project: any) => void;
  initialTab?: 'overview' | 'tasks' | 'files' | 'financials' | 'notes' | 'projects';
}

const AvatarWithFallback: React.FC<{
  expert: Expert;
  className?: string;
}> = ({ expert, className }) => {
  const [hasError, setHasError] = useState(false);
  const initials = expert.name ? expert.name.slice(0, 2).toUpperCase() : 'EX';

  if (expert.avatar && !hasError) {
    return (
      <img
        alt={expert.name || expert.email}
        className={className || "w-9 h-9 rounded-full border-[3px] border-white object-cover shadow-sm group-hover:scale-105 transition-transform"}
        src={expert.avatar}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={className || "w-9 h-9 rounded-full bg-slate-200 border-[3px] border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm group-hover:scale-105 transition-transform"}
    >
      {initials}
    </div>
  );
};


export const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({
  onBack,
  onNewProject,
  onEditProject,
  onProjectClick,
  initialTab = 'overview'
}) => {
  const {
    clients,
    notes,
    selectedClientId,
    selectClient,
    addNote,
    deleteNote,
    createInvoice,
    updateClient,
    deleteClient
  } = useClientStore();

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'financials' | 'notes' | 'projects'>(initialTab);

  // Experts Sidebar state
  const [isExpertsSidebarOpen, setIsExpertsSidebarOpen] = useState(false);
  const { experts: clientExperts, pinnedAssets, activityLogs, setExperts: storeSetExperts, addPinnedAsset, removePinnedAsset, addActivityLog, _hasHydrated } = useClientDetailsStore();
  const setClientExperts = (updater: any) => {
    // Compatibility shim: support both function updater and direct value
    const newVal = typeof updater === 'function' ? updater(clientExperts) : updater;
    // Persist each client's experts to store
    Object.keys(newVal).forEach(clientId => {
      storeSetExperts(clientId, newVal[clientId]?.assigned || []);
    });
  };

  const activeExperts = useMemo(() => {
    return clientExperts[selectedClient?.id] || {
      assigned: [],
      available: []
    };
  }, [clientExperts, selectedClient?.id]);

  // Compatibility shims for setPinnedAssets/setActivityLogs (delegates to store)
  const setPinnedAssets = (updater: any) => {
    // The store doesn't support updater pattern, but we need it for filter/spread calls
    // Since pinnedAssets comes from store, we update it via a full replacement through the store
    const newVal = typeof updater === 'function' ? updater(pinnedAssets) : updater;
    // We'll use a direct store write via the API
    fetch('/api/store/clientDetails', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: { ...useClientDetailsStore.getState(), pinnedAssets: newVal }, version: 0 })
    }).catch(() => { });
    // Also update local store state
    useClientDetailsStore.setState({ pinnedAssets: newVal });
  };
  const setActivityLogs = (updater: any) => {
    const newVal = typeof updater === 'function' ? updater(activityLogs) : updater;
    useClientDetailsStore.setState({ activityLogs: newVal });
  };

  const handleSaveExperts = (newAssigned: Expert[]) => {
    const originalAvail = clientExperts[selectedClient?.id]?.available || [];
    const newAvail = originalAvail.filter(e => !newAssigned.some(na => na.id === e.id));
    setClientExperts({
      ...clientExperts,
      [selectedClient?.id]: {
        assigned: newAssigned,
        available: newAvail
      }
    });
  };


  // Custom states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('1500');
  const [invoiceDueDays, setInvoiceDueDays] = useState('14');
  const [copyFeedback, setCopyFeedback] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteType, setNoteType] = useState<'Meeting' | 'Idea' | 'Feedback' | 'Urgent'>('Meeting');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (isNoteModalOpen || isTaskModalOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isNoteModalOpen, isTaskModalOpen]);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPhase, setTaskPhase] = useState('Development');
  const [taskDueText, setTaskDueText] = useState('Due in 7 days');


  // For file upload simulation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // New Quick Actions states
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isDocAttachModalOpen, setIsDocAttachModalOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Left Sidebar Accordion / Expansion states
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);
  const [isLatestNoteExpanded, setIsLatestNoteExpanded] = useState(true);
  const [isRatingsExpanded, setIsRatingsExpanded] = useState(true);

  // Appointment state
  const [appointmentDate, setAppointmentDate] = useState('2026-06-01');
  const [appointmentTime, setAppointmentTime] = useState('11:00');
  const [appointmentExpert, setAppointmentExpert] = useState('Leslie Alexander');
  const [appointmentTopic, setAppointmentTopic] = useState('Project Check-in');

  // Appointment scheduling handler
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newLogId = `act-${Date.now()}`;
    setActivityLogs(prev => [
      {
        id: newLogId,
        user: appointmentExpert,
        action: `scheduled an appointment (${appointmentTopic}) for`,
        target: `${appointmentDate} at ${appointmentTime}`,
        time: 'Just now',
        type: 'comment'
      },
      ...prev
    ]);

    addNote({
      clientId: selectedClient.id,
      clientInitials: selectedClient.initials,
      type: 'Meeting',
      content: `Scheduled meeting with ${appointmentExpert} for ${appointmentDate} at ${appointmentTime}. Topic: ${appointmentTopic}`,
      authorInitials: 'SC',
      tags: ['Meeting', 'Appointment']
    });

    setIsAppointmentModalOpen(false);
    setCopyFeedback({
      message: `Appointment scheduled: ${appointmentDate} at ${appointmentTime} with ${appointmentExpert}!`,
      visible: true
    });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 3000);
  };

  // Tags save handler
  const handleSaveTags = (updatedTags: string[]) => {
    updateClient(selectedClient.id, { tags: updatedTags });

    const newLogId = `act-${Date.now()}`;
    setActivityLogs(prev => [
      {
        id: newLogId,
        user: 'You',
        action: 'updated branding categorization tags to:',
        target: updatedTags.join(', ') || 'No tags',
        time: 'Just now',
        type: 'comment'
      },
      ...prev
    ]);

    setCopyFeedback({
      message: 'Categorization tags updated successfully!',
      visible: true
    });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 2000);
  };

  // Tag delete handler
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (selectedClient.tags || []).filter(t => t !== tagToRemove);
    updateClient(selectedClient.id, { tags: updatedTags });

    const newLogId = `act-${Date.now()}`;
    setActivityLogs(prev => [
      {
        id: newLogId,
        user: 'You',
        action: 'removed branding tag:',
        target: tagToRemove,
        time: 'Just now',
        type: 'comment'
      },
      ...prev
    ]);
  };

  // Attach document handler
  const handleAttachDocument = (docName: string, docType: 'pdf' | 'doc') => {
    const newAsset = {
      id: `a-${Date.now()}`,
      name: docName,
      type: docType,
      date: 'Uploaded Just now'
    };

    setPinnedAssets(prev => [newAsset, ...prev]);
    setIsDocAttachModalOpen(false);

    const newLogId = `act-${Date.now()}`;
    setActivityLogs(prev => [
      {
        id: newLogId,
        user: 'You',
        action: 'attached regulatory document',
        target: docName,
        time: 'Just now',
        type: 'comment'
      },
      ...prev
    ]);

    setCopyFeedback({
      message: `Attached ${docName} successfully!`,
      visible: true
    });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 2000);
  };

  if (!selectedClient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-500">
        <AlertCircle className="size-12 mb-4 text-slate-300" />
        <p className="font-bold">No active client selected</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Back to Directory
        </button>
      </div>
    );
  }

  // Handle task completion toggle
  const toggleTaskStatus = (taskId: string) => {
    const updatedHistory = (selectedClient.projectHistory || []).map(task => {
      if (task.id === taskId) {
        const newStatus: 'ongoing' | 'upcoming' | 'completed' = task.statusType === 'completed' ? 'ongoing' : 'completed';

        // Log activity
        const newActivity = {
          id: `act-${Date.now()}`,
          user: 'Task updated',
          action: `"${task.title}" was marked as ${newStatus}`,
          target: '',
          time: 'Just now',
          type: 'task' as const
        };
        setActivityLogs(prev => [newActivity, ...prev]);

        return { ...task, statusType: newStatus };
      }
      return task;
    });

    updateClient(selectedClient.id, { projectHistory: updatedHistory });
  };

  // Add new task
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: ProjectHistoryItem = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      phase: taskPhase,
      statusType: 'ongoing',
      desc: taskPhase,
      dueText: taskDueText || 'Due soon'
    };

    const updatedHistory = [newTask, ...(selectedClient.projectHistory || [])];
    updateClient(selectedClient.id, { projectHistory: updatedHistory });

    // Add activity log
    const newActivity = {
      id: `act-${Date.now()}`,
      user: 'You',
      action: 'scheduled task',
      target: taskTitle,
      time: 'Just now',
      type: 'task' as const
    };
    setActivityLogs(prev => [newActivity, ...prev]);

    setTaskTitle('');
    setTaskPhase('Development');
    setTaskDueText('Due in 7 days');
    setIsTaskModalOpen(false);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ message: `${label} copied: ${text}`, visible: true });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 2000);
  };

  // Add notes specific to index
  const handleAddNoteDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    addNote({
      clientId: selectedClient.id,
      clientInitials: selectedClient.initials,
      type: noteType,
      content: noteContent,
      authorInitials: 'You',
      tags: noteTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    // Add activity log
    const newActivity = {
      id: `act-${Date.now()}`,
      user: 'You',
      action: `added a ${noteType.toLowerCase()} note to`,
      target: selectedClient.name,
      time: 'Just now',
      type: 'note' as const
    };
    setActivityLogs(prev => [newActivity, ...prev]);

    setNoteContent('');
    setNoteTags('');
    setIsNoteModalOpen(false);
  };

  // Record simulated invoice from profile
  const handleRecordInvoiceDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(invoiceAmount) || 0;
    const dueDaysNum = parseInt(invoiceDueDays) || 14;

    createInvoice(selectedClient.id, amountNum, dueDaysNum);

    // Dynamic automated activity index
    addNote({
      clientId: selectedClient.id,
      clientInitials: selectedClient.initials,
      type: 'Urgent',
      content: `Logged billing invoice for $${amountNum.toLocaleString()} with ${dueDaysNum}-day maturity.`,
      authorInitials: 'SYS',
      tags: ['Financials', 'Invoice']
    });

    // Add Activity Log
    const newActivity = {
      id: `act-${Date.now()}`,
      user: 'Accounting System',
      action: `issued invoice of $${amountNum.toLocaleString()} to`,
      target: selectedClient.company,
      time: 'Just now',
      type: 'note' as const
    };
    setActivityLogs(prev => [newActivity, ...prev]);

    setIsInvoiceModalOpen(false);
  };

  // Simulated file upload
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const simulateUpload = (fileName: string) => {
    const fileType = fileName.endsWith('.zip') ? 'zip' : fileName.endsWith('.pdf') ? 'pdf' : 'doc';
    setPinnedAssets(prevAssets => [
      {
        id: `asset-${Date.now()}`,
        name: fileName,
        type: fileType,
        date: 'Uploaded Just now'
      },
      ...prevAssets
    ]);
    // Add activity log
    setActivityLogs(prevAct => [
      {
        id: `act-${Date.now()}`,
        user: 'You',
        action: 'uploaded asset',
        target: fileName,
        time: 'Just now',
        type: 'comment'
      },
      ...prevAct
    ]);
  };

  // Get specific notes for the currently active selected client index
  const clientNotes = notes.filter(n => n.clientId === selectedClient.id);

  // Profile picture mapping
  const portraitUrl = selectedClient.avatarUrl || (selectedClient.id === 'alexander-hamilton'
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuB-LEbQMHWg-bgTRP93dJLCMtaMD0QmCGBLu14FCPro90t-rkftnpE44Gkt0SSY5QyzLrw6MGVd6ZLufGI1JglRWNAAq2-dyW_CGak9I2DF6DSlq43_WPH402DjKgTxuoAvYQ6jjzmZvLI_ihP9p8gq7swKEBT3mmP8mnRbK990Wy-E63bzjkWwTVrmfJkAUjOsrgHAawMxT78Qo_2NIFle-GLQrh8L5hv-_FewC0cv9bXM3AoVru6XD-lPthKDfqgneqFWmsmtEKQ"
    : null);

  if (!_hasHydrated || !selectedClient) {
    return <ClientsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7] overflow-hidden text-slate-900 font-display relative">
      {/* Main Container Multi-Pane Split */}
      <div className="flex-1 overflow-hidden flex">
        <div className="w-full h-full bg-white flex overflow-hidden">

          {/* Left Sidebar Info Card */}
          <aside className="w-[340px] flex flex-col gap-6 overflow-y-auto pr-6 pl-8 py-8 border-r border-slate-200 shrink-0 h-full scrollbar-thin">
            <div className="flex flex-col">

              {/* Profile Block */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {portraitUrl ? (
                    <img
                      alt={selectedClient.name}
                      className="w-20 h-20 rounded-[1.25rem] object-cover shadow-md border border-slate-100"
                      src={portraitUrl}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-3xl font-black shadow-md ${selectedClient.avatarBg || 'bg-slate-900 text-white'}`}>
                      {selectedClient.initials}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${selectedClient.status === 'Active' ? 'bg-emerald-500' : selectedClient.status === 'Prospect' ? 'bg-accent' : 'bg-slate-400'
                    }`}></span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {selectedClient.name}
                  </h2>
                  <div className="mt-1 flex items-center relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${selectedClient.status === 'Active'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50'
                        : selectedClient.status === 'Prospect'
                          ? 'text-accent hover:bg-accent/10'
                          : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                    >
                      <span className={`size-1.5 rounded-full ${selectedClient.status === 'Active' ? 'bg-emerald-500 animate-pulse' : selectedClient.status === 'Prospect' ? 'bg-accent animate-pulse' : 'bg-slate-400'}`}></span>
                      {selectedClient.status}
                      <span className="material-symbols-outlined text-[14px] leading-none select-none text-slate-400">
                        expand_more
                      </span>
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)}></div>
                        <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                          {(['Active', 'Prospect', 'Inactive'] as const).map((statusVal) => (
                            <button
                              key={statusVal}
                              type="button"
                              onClick={() => {
                                updateClient(selectedClient.id, { status: statusVal });
                                setIsStatusDropdownOpen(false);

                                // Add activity log
                                const newActivity = {
                                  id: `act-${Date.now()}`,
                                  user: 'You',
                                  action: `changed client status to`,
                                  target: statusVal,
                                  time: 'Just now',
                                  type: 'comment' as const
                                };
                                setActivityLogs(prev => [newActivity, ...prev]);
                              }}
                              className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 hover:bg-slate-50 ${selectedClient.status === statusVal ? 'bg-slate-50 text-slate-900 font-extrabold' : 'text-slate-500'
                                }`}
                            >
                              <span className={`size-1.5 rounded-full ${statusVal === 'Active' ? 'bg-emerald-500' : statusVal === 'Prospect' ? 'bg-accent' : 'bg-slate-400'}`}></span>
                              {statusVal}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Instant Interaction Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <a
                  href={`mailto:${selectedClient.email}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">mail</span> Message
                </a>
                <a
                  href={`tel:${selectedClient.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">alternate_email</span> Email
                </a>
              </div>

              <button
                onClick={async () => {
                  const ok = await confirm.danger(
                    `Delete ${selectedClient.name}?`,
                    'This client account will be moved to the Trash.'
                  );
                  if (ok) {
                    deleteClient(selectedClient.id);
                    onBack();
                  }
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mb-8 cursor-pointer"
              >
                <Trash2 className="size-4" /> Delete Client Account
              </button>

              {/* Sidebar Sections */}
              <div className="space-y-8 text-slate-700">

                {/* Section Details */}
                <section>
                  <div
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="flex items-center justify-between mb-4 group cursor-pointer text-slate-900 select-none"
                  >
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                      <span
                        className="material-symbols-outlined text-slate-400 text-lg leading-none inline-block"
                        style={{
                          transform: isDetailsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        expand_more
                      </span> Client Details
                    </h3>
                  </div>
                  {isDetailsExpanded && (
                    <div className="space-y-4 pl-7">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Email</span>
                        <InlineEditCell
                          value={selectedClient.email}
                          type="email"
                          onSave={(val) => updateClient(selectedClient.id, { email: val })}
                          className="text-sm font-semibold text-slate-900 w-full truncate block"
                          renderValue={(val) => (
                            <span className="hover:underline cursor-pointer">
                              {val}
                            </span>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Phone</span>
                        <InlineEditCell
                          value={selectedClient.phone || ''}
                          onSave={(val) => updateClient(selectedClient.id, { phone: val })}
                          className="text-sm font-bold text-slate-700 w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Address</span>
                        <InlineEditCell
                          value={selectedClient.location || ''}
                          onSave={(val) => updateClient(selectedClient.id, { location: val })}
                          className="text-sm font-bold text-slate-700 w-full"
                          renderValue={(val) => (
                            <span className="whitespace-pre-line leading-relaxed">
                              {val}
                            </span>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* Section Tags */}
                <section>
                  <div className="flex items-center justify-between mb-3 text-slate-900 select-none">
                    <h3
                      onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-slate-400 text-lg leading-none inline-block"
                        style={{
                          transform: isTagsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        expand_more
                      </span> Brand Tags
                    </h3>
                    <button
                      onClick={() => {
                        setIsTagsModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Manage Brand Tags"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  {isTagsExpanded && (
                    <div className="flex flex-wrap gap-2.5 pl-7">
                      {selectedClient.tags && selectedClient.tags.length > 0 ? (
                        (selectedClient.tags || []).map(t => {
                          const isLocation = t.toUpperCase().includes('GOV') || t.toUpperCase().includes('FED') || t.toUpperCase().includes('STRAT') || t.toUpperCase().includes('LOCAL');
                          const isAvatar = t.toUpperCase().includes('CLIENT') || t.toUpperCase().includes('RETAINER') || t.toUpperCase().includes('DIRECT') || t.toUpperCase().includes('PROSPECT') || t.toUpperCase().includes('DESIGN') || t.toUpperCase().includes('FINTECH');

                          // Capitalize beautifully like the image (e.g., "Strategic", "Government")
                          const formatted = t.split(/[_\s-]+/)
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ');

                          return (
                            <div
                              key={t}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#242424] border border-[#242424] rounded-full text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-800 select-none group"
                            >
                              {/* Option A: Map Pin Icon on the Left (Solid Pin from image) */}
                              {isLocation && (
                                <svg className="size-3.5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                              )}

                              {/* Option B: Avatar image circle with a blue graphic backdrop like the third row of the image */}
                              {isAvatar && !isLocation && (
                                <img
                                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                                  alt="User"
                                  className="size-4.5 rounded-full object-cover ring-1 ring-[#dbcaff]/50 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              )}

                              {/* Tag text in Titlecase */}
                              <span className="leading-none text-[12px] text-white font-medium">
                                {formatted}
                              </span>

                              {/* Delete button (X) as shown in image */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTag(t);
                                }}
                                className="ml-1 text-white/60 hover:text-white transition-colors cursor-pointer select-none focus:outline-none flex items-center justify-center"
                                title={`Remove tag: ${formatted}`}
                              >
                                <X size={11} strokeWidth={2.5} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full text-[11px] text-slate-400 font-medium py-2">
                          No brand tags added. Click the edit icon to manage tags.
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Section Assigned Team */}
                <section>
                  <div className="flex items-center justify-between mb-3 text-slate-900 select-none">
                    <h3
                      onClick={() => setIsTeamExpanded(!isTeamExpanded)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-slate-400 text-lg leading-none inline-block"
                        style={{
                          transform: isTeamExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        expand_more
                      </span> Assigned Team
                    </h3>
                    <button
                      onClick={() => setIsExpertsSidebarOpen(true)}
                      className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Manage Assigned Team"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  {isTeamExpanded && (
                    <div
                      onClick={() => setIsExpertsSidebarOpen(true)}
                      className="flex -space-x-3 pl-7 items-center cursor-pointer group"
                      title="Click to manage assigned team"
                    >
                      {activeExperts.assigned.slice(0, 3).map((expert) => (
                        <AvatarWithFallback
                          key={expert.id}
                          expert={expert}
                        />
                      ))}
                      {activeExperts.assigned.length > 3 && (
                        <div className="w-9 h-9 rounded-full bg-slate-100 border-[3px] border-white flex items-center justify-center text-[10px] font-black text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer shadow-sm">
                          +{activeExperts.assigned.length - 3}
                        </div>
                      )}
                      {activeExperts.assigned.length === 0 && (
                        <span className="text-[11px] text-slate-400 font-medium pl-1">No assigned team</span>
                      )}
                    </div>
                  )}
                </section>

                {/* Section Client Ratings */}
                <section>
                  <div className="flex items-center justify-between mb-3 text-slate-900 select-none">
                    <h3
                      onClick={() => setIsRatingsExpanded(!isRatingsExpanded)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-slate-400 text-lg leading-none inline-block"
                        style={{
                          transform: isRatingsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        expand_more
                      </span> Client Ratings
                    </h3>
                  </div>
                  {isRatingsExpanded && (
                    <div className="space-y-4 pl-7">
                      <div className="flex flex-col gap-1 pb-2 border-b border-slate-100/50 mb-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>Overall Rating (Auto)</span>
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            {selectedClient.rating !== null ? selectedClient.rating.toFixed(1) : '--'}
                            <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>Communication</span>
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            {selectedClient.communicationRating !== null ? selectedClient.communicationRating.toFixed(1) : '--'}
                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const filled = star <= Math.round(selectedClient.communicationRating || 0);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  const newComm = star;
                                  const newOverall = (newComm + (selectedClient.speedRating || 0)) / 2;
                                  updateClient(selectedClient.id, {
                                    communicationRating: newComm,
                                    rating: newOverall
                                  });
                                }}
                                className="text-slate-200 hover:text-yellow-400 transition-colors focus:outline-none cursor-pointer"
                              >
                                <Star
                                  className={`size-5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>Velocity Speed</span>
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            {selectedClient.speedRating !== null ? selectedClient.speedRating.toFixed(1) : '--'}
                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const filled = star <= Math.round(selectedClient.speedRating || 0);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  const newSpeed = star;
                                  const newOverall = ((selectedClient.communicationRating || 0) + newSpeed) / 2;
                                  updateClient(selectedClient.id, {
                                    speedRating: newSpeed,
                                    rating: newOverall
                                  });
                                }}
                                className="text-slate-200 hover:text-yellow-400 transition-colors focus:outline-none cursor-pointer"
                              >
                                <Star
                                  className={`size-5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section Latest Operational Note */}
                <section>
                  <div className="flex items-center justify-between mb-3 text-slate-900 select-none">
                    <h3
                      onClick={() => setIsLatestNoteExpanded(!isLatestNoteExpanded)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-slate-400 text-lg leading-none inline-block"
                        style={{
                          transform: isLatestNoteExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        expand_more
                      </span> Latest Note
                    </h3>
                    <button
                      onClick={() => setIsNoteModalOpen(true)}
                      className="material-symbols-outlined text-sm text-slate-400 hover:text-slate-900 transition-opacity cursor-pointer"
                    >
                      add
                    </button>
                  </div>
                  {isLatestNoteExpanded && (
                    <div className="pl-7">
                      <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100 min-h-[120px] flex flex-col justify-between">
                        <p className="line-clamp-5">
                          {clientNotes.length > 0
                            ? clientNotes[0].content
                            : "Client may provide additional documents for the Q3 audit report by Friday. Please ensure all previous findings are merged before the meeting."
                          }
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="font-bold text-slate-900">
                            {clientNotes.length > 0 ? clientNotes[0].authorInitials : 'You'}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {clientNotes.length > 0 ? clientNotes[0].timeText : '• Yesterday'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </aside>

          {/* Right Work Area */}
          <div className="flex-1 flex flex-col relative bg-white">

            {/* Embedded Navigation Tabs Row */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-8 pt-6 pb-4 border-b border-slate-100 flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group shrink-0 cursor-pointer"
                title="Back to Clients"
              >
                <svg
                  viewBox="416.66 432.14 158.84 158.84"
                  className="size-8"
                >
                  <polyline
                    fill="none"
                    stroke="#fff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="12"
                    points="507.33 540.98 478.51 512.16 507.33 483.34"
                    className="group-hover:-translate-x-[6px] transition-transform duration-200"
                  />
                </svg>
              </button>
              <div className="w-[1px] h-5 bg-slate-200 shrink-0" />
              <nav className="flex flex-wrap items-center gap-2">
                {(['overview', 'tasks', 'files', 'notes', 'financials', 'projects'] as const).map(tab => {
                  const isActive = activeTab === tab;

                  const onClickTab = () => {
                    setActiveTab(tab);
                  }

                  return (
                    <PillTab
                      key={tab}
                      label={tab}
                      isActive={isActive}
                      onClick={onClickTab}
                    />
                  );
                })}
              </nav>
            </div>

            {/* Scrollable Action Content */}
            <div className={`flex-1 min-h-0 ${activeTab === 'files' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto space-y-10 scroll-smooth custom-scrollbar'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={activeTab === 'files' ? 'flex-1 min-h-0 flex flex-col' : ''}
                >

                  {/* TAB: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-10 px-8 py-6">

                      {/* Latest Tasks Module */}
                      <section>
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-black tracking-tight text-slate-900">Latest Tasks</h3>
                          <button
                            onClick={() => setActiveTab('tasks')}
                            className="text-xs font-bold text-slate-900 hover:text-accent transition-colors"
                          >
                            Show all
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(!selectedClient.projectHistory || selectedClient.projectHistory.length === 0) ? (
                            <div className="p-8 bg-slate-50 rounded-2xl text-center border text-slate-400 text-xs">
                              No tasks assigned currently.
                            </div>
                          ) : (
                            (selectedClient.projectHistory || []).map(task => {
                              const isCompleted = task.statusType === 'completed';
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className={`p-4 rounded-2xl flex items-center gap-4 border border-slate-100 hover:shadow-sm transition-all cursor-pointer group ${isCompleted
                                    ? 'bg-slate-50/50'
                                    : 'bg-slate-50 hover:bg-white'
                                    }`}
                                >
                                  {isCompleted ? (
                                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                                      <span className="material-symbols-outlined text-sm font-black">check</span>
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-slate-900 transition-colors shrink-0"></div>
                                  )}
                                  <span className={`text-sm font-bold flex-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                    {task.title || (task as any).name || "Untitled Task"}
                                  </span>
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-md tracking-wider uppercase ${isCompleted
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : task.dueText.includes('Due')
                                      ? 'text-rose-600 bg-rose-50'
                                      : 'text-amber-600 bg-amber-50'
                                    }`}>
                                    {isCompleted ? 'Completed' : task.dueText}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </section>

                      {/* Pinned Assets Module */}
                      <section>
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-black tracking-tight text-slate-900">Pinned Assets</h3>
                          <button
                            onClick={() => setActiveTab('files')}
                            className="text-xs font-bold text-slate-900 hover:text-accent transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {pinnedAssets.map((asset) => (
                            <div
                              key={asset.id}
                              className="group relative overflow-hidden p-5 bg-slate-50/50 hover:bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPinnedAssets(prev => prev.filter(a => a.id !== asset.id));
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 ${asset.type === 'zip' ? 'text-indigo-600 bg-indigo-50' : 'text-accent bg-accent/5'
                                }`}>
                                <span className="material-symbols-outlined fill-1 text-2xl">
                                  {asset.type === 'zip' ? 'folder_zip' : 'description'}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 mb-1 truncate pr-6">{asset.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{asset.date}</p>
                            </div>
                          ))}

                          {/* File Uploader Simulator Box */}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center p-5 bg-slate-50/50 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-100/50 hover:border-slate-400 transition-all group min-h-[140px] ${isDragging ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'
                              }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            {uploadProgress !== null ? (
                              <div className="w-full px-4 text-center">
                                <div className="text-xs font-extrabold text-indigo-600 mb-1">Uploading {uploadProgress}%</div>
                                <div className="w-full bg-slate-200 rounded-full h-1">
                                  <div className="bg-indigo-600 h-1 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-white transition-colors">
                                  <span className="material-symbols-outlined text-slate-400 font-bold">add</span>
                                </div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Pin Asset</p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">Drag & drop files</p>
                              </>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Latest Activity Timeline Module */}
                      <section>
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-black tracking-tight text-slate-900">Latest Activity</h3>
                          <button
                            onClick={() => {
                              toast.info("Activity Log Audit", "Full operational audit is persistent. State synchronization synced successfully.");
                            }}
                            className="text-xs font-bold text-slate-900 hover:text-accent transition-colors cursor-pointer"
                          >
                            View Log
                          </button>
                        </div>
                        <div className="space-y-0 relative pl-4">
                          <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-slate-100"></div>

                          {activityLogs.map((log) => {
                            return (
                              <div key={log.id} className="relative flex gap-6 pb-8 last:pb-0 group">
                                <div className="relative z-10 w-14 h-14 shrink-0 flex items-center justify-center">
                                  <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center ${log.type === 'note'
                                    ? 'bg-accent/5 text-accent'
                                    : log.type === 'task'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-sm font-black">
                                      {log.type === 'note' ? 'description' : log.type === 'task' ? 'check_circle' : 'forum'}
                                    </span>
                                  </div>
                                </div>
                                <div className="pt-2">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-sm font-black text-slate-900">{log.user}</span>
                                    <span className="text-xs text-slate-500 font-medium">{log.action}</span>
                                    {log.target && (
                                      <span className="text-xs font-black text-slate-900">
                                        {log.target}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{log.time}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <TaskPage 
                      projectId={selectedClient ? `client-${selectedClient.id}` : undefined}
                      onTabChange={(tab) => {
                        if (tab === 'tasks') setActiveTab('tasks');
                        else if (tab === 'files') setActiveTab('files');
                        else if (tab === 'notes') setActiveTab('notes');
                      }} 
                    />
                  )}

                  {/* TAB: FILES */}
                  {activeTab === 'files' && (
                    <div className="flex-1 min-h-[500px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                          <FolderOpen size={20} className="fill-current/20" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">Client Files</h3>
                          <p className="text-sm text-slate-500">Manage documents, assets, and deliverables</p>
                        </div>
                      </div>
                      {/* Explorer */}
                      <div className="flex-1 relative overflow-hidden bg-white min-h-[600px] h-full flex flex-col">
                        <TabbedFileExplorer sessionId={`CLIENT_${selectedClient.id}`} rootPath="GLOBAL" />
                      </div>
                    </div>
                  )}

                  {/* TAB: FINANCIALS */}
                  {activeTab === 'financials' && (
                    <div className="space-y-6 px-8 py-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900">Financial Statement</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Track billing parameters, total contract values, and outstanding logs</p>
                        </div>
                        <button
                          onClick={() => setIsInvoiceModalOpen(true)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <DollarSign className="size-3.5" /> Log Invoice
                        </button>
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-800 shadow-sm shrink-0">
                            <TrendingUp className="size-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Contract Value</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                              ${selectedClient.totalVolume.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-800 shadow-sm shrink-0">
                            <DollarSign className="size-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Due</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                              ${selectedClient.outstandingAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-800 shadow-sm shrink-0">
                            <Calendar className="size-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Cycle Maturity</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                              {selectedClient.outstandingPending ? `${selectedClient.outstandingDueDays} Days Remaining` : 'No Pendings'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contract history */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-6">
                        <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Billing Entries Directory</h4>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-500">
                            <thead className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-150">
                              <tr>
                                <th className="pb-3">Transaction</th>
                                <th className="pb-3">Type</th>
                                <th className="pb-3">Maturity Status</th>
                                <th className="pb-3 text-right">Invoice Volume</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="py-3 font-bold text-slate-800">System Integration Kickoff</td>
                                <td className="py-3 font-medium">Core Scope Build</td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 bg-green-50 text-green-700 font-extrabold uppercase rounded">Settled</span>
                                </td>
                                <td className="py-3 text-right font-bold text-slate-900">
                                  ${(selectedClient.totalVolume - selectedClient.outstandingAmount).toLocaleString()}
                                </td>
                              </tr>
                              {selectedClient.outstandingAmount > 0 && (
                                <tr>
                                  <td className="py-3 font-bold text-slate-800">Phase 2 Audit Deliverable</td>
                                  <td className="py-3 font-medium">Cycle Assessment</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-extrabold uppercase rounded">Pending Maturity</span>
                                  </td>
                                  <td className="py-3 text-right font-bold text-slate-900">
                                    ${selectedClient.outstandingAmount.toLocaleString()}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: NOTES */}
                  {activeTab === 'notes' && (
                    <div className="space-y-6 px-8 py-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900">Client Logs</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Log meeting minutes, strategy ideas, and feedback reports for continuous reference</p>
                        </div>
                        <button
                          onClick={() => setIsNoteModalOpen(true)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="size-3.5" /> Record Log Note
                        </button>
                      </div>

                      {/* Displaying all client notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientNotes.length === 0 ? (
                          <div className="col-span-2 p-12 bg-slate-50 text-center border text-slate-400 text-xs rounded-2xl">
                            No notes logged for this client yet. Create one above!
                          </div>
                        ) : (
                          clientNotes.map(note => (
                            <div
                              key={note.id}
                              className={`p-5 rounded-2xl border shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-shadow ${note.type === 'Meeting'
                                ? 'bg-amber-50/70 border-amber-100 text-amber-900'
                                : note.type === 'Idea'
                                  ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
                                  : note.type === 'Feedback'
                                    ? 'bg-green-50/70 border-green-100 text-green-900'
                                    : 'bg-red-50/70 border-red-100 text-red-900'
                                }`}
                            >
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-black/5"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-white text-[9px] font-black uppercase tracking-wider border border-black/5 shadow-sm">
                                    {note.type}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold leading-relaxed mb-4">{note.content}</p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-auto">
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="font-bold text-slate-800">{note.authorInitials}</span>
                                  <span className="text-slate-400">{note.timeText}</span>
                                </div>
                                <div className="flex gap-1">
                                  {(note.tags || []).map(t => (
                                    <span key={t} className="text-[9px] font-extrabold uppercase bg-white/50 px-1 py-0.5 rounded">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: PROJECTS */}
                  {activeTab === 'projects' && (
                    <div className='px-8 py-6'>
                      <ProjectsPage
                        clientName={selectedClient.name}
                        onNewProject={onNewProject}
                        onEditProject={onEditProject}
                        onProjectClick={onProjectClick}
                      />
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              <div className="h-20"></div>
            </div>

            {/* Backdrop overlay to dismiss list */}
            {isQuickActionsOpen && (
              <div
                className="fixed inset-0 z-20 cursor-default bg-black/10"
                onClick={() => setIsQuickActionsOpen(false)}
              />
            )}

            {/* Float Action Button (FAB) in the corner */}
            <div className="absolute bottom-8 right-8 z-30">
              <button
                onClick={() => setIsQuickActionsOpen(prev => !prev)}
                className="w-14 h-14 bg-slate-950 dark:bg-slate-950 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <span className={`material-symbols-outlined text-2xl transition-transform duration-300 font-bold ${isQuickActionsOpen ? 'rotate-45' : ''}`}>add</span>
              </button>

              {/* Dropdown Options (Quick Actions Menu) */}
              <div
                className={`absolute bottom-16 right-0 w-[320px] sm:w-[350px] bg-white border border-slate-200/90 rounded-2xl shadow-soft flex flex-col py-1.5 origin-bottom-right z-30 transition-all duration-200 ${isQuickActionsOpen
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
              >
                <button
                  onClick={() => {
                    setIsAppointmentModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">calendar_today</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Book appointment</h3>
                    <p className="text-xs text-slate-400 font-display">Request appointment with client</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsTagsModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">local_offer</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Add or edit tags</h3>
                    <p className="text-xs text-slate-400 font-display">Manage project and client categorization tags</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsInvoiceModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">receipt_long</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Create invoice</h3>
                    <p className="text-xs text-slate-400 font-display">Create and send invoice to client</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsNoteModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">note_add</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Add note</h3>
                    <p className="text-xs text-slate-400 font-display">Create note for you and your team</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsTaskModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">check_circle</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Create task</h3>
                    <p className="text-xs text-slate-400 font-display">Add a task to this client</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">file_upload</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Upload files</h3>
                    <p className="text-xs text-slate-400 font-display">Upload files related to this client</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsDocAttachModalOpen(true);
                    setIsQuickActionsOpen(false);
                  }}
                  className="group flex items-start w-full px-5 py-3 hover:bg-slate-50 transition-colors duration-150 text-left focus:outline-none focus:bg-slate-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform duration-200">description</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5 font-display">Attach documents</h3>
                    <p className="text-xs text-slate-400 font-display">Add agreements and intake forms</p>
                  </div>
                </button>

                {/* Decorative ambient blurred backing shapes */}
                <div className="absolute -z-10 top-0 right-0 w-44 h-44 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl opacity-30 transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute -z-10 bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-yellow-100 to-transparent rounded-full blur-3xl opacity-30 transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* DIALOG 1: Record Invoice Modal */}
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
      {isInvoiceModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 flex-row">
                <DollarSign className="size-4" /> Log Billing Invoice
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleRecordInvoiceDetails} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Invoice Dollar Amount ($)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold text-slate-900"
                  placeholder="e.g. 2400"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Days Until Maturity</label>
                <select
                  value={invoiceDueDays}
                  onChange={e => setInvoiceDueDays(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold text-slate-900"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md mt-6"
              >
                Issue and Sync
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG 2: Create Note Modal */}
      {isNoteModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900">Record Log Note</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAddNoteDetails} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Log Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Meeting', 'Idea', 'Feedback', 'Urgent'] as const).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNoteType(cat)}
                      className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all ${noteType === cat
                        ? 'bg-slate-950 text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Note Narrative Content</label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none font-semibold h-24"
                  placeholder="Record discussion points or internal directives..."
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={noteTags}
                  onChange={e => setNoteTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none font-semibold"
                  placeholder="e.g. Audit, Q3, Strategic"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md mt-6"
              >
                Log Operational Entry
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG 3: Create Task Modal */}
      {isTaskModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900">Create New Assignment</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAddTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none font-semibold"
                  placeholder="e.g. Design homepage concepts"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Phase / Category</label>
                <input
                  type="text"
                  value={taskPhase}
                  onChange={e => setTaskPhase(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none font-semibold"
                  placeholder="e.g. Redesign, Development"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Due Date Label</label>
                <input
                  type="text"
                  value={taskDueText}
                  onChange={e => setTaskDueText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none font-semibold"
                  placeholder="e.g. Due in 5 days, Wed 20 Oct"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md mt-6"
              >
                Schedule Assignment
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG 4: Book Appointment Modal */}
      {isAppointmentModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl">calendar_today</span> Schedule Appointment
              </h3>
              <button onClick={() => setIsAppointmentModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Appointment Objective / Topic</label>
                <input
                  type="text"
                  value={appointmentTopic}
                  onChange={e => setAppointmentTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none font-semibold"
                  placeholder="e.g. Audit Review Strategy Planning"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Assigned Consultant / Expert</label>
                <select
                  value={appointmentExpert}
                  onChange={e => setAppointmentExpert(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none font-semibold"
                >
                  <option value="Leslie Alexander">Leslie Alexander (Expert Designer)</option>
                  <option value="Bessie Cooper">Bessie Cooper (Technical Architect)</option>
                  <option value="Marvin McKinney">Marvin McKinney (Senior Auditor)</option>
                  <option value="Theresa Webb">Theresa Webb (Financial Lead)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Meeting Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Meeting Time</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md mt-6"
              >
                Book Cal.com Session
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG 5: Manage Brand Tags Sidebar */}
      <ManageTagsSidebar
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        title={`Brand Tags for ${selectedClient.name}`}
        subtitle="Tag branding or service levels"
        defaultLabels={['GOVERNMENT', 'STRATEGIC', 'FINTECH', 'DESIGN', 'RETAINER', 'ENTERPRISE', 'PROSPECT', 'TIER 1']}
        isMulti={true}
        selectedTags={selectedClient.tags || []}
        onSelectTags={handleSaveTags}
        listTitle="Active Tags"
        searchPlaceholder="Search active tags..."
        showOnlySelected={true}
      />

      {/* DIALOG 6: Attach Documents Modal */}
      {isDocAttachModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl">description</span> Attach Regulatory Document
              </h3>
              <button onClick={() => setIsDocAttachModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Select a professional template or compliance form to instantly compile and attach to the client's asset vault:</p>
              {[
                { name: 'Mutual Non-Disclosure Agreement (NDA).pdf', type: 'pdf' as const },
                { name: 'Master Services Agreement (MSA) v4.pdf', type: 'pdf' as const },
                { name: 'Client Onboarding Workbook.doc', type: 'doc' as const },
                { name: 'Standard Risk Assessments Questionnaire.pdf', type: 'pdf' as const },
                { name: 'Q4 Treasury Scope of Work (SOW).pdf', type: 'pdf' as const }
              ].map((doc) => (
                <button
                  key={doc.name}
                  onClick={() => handleAttachDocument(doc.name, doc.type)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 text-left transition-all group focus:outline-none"
                >
                  <div className="flex items-center gap-3 font-display">
                    <span className="material-symbols-outlined text-accent text-xl">insert_drive_file</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{doc.name}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/5 px-2 py-0.5 rounded-md">Attach</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <AssignedExpertsSidebar
        isOpen={isExpertsSidebarOpen}
        onClose={() => setIsExpertsSidebarOpen(false)}
        initialAssigned={activeExperts.assigned}
        initialAvailable={activeExperts.available}
        onSave={handleSaveExperts}
      />

    </div>
  );
};
