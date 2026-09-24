/**
 * Groq rate limiting: the per-key ledger and the "fit this request" planner.
 *
 * Kept out of server.ts, and free of any schema import, so the timing parser and
 * the budgeting maths can be exercised directly. Both are the kind of code that
 * fails silently: a mis-parsed reset window makes the limiter believe the budget
 * refilled when it has not, and an off-by-one in the output reserve turns every
 * request back into a 413.
 */

export type AiProvider = 'groq' | 'gemini';

/** Published TPM for every Groq model this app routes to (8K at base tier). */
export const GROQ_DEFAULT_TPM = 8000;

/** Held back so the completion itself has room inside the same TPM window. */
export const GROQ_OUTPUT_RESERVE = 1000;

/** Below this, sending tools is not worth the tokens. */
export const MIN_TOOL_BUDGET = 400;

export interface KeyRateState {
  limitTokens?: number;
  remainingTokens?: number;
  resetTokensAt?: number;
  limitRequests?: number;
  remainingRequests?: number;
  resetRequestsAt?: number;
  updatedAt?: number;
}

/**
 * Model id -> the provider whose key must serve it.
 *
 * The client keeps a twin of this in `src/services/geminiService.ts`. The two
 * must agree, or the client would send a key the server then rejects.
 */
export const providerForModel = (modelId: string): AiProvider =>
  /^gemini/i.test(modelId || '') ? 'gemini' : 'groq';

/**
 * Groq durations look like "7.66s", "2m59.56s", "1h2m3s" or "500ms".
 *
 * Returns 0 for anything unparseable, which callers read as "window already
 * refilled" — so an unparseable value degrades to "allow the request" rather
 * than to a limiter that refuses forever.
 */
export const parseGroqDuration = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  let ms = 0;
  const re = /(\d+(?:\.\d+)?)\s*(ms|s|m|h)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const value = parseFloat(m[1]);
    const unit = m[2];
    ms += unit === 'ms' ? value : unit === 's' ? value * 1000 : unit === 'm' ? value * 60000 : value * 3600000;
  }
  return Math.round(ms);
};

/**
 * Per-key view of the provider's budget.
 *
 * Groq applies limits per *organization*, not per key: two keys from one org
 * share a single budget, so rotating between them gains nothing. The ledger is
 * keyed by secret for isolation; the numbers themselves belong to the org.
 */
export const createGroqRateLedger = () => {
  const entries = new Map<string, KeyRateState>();

  // Only the tail, so a full secret never lands in process state.
  const idOf = (apiKey: string): string => `...${(apiKey || '').slice(-10)}`;

  const record = (apiKey: string, response: any, now = Date.now()): KeyRateState => {
    const num = (name: string): number | undefined => {
      const raw = response?.headers?.get?.(name);
      if (raw == null || raw === '') return undefined;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const state: KeyRateState = {
      limitTokens: num('x-ratelimit-limit-tokens'),
      remainingTokens: num('x-ratelimit-remaining-tokens'),
      resetTokensAt: now + parseGroqDuration(response?.headers?.get?.('x-ratelimit-reset-tokens')),
      limitRequests: num('x-ratelimit-limit-requests'),
      remainingRequests: num('x-ratelimit-remaining-requests'),
      resetRequestsAt: now + parseGroqDuration(response?.headers?.get?.('x-ratelimit-reset-requests')),
      updatedAt: now,
    };
    entries.set(idOf(apiKey), state);
    return state;
  };

  const get = (apiKey: string): KeyRateState | undefined => entries.get(idOf(apiKey));

  /** TPM available right now, allowing for a window that has already refilled. */
  const availableTokens = (apiKey: string, now = Date.now()): number => {
    const state = get(apiKey);
    const ceiling = state?.limitTokens ?? GROQ_DEFAULT_TPM;
    if (!state || state.remainingTokens == null) return ceiling;
    if (state.resetTokensAt && now >= state.resetTokensAt) return ceiling;
    return Math.min(state.remainingTokens, ceiling);
  };

  /** Seconds until this key can accept another request. Zero means send now. */
  const retryAfterSeconds = (apiKey: string, now = Date.now()): number => {
    const state = get(apiKey);
    if (!state) return 0;
    const tokensLeft = availableTokens(apiKey, now);
    const requestsLeft = state.resetRequestsAt && now >= state.resetRequestsAt
      ? Infinity
      : (state.remainingRequests ?? Infinity);
    if (tokensLeft > 0 && requestsLeft > 0) return 0;
    const waitUntil = tokensLeft <= 0 ? (state.resetTokensAt || 0) : (state.resetRequestsAt || 0);
    return Math.max(1, Math.ceil((waitUntil - now) / 1000));
  };

  return { idOf, record, get, availableTokens, retryAfterSeconds };
};

export type GroqRateLedger = ReturnType<typeof createGroqRateLedger>;

/**
 * Drop the oldest conversation turns until the request fits.
 *
 * The first message is the system instruction and the last is the request in
 * flight, and neither may be dropped, so trimming happens in the middle.
 */
export const trimHistoryToFit = (
  messages: any[],
  tokenBudget: number,
  estimate: (value: unknown) => number
): { messages: any[]; dropped: number } => {
  if (!Array.isArray(messages) || messages.length <= 3) return { messages, dropped: 0 };
  if (estimate(messages) <= tokenBudget) return { messages, dropped: 0 };

  const head = messages[0];
  const tail = messages[messages.length - 1];
  const middle = messages.slice(1, -1);
  let dropped = 0;

  while (middle.length > 0 && estimate([head, ...middle, tail]) > tokenBudget) {
    middle.shift();
    dropped++;
  }

  return { messages: dropped > 0 ? [head, ...middle, tail] : messages, dropped };
};

export interface GroqPlan {
  tools: any[];
  messages: any[];
  totalTokens: number;
  availableTokens: number;
  ceilingTokens: number;
  droppedMessages: number;
  fits: boolean;
}

/**
 * Fit one request inside the key's remaining per-minute budget.
 *
 * Order of sacrifice: the tool list first, since a narrower turn can still
 * answer the question, then the older conversation turns, and only then give up.
 * Cutting tools first is deliberate — the alternative is a 413, where nothing
 * runs at all.
 *
 * Pure by construction: the clock, the token estimate and the tool selector are
 * all passed in, so the maths can be tested without a network or a schema.
 */
export const planGroqRequest = (input: {
  messages: any[];
  query: string;
  /** TPM available now, as reported by the provider. */
  availableTokens: number;
  /** TPM ceiling, as reported by the provider. */
  ceilingTokens: number;
  /** False on the first request for a key, before any headers have been seen. */
  hasHeaderData: boolean;
  /** Conservative fallback used only when `hasHeaderData` is false. */
  staticToolBudget: number;
  estimate: (value: unknown) => number;
  selectTools: (query: string, budget: number) => any[];
}): GroqPlan => {
  const {
    messages, query, availableTokens, ceilingTokens, hasHeaderData,
    staticToolBudget, estimate, selectTools,
  } = input;

  const toolBudget = hasHeaderData
    ? Math.max(MIN_TOOL_BUDGET, availableTokens - estimate(messages) - GROQ_OUTPUT_RESERVE)
    : staticToolBudget;

  const tools = selectTools(query, toolBudget);
  let finalMessages = messages;
  let droppedMessages = 0;
  let totalTokens = estimate(messages) + estimate(tools) + GROQ_OUTPUT_RESERVE;

  if (totalTokens > availableTokens) {
    const trimmed = trimHistoryToFit(
      messages,
      Math.max(0, availableTokens - estimate(tools) - GROQ_OUTPUT_RESERVE),
      estimate
    );
    finalMessages = trimmed.messages;
    droppedMessages = trimmed.dropped;
    totalTokens = estimate(finalMessages) + estimate(tools) + GROQ_OUTPUT_RESERVE;
  }

  return {
    tools,
    messages: finalMessages,
    totalTokens,
    availableTokens,
    ceilingTokens,
    droppedMessages,
    fits: totalTokens <= availableTokens,
  };
};
