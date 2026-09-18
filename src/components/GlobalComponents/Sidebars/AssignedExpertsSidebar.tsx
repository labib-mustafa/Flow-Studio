import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../../../stores/toastStore';

export interface Expert {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  online?: boolean;
  invited?: boolean;
  inviteDate?: string;
}

const AvatarWithFallback: React.FC<{
  expert: Expert;
  className: string;
  textClassName?: string;
}> = ({ expert, className, textClassName }) => {
  const [hasError, setHasError] = useState(false);
  const initials = expert.name ? expert.name.slice(0, 2).toUpperCase() : 'EX';

  if (expert.avatar && !hasError) {
    return (
      <img
        alt={expert.name || expert.email}
        className={className}
        src={expert.avatar}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-slate-100 font-bold text-slate-500`}
    >
      <span className={textClassName || "text-xs"}>{initials}</span>
    </div>
  );
};


interface AssignedExpertsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssigned?: Expert[];
  initialAvailable?: Expert[];
  onSave?: (assigned: Expert[]) => void;
}

export const AssignedExpertsSidebar: React.FC<AssignedExpertsSidebarProps> = ({
  isOpen,
  onClose,
  initialAssigned = [],
  initialAvailable = [],
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assigned, setAssigned] = useState<Expert[]>(initialAssigned);
  const [available, setAvailable] = useState<Expert[]>(initialAvailable);
  const [isViewMoreOpen, setIsViewMoreOpen] = useState(false);
  const [inviteText, setInviteText] = useState('');

  // Sync inputs if they change when opened
  React.useEffect(() => {
    if (isOpen) {
      setAssigned(initialAssigned);
      setAvailable(initialAvailable);
      setSearchQuery('');
    }
  }, [isOpen, initialAssigned, initialAvailable]);

  // Handle adding an expert
  const handleAddExpert = (expert: Expert) => {
    // If already assigned, do nothing
    if (assigned.some(e => e.id === expert.id)) return;
    
    setAssigned(prev => [...prev, expert]);
    setAvailable(prev => prev.filter(e => e.id !== expert.id));
  };

  // Handle removing/deleting an expert
  const handleRemoveExpert = (expertId: string) => {
    const removedExpert = assigned.find(e => e.id === expertId);
    if (!removedExpert) return;

    setAssigned(prev => prev.filter(e => e.id !== expertId));
    
    // Put back to available if it wasn't a manual typed email invite
    if (removedExpert.name) {
      setAvailable(prev => {
        if (prev.some(e => e.id === removedExpert.id)) return prev;
        return [...prev, removedExpert];
      });
    }
  };

  // Handle typing custom email and clicking Join/Invite
  const handleInviteCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.includes('@')) return;

    const newInvite: Expert = {
      id: `invite-${Date.now()}`,
      name: searchQuery,
      email: searchQuery,
      invited: true,
      inviteDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    setAssigned(prev => [...prev, newInvite]);
    setSearchQuery('');
  };

  // Filter available members based on search
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return available;
    return available.filter(
      e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [available, searchQuery]);

  // Split available count for "View more" toggle
  const displayedAvailable = useMemo(() => {
    if (isViewMoreOpen) return filteredAvailable;
    return filteredAvailable.slice(0, 2);
  }, [filteredAvailable, isViewMoreOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave(assigned);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[120] flex justify-end">
          {/* Backdrop (solid translucent, NO backdrop-blur as requested) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 cursor-pointer"
          />

          {/* Sidebar Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-white border-l border-slate-100 shadow-2xl h-full flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Assigned experts</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Sticky Search bar */}
            <div className="px-6 pt-5 pb-2 shrink-0">
              <form onSubmit={handleInviteCustomEmail} className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
                  placeholder="Find experts by name or email to add"
                />
                {searchQuery.includes('@') && (
                  <button
                    type="submit"
                    className="absolute right-2 top-11/2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Invite
                  </button>
                )}
              </form>
            </div>

            {/* Scrollable list content */}
            <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
              
              {/* AVAILABLE MEMBERS Section */}
              {displayedAvailable.length > 0 && (
                <div className="mb-6 pt-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Available members
                  </h4>
                  <div className="space-y-1">
                    {displayedAvailable.map((expert) => (
                      <div
                        key={expert.id}
                        onClick={() => handleAddExpert(expert)}
                        className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors"
                      >
                        <div className="relative">
                          <AvatarWithFallback 
                            expert={expert} 
                            className="w-9 h-9 rounded-full object-cover shrink-0" 
                            textClassName="text-xs"
                          />
                          {expert.online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-primary transition-colors">
                            {expert.name}
                          </h4>
                          {expert.role && (
                            <p className="text-xs text-slate-400 truncate">{expert.role}</p>
                          )}
                        </div>
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm">
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {filteredAvailable.length > 2 && (
                    <button
                      onClick={() => setIsViewMoreOpen(prev => !prev)}
                      className="w-full mt-2 py-2 flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                      <span>{isViewMoreOpen ? 'View less' : 'View more'}</span>
                      <span className="material-symbols-outlined text-base transition-transform duration-200" style={{ transform: isViewMoreOpen ? 'rotate(180deg)' : 'none' }}>
                        expand_more
                      </span>
                    </button>
                  )}
                </div>
              )}

              {displayedAvailable.length > 0 && <div className="border-t border-slate-100 my-2"></div>}

              {/* ASSIGNED MEMBERS Section */}
              <div className="pt-4 pb-20">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Assigned
                </h4>
                {assigned.length === 0 ? (
                  <p className="text-xs text-slate-400 italic px-2 py-4">No experts assigned to this client yet.</p>
                ) : (
                  <div className="space-y-1">
                    {assigned.map((expert) => (
                      <div
                        key={expert.id}
                        className="flex items-center gap-3 py-3 group px-2 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        {expert.invited ? (
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                            <span className="material-symbols-outlined text-xl">mail</span>
                          </div>
                        ) : (
                          <AvatarWithFallback 
                            expert={expert} 
                            className="w-10 h-10 rounded-full object-cover shrink-0" 
                            textClassName="text-xs font-bold"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {expert.name || expert.email}
                          </h4>
                          {expert.invited ? (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-400 truncate">Invited on {expert.inviteDate || 'May 15'}</p>
                              <button 
                                onClick={() => {
                                  toast.success('Invitation Resent', `Successfully resent invitation to ${expert.email}`);
                                }}
                                className="text-[10px] font-bold text-primary hover:text-blue-700 hover:underline cursor-pointer"
                              >
                                Resend invite?
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 truncate">{expert.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveExpert(expert.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100Focus lg:opacity-100"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Form action */}
            <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
              <button
                onClick={handleSave}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center active:scale-[0.98]"
              >
                Save changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
