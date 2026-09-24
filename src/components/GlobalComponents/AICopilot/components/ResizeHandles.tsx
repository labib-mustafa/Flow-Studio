import React from 'react';
import { ResizeDirection } from '../types';

interface ResizeHandlesProps {
  isPinnedRightDrawer: boolean;
  isMaximized: boolean;
  isMobileScreen: boolean;
  onResizeStart: (e: React.MouseEvent, dir: ResizeDirection) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  isPinnedRightDrawer,
  isMaximized,
  isMobileScreen,
  onResizeStart
}) => {
  if (isMobileScreen) return null;

  if (isPinnedRightDrawer) {
    return (
      <div
        onMouseDown={(e) => onResizeStart(e, 'left-drawer')}
        className="absolute top-0 bottom-0 left-0 w-2.5 -ml-1 cursor-ew-resize hover:bg-zinc-800/40 transition-colors z-50 group flex items-center justify-center"
        title="Drag to resize drawer width"
      >
        <div className="w-0.5 h-8 rounded-full bg-zinc-700 group-hover:bg-zinc-300 transition-colors" />
      </div>
    );
  }

  if (!isMaximized) {
    return (
      <>
        {/* Top Edge */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'top')}
          className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize hover:bg-zinc-700/30 z-50 transition-colors"
          title="Drag to resize top"
        />
        {/* Bottom Edge */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'bottom')}
          className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize hover:bg-zinc-700/30 z-50 transition-colors"
          title="Drag to resize bottom"
        />
        {/* Left Edge */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'left')}
          className="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize hover:bg-zinc-700/30 z-50 transition-colors"
          title="Drag to resize left"
        />
        {/* Right Edge */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'right')}
          className="absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize hover:bg-zinc-700/30 z-50 transition-colors"
          title="Drag to resize right"
        />

        {/* Top-Left Corner */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'top-left')}
          className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize hover:bg-zinc-700/40 rounded-tl z-50 transition-colors"
          title="Drag to resize top-left"
        />
        {/* Top-Right Corner */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'top-right')}
          className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize hover:bg-zinc-700/40 rounded-tr z-50 transition-colors"
          title="Drag to resize top-right"
        />
        {/* Bottom-Left Corner */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'bottom-left')}
          className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize hover:bg-zinc-700/40 rounded-bl z-50 transition-colors"
          title="Drag to resize bottom-left"
        />
        {/* Bottom-Right Corner */}
        <div
          onMouseDown={(e) => onResizeStart(e, 'bottom-right')}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center text-zinc-600 hover:text-zinc-300 z-50 transition-colors"
          title="Drag to resize bottom-right"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="rotate-90">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
            <circle cx="5" cy="5" r="1" fill="currentColor" />
            <circle cx="8" cy="2" r="1" fill="currentColor" />
            <circle cx="5" cy="5" r="1" fill="currentColor" />
            <circle cx="8" cy="5" r="1" fill="currentColor" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
          </svg>
        </div>
      </>
    );
  }

  return null;
};
