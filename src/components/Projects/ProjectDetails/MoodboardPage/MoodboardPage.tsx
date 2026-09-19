import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Minus, 
  Plus, 
  Crosshair, 
  Trash2, 
  MousePointer2, 
  Hand, 
  ArrowUpRight, 
  Pencil, 
  Square, 
  Circle, 
  MessageSquare, 
  Type, 
  Image, 
  Palette, 
  Sparkles, 
  Undo2, 
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Columns3,
  Rows3,
  Grid,
  Filter,
  Lock,
  Link2,
  Frame,
  X,
  Maximize2
} from 'lucide-react';
import Moveable from 'react-moveable';
import Selecto from 'react-selecto';
import { DropdownMenu, DropdownOption } from '../../../GlobalComponents/DropdownMenu';
import { MoodboardItem, MoodboardItemData, CommentPin, UrlMeta } from './MoodboardItem';
import { FloatingPropertyBar } from './FloatingPropertyBar';
import { AddImageModal } from '../../../GlobalComponents/modals/AddImageModal';
import { AddBookmarkModal } from '../../../GlobalComponents/modals/AddBookmarkModal';
import { CommentPinPopover } from './CommentPinPopover';
import { AddStylesModal, QueueItem } from '../../../GlobalComponents/AddStylesModal';
import { EditTypographySidebar } from '../../../GlobalComponents/Sidebars/EditTypographySidebar';
import { EditColorSidebar } from '../../../GlobalComponents/Sidebars/EditColorSidebar';
import { DrawingOverlay } from './DrawingOverlay';
import { useMoodboardStore } from '../../../../stores/moodboardStore';
import { confirm } from '../../../../stores/confirmStore';
import { useProjectStore } from '../../../../stores/projectStore';
import { MoodboardSkeleton } from '../../../GlobalComponents/Skeletons/MoodboardSkeleton';

interface MoodboardPageProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes' | 'moodboard') => void;
  onEditSidebarToggle?: (isOpen: boolean) => void;
}

export const MoodboardPage: React.FC<MoodboardPageProps> = ({ onTabChange, onEditSidebarToggle }) => {
  const { currentProject } = useProjectStore();
  const { 
    items, setItems, 
    selectedIds, setSelectedIds, 
    view, setView, 
    history, historyIndex, 
    _hasHydrated, 
    saveToHistory, 
    undo: handleUndo, redo: handleRedo,
    setProject,
    gridConfig, setGridConfig,
    activeCategoryFilter, setActiveCategoryFilter,
    alignSelectedItems, distributeSelectedItems,
    toggleLockItems, createSectionFrame, moveFrameWithChildren,
    addCommentPin, resolveCommentPin, addCommentReply, deleteCommentPin,
    duplicateItems, addBookmarkCard, extractImagePalette
  } = useMoodboardStore();

  useEffect(() => {
    if (currentProject?.id) {
      setProject(currentProject.id);
    }
  }, [currentProject?.id, setProject]);

  const selectedIdsRef = useRef<string[]>([]);
  const itemsRef = useRef<MoodboardItemData[]>([]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [isAddStylesModalOpen, setIsAddStylesModalOpen] = useState(false);
  const [tempAnchorPos, setTempAnchorPos] = useState({ x: 0, y: 0 });
  const [isTypographySidebarOpen, setIsTypographySidebarOpen] = useState(false);
  const [isColorSidebarOpen, setIsColorSidebarOpen] = useState(false);
  const [editingTypographyId, setEditingTypographyId] = useState<string | null>(null);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'pencil' | 'arrow' | 'shape' | 'comment'>('select');
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const [activeCommentPinId, setActiveCommentPinId] = useState<string | null>(null);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);

  const [copyFeedback, setCopyFeedback] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const prevTool = useRef<'select' | 'hand' | 'pencil' | 'arrow' | 'shape' | 'comment'>('select');
  const [pencilSmoothing, setPencilSmoothing] = useState(20);
  const [defaultStrokeColor, setDefaultStrokeColor] = useState('#000000');
  const [defaultStrokeWidth, setDefaultStrokeWidth] = useState(2);
  
  // Selection Marquee State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });

  // Zoom and Pan State
  const { zoom, pan } = view;
  const velocityRef = useRef({ x: 0, y: 0 });
  const momentumId = useRef<number | null>(null);

  const applyMomentum = () => {
    if (Math.abs(velocityRef.current.x) < 0.1 && Math.abs(velocityRef.current.y) < 0.1) {
      if (momentumId.current) cancelAnimationFrame(momentumId.current);
      momentumId.current = null;
      return;
    }

    velocityRef.current = {
      x: velocityRef.current.x * 0.95,
      y: velocityRef.current.y * 0.95
    };

    setView(prev => ({
      ...prev,
      pan: {
        x: prev.pan.x + velocityRef.current.x,
        y: prev.pan.y + velocityRef.current.y
      }
    }));

    momentumId.current = requestAnimationFrame(applyMomentum);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const resizeStartItems = useRef<Map<string, MoodboardItemData>>(new Map());
  const isSpaceHandActive = useRef(false);
  const pendingToolRestore = useRef(false);
  const suppressClickUntil = useRef(0);

  const handleZoom = (delta: number, clientX?: number, clientY?: number) => {
    setView(prev => {
      let newZoom = prev.zoom + delta;
      newZoom = Math.min(Math.max(0.1, newZoom), 5);
      
      if (newZoom === prev.zoom) return prev;
      
      const container = containerRef.current;
      if (!container) return { ...prev, zoom: newZoom };
      
      const rect = container.getBoundingClientRect();
      const cursorX = (clientX ?? (rect.left + rect.width / 2)) - rect.left;
      const cursorY = (clientY ?? (rect.top + rect.height / 2)) - rect.top;
      
      const scaleRatio = newZoom / prev.zoom;
      const newX = cursorX - (cursorX - prev.pan.x) * scaleRatio;
      const newY = cursorY - (cursorY - prev.pan.y) * scaleRatio;
      
      return { zoom: newZoom, pan: { x: newX, y: newY } };
    });
  };

  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const handleCenterMoodboard = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (items.length === 0) {
        setView(prev => ({
          ...prev,
          pan: { x: rect.width / 2 - 5000 * prev.zoom, y: rect.height / 2 - 5000 * prev.zoom }
        }));
        return;
      }
      const xs = items.flatMap(i => [i.x, i.x + (i.width || 0)]);
      const ys = items.flatMap(i => [i.y, i.y + (i.height || 0)]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      
      setView(prev => ({
        ...prev,
        pan: { x: rect.width / 2 - cx * prev.zoom, y: rect.height / 2 - cy * prev.zoom }
      }));
    }
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (items.length === 0) {
      setView({ zoom: 1, pan: { x: rect.width / 2 - 5000, y: rect.height / 2 - 5000 } });
      return;
    }
    const xs = items.flatMap(i => [i.x, i.x + (i.width || 200)]);
    const ys = items.flatMap(i => [i.y, i.y + (i.height || 200)]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const contentWidth = Math.max(100, maxX - minX);
    const contentHeight = Math.max(100, maxY - minY);
    const padding = 100;

    const availableWidth = Math.max(100, rect.width - padding * 2);
    const availableHeight = Math.max(100, rect.height - padding * 2);

    const fitZoom = Math.min(
      1.5,
      Math.max(0.2, Math.min(availableWidth / contentWidth, availableHeight / contentHeight))
    );

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setView({
      zoom: fitZoom,
      pan: {
        x: rect.width / 2 - cx * fitZoom,
        y: rect.height / 2 - cy * fitZoom,
      },
    });
  };

  useEffect(() => {
    handleCenterMoodboard();
  }, []);

  // Global Paste listener for URLs
  useEffect(() => {
    const isInputTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isInputTarget(e.target)) return;
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && /^(https?:\/\/|www\.)[^\s]+/i.test(pastedText.trim())) {
        e.preventDefault();
        setPastedUrl(pastedText.trim());
        setIsAddBookmarkModalOpen(true);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        let delta = -e.deltaY * 0.005;
        if (Math.abs(e.deltaY) >= 20) {
          delta = e.deltaY > 0 ? -0.1 : 0.1;
        }
        handleZoom(delta, e.clientX, e.clientY);
      } else {
        setView(prev => ({
          ...prev,
          pan: {
            x: prev.pan.x - e.deltaX,
            y: prev.pan.y - e.deltaY
          }
        }));
      }
    };

    const isInputTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputTarget(e.target)) return;

      if (e.code === 'Space' && !e.repeat && activeToolRef.current !== 'hand') {
        isSpaceHandActive.current = true;
        prevTool.current = activeToolRef.current;
        setActiveTool('hand');
      }

      if (e.key === 'Shift') setIsShiftPressed(true);

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoom(0.1);
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoom(-0.1);
        } else if (e.key === '0') {
          e.preventDefault();
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setView({ zoom: 1, pan: { x: rect.width / 2 - 5400, y: rect.height / 2 - 5200 } });
          }
        } else if (e.key === '1' && e.shiftKey) {
          e.preventDefault();
          handleFitToScreen();
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          if (selectedIdsRef.current.length > 0) {
            const clonedIds = useMoodboardStore.getState().duplicateItems(selectedIdsRef.current, { x: 20, y: 20 });
            setSelectedIds(clonedIds);
          }
        } else if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      } else {
        if (e.key === 'v') setActiveTool('select');
        else if (e.key === 'p') setActiveTool('pencil');
        else if (e.key === 'a') setActiveTool('arrow');
        else if (e.key === 's') setActiveTool('shape');
        else if (e.key === 'c') setActiveTool('comment');
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedIdsRef.current.length > 0) {
            const newItems = itemsRef.current.filter(item => !selectedIdsRef.current.includes(item.id));
            setItems(newItems);
            useMoodboardStore.getState().saveToHistory(newItems);
            setSelectedIds([]);
            updateSidebars(false, false);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputTarget(e.target)) return;

      if (e.code === 'Space') {
        isSpaceHandActive.current = false;
        if (isPanning.current) {
          pendingToolRestore.current = true;
        } else {
          setActiveTool(prevTool.current as any);
        }
      }
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isSelecting) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
      if (Math.abs(e.clientX - selectionStart.x) > 3 || Math.abs(e.clientY - selectionStart.y) > 3) {
        hasDragged.current = true;
      }
    };

    const handleGlobalPointerUp = () => {
      setIsSelecting(false);
    };

    document.addEventListener('pointermove', handleGlobalPointerMove);
    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isSelecting]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('.no-pan-ui')) return;
    if (activeTool !== 'hand' && targetEl.closest('.no-pan')) return;

    if (activeTool === 'comment' && e.button === 0) {
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - pan.x) / zoom;
        const canvasY = (e.clientY - pan.y) / zoom;

        const itemUnder = [...items].reverse().find(
          (i) =>
            i.type !== 'frame' &&
            !i.isFrame &&
            canvasX >= i.x &&
            canvasX <= i.x + (i.width || 100) &&
            canvasY >= i.y &&
            canvasY <= i.y + (i.height || 100)
        );

        const pinId = addCommentPin({
          x: canvasX,
          y: canvasY,
          text: 'New comment pin',
          author: 'User',
          targetItemId: itemUnder?.id || null
        });
        setActiveCommentPinId(pinId);
      }
      return;
    }

    if (activeTool === 'hand' || e.button === 1 || e.button === 2) {
      isPanning.current = true;
      hasDragged.current = false;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      if (momentumId.current) cancelAnimationFrame(momentumId.current);
      momentumId.current = null;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (activeTool === 'select' && e.button === 0) {
      if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('moodboard-canvas')) {
        setIsSelecting(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
        setSelectionCurrent({ x: e.clientX, y: e.clientY });
        hasDragged.current = false;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        hasDragged.current = true;
      }

      velocityRef.current = { x: dx, y: dy };
      
      setView(prev => ({ ...prev, pan: { x: prev.pan.x + dx, y: prev.pan.y + dy } }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      if (momentumId.current) {
        cancelAnimationFrame(momentumId.current);
        momentumId.current = null;
      }
      velocityRef.current = { x: 0, y: 0 };
      suppressClickUntil.current = Date.now() + 150;
      e.currentTarget.releasePointerCapture(e.pointerId);

      if (pendingToolRestore.current) {
        pendingToolRestore.current = false;
        setActiveTool(prevTool.current as any);
      }
    }
  };

  const updateSidebars = (typographyOpen: boolean, colorOpen: boolean) => {
    setIsTypographySidebarOpen(typographyOpen);
    setIsColorSidebarOpen(colorOpen);
    if (onEditSidebarToggle) {
      onEditSidebarToggle(typographyOpen || colorOpen);
    }
  };

  const handleAddItem = (type: MoodboardItemData['type'], shapeType?: 'rectangle' | 'circle', position?: { x: number, y: number }) => {
    if (type === 'image') {
      setIsAddImageModalOpen(true);
      return;
    }
    if (type === 'bookmark') {
      setIsAddBookmarkModalOpen(true);
      return;
    }

    const newItem: MoodboardItemData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      isFrame: type === 'frame' ? true : undefined,
      x: position ? position.x : (-pan.x + 100) / zoom,
      y: position ? position.y : (-pan.y + 100) / zoom,
      content: type === 'text' ? 'New Text' : type === 'note' ? 'New Note' : '',
      title: type === 'text' ? 'Heading' : type === 'color' ? 'New Color' : type === 'shape' ? 'New Shape' : type === 'frame' ? 'Section Frame' : 'New Item',
      color: type === 'color' ? '#3b82f6' : type === 'shape' ? '#e2e8f0' : undefined,
      frameColor: type === 'frame' ? '#cbd5e1' : undefined,
      width: type === 'color' ? 160 : type === 'note' ? 240 : type === 'text' ? 200 : type === 'shape' ? 150 : type === 'frame' ? 400 : 300,
      height: type === 'color' ? 160 : type === 'note' ? 150 : type === 'text' ? 80 : type === 'shape' ? 150 : type === 'frame' ? 300 : 200,
      rotation: 0,
      shapeType: shapeType,
      borderWidth: type === 'shape' ? 2 : undefined,
      borderColor: type === 'shape' ? '#94a3b8' : undefined,
    };
    
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToHistory(newItems);
    setSelectedIds([newItem.id]);

    if (type === 'text') {
      updateSidebars(true, false);
    } else if (type === 'color' || type === 'shape') {
      updateSidebars(false, true);
    }
  };

  const handleAddImage = (imageData: { url: string; title?: string; category?: string }) => {
    if (editingImageId) {
      handleUpdateItemWithHistory(editingImageId, {
        content: imageData.url,
        title: imageData.title || 'Image',
        ...(imageData.category ? { categories: [imageData.category] } : {})
      });
      setEditingImageId(null);
    } else {
      const newItem: MoodboardItemData = {
        id: Date.now().toString(),
        type: 'image',
        x: (-pan.x + 100) / zoom,
        y: (-pan.y + 100) / zoom,
        content: imageData.url,
        title: imageData.title || 'Image',
        categories: imageData.category ? [imageData.category] : undefined,
        width: 300,
        height: 200,
        rotation: 0,
      };
      
      const newItems = [...items, newItem];
      setItems(newItems);
      saveToHistory(newItems);
      setSelectedIds([newItem.id]);
    }
  };

  const handleAddBookmark = (url: string, initialMeta?: Partial<UrlMeta>) => {
    const centerPos = { x: (-pan.x + 100) / zoom, y: (-pan.y + 100) / zoom };
    addBookmarkCard(url, centerPos, initialMeta);
  };

  const handleAddShape = (shape: { x: number, y: number, width: number, height: number, shapeType: 'rectangle' | 'circle' }) => {
    let { x, y, width, height } = shape;
    if (gridConfig.snapToGrid && gridConfig.size > 0) {
      const size = gridConfig.size;
      x = Math.round(x / size) * size;
      y = Math.round(y / size) * size;
      width = Math.max(size, Math.round(width / size) * size);
      height = Math.max(size, Math.round(height / size) * size);
    }

    const newItem: MoodboardItemData = {
      id: Date.now().toString(),
      type: 'shape',
      x,
      y,
      width,
      height,
      shapeType: shape.shapeType,
      title: 'New Shape',
      color: '#e2e8f0',
      rotation: 0,
      borderWidth: 2,
      borderColor: '#94a3b8',
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToHistory(newItems);
  };

  const handleAddArrow = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const newItem: MoodboardItemData = {
      id: Date.now().toString(),
      type: 'arrow',
      x: minX,
      y: minY,
      width: Math.max(1, Math.abs(end.x - start.x)),
      height: Math.max(1, Math.abs(end.y - start.y)),
      start: { x: start.x - minX, y: start.y - minY },
      end: { x: end.x - minX, y: end.y - minY },
      borderWidth: defaultStrokeWidth,
      color: defaultStrokeColor
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToHistory(newItems);
  };

  const handleAddPath = (points: { x: number, y: number }[]) => {
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));
    const newItem: MoodboardItemData = {
      id: Date.now().toString(),
      type: 'pencil',
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      points: points.map(p => ({ x: p.x - minX, y: p.y - minY })),
      borderWidth: defaultStrokeWidth,
      color: defaultStrokeColor,
      smoothing: pencilSmoothing
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToHistory(newItems);
  };

  const handleUpdateItemTransient = (id: string, updates: Partial<MoodboardItemData>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleUpdateItemWithHistory = (id: string, updates: Partial<MoodboardItemData> | ((item: MoodboardItemData) => Partial<MoodboardItemData>)) => {
    const newItems = itemsRef.current.map((item) => {
      if (item.id === id) {
        const resolvedUpdates = typeof updates === 'function' ? updates(item) : updates;
        if (item.type === 'arrow' || item.type === 'pencil') {
          if (resolvedUpdates.color) setDefaultStrokeColor(resolvedUpdates.color);
          if (resolvedUpdates.borderWidth) setDefaultStrokeWidth(resolvedUpdates.borderWidth);
        }
        return { ...item, ...resolvedUpdates };
      }
      return item;
    });
    itemsRef.current = newItems;
    setItems(newItems);
    saveToHistory(newItems);
  };

  const handleUpdateMultipleItemsWithHistory = (ids: string[], updates: Partial<MoodboardItemData>) => {
    const newItems = itemsRef.current.map((item) => {
      if (ids.includes(item.id)) {
        if (item.type === 'arrow' || item.type === 'pencil') {
          if (updates.color) setDefaultStrokeColor(updates.color);
          if (updates.borderWidth) setDefaultStrokeWidth(updates.borderWidth);
        }
        return { ...item, ...updates };
      }
      return item;
    });
    itemsRef.current = newItems;
    setItems(newItems);
    saveToHistory(newItems);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    saveToHistory(newItems);
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleTypographySave = (data: any) => {
    const textItems = selectedIds.filter(id => items.find(i => i.id === id)?.type === 'text');
    if (textItems.length > 0) {
      const newItems = [...items];
      textItems.forEach(id => {
        const index = newItems.findIndex(i => i.id === id);
        if (index !== -1) {
          newItems[index] = {
            ...newItems[index],
            title: data.styleName,
            content: `${data.fontFamily} - ${data.weight} - ${data.size}px`
          };
        }
      });
      setItems(newItems);
      saveToHistory(newItems);
    }
  };

  const handleColorSave = (color: string, target: 'fill' | 'border', borderWidth?: number) => {
    const colorableItems = selectedIds.filter(id => {
      const type = items.find(i => i.id === id)?.type;
      return type === 'color' || type === 'shape' || type === 'arrow' || type === 'pencil';
    });
    if (colorableItems.length > 0) {
      const newItems = [...items];
      colorableItems.forEach(id => {
        const index = newItems.findIndex(i => i.id === id);
        if (index !== -1) {
          if (target === 'fill') {
            newItems[index] = { ...newItems[index], color: color };
            if (newItems[index].type === 'arrow' || newItems[index].type === 'pencil') setDefaultStrokeColor(color);
          } else if (target === 'border') {
            const updates: Partial<MoodboardItemData> = { borderColor: color };
            if (borderWidth !== undefined) {
              updates.borderWidth = borderWidth;
              if (newItems[index].type === 'arrow' || newItems[index].type === 'pencil') setDefaultStrokeWidth(borderWidth);
            }
            newItems[index] = { ...newItems[index], ...updates };
          }
        }
      });
      setItems(newItems);
      saveToHistory(newItems);
    }
  };

  const handleColorChange = (color: string, target: 'fill' | 'border', borderWidth?: number) => {
    const colorableItems = selectedIds.filter(id => {
      const type = items.find(i => i.id === id)?.type;
      return type === 'color' || type === 'shape' || type === 'arrow' || type === 'pencil';
    });
    if (colorableItems.length > 0) {
      const newItems = [...items];
      colorableItems.forEach(id => {
        const index = newItems.findIndex(i => i.id === id);
        if (index !== -1) {
          if (target === 'fill') {
            newItems[index] = { ...newItems[index], color: color };
          } else if (target === 'border') {
            const updates: Partial<MoodboardItemData> = { borderColor: color };
            if (borderWidth !== undefined) updates.borderWidth = borderWidth;
            newItems[index] = { ...newItems[index], ...updates };
          }
        }
      });
      setItems(newItems);
    }
  };

  const handleItemClick = (id: string, isShiftPressed: boolean) => {
    if (
      activeToolRef.current === 'hand' ||
      activeToolRef.current === 'comment' ||
      Date.now() < suppressClickUntil.current ||
      isPanning.current ||
      hasDragged.current
    ) return;

    let newSelectedIds = [...selectedIds];
    if (isShiftPressed) {
      if (newSelectedIds.includes(id)) {
        newSelectedIds = newSelectedIds.filter(selectedId => selectedId !== id);
      } else {
        newSelectedIds.push(id);
      }
    } else {
      newSelectedIds = [id];
    }
    
    setSelectedIds(newSelectedIds);
    
    const selectedItems = newSelectedIds.map(selectedId => items.find(i => i.id === selectedId)).filter(Boolean) as MoodboardItemData[];
    
    if (selectedItems.length > 0) {
      const allText = selectedItems.every(i => i.type === 'text');
      const allColorable = selectedItems.every(i => i.type === 'color' || i.type === 'shape' || i.type === 'arrow' || i.type === 'pencil');
      
      if (allText) {
        updateSidebars(true, false);
      } else if (selectedItems.every(i => i.type === 'color')) {
        updateSidebars(false, true);
      } else {
        updateSidebars(false, false);
      }
    } else {
      updateSidebars(false, false);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ message: `${label} copied: ${text}`, visible: true });
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, visible: false })), 2000);
  };

  const handleSaveStyles = (queue: QueueItem[]) => {
    const newItems = [...items];
    
    queue.forEach((item, index) => {
      const offset = index * 20;
      const newItem: MoodboardItemData = {
        id: (Date.now() + index).toString(),
        type: item.type === 'color' ? 'color' : 'text',
        x: tempAnchorPos.x + offset,
        y: tempAnchorPos.y + offset,
        content: item.type === 'color' ? '' : `${item.font} - ${item.weight}${item.italic ? ' Italic' : ''}`,
        title: item.type === 'color' ? 'New Color' : 'Typography',
        color: item.type === 'color' ? item.value : undefined,
        fontFamily: item.type === 'typography' ? item.font : undefined,
        fontWeight: item.type === 'typography' ? item.weight : undefined,
        isItalic: item.type === 'typography' ? item.italic : undefined,
        width: item.type === 'color' ? 160 : 250,
        height: item.type === 'color' ? 160 : 80,
        rotation: 0,
      };
      newItems.push(newItem);
    });

    setItems(newItems);
    saveToHistory(newItems);
  };

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, isOpen: boolean, targetId?: string }>({ x: 0, y: 0, isOpen: false });

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.isOpen]);

  const handleContextMenu = (e: React.MouseEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;
    
    setTempAnchorPos({ x: canvasX, y: canvasY });
    
    if (targetId && !selectedIds.includes(targetId)) {
      setSelectedIds([targetId]);
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, isOpen: true, targetId });
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const newItems = [...items];
    const selectedItems = newItems.filter(item => selectedIds.includes(item.id));
    const unselectedItems = newItems.filter(item => !selectedIds.includes(item.id));
    setItems([...unselectedItems, ...selectedItems]);
    saveToHistory([...unselectedItems, ...selectedItems]);
  };

  const bringForward = () => {
    if (selectedIds.length === 0) return;
    const newItems = [...items];
    let madeChanges = false;
    for (let i = newItems.length - 2; i >= 0; i--) {
      if (selectedIds.includes(newItems[i].id) && !selectedIds.includes(newItems[i+1].id)) {
        const temp = newItems[i];
        newItems[i] = newItems[i+1];
        newItems[i+1] = temp;
        madeChanges = true;
      }
    }
    if (madeChanges) {
      setItems(newItems);
      saveToHistory(newItems);
    }
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const newItems = [...items];
    const selectedItems = newItems.filter(item => selectedIds.includes(item.id));
    const unselectedItems = newItems.filter(item => !selectedIds.includes(item.id));
    setItems([...selectedItems, ...unselectedItems]);
    saveToHistory([...selectedItems, ...unselectedItems]);
  };

  const sendBackward = () => {
    if (selectedIds.length === 0) return;
    const newItems = [...items];
    let madeChanges = false;
    for (let i = 1; i < newItems.length; i++) {
        if (selectedIds.includes(newItems[i].id) && !selectedIds.includes(newItems[i-1].id)) {
            const temp = newItems[i];
            newItems[i] = newItems[i-1];
            newItems[i-1] = temp;
            madeChanges = true;
        }
    }
    if (madeChanges) {
        setItems(newItems);
        saveToHistory(newItems);
    }
  };

  // Calculate selection box dimensions
  const selectionLeft = Math.min(selectionStart.x, selectionCurrent.x);
  const selectionTop = Math.min(selectionStart.y, selectionCurrent.y);
  const selectionWidth = Math.abs(selectionCurrent.x - selectionStart.x);
  const selectionHeight = Math.abs(selectionCurrent.y - selectionStart.y);
  const isMovingSelection = isSelecting && (selectionWidth > 0 || selectionHeight > 0);

  // Compute snap points for arrows
  const snapPoints = useMemo(() => {
    const points: { x: number, y: number }[] = [];
    items.forEach(item => {
      if (item.type === 'arrow' || item.type === 'pencil') return;
      const { x, y, width = 0, height = 0 } = item;
      
      // Corners
      points.push({ x, y });
      points.push({ x: x + width, y });
      points.push({ x, y: y + height });
      points.push({ x: x + width, y: y + height });
      
      // Centers
      points.push({ x: x + width / 2, y: y + height / 2 });
      
      // Edge centers
      points.push({ x: x + width / 2, y });
      points.push({ x: x + width / 2, y: y + height });
      points.push({ x, y: y + height / 2 });
      points.push({ x: x + width, y: y + height / 2 });
    });
    return points;
  }, [items]);

  // Categories extracted across all items
  const allCategories = useMemo(() => {
    return Array.from(new Set(items.flatMap(i => i.categories || [])));
  }, [items]);

  // Comment pins extracted across items
  const allCommentPins = useMemo(() => {
    const pins: (CommentPin & { itemId?: string })[] = [];
    items.forEach(item => {
      if (item.comments && item.comments.length > 0) {
        item.comments.forEach(pin => {
          pins.push({ ...pin, itemId: item.id });
        });
      }
    });
    return pins;
  }, [items]);

  // Dynamic canvas background grid styling based on gridConfig
  const getCanvasGridStyle = () => {
    const { type, size, opacity } = gridConfig;
    const color = `rgba(148, 163, 184, ${opacity})`;
    if (type === 'dot') {
      return {
        backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    } else if (type === 'square') {
      return {
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    } else if (type === 'isometric') {
      return {
        backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${size * 1.732}px ${size}px`,
      };
    }
    return { backgroundImage: 'none' };
  };

  // Moveable target filtering to exclude locked items
  const moveableTargets = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const unlocked = selectedIds.filter(id => !items.find(i => i.id === id)?.isLocked);
    if (unlocked.length === 0) return null;
    if (unlocked.length === 1) {
      const item = items.find(i => i.id === unlocked[0]);
      if (item?.type === 'arrow') return null;
      return `.item-${unlocked[0]}`;
    }
    return unlocked.map(id => `.item-${id}`);
  }, [selectedIds, items]);

  // Process item updates on drag end: Frame shifting, Snap-to-grid, Auto-containment
  const processPostDragItems = (currentItems: MoodboardItemData[], draggedIds: string[]) => {
    let updatedItems = [...currentItems];

    // 1. Frame Shift Child Items
    draggedIds.forEach(id => {
      const item = updatedItems.find(i => i.id === id);
      const oldItem = itemsRef.current.find(i => i.id === id);
      if (item && oldItem && (item.type === 'frame' || item.isFrame)) {
        const dx = item.x - oldItem.x;
        const dy = item.y - oldItem.y;
        if (dx !== 0 || dy !== 0) {
          updatedItems = updatedItems.map(child => {
            if (child.frameId === item.id) {
              const updates: Partial<MoodboardItemData> = {
                x: child.x + dx,
                y: child.y + dy,
              };
              if (child.start) updates.start = { x: child.start.x + dx, y: child.start.y + dy };
              if (child.end) updates.end = { x: child.end.x + dx, y: child.end.y + dy };
              if (child.controlPoint) updates.controlPoint = { x: child.controlPoint.x + dx, y: child.controlPoint.y + dy };
              return { ...child, ...updates };
            }
            return child;
          });
        }
      }
    });

    // 2. Snap to Grid Math
    if (gridConfig.snapToGrid && gridConfig.size > 0) {
      const size = gridConfig.size;
      updatedItems = updatedItems.map(item => {
        if (draggedIds.includes(item.id)) {
          return {
            ...item,
            x: Math.round(item.x / size) * size,
            y: Math.round(item.y / size) * size,
          };
        }
        return item;
      });
    }

    // 3. Frame Auto Containment
    const frames = updatedItems.filter(i => i.type === 'frame' || i.isFrame);
    if (frames.length > 0) {
      updatedItems = updatedItems.map(item => {
        if (draggedIds.includes(item.id) && item.type !== 'frame' && !item.isFrame) {
          const cx = item.x + (item.width || 100) / 2;
          const cy = item.y + (item.height || 100) / 2;

          const containingFrame = frames.find(f => 
            cx >= f.x && cx <= f.x + (f.width || 200) &&
            cy >= f.y && cy <= f.y + (f.height || 200)
          );

          return {
            ...item,
            frameId: containingFrame ? containingFrame.id : undefined,
          };
        }
        return item;
      });
    }

    return updatedItems;
  };

  if (!_hasHydrated) {
    return <MoodboardSkeleton />;
  }

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-hidden relative bg-slate-50 w-full h-full ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : (activeTool === 'comment' ? 'cursor-crosshair' : 'cursor-default')}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        if (hasDragged.current) return;
        if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('moodboard-canvas')) {
          setSelectedIds([]);
          updateSidebars(false, false);
        }
      }}
    >
      <AnimatePresence>
        {copyFeedback.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-bold shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="size-4 rounded-full bg-emerald-400 flex items-center justify-center">
              <Check size={10} className="text-slate-900 stroke-[3]" />
            </div>
            {copyFeedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* R7: Top Canvas Category Filter Bar */}
      {allCategories.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-md border border-slate-200 flex items-center gap-2 no-pan no-pan-ui">
          <Filter size={14} className="text-slate-400" />
          <button
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              activeCategoryFilter === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setActiveCategoryFilter(null)}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                activeCategoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setActiveCategoryFilter(cat === activeCategoryFilter ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div 
        className="moodboard-canvas absolute top-0 left-0 origin-top-left"
        onContextMenu={handleContextMenu}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '10000px',
          height: '10000px',
          ...getCanvasGridStyle(),
        }}
      >
        {items.map((item) => {
          const isDimmed = activeCategoryFilter !== null && (!item.categories || !item.categories.includes(activeCategoryFilter));
          return (
            <MoodboardItem
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              activeTool={activeTool as any}
              onSelect={(id) => handleItemClick(id, isShiftPressed)}
              onUpdate={handleUpdateItemWithHistory}
              onUpdateTransient={handleUpdateItemTransient}
              onDelete={handleDeleteItem}
              onEditImage={(id) => {
                setEditingImageId(id);
                setIsAddImageModalOpen(true);
              }}
              zoom={zoom}
              snapPoints={snapPoints}
              onCopy={handleCopyToClipboard}
              isDimmed={isDimmed}
            />
          );
        })}

        {/* R8: Comment Pins Canvas Overlay Layer */}
        {allCommentPins.map((pin, idx) => (
          <React.Fragment key={pin.id}>
            <div
              className={`absolute z-40 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg cursor-pointer transition-transform hover:scale-110 border-2 border-white no-pan no-pan-ui ${
                pin.resolved ? 'bg-slate-400' : 'bg-blue-600 ring-4 ring-blue-500/20'
              }`}
              style={{ left: pin.x, top: pin.y, transform: 'translate(-50%, -50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCommentPinId(pin.id);
              }}
              title={`Comment #${idx + 1} by ${pin.author}`}
            >
              {idx + 1}
            </div>
            {activeCommentPinId === pin.id && (
              <CommentPinPopover
                pin={pin}
                isOpen={true}
                onClose={() => setActiveCommentPinId(null)}
                onResolve={(id) => resolveCommentPin(id)}
                onReply={(id, text) => addCommentReply(id, text)}
                onDelete={(id) => {
                  deleteCommentPin(id);
                  setActiveCommentPinId(null);
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* R3: Smart Alignment & Distribute Floating Toolbar */}
        {selectedIds.length > 1 && activeTool === 'select' && (
          <div
            className="absolute z-50 bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1 no-pan no-pan-ui"
            style={{
              left: Math.min(...items.filter(i => selectedIds.includes(i.id)).map(i => i.x)),
              top: Math.min(...items.filter(i => selectedIds.includes(i.id)).map(i => i.y)) - (110 / zoom),
              transform: `scale(${1 / zoom})`,
              transformOrigin: 'bottom left'
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Left" onClick={() => alignSelectedItems('left')}>
              <AlignLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Center" onClick={() => alignSelectedItems('center')}>
              <AlignCenter size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Right" onClick={() => alignSelectedItems('right')}>
              <AlignRight size={16} />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Top" onClick={() => alignSelectedItems('top')}>
              <AlignStartVertical size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Middle" onClick={() => alignSelectedItems('middle')}>
              <AlignCenterVertical size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Align Bottom" onClick={() => alignSelectedItems('bottom')}>
              <AlignEndVertical size={16} />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Distribute Horizontally" onClick={() => distributeSelectedItems('horizontal')}>
              <Columns3 size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Distribute Vertically" onClick={() => distributeSelectedItems('vertical')}>
              <Rows3 size={16} />
            </button>
          </div>
        )}

        {selectedIds.length > 0 && activeTool === 'select' && (
          <FloatingPropertyBar
            items={items.filter(i => selectedIds.includes(i.id))}
            onUpdate={(id, updates) => handleUpdateItemWithHistory(id, updates)}
            onUpdateMany={(ids, updates) => handleUpdateMultipleItemsWithHistory(ids, updates)}
            onDelete={(ids) => ids.forEach(id => handleDeleteItem(id))}
            onToggleColorSidebar={() => updateSidebars(false, !isColorSidebarOpen)}
            onExtractPalette={(id) => extractImagePalette(id)}
            position={{ 
              x: Math.min(...items.filter(i => selectedIds.includes(i.id)).map(i => i.x)), 
              y: Math.min(...items.filter(i => selectedIds.includes(i.id)).map(i => i.y)) 
            }}
            zoom={zoom}
          />
        )}

        {selectedIds.length > 0 && activeTool === 'select' && moveableTargets && (
          <Moveable
            target={moveableTargets}
            container={document.querySelector('.moodboard-canvas') as HTMLElement | null}
            origin={false}
            draggable={true}
            resizable={selectedIds.length === 1 ? items.find(i => i.id === selectedIds[0])?.type !== 'arrow' : true}
            rotatable={selectedIds.length === 1 ? items.find(i => i.id === selectedIds[0])?.type !== 'arrow' : true}
            snappable={true}
            snapCenter={true}
            snapElement={true}
            snapGap={true}
            snapThreshold={5}
            isDisplaySnapDigit={true}
            verticalGuidelines={[0]}
            horizontalGuidelines={[0]}
            elementGuidelines={items.filter(i => !selectedIds.includes(i.id)).map(i => `.item-${i.id}`)}
            zoom={1 / zoom}
            keepRatio={isShiftPressed}
            onDragStart={e => {
              const item = itemsRef.current.find(i => i.id === selectedIds[0]);
              if (item) {
                e.set([item.x, item.y]);
              }
            }}
            onDrag={e => {
              e.target.style.transform = e.transform;
            }}
            onDragEnd={e => {
              if (!e.isDrag) return;
              const transform = e.target.style.transform;
              const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
              if (translateMatch) {
                const newX = parseFloat(translateMatch[1]);
                const newY = parseFloat(translateMatch[2]);
                const current = itemsRef.current.find(i => i.id === selectedIds[0]);
                if (current && Math.abs(current.x - newX) < 0.5 && Math.abs(current.y - newY) < 0.5) {
                  return;
                }
                const updatedItems = itemsRef.current.map(i => i.id === selectedIds[0] ? { ...i, x: newX, y: newY } : i);
                const finalItems = processPostDragItems(updatedItems, [selectedIds[0]]);
                setItems(finalItems);
                saveToHistory(finalItems);
              }
            }}
            onDragGroupStart={e => {
              e.events.forEach(ev => {
                const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                const item = itemsRef.current.find(i => i.id === id);
                if (item) {
                  ev.set([item.x, item.y]);
                }
              });
            }}
            onDragGroup={e => {
              e.events.forEach(ev => {
                ev.target.style.transform = ev.transform;
              });
            }}
            onDragGroupEnd={e => {
              if (!e.isDrag) return;
              const draggedIds: string[] = [];
              const newItems = [...itemsRef.current];
              e.events.forEach(ev => {
                const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                if (id) {
                  const transform = ev.target.style.transform;
                  const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                  if (translateMatch) {
                    const newX = parseFloat(translateMatch[1]);
                    const newY = parseFloat(translateMatch[2]);
                    const index = newItems.findIndex(i => i.id === id);
                    if (index !== -1) {
                      if (Math.abs(newItems[index].x - newX) >= 0.5 || Math.abs(newItems[index].y - newY) >= 0.5) {
                        newItems[index] = {
                          ...newItems[index],
                          x: newX,
                          y: newY
                        };
                        draggedIds.push(id);
                      }
                    }
                  }
                }
              });
              if (draggedIds.length > 0) {
                const finalItems = processPostDragItems(newItems, draggedIds);
                setItems(finalItems);
                saveToHistory(finalItems);
              }
            }}
            onResizeStart={e => {
              resizeStartItems.current.clear();
              const item = items.find(i => i.id === selectedIds[0]);
              if (item) {
                resizeStartItems.current.set(item.id, { ...item });
                if (e.dragStart) {
                  e.dragStart.set([item.x, item.y]);
                }
              }
            }}
            onResize={e => {
              e.target.style.width = `${e.width}px`;
              e.target.style.height = `${e.height}px`;
              e.target.style.transform = e.drag.transform;
              
              const originalItem = resizeStartItems.current.get(selectedIds[0]);
              if (originalItem) {
                const transform = e.drag.transform;
                const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                const scaleX = originalItem.width ? e.width / originalItem.width : 1;
                const scaleY = originalItem.height ? e.height / originalItem.height : 1;
                
                const updates: Partial<MoodboardItemData> = {
                  width: e.width,
                  height: e.height,
                  ...(translateMatch ? { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) } : {})
                };
                
                if (originalItem.type === 'arrow') {
                  if (originalItem.start) updates.start = { x: originalItem.start.x * scaleX, y: originalItem.start.y * scaleY };
                  if (originalItem.end) updates.end = { x: originalItem.end.x * scaleX, y: originalItem.end.y * scaleY };
                  if (originalItem.controlPoint) updates.controlPoint = { x: originalItem.controlPoint.x * scaleX, y: originalItem.controlPoint.y * scaleY };
                } else if (originalItem.type === 'pencil' && originalItem.points) {
                  updates.points = originalItem.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                }
                
                handleUpdateItemTransient(selectedIds[0], updates);
              }
            }}
            onResizeEnd={e => {
              const transform = e.target.style.transform;
              const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
              
              handleUpdateItemWithHistory(selectedIds[0], (item) => {
                let newWidth = parseFloat(e.target.style.width);
                let newHeight = parseFloat(e.target.style.height);
                let newX = translateMatch ? parseFloat(translateMatch[1]) : item.x;
                let newY = translateMatch ? parseFloat(translateMatch[2]) : item.y;

                if (gridConfig.snapToGrid && gridConfig.size > 0) {
                  const size = gridConfig.size;
                  newX = Math.round(newX / size) * size;
                  newY = Math.round(newY / size) * size;
                  newWidth = Math.max(size, Math.round(newWidth / size) * size);
                  newHeight = Math.max(size, Math.round(newHeight / size) * size);
                }
                
                const originalItem = resizeStartItems.current.get(selectedIds[0]);
                const updates: Partial<MoodboardItemData> = {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                };

                if (originalItem) {
                  const scaleX = originalItem.width ? newWidth / originalItem.width : 1;
                  const scaleY = originalItem.height ? newHeight / originalItem.height : 1;
                  
                  if (originalItem.type === 'arrow') {
                    if (originalItem.start) updates.start = { x: originalItem.start.x * scaleX, y: originalItem.start.y * scaleY };
                    if (originalItem.end) updates.end = { x: originalItem.end.x * scaleX, y: originalItem.end.y * scaleY };
                    if (originalItem.controlPoint) updates.controlPoint = { x: originalItem.controlPoint.x * scaleX, y: originalItem.controlPoint.y * scaleY };
                  } else if (originalItem.type === 'pencil' && originalItem.points) {
                    updates.points = originalItem.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                  }
                }
                
                return updates;
              });
              resizeStartItems.current.clear();
            }}
            onResizeGroupStart={e => {
              resizeStartItems.current.clear();
              selectedIds.forEach(id => {
                const item = items.find(i => i.id === id);
                if (item) {
                  resizeStartItems.current.set(id, { ...item });
                }
              });
            }}
            onResizeGroup={e => {
              e.events.forEach(ev => {
                ev.target.style.width = `${ev.width}px`;
                ev.target.style.height = `${ev.height}px`;
                ev.target.style.transform = ev.drag.transform;
                
                const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                if (id) {
                  const originalItem = resizeStartItems.current.get(id);
                  if (originalItem) {
                    const transform = ev.drag.transform;
                    const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                    const scaleX = originalItem.width ? ev.width / originalItem.width : 1;
                    const scaleY = originalItem.height ? ev.height / originalItem.height : 1;
                    
                    const updates: Partial<MoodboardItemData> = {
                      width: ev.width,
                      height: ev.height,
                      ...(translateMatch ? { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) } : {})
                    };
                    
                    if (originalItem.type === 'arrow') {
                      if (originalItem.start) updates.start = { x: originalItem.start.x * scaleX, y: originalItem.start.y * scaleY };
                      if (originalItem.end) updates.end = { x: originalItem.end.x * scaleX, y: originalItem.end.y * scaleY };
                      if (originalItem.controlPoint) updates.controlPoint = { x: originalItem.controlPoint.x * scaleX, y: originalItem.controlPoint.y * scaleY };
                    } else if (originalItem.type === 'pencil' && originalItem.points) {
                      updates.points = originalItem.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                    }
                    
                    handleUpdateItemTransient(id, updates);
                  }
                }
              });
            }}
            onResizeGroupEnd={e => {
              setItems(prev => {
                const newItems = [...prev];
                let changed = false;
                e.events.forEach(ev => {
                  const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                  if (id) {
                    const transform = ev.target.style.transform;
                    const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                    const index = newItems.findIndex(i => i.id === id);
                    if (index !== -1) {
                      const item = newItems[index];
                      const originalItem = resizeStartItems.current.get(id);
                      let newWidth = parseFloat(ev.target.style.width);
                      let newHeight = parseFloat(ev.target.style.height);
                      let newX = translateMatch ? parseFloat(translateMatch[1]) : item.x;
                      let newY = translateMatch ? parseFloat(translateMatch[2]) : item.y;

                      if (gridConfig.snapToGrid && gridConfig.size > 0) {
                        const size = gridConfig.size;
                        newX = Math.round(newX / size) * size;
                        newY = Math.round(newY / size) * size;
                        newWidth = Math.max(size, Math.round(newWidth / size) * size);
                        newHeight = Math.max(size, Math.round(newHeight / size) * size);
                      }
                      
                      const updates: Partial<MoodboardItemData> = {
                        width: newWidth,
                        height: newHeight,
                        x: newX,
                        y: newY,
                      };

                      if (originalItem) {
                        const scaleX = originalItem.width ? newWidth / originalItem.width : 1;
                        const scaleY = originalItem.height ? newHeight / originalItem.height : 1;
                        
                        if (originalItem.type === 'arrow') {
                          if (originalItem.start) updates.start = { x: originalItem.start.x * scaleX, y: originalItem.start.y * scaleY };
                          if (originalItem.end) updates.end = { x: originalItem.end.x * scaleX, y: originalItem.end.y * scaleY };
                          if (originalItem.controlPoint) updates.controlPoint = { x: originalItem.controlPoint.x * scaleX, y: originalItem.controlPoint.y * scaleY };
                        } else if (originalItem.type === 'pencil' && originalItem.points) {
                          updates.points = originalItem.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                        }
                      }
                      
                      newItems[index] = { ...item, ...updates };
                      changed = true;
                    }
                  }
                });
                if (changed) {
                  saveToHistory(newItems);
                }
                return newItems;
              });
              resizeStartItems.current.clear();
            }}
            onRotateStart={e => {
              const item = items.find(i => i.id === selectedIds[0]);
              if (item) {
                e.set(item.rotation || 0);
                if (e.dragStart) {
                  e.dragStart.set([item.x, item.y]);
                }
              }
            }}
            onRotate={e => {
              let rotation = parseFloat(e.drag.transform.match(/rotate\(([-\d.]+)deg\)/)?.[1] || "0");
              
              const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315, -360];
              for (const angle of snapAngles) {
                if (Math.abs(rotation - angle) < 5) {
                  rotation = angle;
                  break;
                }
              }
              
              const translateMatch = e.drag.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
              if (translateMatch) {
                e.target.style.transform = `translate(${translateMatch[1]}px, ${translateMatch[2]}px) rotate(${rotation}deg)`;
              } else {
                e.target.style.transform = `rotate(${rotation}deg)`;
              }
            }}
            onRotateEnd={e => {
              if (!e.isDrag) return;
              const transform = e.target.style.transform;
              const rotateMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
              if (rotateMatch) {
                handleUpdateItemWithHistory(selectedIds[0], { rotation: parseFloat(rotateMatch[1]) });
              }
            }}
            onRotateGroupStart={e => {
              e.events.forEach(ev => {
                const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                const item = items.find(i => i.id === id);
                if (item) {
                  ev.set(item.rotation || 0);
                  if (ev.dragStart) {
                    ev.dragStart.set([item.x, item.y]);
                  }
                }
              });
            }}
            onRotateGroup={e => {
              e.events.forEach(ev => {
                ev.target.style.transform = ev.drag.transform;
              });
            }}
            onRotateGroupEnd={e => {
              if (!e.isDrag) return;
              setItems(prev => {
                const newItems = [...prev];
                let changed = false;
                e.events.forEach(ev => {
                  const id = ev.target.className.match(/item-([^\s]+)/)?.[1];
                  if (id) {
                    const transform = ev.target.style.transform;
                    const rotateMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
                    const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                    const index = newItems.findIndex(i => i.id === id);
                    if (index !== -1) {
                      newItems[index] = {
                        ...newItems[index],
                        ...(rotateMatch ? { rotation: parseFloat(rotateMatch[1]) } : {}),
                        ...(translateMatch ? { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) } : {})
                      };
                      changed = true;
                    }
                  }
                });
                if (changed) {
                  saveToHistory(newItems);
                }
                return newItems;
              });
            }}
          />
        )}
        
        {activeTool === 'select' && (
          <Selecto
            dragContainer={".moodboard-canvas"}
            selectableTargets={[".moodboard-item"]}
            hitRate={0}
            selectByClick={false}
            selectFromInside={false}
            toggleContinueSelect={["shift"]}
            onDragStart={e => {
              if ((e.inputEvent.target as HTMLElement).closest('.no-pan')) {
                e.stop();
              }
            }}
            onSelect={e => {
              e.added.forEach(el => {
                el.classList.add("selected");
              });
              e.removed.forEach(el => {
                el.classList.remove("selected");
              });
            }}
            onSelectEnd={e => {
              const newSelectedIds = e.selected.map(el => {
                const match = el.className.match(/item-([^\s]+)/);
                return match ? match[1] : null;
              }).filter(Boolean) as string[];
              
              setSelectedIds(newSelectedIds);
              
              const selectedItems = newSelectedIds.map(id => items.find(i => i.id === id)).filter(Boolean) as MoodboardItemData[];
              if (selectedItems.length > 0) {
                const allText = selectedItems.every(i => i.type === 'text');
                const allColorable = selectedItems.every(i => i.type === 'color' || i.type === 'shape' || i.type === 'arrow' || i.type === 'pencil');
                
                if (allText) {
                  updateSidebars(true, false);
                } else if (allColorable) {
                  updateSidebars(false, true);
                } else {
                  updateSidebars(false, false);
                }
              } else {
                updateSidebars(false, false);
              }
            }}
          />
        )}
        
        <div id="arrow-controls-layer" className="absolute inset-0 pointer-events-none z-[100]"></div>
      </div>

      <DrawingOverlay 
        activeTool={activeTool === 'comment' ? 'select' : activeTool}
        onAddArrow={handleAddArrow}
        onAddPath={handleAddPath}
        onAddShape={handleAddShape}
        zoom={zoom}
        pan={pan}
        isShiftPressed={isShiftPressed}
        items={items}
        pencilSmoothing={pencilSmoothing}
        defaultStrokeColor={defaultStrokeColor}
        defaultStrokeWidth={defaultStrokeWidth}
      />

      {/* Selection Marquee */}
      {isMovingSelection && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionLeft}px`,
            top: `${selectionTop}px`,
            width: `${selectionWidth}px`,
            height: `${selectionHeight}px`,
            border: '1px solid #18A0FB',
            backgroundColor: 'rgba(24, 160, 251, 0.1)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* Zoom / Canvas Controls & R9 Grid Menu */}
      <div className="absolute bottom-8 left-8 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 p-1.5 flex items-center gap-1 z-50 no-pan no-pan-ui">
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          onClick={() => handleZoom(-0.1)}
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
        <span 
          className="text-xs font-bold text-slate-700 min-w-[4ch] text-center cursor-pointer hover:text-[#1978e5] transition-colors select-none" 
          onClick={() => { 
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setView({ zoom: 1, pan: { x: rect.width / 2 - 5400, y: rect.height / 2 - 5200 } });
            }
          }} 
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          onClick={() => handleZoom(0.1)}
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          onClick={handleCenterMoodboard}
          title="Center Canvas"
        >
          <Crosshair size={18} />
        </button>
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          onClick={handleFitToScreen}
          title="Fit to Screen (Shift + 1)"
        >
          <Maximize2 size={16} />
        </button>

        {/* R9: Grid Settings Button & Popover */}
        <div className="relative">
          <button 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isGridMenuOpen ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
            title="Canvas Grid Settings"
          >
            <Grid size={18} />
          </button>
          {isGridMenuOpen && (
            <div className="absolute bottom-full mb-3 left-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-64 z-50 flex flex-col gap-3 text-xs text-slate-700">
              <span className="font-bold text-slate-800">Grid Pattern</span>
              <div className="grid grid-cols-4 gap-1">
                {(['dot', 'square', 'isometric', 'blank'] as const).map((pattern) => (
                  <button
                    key={pattern}
                    className={`py-1 rounded-lg font-semibold capitalize border ${
                      gridConfig.type === pattern ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => setGridConfig({ type: pattern })}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Grid Size</span>
                  <span>{gridConfig.size}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={gridConfig.size}
                  onChange={(e) => setGridConfig({ size: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Grid Opacity</span>
                  <span>{Math.round(gridConfig.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={gridConfig.opacity}
                  onChange={(e) => setGridConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-bold">Snap to Grid</span>
                <input
                  type="checkbox"
                  checked={gridConfig.snapToGrid}
                  onChange={(e) => setGridConfig({ snapToGrid: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          onClick={async () => {
            const ok = await confirm.danger('Clear Moodboard?', 'Are you sure you want to clear the entire moodboard? This cannot be undone.');
            if (ok) {
              setItems([]);
              saveToHistory([]);
              setSelectedIds([]);
            }
          }}
          title="Clear Moodboard"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 p-1.5 flex items-center gap-1 z-50 no-pan no-pan-ui">
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTool === 'select' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          title="Select (V)"
          onClick={() => setActiveTool('select')}
        >
          <MousePointer2 size={20} />
        </button>
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTool === 'hand' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          title="Hand Tool"
          onClick={() => {
            setActiveTool('hand');
            setSelectedIds([]);
            updateSidebars(false, false);
          }}
        >
          <Hand size={20} />
        </button>
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTool === 'arrow' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          title="Arrow Tool (A)"
          onClick={() => setActiveTool('arrow')}
        >
          <ArrowUpRight size={20} />
        </button>
        <div className="relative flex items-center justify-center">
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTool === 'pencil' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
            title="Pencil Tool (P)"
            onClick={() => setActiveTool('pencil')}
          >
            <Pencil size={20} />
          </button>
          
          {activeTool === 'pencil' && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 p-3 flex flex-col gap-2 w-48">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Smoothing</span>
                <span className="text-xs text-slate-500">{pencilSmoothing}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={pencilSmoothing} 
                onChange={(e) => setPencilSmoothing(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Raw</span>
                <span>Smooth</span>
              </div>
            </div>
          )}
        </div>

        {/* R8: Comment Pin Tool Button */}
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTool === 'comment' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          title="Comment Pin Tool (C)"
          onClick={() => setActiveTool('comment')}
        >
          <MessageSquare size={20} />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Rectangle"
          onClick={() => handleAddItem('shape', 'rectangle')}
        >
          <Square size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Circle"
          onClick={() => handleAddItem('shape', 'circle')}
        >
          <Circle size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Section Frame"
          onClick={() => handleAddItem('frame')}
        >
          <Frame size={20} />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Note"
          onClick={() => handleAddItem('note')}
        >
          <MessageSquare size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Text"
          onClick={() => handleAddItem('text')}
        >
          <Type size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Image"
          onClick={() => handleAddItem('image')}
        >
          <Image size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Bookmark"
          onClick={() => handleAddItem('bookmark')}
        >
          <Link2 size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors" 
          title="Add Color"
          onClick={() => handleAddItem('color')}
        >
          <Palette size={20} />
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95" 
          title="Add Styles"
          onClick={() => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const centerX = (rect.width / 2 - pan.x) / zoom;
              const centerY = (rect.height / 2 - pan.y) / zoom;
              setTempAnchorPos({ x: centerX, y: centerY });
            }
            setIsAddStylesModalOpen(true);
          }}
        >
          <Sparkles size={20} />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${historyIndex > 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
        >
          <Undo2 size={20} />
        </button>
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${historyIndex < history.length - 1 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
          title="Redo (Ctrl+Y)"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
        >
          <Redo2 size={20} />
        </button>
      </div>

      <AddImageModal 
        isOpen={isAddImageModalOpen} 
        onClose={() => {
          setIsAddImageModalOpen(false);
          setEditingImageId(null);
        }} 
        onAddImage={handleAddImage} 
        initialUrl={editingImageId ? items.find(i => i.id === editingImageId)?.content : undefined}
        initialTitle={editingImageId ? items.find(i => i.id === editingImageId)?.title : undefined}
      />

      <AddBookmarkModal
        isOpen={isAddBookmarkModalOpen}
        onClose={() => {
          setIsAddBookmarkModalOpen(false);
          setPastedUrl('');
        }}
        onAddBookmark={handleAddBookmark}
        initialUrl={pastedUrl}
      />

      <AddStylesModal
        isOpen={isAddStylesModalOpen}
        onClose={() => setIsAddStylesModalOpen(false)}
        anchorPos={tempAnchorPos}
        onSave={handleSaveStyles}
      />

      <EditTypographySidebar
        isOpen={isTypographySidebarOpen}
        onClose={() => updateSidebars(false, isColorSidebarOpen)}
        onSave={handleTypographySave}
      />

      <EditColorSidebar
        isOpen={isColorSidebarOpen}
        onClose={() => updateSidebars(isTypographySidebarOpen, false)}
        onSave={handleColorSave}
        onChange={handleColorChange}
        initialColor={selectedIds.length > 0 ? items.find(i => i.id === selectedIds[0])?.color : undefined}
        initialBorderColor={selectedIds.length > 0 ? items.find(i => i.id === selectedIds[0])?.borderColor : undefined}
        initialBorderWidth={selectedIds.length > 0 ? items.find(i => i.id === selectedIds[0])?.borderWidth : undefined}
        showBorderToggle={selectedIds.length > 0 && items.find(i => i.id === selectedIds[0])?.type === 'shape'}
      />

      <DropdownMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        anchorRect={{
          top: contextMenu.y,
          bottom: contextMenu.y,
          left: contextMenu.x,
          right: contextMenu.x,
          width: 0,
          height: 0,
          x: contextMenu.x,
          y: contextMenu.y,
          toJSON: () => {}
        } as DOMRect}
        width={200}
        options={
          contextMenu.targetId ? [
            { 
              id: 'front', 
              label: 'Bring to Front', 
              icon: 'flip_to_front', 
              onClick: bringToFront 
            },
            { 
              id: 'forward', 
              label: 'Bring Forward', 
              icon: 'arrow_upward', 
              onClick: bringForward 
            },
            { 
              id: 'backward', 
              label: 'Send Backward', 
              icon: 'arrow_downward', 
              onClick: sendBackward 
            },
            { 
              id: 'back', 
              label: 'Send to Back', 
              icon: 'flip_to_back', 
              onClick: sendToBack 
            },
            ...(items.find(i => i.id === contextMenu.targetId)?.type === 'image' ? [{
              id: 'edit-image',
              label: 'Edit Image',
              icon: 'edit',
              onClick: () => {
                setEditingImageId(contextMenu.targetId!);
                setIsAddImageModalOpen(true);
              }
            }] : []),
            { 
              id: 'delete', 
              label: 'Delete', 
              icon: 'delete', 
              color: '#ef4444',
              divider: true,
              onClick: () => selectedIds.forEach(id => handleDeleteItem(id))
            }
          ] : [
            { 
              id: 'add-styles', 
              label: 'Add Styles', 
              icon: 'auto_awesome', 
              onClick: () => {
                setTempAnchorPos({ x: (contextMenu.x - pan.x) / zoom, y: (contextMenu.y - pan.y) / zoom });
                setIsAddStylesModalOpen(true);
              }
            },
            { 
              id: 'add-text', 
              label: 'Add Text', 
              icon: 'title', 
              onClick: () => handleAddItem('text', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-note', 
              label: 'Add Note', 
              icon: 'sticky_note_2', 
              onClick: () => handleAddItem('note', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-image', 
              label: 'Add Image', 
              icon: 'image', 
              onClick: () => handleAddItem('image', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-bookmark', 
              label: 'Add Bookmark', 
              icon: 'link', 
              onClick: () => handleAddItem('bookmark', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-frame', 
              label: 'Add Section Frame', 
              icon: 'crop_square', 
              onClick: () => handleAddItem('frame', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-color', 
              label: 'Add Color', 
              icon: 'palette', 
              onClick: () => handleAddItem('color', undefined, tempAnchorPos) 
            },
            { 
              id: 'add-rectangle', 
              label: 'Add Rectangle', 
              icon: 'rectangle', 
              onClick: () => handleAddItem('shape', 'rectangle', tempAnchorPos) 
            },
            { 
              id: 'add-circle', 
              label: 'Add Circle', 
              icon: 'circle', 
              divider: true,
              onClick: () => handleAddItem('shape', 'circle', tempAnchorPos) 
            }
          ]
        }
      />
    </div>
  );
};
