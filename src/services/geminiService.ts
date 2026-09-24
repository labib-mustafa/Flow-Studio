/**
 * Flow Studio — AI Design Co-Pilot Service
 * Connects to the local Express backend /api/ai/* endpoints using Google Gemini.
 */

export interface GeneratedTask {
  id: string;
  projectId: string;
  title: string;
  details: string;
  phase: 'todo' | 'inprogress' | 'review' | 'done';
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  taskType: string;
  assignees: string[];
}

export interface DesignBrief {
  projectTitle: string;
  summary: string;
  objectives: string[];
  visualDirectives: string[];
  brandColors: string[];
  typographySuggestions: string[];
  keyDeliverables: string[];
  constraints: string[];
}

export interface MoodboardGeneratedItem {
  id: string;
  projectId: string;
  type: 'color' | 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  content?: string;
  color?: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
  retryPrompt?: string;
  isUndone?: boolean;
  toolResults?: Array<{
    toolName: string;
    description: string;
    data: any;
  }>;
}

export interface AgentToolCall {
  name: string;
  args: Record<string, any>;
}

export function getProviderFromKey(key?: string): 'groq' | 'gemini' | 'unknown' {
  const trimmed = (key || '').trim();
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('AIzaSy')) return 'gemini';
  return 'unknown';
}

export function cleanErrorMessage(raw: string): string {
  if (!raw) return 'An unknown error occurred';
  if (raw.includes('invalid_api_key') || raw.includes('Invalid API Key') || (raw.includes('401') && raw.includes('Groq'))) {
    return 'Invalid Groq API key. Please check your key at console.groq.com/keys (starts with "gsk_").';
  }
  if (raw.includes('rate_limit_exceeded') || (raw.includes('429') && raw.includes('Groq'))) {
    return 'Groq rate limit reached (30 requests/min). Please wait a few seconds and try again.';
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error && parsed.error.message) {
      if (parsed.error.message.includes('API key not valid') || parsed.error.reason === 'API_KEY_INVALID') {
        return 'The API key is invalid. Please make sure you copied your key correctly (Google "AIzaSy..." or Groq "gsk_...").';
      }
      return parsed.error.message;
    }
  } catch {}
  if (raw.includes('API key not valid') || raw.includes('API_KEY_INVALID')) {
    return 'The API key is invalid. Please make sure you copied your key correctly (Google "AIzaSy..." or Groq "gsk_...").';
  }
  return raw;
}

import { getUserTimeZone } from '../lib/timezone';

export const geminiService = {
  /** Send conversational messages to the personal agent */
  chat: async (
    apiKey: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    projectContext?: { id?: string; title?: string; clientName?: string; notesCount?: number },
    model?: string,
    customRules?: Array<{ trigger: string; response: string }>,
    timeZone?: string,
    fallbackKeys?: string[],
    enabledKeys?: Array<{ id?: string; name?: string; key: string; provider?: string; isEnabled?: boolean }>
  ): Promise<{
    text: string;
    toolCalls: AgentToolCall[];
    wasRotated?: boolean;
    rotatedKey?: { id?: string; name?: string; key: string; provider?: string };
    switchedModel?: string;
    modelSwitchNotice?: string;
  }> => {
    const trimmedKey = (apiKey || '').trim();
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: trimmedKey,
        fallbackKeys: Array.isArray(fallbackKeys) ? fallbackKeys : [],
        enabledKeys: Array.isArray(enabledKeys) ? enabledKeys : [],
        messages,
        projectContext,
        model,
        customRules,
        timeZone: timeZone || getUserTimeZone()
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(cleanErrorMessage(data.error || 'Chat failed'));
    }

    return {
      text: data.text || '',
      toolCalls: data.toolCalls || [],
      wasRotated: Boolean(data.rotated),
      rotatedKey: data.usedKey,
      switchedModel: data.switchedModel,
      modelSwitchNotice: data.modelSwitchNotice
    };
  },
  /** Test connection with the provided API key */
  testKey: async (apiKey: string, model?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const trimmedKey = (apiKey || '').trim();
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmedKey, model })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: cleanErrorMessage(data.error || 'Failed to authenticate key') };
      }
      return { success: true, message: data.message || 'Key connected' };
    } catch (e: any) {
      return { success: false, message: cleanErrorMessage(e.message || 'Connection error') };
    }
  },

  /** Convert notes or briefs into ClickUp-style project tasks */
  generateTasks: async (
    apiKey: string,
    notes: string,
    projectId: string,
    projectTitle?: string,
    model?: string
  ): Promise<GeneratedTask[]> => {
    const res = await fetch('/api/ai/generate-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, notes, projectId, projectTitle, model })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(cleanErrorMessage(data.error || 'Failed to generate tasks'));
    }

    return data.tasks || [];
  },

  /** Extract an Executive Design Brief from unstructured notes */
  extractBrief: async (apiKey: string, notes: string, model?: string): Promise<DesignBrief> => {
    const res = await fetch('/api/ai/extract-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: (apiKey || '').trim(), notes, model })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(cleanErrorMessage(data.error || 'Failed to extract design brief'));
    }

    return data.brief;
  },

  /** Generate non-overlapping Moodboard swatches and design directives */
  generateMoodboard: async (
    apiKey: string,
    vibeOrPrompt: string,
    projectId: string,
    model?: string
  ): Promise<MoodboardGeneratedItem[]> => {
    const res = await fetch('/api/ai/generate-moodboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: (apiKey || '').trim(), vibeOrPrompt, projectId, model })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(cleanErrorMessage(data.error || 'Failed to generate moodboard items'));
    }

    return data.items || [];
  }
};
