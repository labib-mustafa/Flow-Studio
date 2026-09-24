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

/**
 * Which provider must serve a given model id.
 *
 * The selected model decides the provider, and the provider decides which key
 * is used. This is the client-side twin of `providerForModel` in server.ts —
 * the two must agree, or the client would send a key the server then rejects.
 */
export function getProviderForModel(model?: string): 'groq' | 'gemini' {
  return /^gemini/i.test((model || '').trim()) ? 'gemini' : 'groq';
}

export function cleanErrorMessage(raw: string): string {
  if (!raw) return 'An unknown error occurred';
  if (raw.includes('invalid_api_key') || raw.includes('Invalid API Key') || (raw.includes('401') && raw.includes('Groq'))) {
    return 'Invalid Groq API key. Please check your key at console.groq.com/keys (starts with "gsk_").';
  }
  if (raw.includes('rate_limit_exceeded') || (raw.includes('429') && raw.includes('Groq'))) {
    return 'Groq rate limit reached (30 requests/min). Please wait a few seconds and try again.';
  }
  if (raw.includes('Groq limit')) {
    // Already written for the user in server.ts, including the retry estimate.
    return raw.replace(/^\[Groq limit\]\s*/, '');
  }
  if (raw.includes('413') || raw.includes('tokens per minute') || raw.includes('Request too large')) {
    return (
      'This request is larger than your Groq key allows per minute, even after trimming the tool list. ' +
      'Groq\u2019s on-demand tier allows 8,000 tokens/minute, which the full tool surface exceeds. ' +
      'Add a Gemini key in Settings, or move the Groq key to a higher tier.'
    );
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

/**
 * Outer ceiling on one agent turn, in milliseconds.
 *
 * The server bounds each individual provider call, but it can retry across keys
 * and models, so this is the last line of defence: past it the UI recovers with
 * a real error instead of spinning "thinking" forever with input locked behind
 * it. Sits above the server's own timeout so its more specific message wins when
 * it can.
 */
const CHAT_REQUEST_TIMEOUT_MS = 150_000;

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch('/api/ai/chat', {
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
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(
          `The agent did not respond within ${Math.round(CHAT_REQUEST_TIMEOUT_MS / 1000)} seconds, ` +
          `so the request was stopped. The provider stalled — try again, or switch to a different model.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

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
