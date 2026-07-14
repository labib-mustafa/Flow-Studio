import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore } from '../../stores/teamStore';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { TaskList } from '../GlobalComponents/Pages/TaskPage/TaskList';
import { PillTab } from '../GlobalComponents/PillTab';
import { EditMemberModal } from './EditMemberModal';
import { ProjectCard } from '../Projects/ProjectOverview/ProjectCard';
import {
  Edit2, Calendar, CheckCircle2, Clock, Tag, Plus, X,
  Sparkles, Building2, Layers, ArrowUpRight, ExternalLink,
  FileText, Palette, TrendingUp, AlertCircle, Mail, Phone, Briefcase, MapPin,
  Send, MessageCircle, MoreHorizontal, Award, GraduationCap, MapPin as MapPinIcon, Link as LinkIcon,
  ChevronLeft, ChevronRight, Folder
} from 'lucide-react';

interface MemberDetailsPageProps {
  memberId: string | null;
  onBack: () => void;
  onProjectClick?: () => void;
}

export const MemberDetailsPage: React.FC<MemberDetailsPageProps> = ({ memberId, onBack, onProjectClick }) => {
  const { members, updateMember, deleteMember } = useTeamStore();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects'>('overview');

  const isFullPageTab = activeTab === 'tasks' || activeTab === 'projects';
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [focusInput, setFocusInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newCertInput, setNewCertInput] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Messaging UI State
  const [messageInput, setMessageInput] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'me' | 'them', time: string }[]>([
    { id: '1', text: 'Hey, are you available for a quick sync on the new dashboard?', sender: 'me', time: '10:00 AM' },
    { id: '2', text: 'Sure! Give me 5 minutes to wrap up this PR.', sender: 'them', time: '10:02 AM' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const member = members.find((m) => m.id === memberId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!member) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-12 text-center">
        <AlertCircle className="size-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Team Member Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">The requested member details could not be retrieved.</p>
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
        >
          ← Return to Team Directory
        </button>
      </div>
    );
  }

  const memberTasks = (tasks || []).filter((t) =>
    t.assignees?.some((a) => a.name.toLowerCase() === member.name.toLowerCase() || a.id === member.id)
  );

  const memberProjects = projects.filter((proj) =>
    (member.assignedProjects || []).some(
      (ap) => ap === proj.id || ap === proj.name || ap === proj.title
    )
  );

  const handleSaveFocus = () => {
    updateMember(member.id, { activeFocus: focusInput.trim() || '🎯 Collaborating on core project initiatives' });
    setIsEditingFocus(false);
  };

  const handleStartEditFocus = () => {
    setFocusInput(member.activeFocus || '🎯 Collaborating on core project initiatives');
    setIsEditingFocus(true);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const currentSkills = member.skills || [];
    if (!currentSkills.includes(newSkillInput.trim())) {
      updateMember(member.id, { skills: [...currentSkills, newSkillInput.trim()] });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = member.skills || [];
    updateMember(member.id, { skills: currentSkills.filter(s => s !== skillToRemove) });
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertInput.trim()) return;
    const currentCerts = member.certificates || [];
    if (!currentCerts.includes(newCertInput.trim())) {
      updateMember(member.id, { certificates: [...currentCerts, newCertInput.trim()] });
    }
    setNewCertInput('');
  };

  const handleRemoveCert = (certToRemove: string) => {
    const currentCerts = member.certificates || [];
    updateMember(member.id, { certificates: currentCerts.filter(c => c !== certToRemove) });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateMember(member.id, { profilePic: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveMember = () => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from the team directory?`)) {
      deleteMember(member.id);
      onBack();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: messageInput.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessageInput('');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-blue-100 text-blue-500 border-blue-300';
      case 'Admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Manager': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Designer': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Developer': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };



  const toggleProject = (projId: string) => {
    const assigned = member.assignedProjects || [];
    const newAssigned = assigned.includes(projId) ? assigned.filter(id => id !== projId) : [...assigned, projId];
    updateMember(member.id, { assignedProjects: newAssigned });
  };

  const cubicTransition = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.4 };

  const bannerGradient = member.department.toLowerCase().includes('design')
    ? 'from-indigo-100 via-purple-100 to-pink-100'
    : member.department.toLowerCase().includes('engineer')
      ? 'from-emerald-100 via-teal-100 to-cyan-100'
      : 'from-slate-200 via-slate-100 to-zinc-200';

  return (
    <div id="member-details-layout" className="flex-1 h-screen relative bg-[#f5f5f7] flex flex-col overflow-hidden text-left z-10">

      {/* Fixed Header (same as Project Details Page) */}
      <div className="bg-white border-b border-slate-200/80 shrink-0 flex flex-col z-20 px-10">
        <div id="member-navigation-tabs" className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
          <button 
            onClick={onBack}
            className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group mr-1 shrink-0 cursor-pointer"
            title="Back to Team Directory"
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


          <div className="flex items-center gap-1.5 shrink-0">
            <PillTab label="Overview" icon="person" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <PillTab label="Tasks" icon="task_alt" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} counter={memberTasks.length} />
            <PillTab label="Projects" icon="folder" isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} counter={memberProjects.length} />
          </div>
        </div>
      </div>

      {/* Split Layout: Main Content + Right Messaging Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scrollable Content Area */}
        <main
          id="member-main-content"
          className={`flex-1 flex flex-col ${
            isFullPageTab
              ? 'bg-white overflow-hidden h-full'
              : 'overflow-y-auto bg-[#f5f5f7] custom-scrollbar'
          }`}
        >

          {/* Dynamic Tab Content Container */}
          <div className={`flex-1 ${isFullPageTab ? 'flex flex-col h-full' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={cubicTransition}
                className={isFullPageTab ? 'flex-1 flex flex-col h-full' : ''}
              >

                {/* OVERVIEW TAB: Social Media Profile UI + Messaging UI + Right Details */}
                {activeTab === 'overview' && (
                  <div className="max-w-[1080px] mx-auto w-full space-y-4 px-8 py-6">
                    {/* The Cover Banner & Double Bezel Profile embedded inside Overview */}
                    <div className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden flex flex-col relative">

                      {/* Banner */}
                      <div className="relative w-full h-40 md:h-52 shrink-0 bg-slate-100 overflow-hidden">
                        {member.banner ? (
                          <img src={member.banner} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${bannerGradient} opacity-90`}>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                            <div className="absolute top-[-20%] right-[10%] w-96 h-96 bg-white/30 blur-3xl rounded-full pointer-events-none"></div>
                            <div className="absolute bottom-[-10%] left-[20%] w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
                          </div>
                        )}
                      </div>

                      {/* Header Details */}
                      <div className="px-6 md:px-10 pb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">

                          {/* Overlapping Profile Picture */}
                          <div className="relative -mt-16 md:-mt-20 size-28 md:size-36 rounded-full bg-white p-1.5 shadow-sm border border-slate-100 group shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                              {member.profilePic ? (
                                <img src={member.profilePic} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400 bg-slate-50">
                                  {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pb-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2 mt-6">{member.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600 font-medium mb-3">
                              <span className="flex items-center gap-1.5"><Briefcase className="size-4" /> {member.role} at Flow Studio</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
                              <span className="flex items-center gap-1.5"><MapPinIcon className="size-4" /> Remote</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors w-fit">
                              Contact info
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pb-1 w-full md:w-auto">
                          <button className="flex-1 md:flex-none px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                            <MessageCircle className="size-4" /> Message
                          </button>
                          <button onClick={() => setIsEditModalOpen(true)} className="size-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 8/4 Layout inside Overview */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 overflow-hidden">

                      {/* LEFT (8 cols): Bio, Skills, Certificates */}
                      <div className="lg:col-span-8 p-6 lg:p-8 space-y-6 divide-y divide-slate-100">

                        {/* Bio & Experience */}
                        <div className="pb-6">
                          <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Experience & Bio</h2>
                          <p className="text-sm text-slate-600 leading-relaxed mb-6">
                            {member.bio || 'This member has not written a bio yet.'}
                          </p>
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="size-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                              <Building2 className="size-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{member.role}</h3>
                              <p className="text-sm text-slate-600">Flow Studio • Full-time</p>
                              <p className="text-xs text-slate-400 mt-1">Joined {member.joinDate}</p>
                            </div>
                          </div>
                        </div>

                        {/* Skills & Certificates */}
                        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                          {/* Skills */}
                          <div className="flex flex-col pr-0 sm:pr-6 pb-6 sm:pb-0">
                            <h2 className="text-base font-bold text-slate-900 mb-4">Skills</h2>
                            <div className="flex flex-wrap gap-2 mb-6 flex-1">
                              {(member.skills || []).length > 0 ? (
                                (member.skills || []).map((skill, index) => (
                                  <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">
                                    {skill}
                                    <button onClick={() => handleRemoveSkill(skill)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="size-3" /></button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-400 italic">No skills listed.</span>
                              )}
                            </div>
                            <form onSubmit={handleAddSkill} className="flex gap-2">
                              <input
                                type="text"
                                value={newSkillInput}
                                onChange={(e) => setNewSkillInput(e.target.value)}
                                placeholder="Add a skill..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                              <button type="submit" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"><Plus className="size-4" /></button>
                            </form>
                          </div>

                          {/* Certificates */}
                          <div className="flex flex-col pl-0 sm:pl-6 pt-6 sm:pt-0">
                            <h2 className="text-base font-bold text-slate-900 mb-4">Certifications</h2>
                            <div className="space-y-4 mb-6 flex-1">
                              {(member.certificates || []).length > 0 ? (
                                (member.certificates || []).map((cert, index) => (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className="mt-0.5 size-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                      <Award className="size-3.5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{cert}</h4>
                                      <p className="text-[10px] text-slate-500 mt-0.5">Verified</p>
                                    </div>
                                    <button onClick={() => handleRemoveCert(cert)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0"><X className="size-3.5" /></button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-sm text-slate-400 italic block">No certifications.</span>
                              )}
                            </div>
                            <form onSubmit={handleAddCert} className="flex gap-2">
                              <input
                                type="text"
                                value={newCertInput}
                                onChange={(e) => setNewCertInput(e.target.value)}
                                placeholder="Add cert..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                              <button type="submit" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"><Plus className="size-4" /></button>
                            </form>
                          </div>
                        </div>

                      </div>

                      {/* RIGHT (4 cols): Personal Details & Assigned Projects */}
                      <div className="lg:col-span-4 p-6 lg:p-8 space-y-6 divide-y divide-slate-100">

                        {/* Personal Details */}
                        <div className="pb-6 space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Details</h3>
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-2 border-b border-slate-100/80">
                              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="size-3.5" /> Email</span>
                              <a href={`mailto:${member.email}`} className="font-semibold text-blue-500 hover:underline">{member.email}</a>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100/80">
                              <span className="text-slate-500 flex items-center gap-1.5"><Phone className="size-3.5" /> Phone</span>
                              <span className="font-semibold text-slate-800">{member.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100/80">
                              <span className="text-slate-500 flex items-center gap-1.5"><Briefcase className="size-3.5" /> Department</span>
                              <span className="font-semibold text-slate-800">{member.department}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="size-3.5" /> Joined</span>
                              <span className="font-semibold text-slate-800">{member.joinDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Projects */}
                        <div className="pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Projects</h3>
                            <button
                              type="button"
                              onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
                              className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider"
                            >
                              Manage
                            </button>
                          </div>

                          {isProjectSelectorOpen && (
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                              {projects.map((proj) => {
                                const isAssigned = (member.assignedProjects || []).includes(proj.id);
                                return (
                                  <label key={proj.id} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => toggleProject(proj.id)}
                                      className="rounded border-slate-300 text-blue-500 focus:ring-blue-500/30 size-3.5"
                                    />
                                    {proj.name}
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          <div className="space-y-2">
                            {(member.assignedProjects || []).length > 0 ? (
                              projects
                                .filter((p) => (member.assignedProjects || []).includes(p.id))
                                .map((proj) => (
                                  <div key={proj.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/50 group">
                                    <span className="text-xs font-bold text-slate-800 truncate">{proj.name}</span>
                                    <button onClick={() => toggleProject(proj.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No projects assigned.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* TASKS TAB (Full width) */}
                {activeTab === 'tasks' && (
                  <div className="px-10 py-6 bg-white flex flex-col w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="flex-1 w-full overflow-x-auto">
                      {memberTasks.length > 0 ? (
                        <TaskList tasks={memberTasks} onAddTask={() => { }} onTaskClick={() => { }} />
                      ) : (
                        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 my-4">
                          <CheckCircle2 className="size-12 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-base font-bold text-slate-700">No Assigned Tasks</h4>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PROJECTS TAB (Full width) */}
                {activeTab === 'projects' && (
                  <div className="px-10 py-6 bg-white flex flex-col w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="flex-1 w-full">
                      {memberProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pb-24">
                          {memberProjects.map((project) => {
                            const projectTasks = (tasks || []).filter(t => t.projectId === project.id);
                            const totalTasks = projectTasks.length;
                            const doneTasks = projectTasks.filter(t => t.phase === 'done' || t.status === 'Complete').length;
                            const computedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                            return (
                              <ProjectCard
                                key={project.id}
                                image={project.image || project.thumbnail || ''}
                                category={project.category || ''}
                                status={project.status}
                                statusColor={project.statusColor || ''}
                                progress={computedProgress}
                                client={project.client}
                                title={project.title || project.name}
                                deadline={project.deadline}
                                isPortfolio={project.isPortfolio}
                                doneTasks={doneTasks}
                                tasksCount={totalTasks}
                                commentsCount={project.commentsCount || 0}
                                onClick={() => {
                                  useProjectStore.getState().setCurrentProject(project);
                                  if (onProjectClick) {
                                    onProjectClick();
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 my-4">
                          <Folder className="size-12 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-base font-bold text-slate-700">No Assigned Projects</h4>
                          <p className="text-xs text-slate-500 mt-1">This member is not assigned to any projects yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </motion.div>
            </AnimatePresence>
          </div>

        </main>

        {/* Right Messaging Sidebar */}
        {activeTab === 'overview' && (
          <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-80'} border-l border-slate-200 bg-white hidden lg:flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
          {isSidebarCollapsed ? (
            <div className="flex-1 flex flex-col items-center py-6 gap-6">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="size-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex-1 flex items-center justify-center w-full">
                <div className="rotate-90 origin-center whitespace-nowrap text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 select-none">
                  <MessageCircle className="size-3.5 text-blue-500 -rotate-90" /> Direct Message
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <MessageCircle className="size-4 text-blue-500 animate-pulse" /> Direct Message
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20 custom-scrollbar">
                {messages.map(msg => {
                  const isMe = msg.sender === 'me';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`px-3.5 py-2.5 max-w-[85%] rounded-[1.25rem] text-xs font-semibold leading-relaxed ${isMe
                        ? 'bg-blue-500 text-white rounded-tr-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                        }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full flex items-center justify-center transition-all ${messageInput.trim()
                      ? 'bg-blue-500 text-white hover:scale-105 active:scale-95 shadow-sm'
                      : 'bg-slate-100 text-slate-300'
                      }`}
                  >
                    <Send className="size-3.5 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
          </aside>
        )}
      </div>

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        memberId={member.id}
      />
    </div>
  );
};
