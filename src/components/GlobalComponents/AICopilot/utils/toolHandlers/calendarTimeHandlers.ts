import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useEventStore } from '../../../../../stores/eventStore';
import { useTimeStore } from '../../../../../stores/timeStore';

interface CalendarTimeContext {
  activeProjId: string;
  activeProjTitle: string;
  addEvent: (evt: any) => void;
  startTimer: (projectId: string, projectTitle: string, taskTitle: string) => void;
}

export function handleCalendarTimeTools(
  call: AgentToolCall,
  ctx: CalendarTimeContext
): AgentToolResult | null {
  const { activeProjId, activeProjTitle, addEvent, startTimer } = ctx;

  // 1. Schedule Event
  if (call.name === 'schedule_event' || call.name === 'add_project_event') {
    const { title, date, time, category, duration, type, description } = call.args;
    if (title && date) {
      const validTypes = ['Call', 'Design', 'Team Sync', 'Other'];
      const rawType = type || category || 'Meeting';
      const eventType = validTypes.includes(rawType) ? rawType : 'Other';

      const newEvt = {
        title,
        date,
        time: time || '10:00 AM',
        type: eventType as any,
        description: description || (duration ? `Duration: ${duration}` : ''),
        participants: 'Team',
        projectId: activeProjId
      };

      addEvent(newEvt);
      const created = useEventStore.getState().events.find(
        (e) => e.title === title && e.date === date
      );

      toast.success(`Scheduled "${title}" on ${date}!`);
      return {
        toolName: 'schedule_event',
        description: `Scheduled "${title}" on ${date} (${newEvt.time})`,
        data: created || newEvt
      };
    }
  }

  // 2. Update Event
  if (call.name === 'update_event') {
    const { eventId, title, eventTitle, date, time, description } = call.args;
    const searchTitle = title || eventTitle;
    const eventStore = useEventStore.getState();
    const events = eventStore.events || [];
    const target = events.find(
      (e) => (eventId && e.id === eventId) || (searchTitle && e.title.toLowerCase().includes(searchTitle.toLowerCase()))
    );

    if (target) {
      const updates: any = {};
      if (date) updates.date = date;
      if (time) updates.time = time;
      if (description) updates.description = description;

      eventStore.updateEvent(target.id, updates);
      toast.success(`Updated event "${target.title}"`);
      return {
        toolName: 'update_event',
        description: `Updated event "${target.title}"`,
        data: { id: target.id, ...updates }
      };
    }
  }

  // 3. Delete Event
  if (call.name === 'delete_event') {
    const { eventId, title, eventTitle } = call.args;
    const searchTitle = title || eventTitle;
    const eventStore = useEventStore.getState();
    const target = (eventStore.events || []).find(
      (e) => (eventId && e.id === eventId) || (searchTitle && e.title.toLowerCase().includes(searchTitle.toLowerCase()))
    );
    if (target) {
      eventStore.deleteEvent(target.id);
      toast.success(`Cancelled event "${target.title}"`);
      return {
        toolName: 'delete_event',
        description: `Cancelled event "${target.title}"`,
        data: target
      };
    }
  }

  // 4. Start Timer
  if (call.name === 'start_timer' || call.name === 'start_time_tracker') {
    const taskTitle = call.args.title || call.args.taskTitle || 'Task Timer';
    const projTitle = call.args.projectTitle || activeProjTitle;
    startTimer(activeProjId, projTitle, taskTitle);
    toast.success(`Started timer: ${taskTitle}`);
    return {
      toolName: 'start_timer',
      description: `Started live timer for "${taskTitle}" (${projTitle})`,
      data: { taskTitle, projectTitle: projTitle }
    };
  }

  // 5. Stop Timer
  if (call.name === 'stop_timer') {
    const timeStore = useTimeStore.getState();
    const active = timeStore.activeTimer;
    if (active) {
      timeStore.stopTimer();
      toast.success(`Stopped timer for "${active.taskTitle}"`);
      return {
        toolName: 'stop_timer',
        description: `Stopped timer for "${active.taskTitle}"`,
        data: active
      };
    } else {
      toast.info('No active timer running.');
      return {
        toolName: 'stop_timer',
        description: 'No active timer to stop',
        data: null
      };
    }
  }

  // 6. Add Manual Time Entry
  if (call.name === 'add_time_entry') {
    const { taskTitle, durationMinutes, date, projectTitle } = call.args;
    if (taskTitle && durationMinutes) {
      const timeStore = useTimeStore.getState();
      const numMinutes = typeof durationMinutes === 'number' ? durationMinutes : parseFloat(durationMinutes) || 30;
      const durationSeconds = Math.round(numMinutes * 60);
      const targetDate = date ? new Date(date) : new Date();
      const startTime = targetDate.getTime();
      const endTime = startTime + durationSeconds * 1000;

      timeStore.addManualEntry({
        projectId: activeProjId,
        projectTitle: projectTitle || activeProjTitle,
        taskTitle,
        startTime,
        endTime,
        durationSeconds
      });

      const created = useTimeStore.getState().entries[0];
      toast.success(`Logged ${numMinutes} mins for "${taskTitle}"!`);
      return {
        toolName: 'add_time_entry',
        description: `Logged ${numMinutes}m for "${taskTitle}"`,
        data: created || { taskTitle, durationMinutes: numMinutes }
      };
    }
  }

  return null;
}
