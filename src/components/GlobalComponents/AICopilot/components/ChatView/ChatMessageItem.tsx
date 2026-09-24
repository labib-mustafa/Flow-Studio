import React from 'react';
import { Bot, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { ChatMessage } from '../../types';
import { renderFormattedContent } from '../../utils/markdownRenderer';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isLastPrompt: boolean;
  lastPromptRef?: React.RefObject<HTMLDivElement | null>;
  onRetry: (prompt: string) => void;
  onUndo?: (messageId: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isLastPrompt,
  lastPromptRef,
  onRetry,
  onUndo
}) => {
  const isUser = msg.role === 'user';

  const handleNavigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view } }));
  };

  return (
    <div
      className={`flex text-xs sm:text-[13px] leading-relaxed ${isUser ? 'justify-end' : 'justify-start w-full'}`}
    >
      <div className={`flex flex-col gap-2 ${isUser ? 'items-end max-w-[88%] sm:max-w-[80%] ml-auto' : 'items-start w-full'}`}>
        {isUser ? (
          <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl rounded-br-xs bg-[#18181b] border border-zinc-800 text-zinc-100 shadow-sm break-words [word-break:break-word] max-w-full">
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        ) : (
          <div className="w-full text-zinc-300 text-xs sm:text-[13px] leading-relaxed break-words [word-break:break-word]">
            {msg.isUndone && (
              <div className="text-[11px] font-medium text-zinc-400 pb-1 mb-2 border-b border-zinc-800 flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-zinc-500" />
                <span>Response Undone & In-App Actions Reverted</span>
              </div>
            )}

            <div className={`flex flex-col gap-1 w-full overflow-hidden ${msg.isUndone ? 'opacity-50' : ''}`}>
              {renderFormattedContent(msg.content)}
            </div>

            {msg.isError && (
              <div className="mt-3 p-3 rounded-xl bg-[#161618] border border-zinc-700 flex items-center justify-between gap-3 text-zinc-300">
                <span className="text-[11px] font-medium text-zinc-400">Temporary peak traffic</span>
                {msg.retryPrompt && (
                  <button
                    type="button"
                    onClick={() => onRetry(msg.retryPrompt!)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Now</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generative UI Action Cards */}
        {!isUser && msg.toolResults && msg.toolResults.map((tr, idx) => (
          <div
            key={idx}
            className="w-full p-3 rounded-xl border border-zinc-800 bg-[#121214] text-left flex flex-col gap-2 shadow-2xs min-w-0 max-w-full"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-zinc-200 text-xs min-w-0 flex-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{tr.description}</span>
              </div>

              {tr.toolName === 'create_tasks' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('project-tasks')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Tasks ↗
                </button>
              )}
              {tr.toolName === 'add_moodboard_items' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('project-moodboard')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Moodboard ↗
                </button>
              )}
              {tr.toolName === 'create_project_note' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('project-notes')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Notes ↗
                </button>
              )}
              {tr.toolName === 'schedule_event' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('calendar')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Calendar ↗
                </button>
              )}
              {tr.toolName === 'start_timer' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('billing')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Timers ↗
                </button>
              )}
              {tr.toolName === 'create_new_project' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Open Projects ↗
                </button>
              )}
            </div>

            {tr.toolName === 'create_tasks' && Array.isArray(tr.data) && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800">
                {tr.data.slice(0, 4).map((taskItem: any, tIdx: number) => (
                  <div key={tIdx} className="flex items-center justify-between text-[11px] text-zinc-300 gap-2">
                    <span className="truncate font-medium flex-1 min-w-0">• {taskItem.title}</span>
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
                      {taskItem.priority}
                    </span>
                  </div>
                ))}
                {tr.data.length > 4 && (
                  <span className="text-[10px] text-zinc-400 font-medium">+ {tr.data.length - 4} more tasks</span>
                )}
              </div>
            )}

            {tr.toolName === 'add_moodboard_items' && Array.isArray(tr.data) && (
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800 flex-wrap">
                {tr.data.filter((item: any) => item.type === 'color').map((colorItem: any, cIdx: number) => (
                  <div
                    key={cIdx}
                    className="w-6 h-6 rounded-full border border-white/20 shadow-2xs hover:scale-110 transition-transform shrink-0"
                    style={{ backgroundColor: colorItem.color }}
                    title={colorItem.title || colorItem.color}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 px-1 flex-wrap">
          <span className="text-[10px] text-zinc-500">
            {msg.timestamp}
          </span>

          {!isUser && onUndo && (
            <>
              <span className="text-zinc-600">•</span>
              {msg.isUndone ? (
                <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Undone</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onUndo(msg.id)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Undo this AI response and revert any in-app actions"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Undo</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
