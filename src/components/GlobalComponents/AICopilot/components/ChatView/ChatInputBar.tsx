import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowRight, Clock, Sparkles, ListTodo, Palette, FileText, GraduationCap, Trash2, FolderGit2, X } from 'lucide-react';
import { ProjectSelector } from '../ProjectSelector';
import { ModelSelector } from '../ModelSelector';

interface ChatInputBarProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  isThinking: boolean;
  lastSavedPrompt: string;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onSendMessage: (text?: string) => void;
  onNavigateToTrain: () => void;
  onClearChat?: () => void;
  chatMessagesCount?: number;
  currentProject: any;
  availableNotesCount: number;
  isCompact: boolean;
  isUltraCompact: boolean;
  queuedMessages?: Array<{ id: string; text: string; timestamp: string }>;
  onRemoveQueuedMessage?: (id: string) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputPrompt,
  setInputPrompt,
  isThinking,
  lastSavedPrompt,
  chatInputRef,
  onSendMessage,
  onNavigateToTrain,
  onClearChat,
  chatMessagesCount,
  currentProject,
  availableNotesCount,
  isCompact,
  isUltraCompact,
  queuedMessages,
  onRemoveQueuedMessage
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);

  // Dynamic textarea height adjustment
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      const scrollHeight = chatInputRef.current.scrollHeight;
      chatInputRef.current.style.height = `${Math.min(Math.max(scrollHeight, 38), 180)}px`;
    }
  }, [inputPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputPrompt.trim() || isThinking) {
        onSendMessage();
      }
    } else if (e.key === 'ArrowUp' && !inputPrompt.trim() && lastSavedPrompt) {
      e.preventDefault();
      setInputPrompt(lastSavedPrompt);
    }
  };

  const handleQuickAction = (text: string) => {
    setShowActionsMenu(false);
    onSendMessage(text);
  };

  // Slash and Mention Detection
  const trimmed = inputPrompt.trim();
  const showSlashMenu = trimmed === '/' || inputPrompt.endsWith(' /');
  const showMentionMenu = trimmed === '@' || inputPrompt.endsWith(' @');

  const applySlashCommand = (cmd: string, actionPrompt?: string) => {
    if (actionPrompt) {
      setInputPrompt('');
      onSendMessage(actionPrompt);
    } else {
      setInputPrompt(cmd + ' ');
      if (chatInputRef.current) chatInputRef.current.focus();
    }
  };

  const applyMention = (mentionText: string) => {
    const base = inputPrompt.endsWith('@') ? inputPrompt.slice(0, -1) : inputPrompt;
    setInputPrompt(`${base}${mentionText} `);
    if (chatInputRef.current) chatInputRef.current.focus();
  };

  return (
    <div className="flex flex-col gap-1.5 shrink-0 relative z-30 font-sans select-none bg-transparent">
      {/* Queued Messages Chip Stack */}
      {queuedMessages && queuedMessages.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
          <span className="text-[10px] font-medium text-zinc-300 bg-zinc-900 border border-zinc-750 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5 text-zinc-400" />
            Queued ({queuedMessages.length})
          </span>
          {queuedMessages.map((q, idx) => (
            <div
              key={q.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161618] border border-zinc-800 text-zinc-300 max-w-[190px] shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  setInputPrompt(q.text);
                  if (onRemoveQueuedMessage) onRemoveQueuedMessage(q.id);
                }}
                className="truncate hover:underline text-left cursor-pointer text-[10px]"
                title={`Click to edit: "${q.text}"`}
              >
                {idx + 1}. {q.text}
              </button>
              {onRemoveQueuedMessage && (
                <button
                  type="button"
                  onClick={() => onRemoveQueuedMessage(q.id)}
                  className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer shrink-0"
                  title="Remove from queue"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Bar above Input: Folder / Project Selector */}
      <div className="flex items-center justify-between px-1">
        <ProjectSelector isCompact={isCompact} />

        {onClearChat && (chatMessagesCount || 0) > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            title="Clear current chat thread"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Main Dark Input Card */}
      <div className="relative rounded-2xl bg-[#141416] border border-zinc-800 focus-within:border-zinc-700 transition-colors shadow-lg p-3 sm:p-3.5 flex flex-col gap-2">
        {/* Interactive Slash Commands Popover */}
        {showSlashMenu && (
          <div className="absolute left-3 bottom-full mb-2 z-[370] w-64 rounded-xl bg-[#141416] border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-0.5 text-left animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" /> Actions (/):
            </div>
            <button
              type="button"
              onClick={() => applySlashCommand('/tasks', currentProject ? 'Create 3 urgent sprint tasks for this project' : 'Create 3 urgent studio tasks for the team')}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <ListTodo className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">/tasks</span>
              <span className="text-[10px] text-zinc-500 ml-auto">Generate tasks</span>
            </button>
            <button
              type="button"
              onClick={() => applySlashCommand('/moodboard', currentProject ? 'Curate aesthetic color swatches and moodboard cards for this project' : 'Curate aesthetic color swatches and design inspiration for the studio')}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">/moodboard</span>
              <span className="text-[10px] text-zinc-500 ml-auto">Inspiration & colors</span>
            </button>
            <button
              type="button"
              onClick={() => applySlashCommand('/brief', currentProject ? 'Summarize the design notes and deliverables for this project' : 'Summarize the studio overview, active team members, and deliverables')}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">/brief</span>
              <span className="text-[10px] text-zinc-500 ml-auto">Summarize brief</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputPrompt('');
                onNavigateToTrain();
              }}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">/train</span>
              <span className="text-[10px] text-zinc-500 ml-auto">Training studio</span>
            </button>
          </div>
        )}

        {/* Interactive Mention Context Popover */}
        {showMentionMenu && (
          <div className="absolute left-3 bottom-full mb-2 z-[370] w-64 rounded-xl bg-[#141416] border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-0.5 text-left animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Mention Context (@):
            </div>
            <button
              type="button"
              onClick={() => applyMention(currentProject ? `@${currentProject.title || currentProject.name}` : '@Flow-Studio')}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium truncate">{currentProject ? `@${currentProject.title || currentProject.name}` : '@Flow-Studio'}</span>
              <span className="text-[10px] text-zinc-500 ml-auto">Project scope</span>
            </button>
            <button
              type="button"
              onClick={() => applyMention(`@notes (${availableNotesCount} available)`)}
              className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">@notes</span>
              <span className="text-[10px] text-zinc-500 ml-auto">{availableNotesCount} notes</span>
            </button>
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={chatInputRef as any}
          rows={1}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, @ to mention, / for actions"
          style={{ minHeight: '38px', maxHeight: '180px' }}
          className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-100 placeholder:text-zinc-500 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto custom-scrollbar leading-relaxed font-sans"
        />

        {/* Bottom Controls Row: (+) | Model Selector | (→) */}
        <div className="flex items-center justify-between pt-0.5 select-none">
          {/* Left: + Button and Model Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Plus Action Button */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${showActionsMenu
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                  }`}
                title="1-Click Actions & Studio Tools (+)"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Actions Dropdown Popover */}
              {showActionsMenu && (
                <div className="absolute left-0 bottom-full mb-2 z-[360] w-64 rounded-xl bg-[#141416] border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-0.5 text-left animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                    <span>1-Click Autonomous Actions</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickAction(currentProject ? 'Create 3 urgent design sprint tasks for this project' : 'Create 3 urgent studio tasks for the team')}
                    className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs transition-colors"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium">Generate Sprint Tasks</div>
                      <div className="text-[10px] text-zinc-500">Autonomous task cards</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction(currentProject ? 'Curate aesthetic color swatches and moodboard cards for this project' : 'Curate aesthetic color swatches and design inspiration for the studio')}
                    className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium">Curate Moodboard</div>
                      <div className="text-[10px] text-zinc-500">Aesthetic colors & inspiration</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction(currentProject ? 'Summarize the design notes and deliverables for this project' : 'Summarize the studio overview, active team members, and deliverables')}
                    className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium">{currentProject ? 'Project Brief' : 'Studio Brief'}</div>
                      <div className="text-[10px] text-zinc-500">Deliverables & requirements</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onNavigateToTrain();
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/80 text-zinc-200 cursor-pointer text-xs transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium">Train Nova Agent</div>
                      <div className="text-[10px] text-zinc-400">Custom knowledge & truths</div>
                    </div>
                  </button>

                  {onClearChat && (chatMessagesCount || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsMenu(false);
                        onClearChat();
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-zinc-800 text-zinc-300 cursor-pointer text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Clear Chat Thread</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Model Selector Trigger */}
            <ModelSelector isCompact={isCompact} />
          </div>

          {/* Right: Circular Send Button with Right Arrow */}
          <button
            type="button"
            onClick={() => onSendMessage()}
            disabled={!inputPrompt.trim() && !isThinking}
            className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 focus:outline-none ${isThinking
              ? 'bg-zinc-700 hover:bg-zinc-600 text-white animate-pulse'
              : inputPrompt.trim()
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white active:scale-95 shadow-xs'
                : 'bg-[#222226] text-zinc-600 cursor-not-allowed opacity-80'
              }`}
            title={isThinking ? 'Queue prompt to run next' : 'Send message (Enter)'}
          >
            {isThinking ? (
              <Clock className="w-3.5 h-3.5 text-white" />
            ) : (
              <ArrowRight className="w-4 h-4 text-zinc-200" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
