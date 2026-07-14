import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useTaskStore } from '../../../../stores/taskStore';
import { CellPopover } from '../../../ui/CellPopover';

interface ColumnHeaderMenuProps {
  columnId: string;
  colKey?: string;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ColumnHeaderMenu: React.FC<ColumnHeaderMenuProps> = ({
  columnId,
  colKey,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledSetOpen
}) => {
  const { setSortDirection, toggleColumnVisibility, removeColumnSchema, moveColumn, updateColumnName } = useTaskStore();
  const columnNames = useTaskStore(state => state.columnNames) || {};
  const columns = useTaskStore(state => state.columns) || [];

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setUncontrolledOpen;

  const activeKey = colKey || columnId;

  React.useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const taskPageContainer = document.getElementById('task-page-container');
      const originalContainerOverflow = taskPageContainer ? taskPageContainer.style.overflow : '';
      if (taskPageContainer) {
        taskPageContainer.style.overflow = 'hidden';
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (taskPageContainer) {
          taskPageContainer.style.overflow = originalContainerOverflow;
        }
      };
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setIsEditing(false);
    }
  };

  const getColumnDisplayName = () => {
    if (columnNames[activeKey]) {
      return columnNames[activeKey];
    }
    const dynamicCol = columns.find(c => c.id === activeKey);
    if (dynamicCol) {
      return dynamicCol.name;
    }
    switch (activeKey) {
      case 'title': return 'Name';
      case 'assignee': return 'Assignee';
      case 'dueDate': return 'Due date';
      case 'priority': return 'Priority';
      case 'status': return 'Status';
      case 'comments': return 'Comments';
      case 'customField': return 'Custom Field';
      case 'pics': return 'Pics';
      default: return activeKey;
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(getColumnDisplayName());
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateColumnName(activeKey, editName.trim());
    }
    setIsEditing(false);
    setOpen(false);
  };

  const handleSortAsc = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSortDirection(columnId, 'asc');
    setOpen(false);
  };

  const handleSortDesc = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSortDirection(columnId, 'desc');
    setOpen(false);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleColumnVisibility(activeKey);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeColumnSchema(activeKey);
    setOpen(false);
  };

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveColumn(activeKey, 'left');
    setOpen(false);
  };

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveColumn(activeKey, 'right');
    setOpen(false);
  };

  const showCalculate = activeKey === 'dueDate' || activeKey === 'priority' || activeKey === 'status' || activeKey === 'comments' || activeKey === 'pics';

  const content = isEditing ? (
    <div
      className="w-[240px] font-sans p-2.5 text-[13px] text-slate-700 flex flex-col gap-3"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSaveEdit();
        } else if (e.key === 'Escape') {
          setIsEditing(false);
        }
      }}
    >
      <div className="font-semibold text-slate-800 text-[12px] uppercase tracking-wider opacity-60">Rename Column</div>
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="Column name"
        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all font-medium"
        autoFocus
      />
      <div className="flex flex-row justify-end gap-1.5 text-[12px]">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-2.5 py-1.5 rounded transition-colors text-slate-500 hover:bg-slate-100 cursor-pointer text-[12px] font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveEdit}
          className="px-3 py-1.5 rounded transition-colors bg-slate-900 text-white hover:bg-slate-800 cursor-pointer text-[12px] font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  ) : (
    <div
      className="w-[240px] font-sans p-0.5 text-[13px] text-slate-700 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleSortAsc} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">north</span>
         Sort ascending
      </button>
      
      <button onClick={handleSortDesc} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">south</span>
         Sort descending
      </button>

      <div className="h-[1px] bg-slate-100 my-1 mx-2" />

      <button onClick={handleMoveLeft} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">keyboard_tab_rtl</span>
         Move left
      </button>
      
      <button onClick={handleMoveRight} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">keyboard_tab</span>
         Move right
      </button>

      {showCalculate && (
        <button type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
           <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">calculate</span>
           Calculate
        </button>
      )}

      <button onClick={handleStartEdit} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">tune</span>
         Edit field
      </button>

      <button onClick={handleHide} type="button" className="flex flex-row items-center cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
         <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-slate-600 mr-2">visibility_off</span>
         Hide column
      </button>

      {activeKey !== 'title' && activeKey !== 'dueDate' && activeKey !== 'priority' && activeKey !== 'status' && activeKey !== 'assignee' && activeKey !== 'comments' && (
        <>
          <div className="h-[1px] bg-slate-100 my-1 mx-2" />
          <button onClick={handleDelete} type="button" className="flex flex-row items-center cursor-pointer hover:bg-red-50 text-red-600 px-3 py-1.5 rounded transition-colors text-left w-full group/btn">
             <span className="material-symbols-outlined text-[16px] text-red-400 group-hover/btn:text-red-600 mr-2">delete</span>
             Delete field
          </button>
        </>
      )}
    </div>
  );

  return (
    <CellPopover
      open={open}
      onOpenChange={handleOpenChange}
      align="start"
      sideOffset={4}
      content={content}
      triggerClassName=""
    >
      {trigger}
    </CellPopover>
  );
};
