import React, { useState } from 'react';
import {
  CircleDot,
  User,
  Calendar,
  SquarePen,
  Tag,
  ClipboardCopy,
  CopyPlus,
  Archive,
  Trash,
  MoreHorizontal,
  X,
  CheckCircle2,
  Circle,
  Plus
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { WithDevHoverBounds } from '../../DevTools/WithDevHoverBounds';

import { StatusDropdown } from './StatusDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import { DueDateDropdown } from './DueDateDropdown';
import { useTaskStore } from '../../../../stores/taskStore';
import { toast } from '../../../../stores/toastStore';
import { sound } from '../../../../stores/soundStore';
import { triggerConfettiBurst } from '../../../../lib/confetti';

interface FloatingBulkActionToolbarProps {
  selectedTaskIds: string[];
  onClose: () => void;
  onCustomFieldsClick: () => void;
  onCopyClick: () => void;
  onDuplicateClick: () => void;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
}

export const FloatingBulkActionToolbar: React.FC<FloatingBulkActionToolbarProps> = ({
  selectedTaskIds,
  onClose,
  onCustomFieldsClick,
  onCopyClick,
  onDuplicateClick,
  onArchiveClick,
  onDeleteClick,
}) => {
  const { tasks, updateTask, updateTasks, toggleTaskAssignee, updateTaskDates } = useTaskStore();
  const selectedCount = selectedTaskIds.length;

  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleApplyTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    const tagsList = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsList.length > 0) {
      selectedTaskIds.forEach((id) => {
        const task = tasks.find((t) => t.id === id);
        const currentTags = task?.tags || [];
        const updatedTags = Array.from(new Set([...currentTags, ...tagsList]));
        updateTask(id, { tags: updatedTags });
      });
      toast.success(`Tags applied`, `Added tags to ${selectedCount} selected tasks.`);
      setTagInput('');
      setIsTagsOpen(false);
    }
  };

  const handleBulkStatus = (status: 'Complete' | 'Incomplete') => {
    selectedTaskIds.forEach((id) => updateTask(id, { status }));
    if (status === 'Complete') {
      sound.success();
      triggerConfettiBurst(undefined, undefined, 8);
    } else {
      sound.tick();
    }
    setIsMoreOpen(false);
  };

  const handleClearTags = () => {
    selectedTaskIds.forEach((id) => updateTask(id, { tags: [] }));
    toast.info('Tags cleared', `Removed tags from ${selectedCount} tasks.`);
    setIsMoreOpen(false);
  };

  return (
    <div className="fixed bottom-10 inset-x-0 mx-auto w-max flex flex-nowrap whitespace-nowrap items-center bg-[#202024]/95 backdrop-blur-xl text-gray-300 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] h-12 px-3 border border-[#383a3f] z-[999] animate-fade-in-up font-sans">
      {/* Left Side: Counter & Close */}
      <div className="flex items-center space-x-3 pr-3 whitespace-nowrap">
        <div className="flex items-center justify-between border border-[#383a3f] bg-[#2a2b30] rounded-xl px-3 py-1 min-w-[135px] whitespace-nowrap">
          <span className="text-white font-semibold text-[13px] tracking-tight mr-3">
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

      {/* Right Side: Actions */}
      <div className="flex items-center flex-nowrap space-x-1 font-medium text-[13px] whitespace-nowrap">
        {/* Status Dropdown */}
        <StatusDropdown onSelectOption={(phase) => updateTasks(selectedTaskIds, { phase: phase as any })}>
          <button className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors">
            <CircleDot size={14} className="mr-1.5 text-blue-400" />
            Status
          </button>
        </StatusDropdown>

        {/* Assignees */}
        <AssigneeDropdown onToggleAssignee={(userId) => {
          selectedTaskIds.forEach((id) => toggleTaskAssignee(id, userId));
        }}>
          <button className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors">
            <User size={14} className="mr-1.5 text-indigo-400" />
            Assignees
          </button>
        </AssigneeDropdown>

        {/* Due Dates */}
        <DueDateDropdown onUpdateDates={(start, due) => {
          selectedTaskIds.forEach((id) => updateTaskDates(id, start, due));
        }}>
          <button className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors">
            <Calendar size={14} className="mr-1.5 text-amber-400" />
            Dates
          </button>
        </DueDateDropdown>

        {/* Custom Fields */}
        <button
          onClick={onCustomFieldsClick}
          className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <SquarePen size={14} className="mr-1.5 text-emerald-400" />
          Fields
        </button>

        {/* Popover: Add Tags */}
        <Popover.Root open={isTagsOpen} onOpenChange={setIsTagsOpen}>
          <Popover.Trigger asChild>
            <button className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors">
              <Tag size={14} className="mr-1.5 text-pink-400" />
              Tags
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              sideOffset={10}
              className="z-[9999] w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl outline-none animate-in fade-in zoom-in-95"
            >
              <form onSubmit={handleApplyTags} className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-slate-700">Add Tags to Selected</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Design, Frontend"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full text-[12.5px] px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-800"
                />
                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsTagsOpen(false)}
                    className="text-[11.5px] px-2.5 py-1 rounded text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[11.5px] px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="w-[1px] h-4 bg-[#383a3f] mx-1.5" />

        {/* Copy, Duplicate, Archive, Delete */}
        <button
          onClick={onCopyClick}
          className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2 py-1.5 transition-colors"
          title="Copy task list as text"
        >
          <ClipboardCopy size={14} />
        </button>
        <button
          onClick={onDuplicateClick}
          className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2 py-1.5 transition-colors"
          title="Duplicate tasks"
        >
          <CopyPlus size={14} />
        </button>
        <button
          onClick={onArchiveClick}
          className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2 py-1.5 transition-colors"
          title="Archive tasks"
        >
          <Archive size={14} />
        </button>
        <button
          onClick={onDeleteClick}
          className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2 py-1.5 transition-colors"
          title="Delete tasks"
        >
          <Trash size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[#383a3f] mx-1.5" />

        {/* Popover: More Actions */}
        <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <Popover.Trigger asChild>
            <button className="flex items-center text-[#9ea3ab] hover:text-white hover:bg-[#2e3035] rounded-lg px-2.5 py-1.5 transition-colors">
              <MoreHorizontal size={14} className="mr-1.5" />
              More
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              sideOffset={10}
              className="z-[9999] min-w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl outline-none animate-in fade-in zoom-in-95 font-sans"
            >
              <div className="flex flex-col space-y-0.5">
                <button
                  onClick={() => handleBulkStatus('Complete')}
                  className="flex items-center gap-2 w-full px-2.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg transition-colors text-left"
                >
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Mark all as Complete
                </button>
                <button
                  onClick={() => handleBulkStatus('Incomplete')}
                  className="flex items-center gap-2 w-full px-2.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                >
                  <Circle size={15} className="text-slate-400" />
                  Mark all as Incomplete
                </button>
                <div className="h-[1px] bg-slate-100 my-1" />
                <button
                  onClick={handleClearTags}
                  className="flex items-center gap-2 w-full px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50 hover:text-amber-600 rounded-lg transition-colors text-left"
                >
                  <Tag size={14} className="text-slate-400" />
                  Clear all tags
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
};
