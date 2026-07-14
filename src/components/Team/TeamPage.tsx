import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore, TeamMember } from '../../stores/teamStore';
import { useProjectStore } from '../../stores/projectStore';
import { AddMemberModal } from './AddMemberModal';
import { InviteMemberModal } from './InviteMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { Users, Plus, UserPlus, Edit, Trash2, Folder } from 'lucide-react';
import { PillTab } from '../GlobalComponents/PillTab';

interface TeamPageProps {
  onSelectMember?: (memberId: string) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ onSelectMember }) => {
  const members = useTeamStore((state) => state.members);
  const invites = useTeamStore((state) => state.invites);
  const deleteMember = useTeamStore((state) => state.deleteMember);
  const revokeInvite = useTeamStore((state) => state.revokeInvite);
  const resendInvite = useTeamStore((state) => state.resendInvite);
  const updateMember = useTeamStore((state) => state.updateMember);
  const projects = useProjectStore((state) => state.projects);

  const [activeTab, setActiveTab] = useState<'directory' | 'invites'>('directory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredInvites = invites.filter((inv) =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleProject = (member: TeamMember, projectName: string) => {
    const current = member.assignedProjects || [];
    const exists = current.includes(projectName);
    const updated = exists
      ? current.filter((p) => p !== projectName)
      : [...current, projectName];
    updateMember(member.id, { assignedProjects: updated });
  };

  const handleMemberAdded = () => {
    setActiveTab('directory');
    setSearchQuery('');
    setRoleFilter('All');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-blue-50 text-blue-500 border-blue-200';
      case 'Admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Designer':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Developer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 h-screen relative bg-[#f5f5f7] flex flex-col overflow-hidden text-left z-10">

      {/* Header Banner */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-2 w-1/3">
          <Users className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Team & Workspace</h2>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative group w-full max-w-[320px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team..."
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
            onClick={() => setIsAddMemberModalOpen(true)}
            type="button"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-2 outline-none shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            Add Member
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            type="button"
            className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 outline-none border border-slate-950 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            Invite Member
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-scroll px-8 py-6 custom-scrollbar bg-[#f5f5f7]">
        <div className="w-full flex flex-col gap-6">

          {/* Controls Bar: Tabs & Search/Filter */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 align-top">
              <PillTab
                label="Directory"
                isActive={activeTab === 'directory'}
                onClick={() => setActiveTab('directory')}
                counter={members.length}
              />
              <PillTab
                label="Pending Invites"
                isActive={activeTab === 'invites'}
                onClick={() => setActiveTab('invites')}
                counter={invites.length}
              />
            </div>

            {/* Search and Layout switches */}
            <div className="flex items-center gap-3 h-[38px] shrink-0">
              {activeTab === 'directory' && (
                <>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center justify-between gap-2.5 pl-3.5 pr-2.5 bg-white border border-[#d1d5db] rounded-xl text-xs text-[#111111] font-bold focus:outline-none focus:border-slate-800 transition-all cursor-pointer h-[38px] leading-none shrink-0"
                    >
                      <span>{roleFilter === 'All' ? 'All Roles' : roleFilter}</span>
                      <span
                        className="material-symbols-outlined text-slate-500 pointer-events-none text-[16px] font-bold transition-transform duration-200 flex items-center justify-center"
                        style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        expand_more
                      </span>
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-full mt-1.5 w-28px rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl z-50 text-left"
                          >
                            {['All', 'Owner', 'Admin', 'Manager', 'Designer', 'Developer', 'Guest'].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  setRoleFilter(role);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${roleFilter === role
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                              >
                                {role === 'All' ? 'All Roles' : role}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center p-1 bg-[#f3f4f6] rounded-xl border border-[#e5e7eb] h-[38px] shrink-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      type="button"
                      title="Grid View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center h-full aspect-square text-[#6b7280] ${viewMode === 'grid' ? 'bg-white text-[#111111] shadow-sm' : 'hover:text-[#111111]'
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">grid_view</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      type="button"
                      title="Table View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center h-full aspect-square text-[#6b7280] ${viewMode === 'table' ? 'bg-white text-[#111111] shadow-sm' : 'hover:text-[#111111]'
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">table_rows</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab 1: Directory */}
          {activeTab === 'directory' && (
            <div>
              {filteredMembers.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[#d1d5db] rounded-2xl bg-[#f9fafb]">
                  <span className="material-symbols-outlined text-4xl text-[#9ca3af] mb-2">person_off</span>
                  <h3 className="text-sm font-semibold text-[#111111]">No team members found</h3>
                  <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
                    No directory members match your search query or role filter. Try broadening your criteria.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      layout
                      onClick={() => onSelectMember ? onSelectMember(member.id) : setSelectedMemberId(member.id)}
                      className="shadow-sm group rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between bg-white border-slate-200 hover:border-slate-400 hover:shadow-md cursor-pointer text-left"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="relative">
                            {member.profilePic ? (
                              <img
                                src={member.profilePic}
                                alt={member.name}
                                className="size-12 rounded-2xl object-cover shadow-sm border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="size-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 font-bold text-sm flex items-center justify-center shadow-sm">
                                {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full bg-emerald-500" title="Active" />
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeStyle(member.role)}`}>
                            {member.role}
                          </span>
                        </div>

                        <div className="flex-1 mt-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-xs font-semibold text-slate-400 mb-3">{member.email}</p>

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200">
                            {member.department}
                          </span>

                          <p className="text-xs text-slate-500 mt-4 line-clamp-2 leading-relaxed font-medium">
                            {member.bio || 'No professional bio added yet.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
                          <Folder className="size-3.5" />
                          <span>{member.assignedProjects?.length || 0} Project{member.assignedProjects?.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMemberId(member.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                            title="Edit member"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
                                deleteMember(member.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete member"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                          <th className="py-3.5 px-6">Member</th>
                          <th className="py-3.5 px-6">Role</th>
                          <th className="py-3.5 px-6">Department</th>
                          <th className="py-3.5 px-6">Projects</th>
                          <th className="py-3.5 px-6">Joined</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] text-xs">
                        {filteredMembers.map((member) => (
                          <tr
                            key={member.id}
                            onClick={() => onSelectMember ? onSelectMember(member.id) : setSelectedMemberId(member.id)}
                            className="hover:bg-[#f9fafb] transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {member.profilePic ? (
                                  <img
                                    src={member.profilePic}
                                    alt={member.name}
                                    className="w-9 h-9 rounded-full object-cover border border-[#e5e7eb]"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-[#f3f4f6] text-[#111111] font-bold text-xs flex items-center justify-center">
                                    {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[#111111] group-hover:text-blue-600 transition-colors">
                                    {member.name}
                                  </p>
                                  <p className="text-[#6b7280] text-[11px]">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(member.role)}`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-medium text-[#4b5563]">{member.department}</td>
                            <td className="py-4 px-6 text-[#6b7280]">
                              <span className="px-2 py-1 bg-[#f3f4f6] rounded-md font-medium">
                                {member.assignedProjects?.length || 0} assigned
                              </span>
                            </td>
                            <td className="py-4 px-6 text-[#6b7280]">{member.joinDate}</td>
                            <td className="py-4 px-6 text-right space-x-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMemberId(member.id);
                                }}
                                className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb] rounded-lg transition-colors inline-flex items-center"
                                title="Edit member"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
                                    deleteMember(member.id);
                                  }
                                }}
                                className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-[#e5e7eb] rounded-lg transition-colors inline-flex items-center"
                                title="Delete member"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Invites */}
          {activeTab === 'invites' && (
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
              {filteredInvites.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-[#9ca3af] mb-2">mark_email_read</span>
                  <h3 className="text-sm font-semibold text-[#111111]">No pending invitations</h3>
                  <p className="text-xs text-[#6b7280] mt-1">All invited workspace collaborators have accepted their invitations.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                        <th className="py-3.5 px-6">Email Address</th>
                        <th className="py-3.5 px-6">Designated Role</th>
                        <th className="py-3.5 px-6">Sent Date</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] text-xs">
                      {filteredInvites.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#f9fafb] transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#111111] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#9ca3af] text-lg">schedule_send</span>
                            {inv.email}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(inv.role)}`}>
                              {inv.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#6b7280]">{inv.sentDate}</td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => resendInvite(inv.id)}
                              className="px-3 py-1.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111111] rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">refresh</span>
                              Re-send
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeInvite(inv.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Member Right Sliding Drawer */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemberId(null)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white border-l border-[#e5e7eb] shadow-2xl flex flex-col overflow-hidden text-left"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#f9fafb]">
                <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Member Details</span>
                <button
                  onClick={() => setSelectedMemberId(null)}
                  type="button"
                  className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {/* Profile Hero */}
                <div className="flex flex-col items-center text-center pb-6 border-b border-[#e5e7eb]">
                  <div className="relative mb-4 group">
                    {selectedMember.profilePic ? (
                      <img
                        src={selectedMember.profilePic}
                        alt={selectedMember.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#e5e7eb] shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#f3f4f6] text-[#111111] font-bold text-2xl flex items-center justify-center border border-[#e5e7eb]">
                        {selectedMember.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(selectedMember.id);
                        setSelectedMemberId(null);
                      }}
                      className="absolute bottom-0 right-0 p-2 bg-[#111111] text-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit Photo or Profile"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-[#111111]">{selectedMember.name}</h3>
                  <span className={`mt-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(selectedMember.role)}`}>
                    {selectedMember.role}
                  </span>
                  <p className="text-xs text-[#6b7280] mt-2 font-medium">{selectedMember.department} Department</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Contact & Status</h4>
                  <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">mail</span> Email
                      </span>
                      <span className="font-medium text-[#111111]">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">call</span> Phone
                      </span>
                      <span className="font-medium text-[#111111]">{selectedMember.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">calendar_today</span> Joined
                      </span>
                      <span className="font-medium text-[#111111]">{selectedMember.joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Biography</h4>
                  <p className="text-xs text-[#374151] bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] leading-relaxed">
                    {selectedMember.bio || 'No bio added yet.'}
                  </p>
                </div>

                {/* Assigned Projects */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Assigned Projects</h4>
                    <button
                      type="button"
                      onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span> Assign
                    </button>
                  </div>

                  {isProjectSelectorOpen && (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                      {projects.map((proj) => {
                        const isAssigned = (selectedMember.assignedProjects || []).includes(proj.name);
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => handleToggleProject(selectedMember, proj.name)}
                            className="w-full flex items-center justify-between text-xs py-1.5 px-2 hover:bg-[#f3f4f6] rounded-lg transition-colors text-left"
                          >
                            <span className="font-medium text-[#111111]">{proj.name}</span>
                            {isAssigned && (
                              <span className="material-symbols-outlined text-[14px] text-emerald-600 font-bold">check</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(selectedMember.assignedProjects || []).length === 0 ? (
                      <span className="text-xs text-[#9ca3af] italic">No projects assigned.</span>
                    ) : (
                      (selectedMember.assignedProjects || []).map((projName) => (
                        <div
                          key={projName}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium"
                        >
                          <span className="material-symbols-outlined text-xs">folder</span>
                          <span>{projName}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleProject(selectedMember, projName)}
                            className="text-blue-400 hover:text-blue-600 ml-1 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this member from the workspace?")) {
                      deleteMember(selectedMember.id);
                      setSelectedMemberId(null);
                    }
                  }}
                  className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">person_remove</span> Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMemberId(selectedMember.id);
                    setSelectedMemberId(null);
                  }}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Profile
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onMemberAdded={handleMemberAdded}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <EditMemberModal
        isOpen={editingMemberId !== null}
        onClose={() => setEditingMemberId(null)}
        memberId={editingMemberId}
      />
    </div>
  );
};
