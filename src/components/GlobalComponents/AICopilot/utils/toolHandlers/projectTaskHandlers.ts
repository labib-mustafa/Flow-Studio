import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useProjectStore } from '../../../../../stores/projectStore';
import { useTaskStore } from '../../../../../stores/taskStore';
import { formatLocalDate } from '../dateParser';

interface ProjectTaskContext {
  activeProjId: string;
  activeProjTitle: string;
  addTask: (task: any) => void;
  addProject: (proj: any) => void;
  setCurrentProject: (proj: any) => void;
}

export function handleProjectTaskTools(
  call: AgentToolCall,
  ctx: ProjectTaskContext
): AgentToolResult | null {
  const { activeProjId, activeProjTitle, addTask, addProject, setCurrentProject } = ctx;

  // 1. Create Tasks
  if (call.name === 'create_tasks') {
    const rawTasks = call.args.tasks || [];
    if (Array.isArray(rawTasks) && rawTasks.length > 0) {
      const formatted = rawTasks.map((t: any, i: number) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
        projectId: activeProjId,
        title: t.title || 'Untitled Task',
        details: t.details || '',
        phase: ['todo', 'inprogress', 'review', 'done'].includes(t.phase) ? t.phase : 'todo',
        status: 'Incomplete',
        priority: ['urgent', 'high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        dueDate: t.dueDate || formatLocalDate(new Date(Date.now() + 7 * 86400000)),
        taskType: 'task',
        assignees: []
      }));

      formatted.forEach((task: any) => addTask(task));
      toast.success(`Agent added ${formatted.length} tasks to ${activeProjTitle}!`);
      return {
        toolName: 'create_tasks',
        description: `Created ${formatted.length} task(s) for "${activeProjTitle}"`,
        data: formatted
      };
    }
  }

  // 2. Update Task
  if (call.name === 'update_task') {
    const { taskTitle, taskId, phase, priority, status, dueDate, details } = call.args;
    const taskStore = useTaskStore.getState();
    const tasks = taskStore.tasks || [];
    const target = tasks.find(
      (t) => (taskId && t.id === taskId) || (taskTitle && t.title.toLowerCase().includes(taskTitle.toLowerCase()))
    );

    if (target) {
      const updates: any = {};
      if (phase && ['todo', 'inprogress', 'review', 'done'].includes(phase)) updates.phase = phase;
      if (priority && ['urgent', 'high', 'medium', 'low'].includes(priority)) updates.priority = priority;
      if (status) updates.status = status;
      if (dueDate) updates.dueDate = dueDate;
      if (details !== undefined) updates.details = details;

      // Snapshot the keys being changed so the agent undo path can restore them.
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

      taskStore.updateTask(target.id, updates);
      toast.success(`Updated task "${target.title}"`);
      return {
        toolName: 'update_task',
        description: `Updated task "${target.title}"`,
        data: { id: target.id, ...updates, previous }
      };
    }
  }

  // 3. Delete Tasks
  if (call.name === 'delete_tasks') {
    const { deleteAll, taskTitle } = call.args;
    const taskStore = useTaskStore.getState();
    if (deleteAll) {
      const toDelete = taskStore.tasks.filter(
        (t) => activeProjId === 'universal' || activeProjId === 'default' || t.projectId === activeProjId
      );
      toDelete.forEach((t) => taskStore.deleteTask(t.id));
      toast.success(`Cleared ${toDelete.length} task(s)`);
      return {
        toolName: 'delete_tasks',
        description: `Cleared ${toDelete.length} task(s)`,
        data: toDelete
      };
    } else if (taskTitle) {
      const target = taskStore.tasks.find((t) => t.title.toLowerCase().includes(taskTitle.toLowerCase()));
      if (target) {
        taskStore.deleteTask(target.id);
        toast.success(`Deleted task "${target.title}"`);
        return {
          toolName: 'delete_tasks',
          description: `Deleted task "${target.title}"`,
          data: target
        };
      }
    }
  }

  // 4. Add Task Comment
  if (call.name === 'add_task_comment') {
    const { taskTitle, taskId, comment } = call.args;
    const taskStore = useTaskStore.getState();
    const target = taskStore.tasks.find(
      (t) => (taskId && t.id === taskId) || (taskTitle && t.title.toLowerCase().includes(taskTitle.toLowerCase()))
    );
    if (target && comment) {
      taskStore.addTaskComment(target.id, comment);
      toast.success(`Added comment to "${target.title}"`);
      return {
        toolName: 'add_task_comment',
        description: `Added comment to task "${target.title}"`,
        data: { taskId: target.id, comment }
      };
    }
  }

  // 5. Create Project
  if (call.name === 'create_new_project') {
    const { title, name, client, clientName, description, deadline, status } = call.args;
    const projTitle = title || name;
    if (projTitle) {
      const newProj = {
        id: `proj-${Date.now()}`,
        name: projTitle,
        title: projTitle,
        client: client || clientName || 'Internal Client',
        status: status || 'Planning',
        color: '#6366f1',
        progress: 0,
        tasksCount: 0,
        deadline: deadline || '',
        description: description || '',
        createdAt: new Date().toISOString()
      };
      addProject(newProj);
      setCurrentProject(newProj);
      toast.success(`Created project "${projTitle}"!`);
      return {
        toolName: 'create_new_project',
        description: `Created and switched to project "${projTitle}"`,
        data: newProj
      };
    }
  }

  // 6. Update Project
  if (call.name === 'update_project') {
    const { projectId, title, projectTitle, client, clientName, status, deadline, description, category, tags, figmaUrl, briefUrl, thumbnail } = call.args;
    const projectStore = useProjectStore.getState();
    const projects = projectStore.projects || [];
    const searchTitle = (projectTitle || title || '').toLowerCase().trim();
    const target = projects.find(
      (p) => (projectId && p.id === projectId) || (searchTitle && ((p.name && p.name.toLowerCase().includes(searchTitle)) || (p.title && p.title.toLowerCase().includes(searchTitle))))
    ) || projectStore.currentProject;

    if (target) {
      const updates: any = {};
      if (title || projectTitle) { const t = title || projectTitle; updates.name = t; updates.title = t; }
      if (client || clientName) updates.client = client || clientName;
      if (status) updates.status = status;
      if (deadline) updates.deadline = deadline;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (Array.isArray(tags)) updates.tags = tags;
      if (figmaUrl) updates.figmaUrl = figmaUrl;
      if (briefUrl) updates.briefUrl = briefUrl;
      if (thumbnail) { updates.thumbnail = thumbnail; updates.image = thumbnail; }

      // Snapshot the keys being changed so the agent undo path can restore them.
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

      projectStore.updateProject(target.id, updates);
      toast.success(`Updated project "${target.name || target.title}"`);
      return {
        toolName: 'update_project',
        description: `Updated project "${target.name || target.title}"`,
        data: { id: target.id, ...updates, previous }
      };
    }
  }

  // 7. Delete Project
  if (call.name === 'delete_project') {
    const { projectId, title } = call.args;
    const projectStore = useProjectStore.getState();
    const target = projectStore.projects.find(
      (p) => (projectId && p.id === projectId) || (title && (p.name === title || p.title === title))
    );
    if (target) {
      projectStore.deleteProject(target.id);
      toast.success(`Deleted project "${target.name || target.title}"`);
      return {
        toolName: 'delete_project',
        description: `Deleted project "${target.name || target.title}"`,
        data: target
      };
    }
  }

  return null;
}
