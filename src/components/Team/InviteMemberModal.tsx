import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore, TeamRole } from '../../stores/teamStore';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { role: TeamRole; desc: string }[] = [
  { role: 'Owner', desc: 'Full administrative access to workspace, billing, and team settings.' },
  { role: 'Admin', desc: 'Can manage workspace projects, clients, and directory members.' },
  { role: 'Manager', desc: 'Can create projects, assign tasks, and review deliverables.' },
  { role: 'Designer', desc: 'Can edit moodboards, canvas assets, and design files.' },
  { role: 'Developer', desc: 'Can inspect code specifications and export production assets.' },
  { role: 'Guest', desc: 'Limited read-only access to specifically assigned projects.' }
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const inviteMember = useTeamStore((state) => state.inviteMember);
  const addCustomRole = useTeamStore((state) => state.addCustomRole);
  const removeCustomRole = useTeamStore((state) => state.removeCustomRole);
  const customRoles = useTeamStore((state) => state.customRoles || []);
  const members = useTeamStore((state) => state.members || []);
  const invites = useTeamStore((state) => state.invites || []);

  const [email, setEmail] = useState('');
  const [roleInput, setRoleInput] = useState('Designer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [error, setError] = useState('');
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

  // Gather default roles
  const defaultRoles = ROLES.map(r => r.role);

  // Combine default roles, customRoles, and actual roles present in members or invites
  const allExistingRoles = Array.from(new Set([
    ...defaultRoles,
    ...customRoles,
    ...members.map(m => m.role),
    ...invites.map(i => i.role)
  ].filter(Boolean)));

  // Filter list by roleInput
  const suggestions = allExistingRoles.filter(role =>
    role.toLowerCase().includes(roleInput.toLowerCase())
  );

  const getRoleDesc = (roleName: string) => {
    const found = ROLES.find((r) => r.role.toLowerCase() === roleName.toLowerCase());
    if (found) return found.desc;
    return 'Custom role with standard workspace permissions.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const finalRole = roleInput.trim();
    if (!finalRole) {
      setError('Please enter or select a role.');
      return;
    }
    setError('');

    // If role is new (not in allExistingRoles), add it to data
    const isNewRole = !allExistingRoles.some(r => r.toLowerCase() === finalRole.toLowerCase());
    if (isNewRole) {
      addCustomRole(finalRole);
    }

    inviteMember(email.trim(), finalRole);
    setEmail('');
    setRoleInput('Designer');
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
          className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl w-full max-w-md overflow-hidden text-left"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
            <div>
              <h3 className="text-lg font-semibold text-[#111111]">Invite Member</h3>
              <p className="text-xs text-[#6b7280] mt-0.5">Send a workspace invitation to join your team.</p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#374151]">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-lg">
                  mail
                </span>
                <input
                  type="email"
                  placeholder="colleague@flowstudio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-medium text-[#374151]">Role & Permissions</label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Select or type a role..."
                  value={roleInput}
                  onChange={(e) => {
                    setRoleInput(e.target.value);
                    setIsRoleDropdownOpen(true);
                  }}
                  onFocus={() => setIsRoleDropdownOpen(true)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                />
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] text-lg pointer-events-none">
                  expand_more
                </span>

                {isRoleDropdownOpen && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {suggestions.map((roleName) => {
                      const isCustom = customRoles.includes(roleName);
                      return (
                        <div
                          key={roleName}
                          className={`w-full flex items-center justify-between hover:bg-[#f9fafb] transition-colors ${
                            roleInput.toLowerCase() === roleName.toLowerCase() ? 'bg-[#f3f4f6]' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setRoleInput(roleName);
                              setIsRoleDropdownOpen(false);
                            }}
                            className="flex-1 px-3.5 py-2 text-left flex flex-col cursor-pointer focus:outline-none"
                          >
                            <span className="text-xs font-semibold text-[#111111]">{roleName}</span>
                            <span className="text-[11px] text-[#6b7280] leading-tight mt-0.5">{getRoleDesc(roleName)}</span>
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeCustomRole(roleName);
                                if (roleInput === roleName) {
                                  setRoleInput('Designer');
                                }
                              }}
                              aria-label={`Delete custom role ${roleName}`}
                              className="p-1.5 mr-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#6b7280] pt-1">
                {getRoleDesc(roleInput)}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3">
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
                <span className="material-symbols-outlined text-sm">send</span>
                Send Invitation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
