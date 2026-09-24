import { TrainedRule } from './types';

export const DEFAULT_TRAINED_RULES: TrainedRule[] = [
  {
    id: 'rule-survey',
    trigger: 'survey meeting',
    response: 'schedule meeting Survey & User Feedback on 22 sep at 2pm',
    createdAt: '2026-09-20',
  },
  {
    id: 'rule-palette',
    trigger: 'brand colors',
    response: 'Flow Studio signature brand palette is Obsidian (#09090b), Clean Slate (#f8fafc), and Amber Glow (#f59e0b).',
    createdAt: '2026-09-20',
  },
  {
    id: 'rule-hours',
    trigger: 'studio hours',
    response: 'Our creative studio hours are Monday through Friday, 9:00 AM – 6:00 PM.',
    createdAt: '2026-09-20',
  },
  // NOTE: default rules must only carry studio *knowledge*. Rules whose trigger
  // or response is an app command short-circuit in useCopilotChat before the
  // tool dispatcher runs, which silently blocks the command from executing.
  // Retired ids are filtered out of persisted storage in useTrainingRules.ts.
  {
    id: 'rule-client-appointment',
    trigger: 'book appointment',
    response: 'Nova books client consultations, syncs them to the studio calendar, logs activity, and adds meeting notes.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-client-docs',
    trigger: 'attach document',
    response: 'Nova attaches regulatory templates (Mutual NDA, MSA v4, Onboarding Workbook, SOW) directly to client vaults.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-client-tags',
    trigger: 'client tags',
    response: 'Nova categorizes clients with brand tags like STRATEGIC, GOVERNMENT, FINTECH, DESIGN, and RETAINER.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-client-invoices',
    trigger: 'client invoice',
    response: 'Nova logs itemized invoices for clients with customizable maturity cycles (7, 14, 30, or 60 days).',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-project-overview',
    trigger: 'project overview',
    response: 'Nova manages project velocity pulse, target countdowns, active deliverables, tags, Figma master files, and cover banners.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-link-figma',
    trigger: 'link figma',
    response: 'Nova links external Figma master canvas files directly to your project command center.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-link-brief',
    trigger: 'link brief',
    response: 'Nova links client brief documents (Google Docs, Notion) directly to project deliverables & shortcuts.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-project-banner',
    trigger: 'project banner',
    response: 'Nova updates project hero cover banners with high-resolution visual showcase images.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-project-files',
    trigger: 'project files',
    response: 'Nova creates dedicated filesystem workspace folders and navigates the tabbed file explorer.',
    createdAt: '2026-09-22',
  },
  {
    id: 'rule-project-moodboard',
    trigger: 'project moodboard',
    response: 'Nova curates harmonious color palettes, sticky design directives, typography pairings, and web bookmarks on the infinite canvas.',
    createdAt: '2026-09-22',
  },
];

export const STORAGE_KEYS = {
  CHAT_MESSAGES: 'flowstudio_ai_chat_messages',
  DRAFT_PROMPT: 'flowstudio_ai_draft_prompt',
  LAST_PROMPT: 'flowstudio_ai_last_prompt',
  TRAINING_RULES: 'flowstudio_ai_training_rules',
  SHOW_QUICK_ACTIONS: 'flowstudio_ai_show_quick_actions',
  DOCK_DRAWER: 'flowstudio_ai_dock_drawer',
  DRAWER_WIDTH: 'flowstudio_ai_drawer_width',
} as const;
