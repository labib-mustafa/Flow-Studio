import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '../../../../stores/toastStore';

export interface QueuedMessage {
  id: string;
  text: string;
  timestamp: string;
}

export const useCopilotQueue = (
  isThinking: boolean,
  onDispatchNext: (text: string) => void
) => {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const prevThinkingRef = useRef(isThinking);

  // Auto-dequeue when thinking finishes
  useEffect(() => {
    const wasThinking = prevThinkingRef.current;
    prevThinkingRef.current = isThinking;

    if (wasThinking && !isThinking && queuedMessages.length > 0) {
      const nextMsg = queuedMessages[0];
      setQueuedMessages((prev) => prev.slice(1));
      // Dispatch next prompt with micro-delay for clean transition
      const timer = setTimeout(() => {
        onDispatchNext(nextMsg.text);
        toast.info(`Running queued prompt: "${nextMsg.text.slice(0, 30)}${nextMsg.text.length > 30 ? '...' : ''}"`);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isThinking, queuedMessages, onDispatchNext]);

  const enqueue = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newQueueItem: QueuedMessage = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: trimmed,
      timestamp: time
    };
    setQueuedMessages((prev) => [...prev, newQueueItem]);
    toast.success(`Prompt queued (#${queuedMessages.length + 1}) — will run next`);
  }, [queuedMessages.length]);

  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((m) => m.id !== id));
    toast.info('Removed prompt from queue');
  }, []);

  const clearQueue = useCallback(() => {
    setQueuedMessages([]);
  }, []);

  return {
    queuedMessages,
    enqueue,
    removeQueuedMessage,
    clearQueue
  };
};
