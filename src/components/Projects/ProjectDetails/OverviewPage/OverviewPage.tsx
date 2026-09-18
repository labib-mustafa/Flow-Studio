import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjectStore } from '../../../../stores/projectStore';
import { useTaskStore } from '../../../../stores/taskStore';
import { useClientStore } from '../../../../stores/clientStore';
import { prompt } from '../../../../stores/promptStore';
import { DatePickerInput } from '../../../ui/DatePickerInput';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit2, Calendar, CheckCircle2, Clock, Tag, Plus, X,
  Image as ImageIcon, Sparkles, Building2, Layers,
  ArrowUpRight, ExternalLink, FileText, Palette, TrendingUp, AlertCircle,
  ChevronDown, Upload, Trash2
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { currentProject, updateProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setFormData(prev => ({
          ...prev,
          thumbnail: base64Url,
          image: base64Url
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    } else {
      const url = e.dataTransfer.getData('text/plain');
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
        setFormData(prev => ({
          ...prev,
          thumbnail: url,
          image: url
        }));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  React.useEffect(() => {
    if (isEditing) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isEditing]);

  const [formData, setFormData] = useState({ ...currentProject });

  // Autocomplete suggestions for clients
  const { clients } = useClientStore();
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const clientDropdownRef = React.useRef<HTMLDivElement>(null);

  const activeClients = React.useMemo(() => {
    return (clients || []).filter(c => c.status === 'Active');
  }, [clients]);

  const filteredClients = React.useMemo(() => {
    const query = (formData.client || '').toLowerCase().trim();
    if (!query) return activeClients;
    return activeClients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.company && c.company.toLowerCase().includes(query))
    );
  }, [activeClients, formData.client]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (!isEditing) {
      setShowClientSuggestions(false);
    }
  }, [isEditing]);

  const handleSelectClient = (clientName: string) => {
    setFormData(prev => ({ ...prev, client: clientName }));
    setShowClientSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showClientSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowClientSuggestions(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (filteredClients.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % filteredClients.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredClients[focusedIndex];
      if (selected) {
        handleSelectClient(selected.company || selected.name);
      }
    } else if (e.key === 'Escape') {
      setShowClientSuggestions(false);
    }
  };

  React.useEffect(() => {
    if (currentProject) {
      setFormData({ ...currentProject });
      setImageError(false);
    }
  }, [currentProject]);

  const projectTasks = React.useMemo(() => {
    if (!currentProject || !currentProject.id) return [];
    return (tasks || []).filter((t) => t.projectId === currentProject.id);
  }, [tasks, currentProject?.id]);

  const completedTasksCount = React.useMemo(() => {
    return projectTasks.filter((t) => t.phase === 'done' || t.status === 'Complete').length;
  }, [projectTasks]);

  const computedCompletion = React.useMemo(() => {
    if (projectTasks.length === 0) return currentProject?.completion || currentProject?.progress || 0;
    return Math.round((completedTasksCount / projectTasks.length) * 100);
  }, [projectTasks.length, completedTasksCount, currentProject?.completion, currentProject?.progress]);

  // Calculate days remaining dynamically
  const daysRemaining = React.useMemo(() => {
    if (!currentProject?.deadline) return null;
    const target = new Date(currentProject.deadline).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [currentProject?.deadline]);

  const handleSave = () => {
    updateProject({
      ...formData,
      completion: computedCompletion,
      progress: computedCompletion
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (currentProject) setFormData({ ...currentProject });
    setIsEditing(false);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !currentProject) return;
    const currentTags = currentProject.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      updateProject({
        ...currentProject,
        tags: [...currentTags, newTagInput.trim()]
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!currentProject) return;
    const currentTags = currentProject.tags || [];
    updateProject({
      ...currentProject,
      tags: currentTags.filter(t => t !== tagToRemove)
    });
  };

  if (!currentProject) return null;

  const bannerUrl = currentProject.thumbnail || currentProject.image;
  const projectName = currentProject.name || currentProject.title || 'Untitled Project';

  const getStatusBadgeStyle = (status: string = '') => {
    const s = status.toLowerCase();
    if (s.includes('plan')) {
      return { bg: 'bg-slate-850 text-slate-100', dot: 'bg-slate-400' };
    }
    if (s.includes('progress') || s.includes('active')) {
      return { bg: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500 animate-pulse' };
    }
    if (s.includes('complete') || s.includes('done')) {
      return { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
    }
    if (s.includes('review')) {
      return { bg: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' };
    }
    return { bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
  };

  const statusStyle = getStatusBadgeStyle(currentProject.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.08, ease: [0.16, 1, 0.3, 1] }}
      id="project-overview-container"
      className="relative flex-1 overflow-y-auto custom-scrollbar bg-slate-50/60"
    >
      {/* Design Read Header / Command Bar */}
      <div className="px-8 py-6 space-y-8">

        {/* Top Header Command Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-8 py-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${statusStyle.bg}`}>
              <span className={`size-2 rounded-full ${statusStyle.dot}`} />
              {currentProject.status || 'Active'}
            </span>
            <span className="h-4 w-px bg-slate-200 hidden sm:block" />
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {projectName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
              <Building2 className="size-3.5 text-slate-400" />
              {currentProject.client || 'Internal Client'}
            </span>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-98 shrink-0"
          >
            <Edit2 className="size-3.5 text-zinc-400" />
            Edit Project Details
          </button>
        </div>

        {/* Asymmetrical Bento Grid Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* TILE 1: Visual Showcase & Banner (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between group">
            <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {bannerUrl && !imageError ? (
                <>
                  <img
                    src={bannerUrl}
                    alt={projectName}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent opacity-90 transition-opacity" />

                  <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30 backdrop-blur-md">
                          Visual Showcase
                        </span>
                        {currentProject.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
                            {currentProject.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                        {projectName}
                      </h2>
                    </div>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-md border border-white/20 transition-all self-start sm:self-end shrink-0"
                    >
                      Change Cover <ArrowUpRight className="size-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                /* Premium Empty/Error Banner State */
                <div className="w-full h-full bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-200/50 flex flex-col items-center justify-center text-slate-400 p-8 text-center border border-dashed border-slate-300 rounded-2xl">
                  <div className="size-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-slate-400 group-hover:scale-110 group-hover:text-zinc-900 transition-all duration-300">
                    {imageError ? <AlertCircle className="size-8 text-red-500" /> : <ImageIcon className="size-8" />}
                  </div>
                  <span className="text-base font-bold text-slate-800 mb-1">
                    {imageError ? 'Failed to Load Cover Banner' : 'No Cover Banner Uploaded'}
                  </span>
                  <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                    {imageError
                      ? 'The image URL could not be retrieved. It may be broken, offline, or restricted.'
                      : 'Personalize your command center by adding a branded hero image, Figma preview, or moodboard visual.'}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    {imageError ? (
                      <>
                        <Edit2 className="size-3.5 text-blue-400" /> Edit Cover Banner
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5 text-emerald-400" /> Upload Project Banner
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TILE 2: Velocity & Timeline Cockpit (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between border border-zinc-800">
            <div className="absolute -right-10 -top-10 size-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-400" /> Velocity Pulse
                </span>
                <span className="text-4xl font-black tabular-nums tracking-tight text-white">{computedCompletion}%</span>
              </div>

              <div className="space-y-2">
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${computedCompletion}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-zinc-400">
                  <span>{completedTasksCount} done</span>
                  <span>{projectTasks.length - completedTasksCount} remaining</span>
                </div>
              </div>
            </div>

            {/* Timeline Countdown Indicator */}
            <div className="pt-6 border-t border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <Clock className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-zinc-200">Target Launch</span>
                    <span className="text-[11px] text-zinc-500">
                      {currentProject.deadline ? new Date(currentProject.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                    </span>
                  </div>
                </div>

                {daysRemaining !== null && (
                  <div className={`text-right px-3 py-1.5 rounded-xl border ${daysRemaining < 0 ? 'bg-red-950/50 border-red-800/60 text-red-300' : daysRemaining <= 7 ? 'bg-amber-950/50 border-amber-800/60 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
                    <span className="text-xs font-bold block tabular-nums">
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? 'Due Today' : `${daysRemaining}d left`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TILE 3: Live Deliverables & Recent Tasks Stream (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-blue-600" /> Active Deliverables Stream
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live snapshot of tasks currently running on this project.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {projectTasks.length} total
                </span>
              </div>

              {projectTasks.length > 0 ? (
                <div className="space-y-3">
                  {projectTasks.slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-2.5 rounded-full shrink-0 ${task.phase === 'done' || task.status === 'Complete' ? 'bg-emerald-500' : task.phase === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className={`text-xs font-semibold truncate ${task.phase === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {task.phase?.replace('_', ' ') || task.status || 'To Do'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {projectTasks.length > 4 && (
                    <p className="text-center text-xs font-semibold text-slate-400 pt-2">
                      + {projectTasks.length - 4} more tasks tracked in Tasks Tab
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="size-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-700 block">No Deliverables Logged</span>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">Switch to the Tasks tab above to assign tasks and milestones to your team.</p>
                </div>
              )}
            </div>
          </div>

          {/* TILE 4: Taxonomy & Quick Deliverable Shortcuts (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">

              {/* Quick Links / Deliverables Shortcuts */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Palette className="size-4 text-purple-600" /> Deliverables & Shortcuts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      let url = (currentProject as any).figmaUrl;
                      if (!url) {
                        url = await prompt.show({
                          title: 'Link Figma Master File',
                          description: 'Enter the Figma canvas or document URL',
                          placeholder: 'https://figma.com/file/...',
                          confirmText: 'Link File'
                        });
                      }
                      if (url && url.trim()) {
                        updateProject(currentProject.id, { figmaUrl: url.trim() } as any);
                        window.open(url.trim(), '_blank');
                      }
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 border border-purple-200/60 text-purple-900 text-xs font-semibold transition-colors group text-left w-full cursor-pointer"
                  >
                    <Palette className="size-4 text-purple-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{(currentProject as any).figmaUrl ? "Open Figma Master" : "Link Figma Master File"}</span>
                    <ExternalLink className="size-3 text-purple-400 ml-auto shrink-0" />
                  </button>
                  <button
                    onClick={async () => {
                      let url = (currentProject as any).briefUrl;
                      if (!url) {
                        url = await prompt.show({
                          title: 'Link Client Brief Document',
                          description: 'Enter the URL for Google Docs, Notion, or Brief file',
                          placeholder: 'https://docs.google.com/document/d/...',
                          confirmText: 'Link Document'
                        });
                      }
                      if (url && url.trim()) {
                        updateProject(currentProject.id, { briefUrl: url.trim() } as any);
                        window.open(url.trim(), '_blank');
                      }
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/60 text-blue-900 text-xs font-semibold transition-colors group text-left w-full cursor-pointer"
                  >
                    <FileText className="size-4 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{(currentProject as any).briefUrl ? "Open Client Brief" : "Link Client Brief Docs"}</span>
                    <ExternalLink className="size-3 text-blue-400 ml-auto shrink-0" />
                  </button>
                </div>
              </div>

              {/* Taxonomy Manager */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="size-3.5 text-slate-400" /> Active Taxonomy Labels
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {(currentProject.tags || []).length} tags
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentProject.tags || []).length > 0 ? (
                    (currentProject.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 transition-colors group"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-red-500 transition-colors rounded-full focus:outline-none ml-1"
                          title="Remove label"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No custom taxonomy labels added yet.</span>
                  )}
                </div>

                {/* Tag Input Form */}
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Add label..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newTagInput.trim()}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="size-3.5" /> Add
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Sleek Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px] animate-fade-in">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={handleCancel}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white w-full max-w-2xl shadow-2xl rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Edit Project Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Update project attributes, status, and banner visuals.</p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={formData.name || formData.title || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value, title: e.target.value })}
                      placeholder="Enter project title..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative" ref={clientDropdownRef}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Client Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={formData.client || ''}
                          onChange={e => {
                            setFormData({ ...formData, client: e.target.value });
                            setShowClientSuggestions(true);
                            setFocusedIndex(0);
                          }}
                          onFocus={() => {
                            setShowClientSuggestions(true);
                            setFocusedIndex(0);
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Client or organization"
                          className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowClientSuggestions(!showClientSuggestions)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                          title="Toggle clients list"
                        >
                          <ChevronDown className={`size-4 transition-transform duration-250 ${showClientSuggestions ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Suggestions dropdown */}
                      <AnimatePresence>
                        {showClientSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {filteredClients.length > 0 ? (
                              <div className="py-1.5 divide-y divide-slate-100/60">
                                {filteredClients.map((client, idx) => {
                                  const isHighlighted = idx === focusedIndex;
                                  const displayName = client.company || client.name;
                                  return (
                                    <button
                                      key={client.id}
                                      type="button"
                                      onClick={() => handleSelectClient(displayName)}
                                      onMouseEnter={() => setFocusedIndex(idx)}
                                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${isHighlighted ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                                        }`}
                                    >
                                      {client.avatarUrl ? (
                                        <img
                                          src={client.avatarUrl}
                                          alt={client.name}
                                          className="size-8 rounded-full object-cover shrink-0 border border-slate-100"
                                        />
                                      ) : (
                                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${client.avatarBg || 'bg-slate-100 text-slate-700'}`}>
                                          {client.initials || client.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                          {client.company || client.name}
                                        </p>
                                        {client.company && (
                                          <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                                            Contact: {client.name}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="px-4 py-6 text-xs text-slate-400 text-center font-medium">
                                No active clients match "{formData.client}"
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Deadline</label>
                      <DatePickerInput
                        value={formData.deadline || ''}
                        onChange={val => setFormData({ ...formData, deadline: val })}
                        placeholder="Select target deadline..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Project Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Active', 'In Progress', 'On Hold', 'Completed'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s })}
                          className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${formData.status === s ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Banner Image</label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${isDragging
                        ? 'border-zinc-950 bg-zinc-50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                    >
                      {formData.thumbnail || formData.image ? (
                        <div className="w-full relative rounded-xl overflow-hidden aspect-[3/1] border border-slate-200 group/preview">
                          <img
                            src={formData.thumbnail || formData.image}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, thumbnail: '', image: '' }))}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all active:scale-95"
                              title="Remove Banner"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <div className="size-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
                            <Upload className="size-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 mb-1">
                            Drag & drop an image here
                          </span>
                          <span className="text-[10px] text-slate-500">
                            or click to browse local files (PNG, JPG, SVG)
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Or enter Image URL</label>
                      <input
                        type="text"
                        value={formData.thumbnail || formData.image || ''}
                        onChange={e => setFormData({ ...formData, thumbnail: e.target.value, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">Leave blank to display the project cover empty state.</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};


