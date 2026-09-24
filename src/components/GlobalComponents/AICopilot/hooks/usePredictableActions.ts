import { AgentToolCall, AgentToolResult, ChatMessage } from '../types';
import { useProjectStore } from '../../../../stores/projectStore';
import { useTaskStore } from '../../../../stores/taskStore';
import { useMoodboardStore } from '../../../../stores/moodboardStore';
import { useEventStore } from '../../../../stores/eventStore';
import { useTimeStore } from '../../../../stores/timeStore';
import { dispatchAgentTools } from '../utils/agentToolDispatcher';
import { matchPredictableTask } from '../utils/predictableActionsMatcher';
import { matchPredictableClientAction } from '../utils/predictableClientMatcher';
import { tryMatchStudioOverview } from '../utils/studioContextHelper';
import { assessToolCall } from '../utils/agentToolGuard';
import { confirm } from '../../../../stores/confirmStore';

export const usePredictableActions = (
  setAvailableNotesCount: (count: number) => void
) => {
  const { currentProject, addProject, setCurrentProject } = useProjectStore();
  const addTask = useTaskStore(state => state.addTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const setItems = useMoodboardStore(state => state.setItems);
  const addEvent = useEventStore(state => state.addEvent);
  const startTimer = useTimeStore(state => state.startTimer);

  // Dispatch In-App Tools from Gemini Agent
  const executeAgentTools = (toolCalls: AgentToolCall[]): AgentToolResult[] => {
    return dispatchAgentTools(toolCalls, {
      currentProject,
      addTask,
      setItems,
      addEvent,
      startTimer,
      addProject,
      setCurrentProject,
      setAvailableNotesCount
    });
  };

  /**
   * Dispatch with the destructive/outbound gate in front of it.
   *
   * Risky calls are batched into ONE confirmation rather than one modal each,
   * so a multi-step plan does not become a queue the user clicks through
   * blindly. Declined calls are reported back as results instead of vanishing,
   * so the model can tell the user what did not happen.
   *
   * Everything not classified as risky dispatches exactly as before.
   */
  const executeAgentToolsGuarded = async (toolCalls: AgentToolCall[]): Promise<AgentToolResult[]> => {
    const results: AgentToolResult[] = [];
    const approved: AgentToolCall[] = [];
    const verdicts = new Map<AgentToolCall, ReturnType<typeof assessToolCall>>();

    for (const call of toolCalls) {
      const verdict = assessToolCall(call);
      if (verdict) verdicts.set(call, verdict);
      else approved.push(call);
    }

    if (verdicts.size > 0) {
      const entries = Array.from(verdicts.values()).filter(Boolean) as NonNullable<
        ReturnType<typeof assessToolCall>
      >[];
      const single = entries.length === 1;

      const ok = await confirm.show({
        title: single ? entries[0].title : `Confirm ${entries.length} actions`,
        message: single
          ? entries[0].message
          : entries.map((v, i) => `${i + 1}. ${v.title}\n${v.message}`).join('\n\n'),
        type: 'danger',
        confirmText: single ? entries[0].confirmText : 'Run all',
        cancelText: 'Cancel'
      });

      if (ok) {
        for (const call of verdicts.keys()) approved.push(call);
      } else {
        for (const [call, verdict] of verdicts) {
          results.push({
            toolName: call.name,
            description: `Cancelled — the user declined "${verdict?.title || call.name}"`,
            data: { declined: true, args: call.args }
          });
        }
      }
    }

    if (approved.length > 0) {
      results.push(...executeAgentTools(approved));
    }
    return results;
  };

  // Predictable Task Fast-Path Engine (instant, without waiting for the API).
  // Destructive branches still confirm — they await the same dialog the guarded
  // model path raises, so this can no longer execute on a pattern match alone.
  const tryExecutePredictableTask = async (
    rawText: string,
    onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void
  ): Promise<boolean> => {
    if (tryMatchStudioOverview(rawText, onSuccessChat)) return true;
    if (matchPredictableClientAction(rawText, onSuccessChat)) return true;
    return await matchPredictableTask(
      rawText,
      {
        currentProject,
        addProject,
        setCurrentProject,
        addTask,
        addEvent,
        startTimer,
        setAvailableNotesCount,
        deleteTask,
        getAllTasks: () => useTaskStore.getState().tasks,
        clearMoodboardItems: (projId: string) => setItems((prev: any) => (Array.isArray(prev) ? prev.filter((item: any) => item.projectId !== projId) : []))
      },
      onSuccessChat
    );
  };

  return {
    executeAgentTools,
    executeAgentToolsGuarded,
    tryExecutePredictableTask
  };
};
