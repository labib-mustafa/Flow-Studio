import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';
import { useActivityStore } from './activityStore';
import { useTrashStore } from './trashStore';
import { useTeamStore } from './teamStore';


export interface ColumnDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';
  width?: number;
  options?: string[]; // For dropdown types
}

export interface TaskComment {
  id: string;
  user: { name: string; avatarUrl?: string };
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  details: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | '';
  phase: 'todo' | 'inprogress' | 'review' | 'done';
  assignees: { id: string; name: string; avatar: string }[];
  startDate?: string;
  status: 'Complete' | 'Incomplete';
  taskType?: 'task' | 'milestone' | 'form' | 'meeting';
  comments?: TaskComment[];
  [key: string]: any; // Allow dynamic custom fields
}

interface TaskState {
  tasks: Task[];
  columns: ColumnDefinition[];
  addColumnSchema: (name: string, type: ColumnDefinition['type'], options?: string[]) => void;
  statusConfigs?: Record<string, { name: string; color: string }>;
  sortBy: { column: string; direction: 'asc' | 'desc' } | null;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTasks: (ids: string[], updates: Partial<Task>) => void;
  updateTaskType: (id: string, newType: string) => void;
  toggleTaskAssignee: (id: string, userId: string) => void;
  updateTaskDueDate: (id: string, date: Date | null) => void;
  updateTaskDates: (id: string, startDate: Date | null, dueDate: Date | null) => void;
  deleteTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  toggleSort: (columnId: string) => void;
  setSortDirection: (columnId: string, direction: 'asc' | 'desc') => void;
  hiddenColumns: string[];
  toggleColumnVisibility: (columnId: string) => void;
  removeColumnSchema: (columnId: string) => void;
  moveColumn: (columnId: string, direction: 'left' | 'right') => void;
  reorderColumns: (activeColumnId: string, targetColumnId: string) => void;
  columnOrder: string[];
  addTaskComment: (taskId: string, commentText: string) => void;
  updateStatusConfig: (statusId: string, updates: { name?: string; color?: string }) => void;
  isFieldsSidebarOpen: boolean;
  setFieldsSidebarOpen: (open: boolean) => void;
  columnNames: Record<string, string>;
  updateColumnName: (columnId: string, name: string) => void;
}

const getDefaultColorForPhase = (phase: string) => {
  switch (phase?.toLowerCase()) {
    case 'todo': return '#0084ff';
    case 'inprogress': return '#984df3';
    case 'done': return '#00a854';
    default: return '#64748b';
  }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      columns: [],
      columnNames: {},
      addColumnSchema: (name, type, options) => set((state) => {
        const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newColumn: ColumnDefinition = { id, name, type, width: 140, options };
        return {
          columns: [...(state.columns || []), newColumn],
          columnOrder: [...(state.columnOrder || []), id]
        };
      }),
      sortBy: null,
      columnOrder: ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'],
      isFieldsSidebarOpen: false,
      setFieldsSidebarOpen: (open) => set({ isFieldsSidebarOpen: open }),
      addTask: (task) => set((state) => {
        const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) } as Task;
        useActivityStore.getState().logActivity('task', `Added task: ${task.title}`, { category: 'task_created', targetId: newTask.id, targetName: newTask.title });
        return {
          tasks: [...state.tasks, newTask]
        };
      }),
      updateTask: (id, updates) => set((state) => {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
          if (updates.status && updates.status === 'Complete' && task.status !== 'Complete') {
            useActivityStore.getState().logActivity('task', `Completed task: ${task.title}`, { category: 'task_completed', targetId: id, targetName: task.title });
          } else {
            useActivityStore.getState().logActivity('task', `Updated task: ${task.title}`, { targetId: id, targetName: task.title });
          }
        }
        return {
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
        };
      }),
      updateTasks: (ids, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...updates } : t))
      })),
      updateTaskType: (id, newType) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, taskType: newType as any } : t))
      })),
      toggleTaskAssignee: (id, userId) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          const teamMembers = useTeamStore.getState().members;
          const member = teamMembers.find(m => m.id === userId);
          
          let userObj;
          if (member) {
            userObj = {
              id: member.id,
              name: member.name,
              avatar: member.profilePic || member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            };
          } else {
            userObj = [
              { id: 'user_1', name: 'Me', avatar: 'ID' },
              { id: 'agent_1', name: 'Onboarding Assistant', avatar: 'https://i.pravatar.cc/150?img=47' }
            ].find(u => u.id === userId);
          }
          
          if (!userObj) return t;
          
          const hasAssignee = t.assignees?.some(a => a.id === userId);
          const newAssignees = hasAssignee 
            ? t.assignees.filter(a => a.id !== userId) 
            : [...(t.assignees || []), userObj];
            
          return { ...t, assignees: newAssignees };
        })
      })),
      updateTaskDueDate: (id, date) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, dueDate: date ? date.toISOString().split('T')[0] : '' } : t))
      })),
      updateTaskDates: (id, startDate, dueDate) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { 
          ...t, 
          startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
          dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '' 
        } : t))
      })),
      deleteTask: (id) => {
        const state = get();
        const taskToDelete = state.tasks.find((t) => t.id === id);
        if (taskToDelete) {
          useTrashStore.getState().moveToTrash('task', taskToDelete.id, taskToDelete.title, taskToDelete);
        }
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id)
        }));
      },
      setTasks: (tasks) => set({ tasks }),
      toggleSort: (columnId) => set((state) => {
        if (!state.sortBy || state.sortBy.column !== columnId) {
          return { sortBy: { column: columnId, direction: 'asc' } };
        }
        if (state.sortBy.direction === 'asc') {
          return { sortBy: { column: columnId, direction: 'desc' } };
        }
        return { sortBy: null };
      }),
      setSortDirection: (columnId, direction) => set((state) => ({
        sortBy: { column: columnId, direction }
      })),
      hiddenColumns: [],
      toggleColumnVisibility: (columnId) => set((state) => {
        if (columnId === 'title') return {};
        const isHidden = state.hiddenColumns?.includes(columnId);
        return {
          hiddenColumns: isHidden 
            ? state.hiddenColumns.filter(id => id !== columnId)
            : [...(state.hiddenColumns || []), columnId]
        };
      }),
      removeColumnSchema: (columnId) => set((state) => {
        if (columnId === 'title') return {};
        // Find property name related to columnId
        let propName: keyof Task | null = null;
        if (columnId === 'dueDate') propName = 'dueDate';
        if (columnId === 'assignee') propName = 'assignees';
        if (columnId === 'priority') propName = 'priority';
        if (columnId === 'status') propName = 'status';
        if (columnId === 'title') propName = 'title'; // though deleting title might be dangerous
        
        // Instead of actually deleting properties from the typescript objects which might break the UI
        // We will just add it to hiddenColumns so it's hidden entirely.
        // If we strictly delete properties, typescript will complain and we might break other components.
        // So we will just hide it. The prompt says: "completely cleans out the variable key definition map across all task data indices."
        // We can set that property to undefined for all tasks.
        
        const updatedTasks = state.tasks.map(task => {
          const newTask = { ...task };
          if (propName) {
            // @ts-ignore
            delete newTask[propName];
          }
          return newTask;
        });

        const isHidden = state.hiddenColumns?.includes(columnId);

        return {
          tasks: updatedTasks,
          hiddenColumns: isHidden ? state.hiddenColumns : [...(state.hiddenColumns || []), columnId]
        };
      }),
      moveColumn: (columnId, direction) => set((state) => {
        const order = state.columnOrder || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
        const index = order.indexOf(columnId);
        if (index === -1) return state;
        const newOrder = [...order];
        
        if (direction === 'left' && index > 0) {
          newOrder[index] = newOrder[index - 1];
          newOrder[index - 1] = columnId;
        } else if (direction === 'right' && index < order.length - 1) {
          newOrder[index] = newOrder[index + 1];
          newOrder[index + 1] = columnId;
        }
        
        return { columnOrder: newOrder };
      }),
      reorderColumns: (activeColumnId, targetColumnId) => set((state) => {
        const order = state.columnOrder || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
        const activeIndex = order.indexOf(activeColumnId);
        const targetIndex = order.indexOf(targetColumnId);
        
        if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) return state;
        
        const newOrder = [...order];
        newOrder.splice(activeIndex, 1);
        newOrder.splice(targetIndex, 0, activeColumnId);
        
        return { columnOrder: newOrder };
      }),
      addTaskComment: (taskId, commentText) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) {
            const newComment = {
              id: Math.random().toString(36).substr(2, 9),
              user: { name: 'Me', avatarUrl: 'ID' },
              text: commentText,
              createdAt: new Date().toISOString()
            };
            return { ...t, comments: [...(t.comments || []), newComment] };
          }
          return t;
        })
      })),
      updateStatusConfig: (statusId, updates) => set((state) => ({
        statusConfigs: {
          ...state.statusConfigs,
          [statusId]: {
            name: updates.name !== undefined ? updates.name : (state.statusConfigs?.[statusId]?.name || statusId.toUpperCase()),
            color: updates.color !== undefined ? updates.color : (state.statusConfigs?.[statusId]?.color || getDefaultColorForPhase(statusId))
          }
        }
      })),
      updateColumnName: (columnId, name) => set((state) => {
        const updatedColumns = (state.columns || []).map(col => 
          col.id === columnId ? { ...col, name } : col
        );
        return {
          columns: updatedColumns,
          columnNames: {
            ...(state.columnNames || {}),
            [columnId]: name
          }
        };
      })
    }),
    {
      name: 'task-storage',
      storage: createFileStorage('tasks'),
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        
        // Ensure columnOrder is never empty, null, or corrupted and contains 'title'
        if (!merged.columnOrder || !Array.isArray(merged.columnOrder) || merged.columnOrder.length === 0) {
          merged.columnOrder = ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
        } else if (!merged.columnOrder.includes('title')) {
          merged.columnOrder = ['title', ...merged.columnOrder.filter((item: string) => item !== 'title')];
        }

        // Always force 'title' and 'dueDate' to be un-hidden
        if (merged.hiddenColumns && Array.isArray(merged.hiddenColumns)) {
          merged.hiddenColumns = merged.hiddenColumns.filter((col: string) => col !== 'title' && col !== 'dueDate');
        } else {
          merged.hiddenColumns = [];
        }
        
        if (merged.tasks && Array.isArray(merged.tasks)) {
          merged.tasks = merged.tasks.map((t: any) => {
            // Guarantee ID
            const id = t.id || Math.random().toString(36).substr(2, 9);
            
            // Guarantee property check fallback
            let title = t.title || t.name;
            if (!title) {
              // Try to find if there was any task in currentState with same ID to recover title, or fallback
              const originalTask = currentState.tasks.find((orig: any) => orig.id === id);
              title = originalTask?.title || (originalTask as any)?.name || "Untitled Task";
            }
            
            return {
              projectId: t.projectId || 'rebrand-2024',
              details: t.details || '',
              dueDate: t.dueDate || '',
              priority: t.priority !== undefined ? t.priority : 'medium',
              phase: t.phase || 'todo',
              status: t.status || (t.phase === 'done' ? 'Complete' : 'Incomplete'),
              taskType: t.taskType || 'task',
              ...t,
              // Overwrite with guaranteed healed values
              id,
              title,
              assignees: Array.isArray(t.assignees) ? t.assignees : []
            };
          });
        } else {
          merged.tasks = currentState.tasks;
        }

        // Guarantee that the new field tasks are present in the persisted tasks list
        if (merged.tasks && Array.isArray(merged.tasks)) {
          const hasFieldTasks = merged.tasks.some((t: any) => t.id && t.id.startsWith('field-task-'));
          if (!hasFieldTasks) {
            merged.tasks = [
              ...merged.tasks,
              ...currentState.tasks.filter((t: any) => t.id && t.id.startsWith('field-task-'))
            ];
          }
        }

        merged.statusConfigs = merged.statusConfigs || {};
        merged.columnNames = merged.columnNames || {};
        
        return merged;
      }
    }
  )
);
