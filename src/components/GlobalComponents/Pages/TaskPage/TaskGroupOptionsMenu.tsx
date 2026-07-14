import React from 'react';
import { CellPopover } from '../../../ui/CellPopover';
import { 
  Pencil, 
  Plus, 
  Settings, 
  ChevronUpCircle, 
  EyeOff, 
  CheckCheck, 
  ChevronsUp, 
  Zap
} from 'lucide-react';

interface TaskGroupOptionsMenuProps {
  onCollapseGroup?: () => void;
  isExpanded?: boolean;
  onRename?: () => void;
  onNewStatus?: () => void;
  onEditStatuses?: () => void;
  onHideStatus?: () => void;
  onSelectAll?: () => void;
  onCollapseAll?: () => void;
  onAutomateStatus?: () => void;
}

export const TaskGroupOptionsMenu: React.FC<TaskGroupOptionsMenuProps> = ({ 
  onCollapseGroup,
  isExpanded = true,
  onRename,
  onNewStatus,
  onEditStatuses,
  onHideStatus,
  onSelectAll,
  onCollapseAll,
  onAutomateStatus
}) => {
  const [open, setOpen] = React.useState(false);

  // Mock handlers
  const handleRename = () => {
    if (onRename) onRename();
    else {
      const newName = window.prompt("Enter new status name:");
      if (newName) console.log(`Renamed status to: ${newName}`);
    }
    setOpen(false);
  };

  const handleNewStatus = () => {
    if (onNewStatus) onNewStatus();
    else console.log("Added new status group");
    setOpen(false);
  };

  const handleEditStatuses = () => {
    if (onEditStatuses) onEditStatuses();
    else alert("Opening statuses configuration panel...");
    setOpen(false);
  };

  const handleHideStatus = () => {
    if (onHideStatus) onHideStatus();
    else console.log("Hid the current status group");
    setOpen(false);
  };

  const handleSelectAll = () => {
    if (onSelectAll) onSelectAll();
    else console.log("Selected all items in this status group");
    setOpen(false);
  };

  const handleCollapseAll = () => {
    if (onCollapseAll) onCollapseAll();
    else console.log("Collapsed all status groups");
    setOpen(false);
  };

  const handleAutomateStatus = () => {
    if (onAutomateStatus) onAutomateStatus();
    else console.log("Opened automation builder for this status");
    setOpen(false);
  };

  const content = (
    <div className="flex flex-col w-[260px] font-sans text-[13px] text-slate-800">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-medium text-slate-500">
        Group options
      </div>

      {/* Section 1 */}
      <div className="flex flex-col gap-0.5">
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={handleRename}
        >
          <Pencil className="w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5" />
          Rename
        </button>
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={handleNewStatus}
        >
          <Plus className="w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5" />
          New status
        </button>
      </div>

      <div className="h-[1px] bg-slate-100 my-1 mx-2" />

      {/* Section 2 */}
      <div className="flex flex-col gap-0.5">
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={() => {
            onCollapseGroup?.();
            setOpen(false);
          }}
        >
          <ChevronUpCircle className={`w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5 ${!isExpanded ? 'rotate-180' : ''} transition-transform`} />
          {isExpanded ? 'Collapse group' : 'Expand group'}
        </button>
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={handleHideStatus}
        >
          <EyeOff className="w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5" />
          Hide status
        </button>
      </div>

      <div className="h-[1px] bg-slate-100 my-1 mx-2" />

      {/* Section 3 */}
      <div className="flex flex-col gap-0.5">
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={handleSelectAll}
        >
          <CheckCheck className="w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5" />
          Select all
        </button>
        <button 
          type="button" 
          className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn"
          onClick={handleCollapseAll}
        >
          <ChevronsUp className="w-4 h-4 text-slate-500 group-hover/btn:text-slate-600 mr-2.5" />
          Collapse all groups
        </button>
      </div>
    </div>
  );

  return (
    <CellPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      align="start"
      sideOffset={4}
      triggerClassName=""
    >
      <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-slate-600 px-1 cursor-pointer">more_horiz</span>
    </CellPopover>
  );
};
