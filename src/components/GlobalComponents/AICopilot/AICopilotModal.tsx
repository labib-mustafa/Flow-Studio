import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AICopilotModalProps, MainViewMode } from './types';
import { useProjectStore } from '../../../stores/projectStore';
import { useClassicTools } from './hooks/useClassicTools';
import { useTrainingRules } from './hooks/useTrainingRules';
import { useWindowPosition } from './hooks/useWindowPosition';
import { useCopilotChat } from './hooks/useCopilotChat';
import { CopilotHeader } from './components/CopilotHeader';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { ResizeHandles } from './components/ResizeHandles';
import { ChatView } from './components/ChatView/ChatView';
import { ToolsView } from './components/ToolsView/ToolsView';
import { TrainingView } from './components/TrainingView/TrainingView';

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose, currentView }) => {
  const [mainView, setMainView] = useState<MainViewMode>('chat');
  const { currentProject } = useProjectStore();

  // Track whether the modal has ever been opened — defer heavy child mounting
  // until the first open so we don't pay the cost on initial app load.
  const hasEverOpened = useRef(false);
  if (isOpen && !hasEverOpened.current) hasEverOpened.current = true;

  const {
    activeTab,
    setActiveTab,
    promptText,
    setPromptText,
    loading: classicLoading,
    availableNotesCount,
    setAvailableNotesCount,
    generatedTasks,
    selectedTaskIds,
    handleInsertProjectNotes,
    handleGenerate,
    handleApplySelectedTasks
  } = useClassicTools();

  const {
    trainedRules,
    addRule,
    deleteRule,
    resetToDefaults
  } = useTrainingRules();

  const {
    chatMessages,
    inputPrompt,
    setInputPrompt,
    lastSavedPrompt,
    isThinking,
    chatBottomRef,
    chatScrollContainerRef,
    lastPromptRef,
    chatInputRef,
    scrollToLastPrompt,
    handleSendMessage,
    handleQuickPrompt,
    clearChat,
    queuedMessages,
    removeQueuedMessage,
    handleUndoResponse
  } = useCopilotChat(mainView, trainedRules, availableNotesCount, setAvailableNotesCount, addRule, isOpen, currentView);

  // Ensure chat view is active when modal opens
  useEffect(() => {
    if (isOpen) {
      setMainView('chat');
    }
  }, [isOpen]);

  const {
    isMobileScreen,
    position,
    size,
    isDragging,
    isResizing,
    isMaximized,
    isPinnedRightDrawer,
    drawerWidth,
    scaleState,
    currentOrigin,
    minScale,
    modalWindowRef,
    isCompact,
    isUltraCompact,
    isFullyHidden,
    togglePinSideDrawer,
    handleClose,
    handleDragStart,
    handleResizeStart,
    handleToggleMaximize
  } = useWindowPosition(isOpen, onClose);

  // Don't render anything until the modal has been opened at least once.
  // After that, the tree stays permanently mounted — hooks + DOM stay warm
  // so every subsequent open animates on a pre-rendered tree with zero jitter.
  if (!hasEverOpened.current) return null;

  // Derive animation targets from scaleState
  const isVisible = scaleState === 'open';

  return (
    <motion.div
      ref={modalWindowRef}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: minScale, opacity: 0 }}
      transition={
        scaleState === 'closing'
          ? { duration: 0.18, ease: [0.32, 0, 0.67, 0] }
          : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
      }
      style={{
        ...(isMobileScreen
          ? { position: 'fixed', left: '8px', top: '8px', width: 'calc(100vw - 16px)', height: 'calc(100dvh - 16px)' }
          : isPinnedRightDrawer
            ? { position: 'fixed', right: '0px', top: '0px', bottom: '0px', width: `${drawerWidth}px`, maxWidth: 'calc(100vw - 60px)', height: '100vh' }
            : isMaximized
              ? { position: 'fixed', left: '24px', top: '24px', width: 'calc(100vw - 48px)', height: 'calc(100vh - 48px)' }
              : { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }),
        transformOrigin: currentOrigin,
        willChange: isVisible ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isFullyHidden ? 'hidden' : 'visible',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease, width 0.15s ease'
      }}
      className={`z-[250] bg-black border border-zinc-800 flex flex-col overflow-hidden text-left font-sans select-none ${
        isPinnedRightDrawer
          ? 'rounded-l-2xl border-r-0 shadow-[-16px_0_40px_-8px_rgba(0,0,0,0.8)] ring-1 ring-white/10'
          : 'rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10'
      } ${isDragging ? 'shadow-3xl ring-1 ring-white/20 cursor-grabbing' : ''}`}
    >
      <CopilotHeader
        mainView={mainView}
        setMainView={setMainView}
        isPinnedRightDrawer={isPinnedRightDrawer}
        togglePinSideDrawer={togglePinSideDrawer}
        isMaximized={isMaximized}
        onToggleMaximize={handleToggleMaximize}
        onClose={handleClose}
        isCompact={isCompact}
        isUltraCompact={isUltraCompact}
        isMobileScreen={isMobileScreen}
        rulesCount={trainedRules.length}
        onDragStart={handleDragStart}
      />

      <ApiKeyBanner />

      {mainView === 'chat' && (
        <ChatView
          isOpen={isOpen}
          currentView={currentView}
          chatMessages={chatMessages}
          chatScrollContainerRef={chatScrollContainerRef}
          lastPromptRef={lastPromptRef}
          chatBottomRef={chatBottomRef}
          chatInputRef={chatInputRef}
          isThinking={isThinking}
          lastSavedPrompt={lastSavedPrompt}
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          onSendMessage={handleSendMessage}
          onQuickPrompt={handleQuickPrompt}
          onNavigateToTrain={() => setMainView('train')}
          onClearChat={clearChat}
          onUndo={handleUndoResponse}
          queuedMessages={queuedMessages}
          onRemoveQueuedMessage={removeQueuedMessage}
          currentProject={currentProject}
          availableNotesCount={availableNotesCount}
          isCompact={isCompact}
          isUltraCompact={isUltraCompact}
        />
      )}

      {mainView === 'tools' && (
        <ToolsView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          promptText={promptText}
          setPromptText={setPromptText}
          loading={classicLoading}
          availableNotesCount={availableNotesCount}
          generatedTasks={generatedTasks}
          selectedTaskIds={selectedTaskIds}
          isCompact={isCompact}
          onInsertProjectNotes={handleInsertProjectNotes}
          onGenerate={handleGenerate}
          onApplySelectedTasks={handleApplySelectedTasks}
        />
      )}

      {mainView === 'train' && (
        <TrainingView
          trainedRules={trainedRules}
          onAddRule={addRule}
          onDeleteRule={deleteRule}
          onResetDefaults={resetToDefaults}
          onTestInChat={(trigger) => {
            setMainView('chat');
            handleSendMessage(trigger);
          }}
        />
      )}

      <ResizeHandles
        isPinnedRightDrawer={isPinnedRightDrawer}
        isMaximized={isMaximized}
        isMobileScreen={isMobileScreen}
        onResizeStart={handleResizeStart}
      />
    </motion.div>
  );
};
