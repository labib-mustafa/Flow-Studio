import React from 'react';
import { ListTodo, FileText, Palette, Sparkles, RefreshCw } from 'lucide-react';
import { TabMode } from '../../types';
import { GeneratedTask } from '../../../../../services/geminiService';

interface ToolsViewProps {
  activeTab: TabMode;
  setActiveTab: (tab: TabMode) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  loading: boolean;
  availableNotesCount: number;
  generatedTasks: GeneratedTask[];
  selectedTaskIds: Set<string>;
  isCompact: boolean;
  onInsertProjectNotes: () => void;
  onGenerate: () => void;
  onApplySelectedTasks: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  activeTab,
  setActiveTab,
  promptText,
  setPromptText,
  loading,
  availableNotesCount,
  generatedTasks,
  selectedTaskIds,
  isCompact,
  onInsertProjectNotes,
  onGenerate,
  onApplySelectedTasks
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 flex flex-col gap-4 sm:gap-5 select-text bg-black">
      {/* Tool Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-[#141416] p-1 rounded-xl border border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{!isCompact ? 'Generate Tasks' : 'Tasks'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brief')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'brief' ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{!isCompact ? 'Extract Brief' : 'Brief'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moodboard')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'moodboard' ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Moodboard</span>
        </button>
      </div>

      {/* Prompt & Requirements Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-300">
            {activeTab === 'tasks' && 'Paste Notes or Requirements:'}
            {activeTab === 'brief' && 'Paste Client Feedback:'}
            {activeTab === 'moodboard' && 'Describe Design Vibe / Aesthetic:'}
          </label>

          {availableNotesCount > 0 && (
            <button
              type="button"
              onClick={onInsertProjectNotes}
              className="text-[11px] font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-800 shadow-2xs cursor-pointer"
            >
              Insert Project Notes ({availableNotesCount})
            </button>
          )}
        </div>

        <textarea
          rows={5}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Enter requirements here..."
          className="w-full text-xs p-3.5 rounded-xl border border-zinc-800 bg-[#121214] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 custom-scrollbar leading-relaxed"
        />

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || !promptText.trim()}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" /> : <Sparkles className="w-3.5 h-3.5 text-zinc-300" />}
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Generated Tasks Output */}
      {activeTab === 'tasks' && generatedTasks.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-200">Generated Tasks ({generatedTasks.length})</span>
            <button
              type="button"
              onClick={onApplySelectedTasks}
              className="text-xs font-medium text-zinc-300 hover:text-white underline cursor-pointer"
            >
              Add {selectedTaskIds.size} to Board ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
