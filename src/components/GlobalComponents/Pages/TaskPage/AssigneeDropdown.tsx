import React, { useState, useMemo } from 'react';
import { CellPopover } from '../../../ui/CellPopover';
import { Task, useTaskStore } from '../../../../stores/taskStore';
import { useTeamStore } from '../../../../stores/teamStore';

interface AssigneeDropdownProps {
  task?: Task;
  children: React.ReactNode;
  onToggleAssignee?: (userId: string) => void;
}

interface AssigneeUser {
  id: string;
  name: string;
  avatar: string;
}

const EMPTY_MEMBERS: any[] = [];
const EMPTY_USERS: AssigneeUser[] = [];

export const AssigneeDropdown: React.FC<AssigneeDropdownProps> = React.memo(({ task, children, onToggleAssignee: onToggleAssigneeProp }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const members = useTeamStore((state) => open ? state.members : EMPTY_MEMBERS);

  const availableUsers = useMemo<AssigneeUser[]>(() => {
    if (!open) return EMPTY_USERS;
    const teamUsers = members.map(m => ({
      id: m.id,
      name: m.name,
      avatar: m.profilePic || m.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    }));

    return [
      { id: 'user_1', name: 'Me', avatar: 'ID' },
      ...teamUsers
    ];
  }, [open, members]);

  const handleToggleAssignee = (user: AssigneeUser) => {
    if (onToggleAssigneeProp) {
      onToggleAssigneeProp(user.id);
    } else if (task) {
      useTaskStore.getState().toggleTaskAssignee(task.id, user.id);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!open) return EMPTY_USERS;
    return availableUsers.filter(opt =>
      opt.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [open, availableUsers, search]);

  const people = useMemo(() => {
    if (!open) return EMPTY_USERS;
    return filteredUsers.filter(u => !u.id.startsWith('agent_'));
  }, [open, filteredUsers]);

  const content = open ? (
    <>
      <div className="px-2 pt-2 border-b border-transparent">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2 top-1.5 text-slate-400 text-[16px]">search</span>
          <input
            type="text"
            placeholder="Search or enter email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-[13px] text-slate-700 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-col pt-1.5 pb-0 max-h-[300px] overflow-y-auto">
        {people.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 flex items-center justify-between group cursor-default">
               <span className="text-[12px] font-semibold text-[#87909e]">People</span>
            </div>
            {people.map(opt => {
              const assigned = task?.assignees?.some(a => a.id === opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleToggleAssignee(opt)}
                  className={`flex items-center justify-between w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 rounded-md transition-colors ${assigned ? 'bg-[#f4f5f7]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {opt.avatar.length > 2 ? (
                      <img alt={opt.name} className="size-[24px] rounded-full object-cover" src={opt.avatar} />
                    ) : (
                      <div className="size-[24px] rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                        {opt.avatar}
                      </div>
                    )}
                    <span className="text-[13px] text-slate-700">{opt.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </>
  ) : null;

  return (
    <CellPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      align="start"
      side="bottom"
      triggerClassName="w-full h-full"
    >
      {children}
    </CellPopover>
  );
});
