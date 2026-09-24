import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ResizeDirection } from '../types';
import { STORAGE_KEYS } from '../constants';
import { sound } from '../../../../stores/soundStore';
import {
  computeOriginPosition,
  getCenteredWindowRect,
  getMinModalScale,
  calculateDragPosition,
  calculateResizeBounds,
  AnchorRect
} from '../utils/windowGeometry';

export const useWindowPosition = (
  isOpen: boolean,
  onClose: () => void,
  onOpenComplete?: () => void
) => {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 120, y: 60 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 720, height: 740 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Side Drawer Pinning State (persisted)
  const [isPinnedRightDrawer, setIsPinnedRightDrawer] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.DOCK_DRAWER) === 'true'; } catch { return false; }
  });
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAWER_WIDTH);
      return saved ? Math.min(Math.max(360, parseInt(saved, 10)), 960) : 480;
    } catch { return 480; }
  });

  const togglePinSideDrawer = useCallback(() => {
    setIsPinnedRightDrawer(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEYS.DOCK_DRAWER, String(next)); } catch { }
      if (next) setIsMaximized(false);
      sound.pop();
      return next;
    });
  }, []);

  const prevDimensions = useRef({ position: { x: 120, y: 60 }, size: { width: 720, height: 740 } });
  const modalWindowRef = useRef<HTMLDivElement | null>(null);
  const prevIsOpenRef = useRef<boolean>(isOpen);

  // Animation State — drives the always-mounted motion.div
  // 'closed'  → scale minScale, opacity 0, visibility hidden (initial / after close)
  // 'open'    → scale 1, opacity 1, visibility visible
  // 'closing' → animating scale down toward minScale, opacity 0
  const [scaleState, setScaleState] = useState<'open' | 'closing' | 'closed'>('closed');
  const [customOrigin, setCustomOrigin] = useState<string | null>(null);
  const isAnimatingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRectRef = useRef<AnchorRect>({
    x: 60,
    y: typeof window !== 'undefined' ? window.innerHeight - 60 : 600,
    width: 40,
    height: 40,
  });

  const minScale = getMinModalScale(size.height, anchorRectRef.current);

  const computeOrigin = useCallback(() => {
    return computeOriginPosition({
      isMobileScreen,
      isPinnedRightDrawer,
      drawerWidth,
      isMaximized,
      position,
      anchorRect: anchorRectRef.current
    });
  }, [isMobileScreen, isPinnedRightDrawer, drawerWidth, isMaximized, position]);

  const currentOrigin = customOrigin || computeOrigin();

  // Derived visibility — hidden when fully closed (a11y + no pointer events)
  const isFullyHidden = scaleState === 'closed';

  // Responsive Compact Mode
  const activeCurrentWidth = isPinnedRightDrawer ? drawerWidth : size.width;
  const isCompact = isMobileScreen || activeCurrentWidth < 540;
  const isUltraCompact = isMobileScreen || activeCurrentWidth < 390;

  // Window Resize Listener
  useEffect(() => {
    const handleWindowResize = () => {
      const isMob = window.innerWidth < 640;
      setIsMobileScreen(isMob);

      if (!isMob && !isMaximized && !isPinnedRightDrawer) {
        setPosition(prevPos => ({
          x: Math.min(Math.max(10, prevPos.x), Math.max(10, window.innerWidth - 120)),
          y: Math.min(Math.max(10, prevPos.y), Math.max(10, window.innerHeight - 60))
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isMaximized, isPinnedRightDrawer]);

  // Close — trigger scale-down animation, then notify parent after duration
  const handleClose = useCallback(() => {
    if (isAnimatingRef.current) return;
    sound.delete();
    setCustomOrigin(computeOrigin());
    setScaleState('closing');
    isAnimatingRef.current = true;

    // Wait for the exit animation to finish (180ms), then finalize
    closeTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      setScaleState('closed');
      setCustomOrigin(null);
      onClose();
    }, 200);
  }, [computeOrigin, onClose]);

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Capture anchor button rect if global open-ai-copilot event is triggered
  useEffect(() => {
    const handleOpenCopilot = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.anchorRect) anchorRectRef.current = detail.anchorRect;
    };
    window.addEventListener('open-ai-copilot', handleOpenCopilot);
    return () => window.removeEventListener('open-ai-copilot', handleOpenCopilot);
  }, []);

  // React to isOpen changes — center window and flip animation state
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Cancel any in-flight close timer (e.g. rapid open-close-open)
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      // Opening: recenter, then animate scale up on pre-rendered DOM
      const centered = getCenteredWindowRect();
      setPosition({ x: centered.x, y: centered.y });
      setSize({ width: centered.width, height: centered.height });
      setScaleState('open');
      setCustomOrigin(null);
      isAnimatingRef.current = false;
      sound.pop();
      if (onOpenComplete) onOpenComplete();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, onOpenComplete]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Dragging logic
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized || isMobileScreen || isPinnedRightDrawer) return;
    if ((e.target as HTMLElement).closest('button, input, select, a, textarea')) return;

    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...position };

    const handleMouseMove = (me: MouseEvent) => {
      setPosition(calculateDragPosition(initialPos, me.clientX - startX, me.clientY - startY));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing logic
  const handleResizeStart = (e: React.MouseEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...position };
    const initialSize = { ...size };
    const initialDrawerWidth = drawerWidth;

    const handleMouseMove = (me: MouseEvent) => {
      const deltaX = me.clientX - startX;
      const deltaY = me.clientY - startY;

      if (dir === 'left-drawer') {
        const newWidth = Math.max(360, Math.min(window.innerWidth - 80, initialDrawerWidth - deltaX));
        setDrawerWidth(newWidth);
        try { localStorage.setItem(STORAGE_KEYS.DRAWER_WIDTH, String(newWidth)); } catch { }
        return;
      }

      const bounds = calculateResizeBounds(dir, deltaX, deltaY, initialSize, initialPos.x, initialPos.y);
      setPosition({ x: bounds.x, y: bounds.y });
      setSize({ width: bounds.width, height: bounds.height });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleToggleMaximize = () => {
    if (isPinnedRightDrawer) return;
    sound.pop();
    if (isMaximized) {
      setPosition(prevDimensions.current.position);
      setSize(prevDimensions.current.size);
      setIsMaximized(false);
    } else {
      prevDimensions.current = { position: { ...position }, size: { ...size } };
      setIsMaximized(true);
    }
  };

  return {
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
  };
};
