import { ChatMessage, AgentToolResult, AgentToolCall } from '../types';
import { toast } from '../../../../stores/toastStore';
import { sound } from '../../../../stores/soundStore';
import { useTeamStore } from '../../../../stores/teamStore';
import { assessToolCall } from './agentToolGuard';
import { confirm } from '../../../../stores/confirmStore';
import { parseNaturalDate } from './dateParser';

export interface PredictableDeps {
  currentProject: any;
  addProject?: (proj: any) => void;
  setCurrentProject?: (proj: any) => void;
  addTask: (task: any) => void;
  addEvent: (event: any) => void;
  startTimer: (projectId: string, projectTitle: string, taskTitle: string) => void;
  setAvailableNotesCount: (count: number) => void;
  deleteTask: (taskId: string) => void;
  getAllTasks: () => any[];
  clearMoodboardItems: (projectId: string) => void;
}

const emitActionSuccess = (
  text: string,
  content: string,
  toolResult: AgentToolResult,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void,
  toastMessage?: string
) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time };
  const agentMsg: ChatMessage = { id: `msg-${Date.now()}-a`, role: 'assistant', content, timestamp: time, toolResults: [toolResult] };
  onSuccessChat(userMsg, agentMsg);
  if (toastMessage) toast.success(toastMessage);
};

/**
 * Ask before destroying, on the fast path.
 *
 * This matcher runs ahead of the model and ahead of the API-key check, so an
 * unguarded branch here deletes on a pattern match alone. It reuses
 * `assessToolCall` — the same classifier the guarded model path uses — so
 * "delete all tasks" gets one identical dialog whichever route caught it.
 *
 * Returns true when the action may proceed. A decline is reported into the chat
 * and the caller consumes the prompt, because the instruction was understood and
 * refused; falling through to the model would only re-ask or fail with no key.
 */
const approveDestructive = async (
  call: AgentToolCall,
  text: string,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void,
  summary: string
): Promise<boolean> => {
  // Nothing to destroy — "delete 0 tasks?" is noise, not consent.
  const payload = call.args?.tasks ?? call.args?.notes ?? call.args?.noteIds;
  if (Array.isArray(payload) && payload.length === 0) return true;

  const verdict = assessToolCall(call);
  if (!verdict) return true;

  const approved = await confirm.show({
    title: verdict.title,
    message: verdict.message,
    type: 'danger',
    confirmText: verdict.confirmText,
    cancelText: 'Cancel'
  });
  if (approved) return true;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  onSuccessChat(
    { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time },
    {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: `Cancelled — you declined to ${summary}. Nothing was changed.`,
      timestamp: time,
      toolResults: [
        {
          toolName: call.name,
          description: `Cancelled — the user declined "${verdict.title}"`,
          data: { declined: true, args: call.args }
        }
      ]
    }
  );
  return false;
};

export const matchPredictableTask = async (
  rawText: string,
  deps: PredictableDeps,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void
): Promise<boolean> => {
  const text = rawText.trim();
  const activeProjId = deps.currentProject?.id || 'default';
  const activeProjTitle = deps.currentProject?.title || deps.currentProject?.name || 'Project';

  // 1. Create Project
  const projMatch = text.match(/^(?:create|make|new)\s+project\s+(?:named|called)?\s*["']?([^"'\n]+?)["']?(?:\s+for\s+(?:client\s+)?["']?([^"'\n]+?)["']?)?$/i);
  if (projMatch) {
    const projName = projMatch[1].trim();
    const client = projMatch[2]?.trim() || 'Direct Client';
    const newProj = {
      id: `proj-${Date.now()}`,
      title: projName,
      name: projName,
      client,
      status: 'active',
      deadline: parseNaturalDate('in 30 days'),
      tags: ['New'],
      completion: 0
    };
    if (deps.addProject) deps.addProject(newProj as any);
    if (deps.setCurrentProject) deps.setCurrentProject(newProj as any);

    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Created new project **"${projName}"** for client **${client}** and set it as your active workspace.`,
      { toolName: 'create_new_project', description: `Created project "${projName}"`, data: newProj },
      onSuccessChat,
      `Nova created project "${projName}"!`
    );
    return true;
  }

  // 2. Schedule / Create Task
  const taskMatch = text.match(/^(?:create|add|schedule)\s+(?:a\s+)?(?:new\s+)?task\s*(?:named|called|to|for|about)?\s*["']?([^"'\n]+?)["']?(?:\s+(?:for|due|on)\s+([a-zA-Z0-9\s,-]+))?$/i);
  if (taskMatch) {
    const rawTitle = taskMatch[1].trim();
    const dueDate = parseNaturalDate(taskMatch[2]?.trim());
    let taskTitle = rawTitle.replace(/^(?:to|for|about|called|named)\s+/i, '').replace(/^(?:a|an|the)\s+/i, '').trim();
    if (!taskTitle) taskTitle = 'New Task';
    taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: activeProjId,
      title: taskTitle,
      details: `Created by Nova for ${activeProjTitle}`,
      phase: 'todo' as const,
      status: 'Incomplete',
      priority: 'high' as const,
      dueDate,
      taskType: 'task',
      assignees: []
    };
    deps.addTask(newTask as any);

    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Scheduled task **"${taskTitle}"** for **${activeProjTitle}** due on **${dueDate}**.`,
      { toolName: 'create_tasks', description: `Created task "${taskTitle}" (Due: ${dueDate})`, data: newTask },
      onSuccessChat,
      `Nova scheduled task "${taskTitle}"!`
    );
    return true;
  }

  // 3. Schedule Meeting / Event
  const meetingMatch = text.match(/^(?:schedule|set|book)\s+(?:a\s+)?meeting\s*(?:named|called|for|about)?\s*["']?([^"'\n]+?)["']?(?:\s+(?:on|for)\s+([a-zA-Z0-9\s,-]+?))?(?:\s+at\s+([0-9:apmAPM\s]+))?$/i);
  if (meetingMatch) {
    const rawTitle = meetingMatch[1]?.trim() || 'Team Meeting';
    const eventDate = parseNaturalDate(meetingMatch[2]?.trim());
    let meetingTitle = rawTitle.replace(/^(?:for|about|called|named)\s+/i, '').trim() || 'Design Sync';
    meetingTitle = meetingTitle.charAt(0).toUpperCase() + meetingTitle.slice(1);

    let parsedTime = '14:00';
    if (meetingMatch[3]) {
      const tc = meetingMatch[3].toLowerCase().trim();
      if (tc.includes('pm') || tc.includes('am')) {
        const isPm = tc.includes('pm');
        const digits = tc.replace(/[^0-9:]/g, '');
        const [hStr, mStr] = digits.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr ? parseInt(mStr, 10) : 0;
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
        parsedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else if (tc.includes(':')) {
        parsedTime = tc;
      }
    }

    deps.addEvent({ title: meetingTitle, date: eventDate, time: parsedTime, type: 'meeting', projectId: activeProjId });
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Scheduled **"${meetingTitle}"** on **${eventDate}** at **${parsedTime}**.`,
      { toolName: 'schedule_event', description: `Scheduled "${meetingTitle}" (${eventDate} at ${parsedTime})`, data: { title: meetingTitle, date: eventDate, time: parsedTime } },
      onSuccessChat,
      `Nova booked "${meetingTitle}"!`
    );
    return true;
  }

  // 4. Start Timer
  const timerMatch = text.match(/^(?:start|run|begin)\s+(?:a\s+)?timer\s*(?:for|on)?\s*["']?([^"'\n]+?)["']?$/i);
  if (timerMatch) {
    const taskTitle = timerMatch[1].trim() || 'Design Session';
    deps.startTimer(activeProjId, activeProjTitle, taskTitle);
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Started active work timer for **"${taskTitle}"** under project **${activeProjTitle}**.`,
      { toolName: 'start_timer', description: `Active timer running for "${taskTitle}"`, data: { taskTitle } },
      onSuccessChat,
      `Timer started for "${taskTitle}"!`
    );
    return true;
  }

  // 5. Delete Notes
  if (/^(?:delete|clear|remove)\s+(?:all\s+)?(?:the\s+)?notes\b/i.test(text)) {
    const noteKey = `notes-list-${activeProjId}`;
    let count = 0;
    let existingNotes: unknown[] = [];
    try {
      const existing = localStorage.getItem(noteKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          count = parsed.length;
          existingNotes = parsed;
        }
      }
    } catch { }

    const proceed = await approveDestructive(
      { name: 'delete_project_notes', args: { notes: existingNotes } },
      text,
      onSuccessChat,
      `delete all ${count} notes from "${activeProjTitle}"`
    );
    if (!proceed) return true;

    localStorage.setItem(noteKey, JSON.stringify([]));
    localStorage.removeItem(`active-note-id-${activeProjId}`);
    deps.setAvailableNotesCount(0);
    fetch('/api/store/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { defaultNotes: [] }, version: 0 }) }).catch(() => { });
    window.dispatchEvent(new CustomEvent('flowstudio-notes-updated', { detail: { projectId: activeProjId } }));
    sound.delete();
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Deleted all **${count}** notes from project **${activeProjTitle}**.`,
      { toolName: 'delete_project_notes', description: `Deleted ${count} notes`, data: { deletedCount: count } },
      onSuccessChat,
      `Deleted all notes for ${activeProjTitle}`
    );
    return true;
  }

  // 6. Delete Tasks
  if (/^(?:delete|clear|remove)\s+(?:all\s+)?(?:the\s+)?tasks\b/i.test(text)) {
    const projectTasks = deps.getAllTasks().filter(t => t.projectId === activeProjId);
    const taskTitles = projectTasks.map(t => t.title).filter(Boolean) as string[];

    const proceed = await approveDestructive(
      {
        name: 'delete_tasks',
        args: { tasks: taskTitles, task: taskTitles.length === 1 ? taskTitles[0] : undefined }
      },
      text,
      onSuccessChat,
      `delete all ${projectTasks.length} tasks from "${activeProjTitle}"`
    );
    if (!proceed) return true;

    projectTasks.forEach(t => deps.deleteTask(t.id));
    sound.delete();
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Deleted all **${projectTasks.length}** tasks from project **${activeProjTitle}**.`,
      { toolName: 'delete_tasks', description: `Deleted ${projectTasks.length} tasks`, data: { deletedCount: projectTasks.length } },
      onSuccessChat,
      `Deleted all tasks for ${activeProjTitle}`
    );
    return true;
  }

  // 7. Clear Moodboard
  if (/^(?:clear|delete|reset)\s+(?:all\s+)?(?:the\s+)?moodboard\b/i.test(text)) {
    const proceed = await approveDestructive(
      { name: 'clear_moodboard', args: {} },
      text,
      onSuccessChat,
      `clear the entire moodboard for "${activeProjTitle}"`
    );
    if (!proceed) return true;

    deps.clearMoodboardItems(activeProjId);
    sound.delete();
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Cleared all inspiration and directive cards from the moodboard for **${activeProjTitle}**.`,
      { toolName: 'clear_moodboard', description: `Cleared moodboard items`, data: { cleared: true } },
      onSuccessChat,
      `Cleared moodboard for ${activeProjTitle}`
    );
    return true;
  }

  // 8. Add Team Member
  const isTeamCreate = /^(?:add|create|hire|new)\s+(?:a\s+)?team\s+member\b/i.test(text);
  if (isTeamCreate) {
    const rawMatch = text.match(/^(?:add|create|hire|new)\s+(?:a\s+)?team\s+member\s*(?:named|called)?\s*["']?([^"'\n,.]+?)?["']?(?:\s+(?:with|as|and|in)\s+(.+))?$/i);
    const candidateName = rawMatch?.[1]?.trim();
    const isGeneric = !candidateName || /^(?:by\s+you|dummy|random|anyone|test|sample|dummy\s+data)$/i.test(candidateName);

    const DUMMIES = [
      { name: 'Aria Vance', role: 'Senior Product Designer', dept: 'Design', skills: ['Figma', 'UI/UX'] },
      { name: 'Marcus Sterling', role: 'Lead Frontend Engineer', dept: 'Engineering', skills: ['React', 'TypeScript'] },
      { name: 'Elena Rostova', role: 'Brand & Motion Designer', dept: 'Design', skills: ['Branding', '3D Design'] }
    ];
    const picked = DUMMIES[Math.floor(Math.random() * DUMMIES.length)];
    const memberName = isGeneric ? picked.name : candidateName;
    const memberRole = picked.role;

    const newMember = {
      id: `m_${Date.now()}`,
      name: memberName,
      role: memberRole,
      email: `${memberName.toLowerCase().replace(/\s+/g, '.')}@flowstudio.design`,
      department: picked.dept,
      phone: '+1 (555) 234-5678',
      bio: `Specializes in ${picked.skills.join(', ')} and studio execution.`,
      status: 'active' as const,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      assignedProjects: activeProjId && activeProjId !== 'default' && activeProjId !== 'universal' ? [activeProjId] : [],
      skills: picked.skills
    };

    useTeamStore.getState().addMember(newMember);
    emitActionSuccess(
      text,
      `⚡ **Instant Action**: Added team member **${memberName}** (${memberRole}) to the studio roster.`,
      { toolName: 'create_team_member', description: `Added team member "${memberName}" (${memberRole})`, data: newMember },
      onSuccessChat,
      `Added ${memberName} to Team!`
    );
    return true;
  }

  return false;
};
