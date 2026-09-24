import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, MainViewMode, TrainedRule } from '../types';
import { STORAGE_KEYS } from '../constants';
import { geminiService } from '../../../../services/geminiService';
import { useSettings } from '../../../../hooks/useSettings';
import { useProjectStore } from '../../../../stores/projectStore';
import { toast } from '../../../../stores/toastStore';
import { getUserTimeZone } from '../../../../lib/timezone';
import { usePredictableActions } from './usePredictableActions';
import { useCopilotQueue } from './useCopilotQueue';
import { executeUndoForToolResults } from '../utils/agentUndoExecutor';
import { formatLocalDate } from '../utils/dateParser';
import { getLiveStudioContext } from '../utils/studioContextHelper';

const loadSaved = (key: string, fallback = '') => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};

export const useCopilotChat = (
  mainView: MainViewMode,
  trainedRules: TrainedRule[],
  availableNotesCount: number,
  setAvailableNotesCount: (n: number) => void,
  onAddRule?: (rule: TrainedRule) => void,
  isOpen?: boolean,
  currentView?: string
) => {
  const { settings, updateSettings } = useSettings();
  const { currentProject } = useProjectStore();
  const { executeAgentToolsGuarded, tryExecutePredictableTask } = usePredictableActions(setAvailableNotesCount);

  const aiSettings = settings.aiSettings || { enabled: false, apiKey: '', model: 'gemini-3.5-flash' };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [inputPrompt, setInputPrompt] = useState<string>(() => loadSaved(STORAGE_KEYS.DRAFT_PROMPT));
  const [lastSavedPrompt, setLastSavedPrompt] = useState<string>(() => loadSaved(STORAGE_KEYS.LAST_PROMPT));
  const [isThinking, setIsThinking] = useState(false);
  const { queuedMessages, enqueue, removeQueuedMessage } = useCopilotQueue(
    isThinking,
    (nextText) => handleSendMessage(nextText)
  );

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const lastPromptRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(chatMessages)); } catch { }
  }, [chatMessages]);

  useEffect(() => {
    try {
      inputPrompt ? localStorage.setItem(STORAGE_KEYS.DRAFT_PROMPT, inputPrompt) : localStorage.removeItem(STORAGE_KEYS.DRAFT_PROMPT);
    } catch { }
  }, [inputPrompt]);

  // Instant scroll to bottom without animated scroll effect
  const scrollToBottom = useCallback(() => {
    const el = chatScrollContainerRef.current;
    if (mainView === 'chat' && el) {
      el.style.scrollBehavior = 'auto';
      el.scrollTop = el.scrollHeight;
    }
  }, [mainView]);

  useEffect(() => {
    scrollToBottom();
    requestAnimationFrame(scrollToBottom);
  }, [chatMessages.length, isThinking, mainView, isOpen, currentView, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = chatInputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, 42), 190)}px`;
  }, [inputPrompt, mainView]);

  // Send Conversational Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text) return;

    if (isThinking) {
      enqueue(text);
      setInputPrompt('');
      return;
    }

    setLastSavedPrompt(text);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PROMPT, text);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_PROMPT);
    } catch { }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Check for /train or /teach command
    if (/^\/(?:train|teach)\b/i.test(text)) {
      const trainMatch = text.match(/^\/(?:train|teach)\s+(.+?)\s*(?:->|=>|::|=)\s*(.+)$/i);
      if (trainMatch) {
        const [, triggerRaw, responseRaw] = trainMatch;
        const trigger = triggerRaw.trim();
        const response = responseRaw.trim();
        if (onAddRule) onAddRule({ id: `rule-${Date.now()}`, trigger, response, createdAt: formatLocalDate(new Date()) });
        setInputPrompt('');

        const isAction = /^(?:schedule|create|make|add|start|track|go\s+to|open)\s+/i.test(response);
        setChatMessages(prev => [
          ...prev,
          { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time },
          {
            id: `msg-${Date.now()}-a`,
            role: 'assistant',
            content: `🎓 **Trained Nova Successfully!**\n\n- **Trigger**: \`${trigger}\`\n- **Response**: \`${response}\`\n- **Behavior**: ${isAction ? '⚡ Auto-executes app action' : '📘 Direct truth/knowledge response'}`,
            timestamp: time
          }
        ]);
        toast.success(`Nova learned: "${trigger}"`);
        return;
      }
    }

    // 2. Check custom trained rules
    const matchedRule = trainedRules.find(r => {
      const u = text.toLowerCase().trim();
      return u === r.trigger.toLowerCase().trim() || u.includes(r.trigger.toLowerCase().trim());
    });

    if (matchedRule) {
      setInputPrompt('');
      setChatMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time },
        { id: `msg-${Date.now()}-a`, role: 'assistant', content: `🎓 **Trained Knowledge** (\`${matchedRule.trigger}\`):\n\n${matchedRule.response}`, timestamp: time }
      ]);
      return;
    }

    // 3. Check Predictable Fast-Path (instant, no API round-trip; destructive
    // branches await a confirmation before they touch anything)
    if (await tryExecutePredictableTask(text, (u, a) => setChatMessages(p => [...p, u, a]))) {
      setInputPrompt('');
      return;
    }

    if (!aiSettings.apiKey) {
      toast.error('Please configure your AI API key');
      return;
    }

    const userMessage: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setInputPrompt('');
    setIsThinking(true);

    try {
      const projectContext = getLiveStudioContext(currentProject, availableNotesCount);

      const resolvedTz = settings.timeZone && settings.timeZone !== 'auto' ? settings.timeZone : getUserTimeZone();
      const apiHistory = newHistory.map(m => ({ role: m.role, content: m.content }));
      const allApiKeys = aiSettings.apiKeys || [];
      const enabledKeys = allApiKeys.filter(k => k.isEnabled !== false);
      const fallbackKeys = enabledKeys.map(k => k.key).filter(k => k && k !== aiSettings.apiKey);
      const customRulesPayload = trainedRules.map(r => ({ trigger: r.trigger, response: r.response }));

      const response = await geminiService.chat(
        aiSettings.apiKey,
        apiHistory,
        projectContext,
        aiSettings.model,
        customRulesPayload,
        resolvedTz,
        fallbackKeys,
        enabledKeys
      );

      // 1. Key Failover / Rotation
      if (response.wasRotated && response.rotatedKey) {
        const nextKey = response.rotatedKey.key;
        const nextId = response.rotatedKey.id;
        const updatedKeys = allApiKeys.map(k => ({ ...k, isActive: (nextId && k.id === nextId) || k.key === nextKey }));
        updateSettings({ aiSettings: { ...aiSettings, apiKey: nextKey, apiKeys: updatedKeys } });
        toast.info(`Switched to backup key: ${response.rotatedKey.name || 'Next Available Key'}`);
      }

      // 2. High Demand / Peak Traffic Model Fallback
      if (response.switchedModel && response.switchedModel !== aiSettings.model) {
        updateSettings({ aiSettings: { ...aiSettings, model: response.switchedModel } });
        toast.info(response.modelSwitchNotice || `Model auto-switched to ${response.switchedModel} due to high traffic.`);
      }

      // Destructive and outbound calls pause here for explicit confirmation —
      // the agent equivalent of the confirm.danger() prompt every delete button
      // in the UI already uses.
      const toolResults = response.toolCalls?.length
        ? await executeAgentToolsGuarded(response.toolCalls)
        : [];
      const contentText = response.text?.trim() || (toolResults.length ? toolResults.map(r => r.description).join('. ') + '.' : "I'm sorry, but I couldn't perform that action or find a matching tool.");

      setChatMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}-a`, role: 'assistant', content: contentText, timestamp: time, toolResults: toolResults.length > 0 ? toolResults : undefined }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: 'assistant', content: err.message || 'AI service error. Please try again.', timestamp: time, isError: true, retryPrompt: text }
      ]);
      toast.error(err.message || 'Agent error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleUndoResponse = useCallback((messageId: string) => {
    const targetIdx = chatMessages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;
    const targetMsg = chatMessages[targetIdx];
    if (targetMsg.isUndone) return;

    const count = executeUndoForToolResults(targetMsg.toolResults, currentProject?.id || 'default', setAvailableNotesCount);
    setChatMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isUndone: true } : m)));

    const prevUser = [...chatMessages.slice(0, targetIdx)].reverse().find((m) => m.role === 'user');
    if (prevUser?.content) setInputPrompt(prevUser.content);
    toast[count > 0 ? 'success' : 'info'](count > 0 ? `Undid response & reverted ${count} actions` : 'Response marked as undone');
  }, [chatMessages, currentProject?.id, setAvailableNotesCount]);

  const handleQuickPrompt = (prompt: string) => { setInputPrompt(prompt); handleSendMessage(prompt); };
  const clearChat = () => { setChatMessages([]); localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES); toast.info('Chat history cleared'); };

  return {
    chatMessages, setChatMessages, inputPrompt, setInputPrompt, lastSavedPrompt,
    isThinking, chatBottomRef, chatScrollContainerRef, lastPromptRef, chatInputRef,
    scrollToBottom, scrollToLastPrompt: scrollToBottom, handleSendMessage, handleQuickPrompt, clearChat,
    queuedMessages, removeQueuedMessage, handleUndoResponse
  };
};
