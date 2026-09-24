import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { ChatMessage } from '../../types';
import { ChatWelcomeState } from './ChatWelcomeState';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputBar } from './ChatInputBar';

interface ChatViewProps {
  isOpen?: boolean;
  currentView?: string;
  chatMessages: ChatMessage[];
  chatScrollContainerRef: React.RefObject<HTMLDivElement | null>;
  lastPromptRef: React.RefObject<HTMLDivElement | null>;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  isThinking: boolean;
  lastSavedPrompt: string;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSendMessage: (text?: string) => void;
  onQuickPrompt: (prompt: string) => void;
  onNavigateToTrain: () => void;
  onClearChat?: () => void;
  onUndo?: (messageId: string) => void;
  queuedMessages?: Array<{ id: string; text: string; timestamp: string }>;
  onRemoveQueuedMessage?: (id: string) => void;
  currentProject: any;
  availableNotesCount: number;
  isCompact: boolean;
  isUltraCompact: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  isOpen = true,
  currentView,
  chatMessages,
  chatScrollContainerRef,
  lastPromptRef,
  chatBottomRef,
  chatInputRef,
  isThinking,
  lastSavedPrompt,
  inputPrompt,
  setInputPrompt,
  onSendMessage,
  onQuickPrompt,
  onNavigateToTrain,
  onClearChat,
  onUndo,
  queuedMessages,
  onRemoveQueuedMessage,
  currentProject,
  availableNotesCount,
  isCompact,
  isUltraCompact
}) => {
  const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user');
  const lastUserMsgId = lastUserMsg?.id;
  const userScrolledUpRef = useRef(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Instant scroll with strictly zero animation
  const scrollToBottomInstant = useCallback(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = el.scrollHeight;
  }, [chatScrollContainerRef]);

  // Robust multi-frame scroll trigger to ensure container is pinned to bottom across rendering frames
  const triggerInstantScroll = useCallback(() => {
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
    scrollToBottomInstant();
    requestAnimationFrame(scrollToBottomInstant);
    const t1 = setTimeout(scrollToBottomInstant, 30);
    const t2 = setTimeout(scrollToBottomInstant, 100);
    const t3 = setTimeout(scrollToBottomInstant, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [scrollToBottomInstant]);

  // Pre-paint scroll on mount
  useLayoutEffect(() => {
    scrollToBottomInstant();
  }, [scrollToBottomInstant]);

  // Trigger instant scroll on modal open, page switch, project switch, or new messages
  useEffect(() => {
    if (isOpen) {
      return triggerInstantScroll();
    }
  }, [isOpen, currentView, currentProject?.id, chatMessages.length, isThinking, triggerInstantScroll]);

  // Listen for global in-app navigation events
  useEffect(() => {
    const handleNav = () => triggerInstantScroll();
    window.addEventListener('navigate-to-view', handleNav);
    return () => window.removeEventListener('navigate-to-view', handleNav);
  }, [triggerInstantScroll]);

  // Track if user manually scrolled up
  const handleScroll = () => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distanceFromBottom > 60;
    userScrolledUpRef.current = isUp;
    setShowScrollBottom(isUp);
  };

  // Keep pinned to bottom on DOM mutations / container size changes unless user scrolled up
  useEffect(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      if (!userScrolledUpRef.current) {
        scrollToBottomInstant();
      }
    });
    ro.observe(el);

    const mo = new MutationObserver(() => {
      if (!userScrolledUpRef.current) {
        scrollToBottomInstant();
      }
    });
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [chatScrollContainerRef, scrollToBottomInstant]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-black relative">
      {/* Messages Stream */}
      <div
        ref={chatScrollContainerRef as any}
        onScroll={handleScroll}
        style={{ scrollBehavior: 'auto' }}
        className="flex-1 overflow-y-auto custom-scrollbar dark-scrollbar px-3 pt-4 sm:px-6 flex flex-col select-text min-h-0 relative bg-black"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 flex-1 min-h-0">
          {chatMessages.length === 0 ? (
            <ChatWelcomeState
              lastSavedPrompt={lastSavedPrompt}
              onQuickPrompt={onQuickPrompt}
              onNavigateToTrain={onNavigateToTrain}
            />
          ) : (
            chatMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                isLastPrompt={msg.id === lastUserMsgId}
                lastPromptRef={msg.id === lastUserMsgId ? lastPromptRef : undefined}
                onRetry={onSendMessage}
                onUndo={onUndo}
              />
            ))
          )}

          {isThinking && (
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 py-1">
              <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                <RefreshCw className="w-3 h-3 animate-spin text-zinc-300" />
              </div>
              <span className="animate-pulse font-medium text-zinc-400">Nova is thinking & taking action...</span>
            </div>
          )}

          <div ref={chatBottomRef as any} className="h-8 shrink-0" />
        </div>
      </div>

      {/* Floating Scroll-to-Bottom Down-Arrow Button (Antigravity Style) */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => {
            userScrolledUpRef.current = false;
            setShowScrollBottom(false);
            scrollToBottomInstant();
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-7 h-7 rounded-full bg-[#18181b]/95 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-xs"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Fading effect on top of chat input area (guaranteed clearance from scrollbar) */}
      <div className="w-full px-3 pointer-events-none h-6 -mt-6 relative z-10 shrink-0">
        <div
          style={{
            background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.96) 30%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0) 100%)'
          }}
          className="w-full max-w-3xl mx-auto h-full"
        />
      </div>

      {/* Chat Input Bar (Antigravity Centered Max-Width) */}
      <div className="w-full px-3 pb-3">
        <div className="w-full max-w-3xl mx-auto">
          <ChatInputBar
            inputPrompt={inputPrompt}
            setInputPrompt={setInputPrompt}
            isThinking={isThinking}
            lastSavedPrompt={lastSavedPrompt}
            chatInputRef={chatInputRef}
            onSendMessage={(text) => {
              userScrolledUpRef.current = false;
              setShowScrollBottom(false);
              onSendMessage(text);
              triggerInstantScroll();
            }}
            onNavigateToTrain={onNavigateToTrain}
            onClearChat={onClearChat}
            chatMessagesCount={chatMessages.length}
            currentProject={currentProject}
            availableNotesCount={availableNotesCount}
            isCompact={isCompact}
            isUltraCompact={isUltraCompact}
            queuedMessages={queuedMessages}
            onRemoveQueuedMessage={onRemoveQueuedMessage}
          />
        </div>
      </div>
    </div>
  );
};
