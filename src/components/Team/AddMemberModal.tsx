import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore, TeamRole } from '../../stores/teamStore';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
}

const ROLES: { role: TeamRole; desc: string }[] = [
  { role: 'Owner', desc: 'Full administrative access to workspace, billing, and team settings.' },
  { role: 'Admin', desc: 'Can manage workspace projects, clients, and directory members.' },
  { role: 'Manager', desc: 'Can create projects, assign tasks, and review deliverables.' },
  { role: 'Designer', desc: 'Can edit moodboards, canvas assets, and design files.' },
  { role: 'Developer', desc: 'Can inspect code specifications and export production assets.' },
  { role: 'Guest', desc: 'Limited read-only access to specifically assigned projects.' }
];

const initialState = {
  name: '',
  email: '',
  phone: '',
  department: '',
  bio: '',
  profilePic: undefined as string | undefined
};

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onMemberAdded }) => {
  const addMember = useTeamStore((state) => state.addMember);
  const customRoles = useTeamStore((state) => state.customRoles);
  const addCustomRole = useTeamStore((state) => state.addCustomRole);
  const removeCustomRole = useTeamStore((state) => state.removeCustomRole);

  const allRoles = [
    ...ROLES,
    ...customRoles.map((cr) => ({ role: cr, desc: 'Custom workspace role designation.' }))
  ];

  const [name, setName] = useState(initialState.name);
  const [email, setEmail] = useState(initialState.email);
  const [phone, setPhone] = useState(initialState.phone);
  const [department, setDepartment] = useState(initialState.department);
  const [bio, setBio] = useState(initialState.bio);
  const [profilePic, setProfilePic] = useState<string | undefined>(initialState.profilePic);
  const [role, setRole] = useState<TeamRole>('Designer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName(initialState.name);
    setEmail(initialState.email);
    setPhone(initialState.phone);
    setDepartment(initialState.department);
    setBio(initialState.bio);
    setProfilePic(initialState.profilePic);
    setRole('Designer');
    setIsRoleDropdownOpen(false);
    setRoleSearchQuery('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Enter the member name before adding them.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Enter a valid email address for this member.');
      return;
    }

    addMember({
      name: trimmedName,
      email: trimmedEmail,
      role,
      phone: phone.trim(),
      department: department.trim() || 'General',
      bio: bio.trim(),
      profilePic,
      status: 'active',
      assignedProjects: []
    });

    resetForm();
    onMemberAdded?.();
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
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-[#111111]">Add Team Member</h3>
              <p className="text-xs text-[#6b7280] mt-0.5">Create an active workspace profile without sending an invite.</p>
            </div>
            <button
              onClick={handleClose}
              type="button"
              aria-label="Close add member modal"
              className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="flex items-center gap-5 p-4 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#111111] flex items-center justify-center"
                  aria-label="Choose profile photo"
                >
                  {profilePic ? (
                    <img
                      alt={name || 'New team member'}
                      src={profilePic}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-bold text-[#6b7280]">
                      {name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'TM'}
                    </span>
                  )}

                  <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                    <span className="material-symbols-outlined text-xl mb-0.5">photo_camera</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                  </span>
                </button>
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
                <p className="text-xs text-[#6b7280]">Use a clear portrait so this member is easy to identify across projects.</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="add-member-name" className="block text-xs font-medium text-[#374151]">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="add-member-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="add-member-email" className="block text-xs font-medium text-[#374151]">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="add-member-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="jordan@flowstudio.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="add-member-department" className="block text-xs font-medium text-[#374151]">Department</label>
                <input
                  id="add-member-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="Design"
                  autoComplete="organization-title"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="add-member-phone" className="block text-xs font-medium text-[#374151]">Phone Number</label>
                <input
                  id="add-member-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="+1 (555) 013-4928"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-medium text-[#374151]">Role Designation</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRoleDropdownOpen(!isRoleDropdownOpen);
                    setRoleSearchQuery('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] flex items-center justify-between hover:border-[#9ca3af] focus:outline-none focus:border-[#111111] transition-all cursor-pointer"
                  aria-expanded={isRoleDropdownOpen}
                >
                  <span className="font-medium">{role}</span>
                  <span className="material-symbols-outlined text-[#6b7280] text-lg">expand_more</span>
                </button>

                {isRoleDropdownOpen && (() => {
                  const filteredRoles = allRoles.filter((item) =>
                    item.role.toLowerCase().includes(roleSearchQuery.toLowerCase())
                  );
                  const exactMatchExists = allRoles.some(
                    (item) => item.role.toLowerCase() === roleSearchQuery.trim().toLowerCase()
                  );

                  return (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg flex flex-col max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-[#e5e7eb] flex items-center gap-1.5 bg-[#f9fafb]">
                        <span className="material-symbols-outlined text-[#9ca3af] text-sm">search</span>
                        <input
                          type="text"
                          placeholder="Search or create custom role..."
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-xs text-[#111111] placeholder-[#9ca3af] py-0.5"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar py-1 flex-1 max-h-40">
                        {filteredRoles.map((item) => {
                          const isCustom = customRoles.includes(item.role);
                          return (
                            <div
                              key={item.role}
                              className={`w-full flex items-center justify-between hover:bg-[#f9fafb] transition-colors ${role === item.role ? 'bg-[#f3f4f6]' : ''
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setRole(item.role);
                                  setIsRoleDropdownOpen(false);
                                  setRoleSearchQuery('');
                                }}
                                className="flex-1 px-3 py-2 text-left flex flex-col cursor-pointer focus:outline-none"
                              >
                                <span className="text-xs font-semibold text-[#111111]">{item.role}</span>
                                <span className="text-[11px] text-[#6b7280] leading-tight mt-0.5">{item.desc}</span>
                              </button>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCustomRole(item.role);
                                    if (role === item.role) {
                                      setRole('Designer');
                                    }
                                  }}
                                  aria-label={`Delete custom role ${item.role}`}
                                  className="p-1.5 mr-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center animate-fadeIn"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {filteredRoles.length === 0 && !roleSearchQuery.trim() && (
                          <div className="px-3 py-3 text-center text-xs text-[#9ca3af]">
                            No roles found.
                          </div>
                        )}

                        {roleSearchQuery.trim() && !exactMatchExists && (
                          <button
                            type="button"
                            onClick={() => {
                              const newRole = roleSearchQuery.trim();
                              addCustomRole(newRole);
                              setRole(newRole);
                              setIsRoleDropdownOpen(false);
                              setRoleSearchQuery('');
                            }}
                            className="w-full px-3 py-2.5 text-left border-t border-[#f3f4f6] hover:bg-[#f3f4f6] text-[#2563eb] hover:text-[#1d4ed8] transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span className="text-xs font-semibold">Create Custom Role: "{roleSearchQuery.trim()}"</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <p className="text-[11px] text-[#6b7280] pt-1">
                {allRoles.find((r) => r.role === role)?.desc}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-member-bio" className="block text-xs font-medium text-[#374151]">Bio / Notes</label>
              <textarea
                id="add-member-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all resize-none"
                placeholder="Add responsibilities, specialties, or internal notes."
              />
            </div>

            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Add Member
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
