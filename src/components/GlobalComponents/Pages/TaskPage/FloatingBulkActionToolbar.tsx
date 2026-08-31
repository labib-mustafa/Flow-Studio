import React from 'react';
import { CircleDot, User, Calendar, SquarePen, Tag, ClipboardCopy, CopyPlus, Archive, Trash, MoreHorizontal, X } from 'lucide-react';
import { WithDevHoverBounds } from '../../DevTools/WithDevHoverBounds';

import { StatusDropdown } from './StatusDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import { DueDateDropdown } from './DueDateDropdown';
import { useTaskStore } from '../../../../stores/taskStore';

interface FloatingBulkActionToolbarProps {
  selectedTaskIds: string[];
  onClose: () => void;
  onCustomFieldsClick: () => void;
  onTagsClick: () => void;
  onCopyClick: () => void;
  onDuplicateClick: () => void;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
  onMoreClick: () => void;
}

export const FloatingBulkActionToolbar: React.FC<FloatingBulkActionToolbarProps> = ({
  selectedTaskIds,
  onClose,
  onCustomFieldsClick,
  onTagsClick,
  onCopyClick,
  onDuplicateClick,
  onArchiveClick,
  onDeleteClick,
  onMoreClick,
}) => {
  const { updateTasks, toggleTaskAssignee, updateTaskDates } = useTaskStore();
  const selectedCount = selectedTaskIds.length;

  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-10 inset-x-0 mx-auto w-max flex flex-nowrap whitespace-nowrap items-center bg-[#202024] text-gray-300 rounded-xl shadow-2xl h-11 px-3 border border-[#313235] z-[999] animate-fade-in-up"
    >
      {/* Left Side */}
      <div className="flex items-center space-x-3 pr-3 whitespace-nowrap">
        <div className="flex items-center justify-between border border-[#313235] bg-[#2a2b2f] rounded-lg px-2.5 py-1 min-w-[130px] whitespace-nowrap">
          <span className="text-white font-semibold text-[13px] tracking-wide mr-3">
            {selectedCount} Task{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <WithDevHoverBounds devId="bulk-action-close-btn" devName="Close Toolbar Button" devCategory="Task Operations">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </WithDevHoverBounds>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center flex-nowrap space-x-0.5 font-medium text-[13px] whitespace-nowrap">
        {/* Group 1 */}
        <StatusDropdown onSelectOption={(phase) => updateTasks(selectedTaskIds, { phase: phase as any })}>
          <button className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
            <CircleDot size={14} className="mr-1.5" />
            Status
          </button>
        </StatusDropdown>

        <AssigneeDropdown onToggleAssignee={(userId) => {
          // Note: Toggle assignee might be tricky bulk, but we can call it per task or add setting logic
          selectedTaskIds.forEach(id => toggleTaskAssignee(id, userId));
        }}>
          <button className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
            <User size={14} className="mr-1.5" />
            Assignees
          </button>
        </AssigneeDropdown>

        <DueDateDropdown onUpdateDates={(start, due) => {
          selectedTaskIds.forEach(id => updateTaskDates(id, start, due));
        }}>
          <button className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
            <Calendar size={14} className="mr-1.5" />
            Dates
          </button>
        </DueDateDropdown>

        <button onClick={onCustomFieldsClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
          <SquarePen size={14} className="mr-1.5" />
          Custom Fields
        </button>
        <button onClick={onTagsClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
          <Tag size={14} className="mr-1.5" />
          Tags
        </button>

        <div className="w-[1px] h-4 bg-[#404348] mx-1.5" />

        {/* Group 2 */}
        <button onClick={onCopyClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
          <ClipboardCopy size={14} className="mr-1.5" />
          Copy
        </button>
        <button onClick={onDuplicateClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-1.5 py-1.5 transition-colors">
          <CopyPlus size={14} />
        </button>
        <button onClick={onArchiveClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-1.5 py-1.5 transition-colors">
          <Archive size={14} />
        </button>
        <button onClick={onDeleteClick} className="flex items-center text-[#ef4444] hover:text-red-400 hover:bg-[#313235] rounded-md px-1.5 py-1.5 transition-colors mr-1">
          <Trash size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[#404348] mx-1.5" />

        {/* Group 3 */}
        <button onClick={onMoreClick} className="flex items-center text-[#8e939a] hover:text-white hover:bg-[#313235] rounded-md px-2 py-1.5 transition-colors">
          <MoreHorizontal size={14} className="mr-1.5" />
          More
        </button>
      </div>
    </div>
  );
};
