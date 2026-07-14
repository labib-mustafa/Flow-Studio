import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore, TeamRole } from '../../stores/teamStore';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
}

const ROLES: { role: TeamRole; desc: string }[] = [
  { role: 'Owner', desc: 'Full administrative access to workspace, billing, and team settings.' },
  { role: 'Admin', desc: 'Can manage workspace projects, clients, and directory members.' },
  { role: 'Manager', desc: 'Can create projects, assign tasks, and review deliverables.' },
  { role: 'Designer', desc: 'Can edit moodboards, canvas assets, and design files.' },
  { role: 'Developer', desc: 'Can inspect code specifications and export production assets.' },
  { role: 'Guest', desc: 'Limited read-only access to specifically assigned projects.' }
];

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, memberId }) => {
  const members = useTeamStore((state) => state.members);
  const updateMember = useTeamStore((state) => state.updateMember);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('Designer');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [activeFocus, setActiveFocus] = useState('');
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<string | undefined>(undefined);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && memberId) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        setName(member.name || '');
        setEmail(member.email || '');
        setRole(member.role || 'Designer');
        setPhone(member.phone || '');
        setDepartment(member.department || 'General');
        setBio(member.bio || '');
        setActiveFocus(member.activeFocus || '');
        setProfilePic(member.profilePic);
        setBanner(member.banner);
      }
    }
  }, [isOpen, memberId, members]);

  if (!isOpen || !memberId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePic(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBanner(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerBannerUpload = () => {
    bannerInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    updateMember(memberId, {
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone.trim(),
      department: department.trim() || 'General',
      bio: bio.trim(),
      activeFocus: activeFocus.trim(),
      profilePic,
      banner
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl w-full max-w-lg overflow-hidden text-left max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-[#111111]">Edit Team Member</h3>
              <p className="text-xs text-[#6b7280] mt-0.5">Update profile details, designation, and permissions.</p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Scrollable Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Banner Section */}
            <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] mb-4">
              <div
                onClick={handleTriggerBannerUpload}
                className="w-full h-full cursor-pointer relative flex items-center justify-center"
              >
                {banner ? (
                  <img
                    alt="Banner Preview"
                    src={banner}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <span className="material-symbols-outlined text-2xl">image</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Cover Banner</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1">
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {banner ? 'Change Cover' : 'Upload Cover'}
                  </span>
                </div>
              </div>

              {banner && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBanner(undefined);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/80 text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm z-10"
                  title="Remove Banner"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}

              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-5 p-4 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
              <div className="relative shrink-0">
                <div
                  onClick={handleTriggerUpload}
                  className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#111111] flex items-center justify-center"
                >
                  {profilePic ? (
                    <img
                      alt={name}
                      src={profilePic}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-bold text-[#6b7280]">
                      {name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'TM'}
                    </span>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                    <span className="material-symbols-outlined text-xl mb-0.5">photo_camera</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-[#111111]">Profile Photo</h4>
                <p className="text-xs text-[#6b7280]">Hover over the avatar and click to choose a picture from your device.</p>
                {profilePic && (
                  <button
                    type="button"
                    onClick={() => setProfilePic(undefined)}
                    className="text-xs text-red-600 font-medium hover:underline pt-1 inline-block cursor-pointer"
                  >
                    Remove custom photo
                  </button>
                )}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="john@flowstudio.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">Department / Podobi</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="e.g. Leadership, Engineering"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Role dropdown */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-medium text-[#374151]">Role Designation</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] flex items-center justify-between hover:border-[#9ca3af] focus:outline-none focus:border-[#111111] transition-all cursor-pointer"
                >
                  <span className="font-medium">{role}</span>
                  <span className="material-symbols-outlined text-[#6b7280] text-lg">expand_more</span>
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {ROLES.map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => {
                          setRole(item.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex flex-col hover:bg-[#f9fafb] transition-colors cursor-pointer ${role === item.role ? 'bg-[#f3f4f6]' : ''
                          }`}
                      >
                        <span className="text-xs font-semibold text-[#111111]">{item.role}</span>
                        <span className="text-[11px] text-[#6b7280] leading-tight mt-0.5">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Focus */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#374151]">Active Focus Banner</label>
              <input
                type="text"
                value={activeFocus}
                onChange={(e) => setActiveFocus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                placeholder="e.g. 🎨 Designing Flow Studio visual guidelines"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#374151]">Biography / Notes</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all resize-none"
                placeholder="Brief professional background or internal responsibilities..."
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
