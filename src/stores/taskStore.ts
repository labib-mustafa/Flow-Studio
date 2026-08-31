import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
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
  _hasHydrated: boolean;
  tasks: Task[];
  projectColumns: Record<string, ColumnDefinition[]>;
  projectColumnOrders: Record<string, string[]>;
  projectColumnNames: Record<string, Record<string, string>>;
  projectStatusConfigs: Record<string, Record<string, { name: string; color: string }>>;
  projectHiddenColumns: Record<string, string[]>;
  currentProjectId: string | null;

  columns: ColumnDefinition[];
  columnOrder: string[];
  columnNames: Record<string, string>;
  statusConfigs?: Record<string, { name: string; color: string }>;
  hiddenColumns: string[];

  setProject: (projectId: string) => void;
  addColumnSchema: (name: string, type: ColumnDefinition['type'], options?: string[]) => void;
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
  toggleColumnVisibility: (columnId: string) => void;
  removeColumnSchema: (columnId: string) => void;
  moveColumn: (columnId: string, direction: 'left' | 'right') => void;
  reorderColumns: (activeColumnId: string, targetColumnId: string) => void;
  addTaskComment: (taskId: string, commentText: string) => void;
  updateStatusConfig: (statusId: string, updates: { name?: string; color?: string }) => void;
  isFieldsSidebarOpen: boolean;
  setFieldsSidebarOpen: (open: boolean) => void;
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
      _hasHydrated: false,
      tasks: [],
      projectColumns: {},
      projectColumnOrders: {},
      projectColumnNames: {},
      projectStatusConfigs: {},
      projectHiddenColumns: {},
      currentProjectId: null,
      columns: [],
      columnNames: {},
      columnOrder: ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'],
      hiddenColumns: [],
      sortBy: null,
      isFieldsSidebarOpen: false,
      setFieldsSidebarOpen: (open) => set({ isFieldsSidebarOpen: open }),

      setProject: (projectId) => set((state) => {
        if (state.currentProjectId === projectId) return {};

        const updatedColumns = { ...state.projectColumns };
        const updatedOrders = { ...state.projectColumnOrders };
        const updatedNames = { ...state.projectColumnNames };
        const updatedConfigs = { ...state.projectStatusConfigs };
        const updatedHidden = { ...state.projectHiddenColumns };

        // Save current properties of previous project before switching
        if (state.currentProjectId) {
          updatedColumns[state.currentProjectId] = state.columns || [];
          updatedOrders[state.currentProjectId] = state.columnOrder || [];
          updatedNames[state.currentProjectId] = state.columnNames || {};
          updatedConfigs[state.currentProjectId] = state.statusConfigs || {};
          updatedHidden[state.currentProjectId] = state.hiddenColumns || [];
        }

        // Load new values for the target project
        const nextColumns = updatedColumns[projectId] || [];
        const nextOrder = updatedOrders[projectId] || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
        const nextNames = updatedNames[projectId] || {};
        const nextConfigs = updatedConfigs[projectId] || {};
        const nextHidden = updatedHidden[projectId] || [];

        return {
          currentProjectId: projectId,
          projectColumns: updatedColumns,
          projectColumnOrders: updatedOrders,
          projectColumnNames: updatedNames,
          projectStatusConfigs: updatedConfigs,
          projectHiddenColumns: updatedHidden,
          columns: nextColumns,
          columnOrder: nextOrder,
          columnNames: nextNames,
          statusConfigs: nextConfigs,
          hiddenColumns: nextHidden
        };
      }),

      addColumnSchema: (name, type, options) => set((state) => {
        const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newColumn: ColumnDefinition = { id, name, type, width: 140, options };
        const newColumns = [...(state.columns || []), newColumn];
        const newOrder = [...(state.columnOrder || []), id];

        const updatedColumns = { ...state.projectColumns };
        const updatedOrders = { ...state.projectColumnOrders };
        if (state.currentProjectId) {
          updatedColumns[state.currentProjectId] = newColumns;
          updatedOrders[state.currentProjectId] = newOrder;
        }

        return {
          columns: newColumns,
          columnOrder: newOrder,
          projectColumns: updatedColumns,
          projectColumnOrders: updatedOrders
        };
      }),

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
      toggleColumnVisibility: (columnId) => set((state) => {
        if (columnId === 'title') return {};
        const isHidden = state.hiddenColumns?.includes(columnId);
        const newHidden = isHidden 
          ? state.hiddenColumns.filter(id => id !== columnId)
          : [...(state.hiddenColumns || []), columnId];

        const updatedHidden = { ...state.projectHiddenColumns };
        if (state.currentProjectId) {
          updatedHidden[state.currentProjectId] = newHidden;
        }

        return {
          hiddenColumns: newHidden,
          projectHiddenColumns: updatedHidden
        };
      }),
      removeColumnSchema: (columnId) => set((state) => {
        if (columnId === 'title') return {};
        let propName: keyof Task | null = null;
        if (columnId === 'dueDate') propName = 'dueDate';
        if (columnId === 'assignee') propName = 'assignees';
        if (columnId === 'priority') propName = 'priority';
        if (columnId === 'status') propName = 'status';
        
        const updatedTasks = state.tasks.map(task => {
          const newTask = { ...task };
          if (propName) {
            // @ts-ignore
            delete newTask[propName];
          }
          return newTask;
        });

        const newColumns = (state.columns || []).filter(c => c.id !== columnId);
        const newOrder = (state.columnOrder || []).filter(id => id !== columnId);
        const isHidden = state.hiddenColumns?.includes(columnId);
        const newHidden = isHidden ? state.hiddenColumns : [...(state.hiddenColumns || []), columnId];

        const updatedColumns = { ...state.projectColumns };
        const updatedOrders = { ...state.projectColumnOrders };
        const updatedHidden = { ...state.projectHiddenColumns };
        if (state.currentProjectId) {
          updatedColumns[state.currentProjectId] = newColumns;
          updatedOrders[state.currentProjectId] = newOrder;
          updatedHidden[state.currentProjectId] = newHidden;
        }

        return {
          tasks: updatedTasks,
          columns: newColumns,
          columnOrder: newOrder,
          hiddenColumns: newHidden,
          projectColumns: updatedColumns,
          projectColumnOrders: updatedOrders,
          projectHiddenColumns: updatedHidden
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
        
        const updatedOrders = { ...state.projectColumnOrders };
        if (state.currentProjectId) {
          updatedOrders[state.currentProjectId] = newOrder;
        }

        return { 
          columnOrder: newOrder,
          projectColumnOrders: updatedOrders
        };
      }),
      reorderColumns: (activeColumnId, targetColumnId) => set((state) => {
        const order = state.columnOrder || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
        const activeIndex = order.indexOf(activeColumnId);
        const targetIndex = order.indexOf(targetColumnId);
        
        if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) return state;
        
        const newOrder = [...order];
        newOrder.splice(activeIndex, 1);
        newOrder.splice(targetIndex, 0, activeColumnId);
        
        const updatedOrders = { ...state.projectColumnOrders };
        if (state.currentProjectId) {
          updatedOrders[state.currentProjectId] = newOrder;
        }

        return { 
          columnOrder: newOrder,
          projectColumnOrders: updatedOrders
        };
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
      updateStatusConfig: (statusId, updates) => set((state) => {
        const existingConfig = state.statusConfigs?.[statusId];
        const defaultName = statusId.startsWith('status_') ? 'New Status' : statusId.toUpperCase();

        const newConfigs = {
          ...state.statusConfigs,
          [statusId]: {
            name: updates.name !== undefined ? updates.name : (existingConfig?.name || defaultName),
            color: updates.color !== undefined ? updates.color : (existingConfig?.color || getDefaultColorForPhase(statusId))
          }
        };

        const updatedConfigs = { ...state.projectStatusConfigs };
        if (state.currentProjectId) {
          updatedConfigs[state.currentProjectId] = newConfigs;
        }

        return {
          statusConfigs: newConfigs,
          projectStatusConfigs: updatedConfigs
        };
      }),
      updateColumnName: (columnId, name) => set((state) => {
        const updatedColumns = (state.columns || []).map(col => 
          col.id === columnId ? { ...col, name } : col
        );
        const newNames = {
          ...(state.columnNames || {}),
          [columnId]: name
        };

        const updatedColumnsMap = { ...state.projectColumns };
        const updatedNamesMap = { ...state.projectColumnNames };
        if (state.currentProjectId) {
          updatedColumnsMap[state.currentProjectId] = updatedColumns;
          updatedNamesMap[state.currentProjectId] = newNames;
        }

        return {
          columns: updatedColumns,
          columnNames: newNames,
          projectColumns: updatedColumnsMap,
          projectColumnNames: updatedNamesMap
        };
      })
    }),
    {
      name: 'task-storage',
      storage: createFileStorage('tasks'),
      onRehydrateStorage: () => () => { useTaskStore.setState({ _hasHydrated: true }); },
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
        merged.projectColumns = merged.projectColumns || {};
        merged.projectColumnOrders = merged.projectColumnOrders || {};
        merged.projectColumnNames = merged.projectColumnNames || {};
        merged.projectStatusConfigs = merged.projectStatusConfigs || {};
        merged.projectHiddenColumns = merged.projectHiddenColumns || {};
        
        return merged;
      }
    }
  )
);

onStoreExternalUpdate('tasks', () => {
  useTaskStore.persist.rehydrate();
});

