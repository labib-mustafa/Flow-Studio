import { ResizeDirection } from '../types';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getCenteredWindowRect = (): WindowRect => {
  const isMob = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  if (isMob) {
    return {
      x: 8,
      y: 8,
      width: typeof window !== 'undefined' ? window.innerWidth - 16 : 360,
      height: typeof window !== 'undefined' ? window.innerHeight - 16 : 600
    };
  }
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const w = Math.min(740, Math.max(380, winW - 60));
  const h = Math.min(760, Math.max(420, winH - 80));
  const x = Math.max(20, Math.floor((winW - w) / 2));
  const y = Math.max(20, Math.floor((winH - h) / 2));
  return { x, y, width: w, height: h };
};

export const getMinModalScale = (currentHeight: number, fallbackAnchor?: AnchorRect): number => {
  let buttonH = 44;
  if (typeof document !== 'undefined') {
    const aiBtn = document.querySelector('[data-ai-button="true"]');
    if (aiBtn) {
      buttonH = aiBtn.getBoundingClientRect().height || 44;
    } else if (fallbackAnchor?.height) {
      buttonH = fallbackAnchor.height;
    }
  }
  const currentH = currentHeight || 740;
  return Math.max(0.03, Math.min(0.18, buttonH / currentH));
};

export const computeOriginPosition = (params: {
  isMobileScreen: boolean;
  isPinnedRightDrawer: boolean;
  drawerWidth: number;
  isMaximized: boolean;
  position: { x: number; y: number };
  anchorRect?: AnchorRect;
}): string => {
  const { isMobileScreen, isPinnedRightDrawer, drawerWidth, isMaximized, position, anchorRect } = params;
  let targetCX = 60;
  let targetCY = typeof window !== 'undefined' ? window.innerHeight - 60 : 600;

  if (typeof document !== 'undefined') {
    const aiBtn = document.querySelector('[data-ai-button="true"]');
    if (aiBtn) {
      const r = aiBtn.getBoundingClientRect();
      targetCX = r.right;
      targetCY = r.top + r.height / 2;
    } else if (anchorRect) {
      targetCX = anchorRect.x + anchorRect.width;
      targetCY = anchorRect.y + anchorRect.height / 2;
    }
  }

  const winX = isMobileScreen
    ? 8
    : isPinnedRightDrawer
      ? (typeof window !== 'undefined' ? window.innerWidth - drawerWidth : 800)
      : isMaximized
        ? 24
        : position.x;
  const winY = isMobileScreen || isPinnedRightDrawer ? 0 : isMaximized ? 24 : position.y;

  return `${Math.round(targetCX - winX)}px ${Math.round(targetCY - winY)}px`;
};

export const calculateDragPosition = (
  initialPos: { x: number; y: number },
  deltaX: number,
  deltaY: number
) => {
  const maxX = Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 120);
  const maxY = Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - 60);
  return {
    x: Math.min(Math.max(10, initialPos.x + deltaX), maxX),
    y: Math.min(Math.max(10, initialPos.y + deltaY), maxY)
  };
};

export const calculateResizeBounds = (
  dir: ResizeDirection,
  deltaX: number,
  deltaY: number,
  initialSize: { width: number; height: number },
  posX: number,
  posY: number
): { x: number; y: number; width: number; height: number } => {
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const MIN_W = 380;
  const MIN_H = 420;
  const PAD = 10;

  const initialRight = posX + initialSize.width;
  const initialBottom = posY + initialSize.height;

  let newX = posX;
  let newWidth = initialSize.width;
  let newY = posY;
  let newHeight = initialSize.height;

  // Horizontal resizing from left
  if (dir === 'left' || dir === 'top-left' || dir === 'bottom-left') {
    newX = Math.max(PAD, Math.min(initialRight - MIN_W, posX + deltaX));
    newWidth = initialRight - newX;
  } else if (dir === 'right' || dir === 'top-right' || dir === 'bottom-right' || dir === 'corner') {
    newWidth = Math.max(MIN_W, Math.min(winW - posX - PAD, initialSize.width + deltaX));
  }

  // Vertical resizing from top
  if (dir === 'top' || dir === 'top-left' || dir === 'top-right') {
    newY = Math.max(PAD, Math.min(initialBottom - MIN_H, posY + deltaY));
    newHeight = initialBottom - newY;
  } else if (dir === 'bottom' || dir === 'bottom-left' || dir === 'bottom-right' || dir === 'corner') {
    newHeight = Math.max(MIN_H, Math.min(winH - posY - PAD, initialSize.height + deltaY));
  }

  return { x: newX, y: newY, width: newWidth, height: newHeight };
};
