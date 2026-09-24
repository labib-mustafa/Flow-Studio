import { useProjectStore, Project } from '../../../../stores/projectStore';
import { useTaskStore, Task } from '../../../../stores/taskStore';
import { useClientStore, Client } from '../../../../stores/clientStore';
import { useWorkspaceStore } from '../../../../stores/workspaceStore';
import { useMoodboardStore } from '../../../../stores/moodboardStore';
import { ChatMessage } from '../types';
import { toast } from '../../../../stores/toastStore';

export interface StudioContextData {
  id: string;
  title: string;
  clientName: string;
  notesCount: number;
  isUniversal: boolean;
  moodboardContext?: {
    activeView: {
      zoom: number;
      pan: { x: number; y: number };
      visibleBounds: { minX: number; maxX: number; minY: number; maxY: number };
      center: { x: number; y: number };
    };
    itemsCount: number;
    itemsSummary: Array<{
      id: string;
      type: string;
      title: string;
      x: number;
      y: number;
      width: number;
      height: number;
      color?: string;
      content?: string;
    }>;
  };
  workspace?: {
    name: string;
    tagline: string;
    legalName: string;
    currency: string;
    taxId: string;
    workingHours: string;
  };
  projectStats: {
    total: number;
    active: number;
    inProgress: number;
    completed: number;
  };
  clientStats: {
    total: number;
    active: number;
    prospects: number;
    totalVolume: number;
    names: string[];
  };
  projectRoster: Array<{
    id: string;
    name: string;
    client: string;
    status: string;
    progress: number;
    deadline: string;
  }>;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
}

export function getLiveStudioContext(currentProject: Project | null, notesCount: number): StudioContextData {
  const projects = useProjectStore.getState().projects || [];
  const tasks = useTaskStore.getState().tasks || [];
  const clients = useClientStore.getState().clients || [];

  const activeProjects = projects.filter(p => (p.status || '').toLowerCase() === 'active');
  const inProgressProjects = projects.filter(p => (p.status || '').toLowerCase() === 'in progress');
  const completedProjects = projects.filter(p => (p.status || '').toLowerCase() === 'completed');

  const activeProjTasks = currentProject ? tasks.filter(t => t.projectId === currentProject.id) : tasks;
  const isUniversal = !currentProject || currentProject.id === 'universal' || currentProject.id === 'none';

  return {
    id: isUniversal ? 'universal' : currentProject.id,
    title: isUniversal ? 'Universal (Entire App Scope)' : (currentProject.title || currentProject.name || 'Active Project'),
    clientName: isUniversal ? 'All Studio Clients & Workspaces' : (currentProject.client || (currentProject as any)?.clientName || 'Client'),
    notesCount,
    isUniversal,
    projectStats: {
      total: projects.length,
      active: activeProjects.length,
      inProgress: inProgressProjects.length,
      completed: completedProjects.length
    },
    clientStats: {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active').length,
      prospects: clients.filter(c => c.status === 'Prospect').length,
      totalVolume: clients.reduce((acc, c) => acc + (c.totalVolume || 0), 0),
      names: clients.map(c => c.name)
    },
    projectRoster: projects.map(p => ({
      id: p.id,
      name: p.title || p.name || 'Untitled',
      client: p.client || (p as any).clientName || 'Direct',
      status: p.status || 'Active',
      progress: p.progress ?? p.completion ?? 0,
      deadline: p.deadline || 'No deadline'
    })),
    workspace: {
      name: useWorkspaceStore.getState().name || 'Flow Studio',
      tagline: useWorkspaceStore.getState().tagline || '',
      legalName: useWorkspaceStore.getState().legalName || '',
      currency: `${useWorkspaceStore.getState().currency} (${useWorkspaceStore.getState().currencySymbol})`,
      taxId: useWorkspaceStore.getState().taxId || '',
      workingHours: useWorkspaceStore.getState().workingHours || 'Mon - Fri, 9:00 AM - 6:00 PM'
    },
    taskStats: {
      total: activeProjTasks.length,
      todo: activeProjTasks.filter(t => t.phase === 'todo').length,
      inProgress: activeProjTasks.filter(t => t.phase === 'inprogress').length,
      review: activeProjTasks.filter(t => t.phase === 'review').length,
      done: activeProjTasks.filter(t => t.phase === 'done' || t.status === 'Complete').length
    },
    moodboardContext: (() => {
      try {
        const moodboardState = useMoodboardStore.getState();
        const currentView = moodboardState.view || { zoom: 1, pan: { x: -4500, y: -4500 } };
        const currentItems = moodboardState.items || [];
        const zoom = currentView.zoom || 1;
        const pan = currentView.pan || { x: -4500, y: -4500 };

        const viewportW = typeof window !== 'undefined' ? Math.max(window.innerWidth - 320, 800) : 1200;
        const viewportH = typeof window !== 'undefined' ? Math.max(window.innerHeight - 80, 600) : 800;

        const minX = Math.round((0 - pan.x) / zoom);
        const maxX = Math.round((viewportW - pan.x) / zoom);
        const minY = Math.round((0 - pan.y) / zoom);
        const maxY = Math.round((viewportH - pan.y) / zoom);
        const centerX = Math.round((viewportW / 2 - pan.x) / zoom);
        const centerY = Math.round((viewportH / 2 - pan.y) / zoom);

        return {
          activeView: {
            zoom,
            pan: { x: Math.round(pan.x), y: Math.round(pan.y) },
            visibleBounds: { minX, maxX, minY, maxY },
            center: { x: centerX, y: centerY }
          },
          itemsCount: currentItems.length,
          itemsSummary: currentItems.slice(0, 30).map(item => ({
            id: item.id,
            type: item.type,
            title: item.title || '',
            x: Math.round(item.x),
            y: Math.round(item.y),
            width: item.width || 200,
            height: item.height || 150,
            color: item.color,
            content: (item.content || '').slice(0, 80)
          }))
        };
      } catch {
        return undefined;
      }
    })()
  };
}

export function tryMatchStudioOverview(
  rawText: string,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void
): boolean {
  const text = rawText.trim().toLowerCase();

  // Matches project count and status breakdown queries
  const isProjectCountQuery =
    /(?:how\s+many\s+.*project|how\s+many\s+in\s+total.*(?:active|progress|completed)|project\s+(?:stats|count|summary|breakdown)|total\s+projects)/i.test(text);

  if (isProjectCountQuery) {
    const projects = useProjectStore.getState().projects || [];
    const active = projects.filter(p => (p.status || '').toLowerCase() === 'active');
    const inProg = projects.filter(p => (p.status || '').toLowerCase() === 'in progress');
    const comp = projects.filter(p => (p.status || '').toLowerCase() === 'completed');

    const fmtList = (list: Project[]) =>
      list.map(p => `\`${p.title || p.name}\`${p.progress !== undefined ? ` (${p.progress}%)` : ''}`).join(', ') || 'None';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const content =
      `📊 **Flow Studio Projects Breakdown**:\n\n` +
      `• **Total Projects**: **${projects.length}**\n` +
      `• **Active / Planning** (${active.length}): ${fmtList(active)}\n` +
      `• **In Progress** (${inProg.length}): ${fmtList(inProg)}\n` +
      `• **Completed** (${comp.length}): ${fmtList(comp)}\n\n` +
      `*Click on any project in the selector above or ask to open a project to inspect tasks.*`;

    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: rawText, timestamp: time };
    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content,
      timestamp: time,
      toolResults: [
        {
          toolName: 'studio_project_overview',
          description: `Queried ${projects.length} studio projects (${active.length} active, ${inProg.length} in progress, ${comp.length} completed)`,
          data: { total: projects.length, active: active.length, inProgress: inProg.length, completed: comp.length }
        }
      ]
    };
    onSuccessChat(userMsg, agentMsg);
    toast.info(`Studio: ${projects.length} projects tracked`);
    return true;
  }

  // Matches task overview queries
  const isTaskCountQuery =
    /(?:how\s+many\s+(?:total\s+)?tasks|task\s+(?:stats|count|summary|breakdown)|all\s+tasks\s+status)/i.test(text);

  if (isTaskCountQuery) {
    const tasks = useTaskStore.getState().tasks || [];
    const todo = tasks.filter(t => t.phase === 'todo');
    const inProg = tasks.filter(t => t.phase === 'inprogress');
    const review = tasks.filter(t => t.phase === 'review');
    const done = tasks.filter(t => t.phase === 'done' || t.status === 'Complete');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const content =
      `📋 **Studio Tasks Breakdown**:\n\n` +
      `• **Total Tasks**: **${tasks.length}**\n` +
      `• **To Do**: ${todo.length}\n` +
      `• **In Progress**: ${inProg.length}\n` +
      `• **In Review**: ${review.length}\n` +
      `• **Completed**: ${done.length}\n\n` +
      `*Ask me to schedule a new task or update existing ones.*`;

    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: rawText, timestamp: time };
    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content,
      timestamp: time,
      toolResults: [
        {
          toolName: 'studio_task_overview',
          description: `Queried ${tasks.length} studio tasks (${todo.length} todo, ${inProg.length} in progress, ${done.length} done)`,
          data: { total: tasks.length, todo: todo.length, inProgress: inProg.length, done: done.length }
        }
      ]
    };
    onSuccessChat(userMsg, agentMsg);
    toast.info(`Studio: ${tasks.length} tasks tracked`);
    return true;
  }

  // Matches client overview queries
  const isClientCountQuery =
    /(?:how\s+many\s+(?:total\s+)?clients|client\s+(?:stats|count|summary|breakdown)|all\s+clients\s+status|who\s+are\s+(?:our\s+)?clients)/i.test(text);

  if (isClientCountQuery) {
    const clients = useClientStore.getState().clients || [];
    const active = clients.filter(c => c.status === 'Active');
    const prospects = clients.filter(c => c.status === 'Prospect');
    const inactive = clients.filter(c => c.status === 'Inactive');
    const totalVolume = clients.reduce((acc, c) => acc + (c.totalVolume || 0), 0);

    const fmtClients = (list: Client[]) =>
      list.map(c => `\`${c.name}\``).join(', ') || 'None';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const content =
      `👥 **Studio Clients Overview**:\n\n` +
      `• **Total Clients**: **${clients.length}**\n` +
      `• **Active Accounts** (${active.length}): ${fmtClients(active)}\n` +
      `• **Prospects** (${prospects.length}): ${fmtClients(prospects)}\n` +
      `• **Inactive** (${inactive.length}): ${fmtClients(inactive)}\n` +
      `• **Combined Contract Volume**: **$${totalVolume.toLocaleString()}**\n\n` +
      `*Ask me to open any client's details, book appointments, attach documents, or log invoices.*`;

    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: rawText, timestamp: time };
    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content,
      timestamp: time,
      toolResults: [
        {
          toolName: 'studio_client_overview',
          description: `Queried ${clients.length} studio clients ($${totalVolume.toLocaleString()} total volume)`,
          data: { total: clients.length, active: active.length, prospects: prospects.length, totalVolume }
        }
      ]
    };
    onSuccessChat(userMsg, agentMsg);
    toast.info(`Studio: ${clients.length} clients tracked`);
    return true;
  }

  return false;
}
