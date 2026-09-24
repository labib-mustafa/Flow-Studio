import { ChatMessage, AgentToolCall, GeneratedTask, DesignBrief, MoodboardGeneratedItem } from '../../../services/geminiService';

export interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView?: string;
}

export type MainViewMode = 'chat' | 'tools' | 'train';
export type TabMode = 'tasks' | 'brief' | 'moodboard';

export interface TrainedRule {
  id: string;
  trigger: string;
  response: string;
  createdAt: string;
}

export interface AgentToolResult {
  toolName: string;
  description: string;
  data: any;
}

export type ResizeDirection =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'corner'
  | 'left-drawer';

export interface WindowDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type {
  ChatMessage,
  AgentToolCall,
  GeneratedTask,
  DesignBrief,
  MoodboardGeneratedItem,
};
