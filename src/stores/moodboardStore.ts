import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
import { 
  MoodboardItemData, 
  UrlMeta, 
  CropMaskConfig, 
  CommentPin, 
  CommentReply, 
  GridConfig 
} from '../components/Projects/ProjectDetails/MoodboardPage/MoodboardItem';
import { extractColorsFromImage } from '../components/Projects/ProjectDetails/MoodboardPage/paletteExtractor';

const initialItems: MoodboardItemData[] = [];

const defaultGridConfig: GridConfig = {
  type: 'dot',
  size: 20,
  opacity: 0.15,
  snapToGrid: false,
};

export interface MoodboardState {
  _hasHydrated: boolean;
  projectItems: Record<string, MoodboardItemData[]>;
  projectViews: Record<string, { zoom: number; pan: { x: number; y: number } }>;
  currentProjectId: string | null;
  items: MoodboardItemData[];
  selectedIds: string[];
  view: { zoom: number; pan: { x: number; y: number } };
  history: MoodboardItemData[][];
  historyIndex: number;

  // Milestone 2 State Fields
  activeCategoryFilter: string | null;
  gridConfig: GridConfig;

  // Core Actions
  setItems: (items: MoodboardItemData[] | ((prev: MoodboardItemData[]) => MoodboardItemData[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setView: (view: { zoom: number; pan: { x: number; y: number } } | ((prev: { zoom: number; pan: { x: number; y: number } }) => { zoom: number; pan: { x: number; y: number } })) => void;
  saveToHistory: (newItems: MoodboardItemData[]) => void;
  undo: () => void;
  redo: () => void;
  setProject: (projectId: string) => void;

  // Milestone 2 Actions R1 - R10
  extractImagePalette: (itemId: string, customPalette?: string[]) => Promise<string[]>;
  addBookmarkCard: (url: string, position?: { x: number; y: number }, initialMeta?: Partial<UrlMeta>) => string;
  alignSelectedItems: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelectedItems: (axis: 'horizontal' | 'vertical') => void;
  toggleLockItems: (itemIds?: string[]) => void;
  createSectionFrame: (bounds: { x: number; y: number; width: number; height: number }, title?: string, color?: string) => string;
  moveFrameWithChildren: (frameId: string, delta: { dx: number; dy: number }, isTransient?: boolean) => void;
  updateCropMask: (itemId: string, cropMaskData: Partial<CropMaskConfig>) => void;
  setItemCategories: (itemId: string, categories: string[]) => void;
  setActiveCategoryFilter: (category: string | null) => void;
  addCommentPin: (
    param1: { x: number; y: number; text: string; author?: string; targetItemId?: string } | string | null,
    param2?: { x: number; y: number; text: string; author?: string }
  ) => string;
  resolveCommentPin: (commentIdOrItemId: string | null, commentId?: string) => void;
  addCommentReply: (commentIdOrItemId: string | null, commentIdOrText: string, textOrAuthor?: string, author?: string) => void;
  deleteCommentPin: (commentIdOrItemId: string | null, commentId?: string) => void;
  setGridConfig: (config: Partial<GridConfig> | ((prev: GridConfig) => GridConfig)) => void;
  duplicateItems: (itemIds?: string[], offset?: { x: number; y: number }) => string[];

  // Stack level (z-order) control. Mirrors the inline implementations that
  // previously lived only in MoodboardPage, so they are reachable without the
  // UI. Follows toggleLockItems/duplicateItems: explicit ids, else selection.
  bringToFront: (itemIds?: string[]) => void;
  bringForward: (itemIds?: string[]) => void;
  sendToBack: (itemIds?: string[]) => void;
  sendBackward: (itemIds?: string[]) => void;
}

export const useMoodboardStore = create<MoodboardState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      projectItems: {},
      projectViews: {},
      currentProjectId: null,
      items: initialItems,
      selectedIds: [],
      view: { zoom: 1, pan: { x: -4500, y: -4500 } },
      history: [initialItems],
      historyIndex: 0,

      // Milestone 2 Initial State
      activeCategoryFilter: null,
      gridConfig: defaultGridConfig,

      setProject: (projectId) => set((state) => {
        if (state.currentProjectId === projectId) return {};
        
        const updatedProjectItems = { ...state.projectItems };
        const updatedProjectViews = { ...state.projectViews };
        
        // Save current items and view of previous project before switching
        if (state.currentProjectId) {
          updatedProjectItems[state.currentProjectId] = state.items;
          updatedProjectViews[state.currentProjectId] = state.view;
        }
        
        // Load new items and view
        const nextItems = updatedProjectItems[projectId] || [];
        const nextView = updatedProjectViews[projectId] || { zoom: 1, pan: { x: -4500, y: -4500 } };
        
        return {
          currentProjectId: projectId,
          projectItems: updatedProjectItems,
          projectViews: updatedProjectViews,
          items: nextItems,
          view: nextView,
          selectedIds: [],
          history: [nextItems],
          historyIndex: 0
        };
      }),

      setItems: (updater) => set((state) => {
        const newItems = typeof updater === 'function' ? updater(state.items) : updater;
        const updatedProjectItems = { ...state.projectItems };
        if (state.currentProjectId) {
          updatedProjectItems[state.currentProjectId] = newItems;
        }
        return { items: newItems, projectItems: updatedProjectItems };
      }),

      setSelectedIds: (updater) => set((state) => {
        const newIds = typeof updater === 'function' ? updater(state.selectedIds) : updater;
        return { selectedIds: newIds };
      }),

      setView: (updater) => set((state) => {
        const newView = typeof updater === 'function' ? updater(state.view) : updater;
        const updatedProjectViews = { ...state.projectViews };
        if (state.currentProjectId) {
          updatedProjectViews[state.currentProjectId] = newView;
        }
        return { view: newView, projectViews: updatedProjectViews };
      }),

      saveToHistory: (newItems) => set((state) => {
        let baseHistory = state.history.slice(0, state.historyIndex + 1);
        if (baseHistory.length === 0 || (baseHistory.length === 1 && baseHistory[0].length === 0 && state.items.length > 0)) {
          baseHistory = [state.items];
        }
        const newHistory = [...baseHistory, newItems];
        const updatedProjectItems = { ...state.projectItems };
        if (state.currentProjectId) {
          updatedProjectItems[state.currentProjectId] = newItems;
        }
        return { history: newHistory, historyIndex: newHistory.length - 1, items: newItems, projectItems: updatedProjectItems };
      }),

      undo: () => set((state) => {
        if (state.historyIndex > 0 && state.history[state.historyIndex - 1]) {
          const newIndex = state.historyIndex - 1;
          const newItems = state.history[newIndex];
          const updatedProjectItems = { ...state.projectItems };
          if (state.currentProjectId) {
            updatedProjectItems[state.currentProjectId] = newItems;
          }
          return { historyIndex: newIndex, items: newItems, projectItems: updatedProjectItems };
        }
        return state;
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1 && state.history[state.historyIndex + 1]) {
          const newIndex = state.historyIndex + 1;
          const newItems = state.history[newIndex];
          const updatedProjectItems = { ...state.projectItems };
          if (state.currentProjectId) {
            updatedProjectItems[state.currentProjectId] = newItems;
          }
          return { historyIndex: newIndex, items: newItems, projectItems: updatedProjectItems };
        }
        return state;
      }),

      // --- R1: Image Color Palette Auto-Extractor ---
      extractImagePalette: async (itemId, customPalette) => {
        const state = get();
        const targetItem = state.items.find((i) => i.id === itemId);
        if (!targetItem) return [];

        let palette: string[] = customPalette || [];
        if (!palette || palette.length === 0) {
          const imageUrl = targetItem.content || targetItem.urlMeta?.thumbnail || targetItem.urlMeta?.url || '';
          palette = await extractColorsFromImage(imageUrl);
        }

        const updatedItems = get().items.map((item) =>
          item.id === itemId ? { ...item, paletteColors: palette } : item
        );

        get().saveToHistory(updatedItems);
        return palette;
      },

      // --- R2: Web Link & URL Bookmark Cards ---
      addBookmarkCard: (url, position = { x: 0, y: 0 }, initialMeta) => {
        let domain = 'link';
        let formattedUrl = url.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
          formattedUrl = 'https://' + formattedUrl;
        }
        try {
          domain = new URL(formattedUrl).hostname.replace(/^www\./, '');
        } catch {
          domain = formattedUrl;
        }

        const urlMeta: UrlMeta = {
          url: formattedUrl,
          domain,
          title: initialMeta?.title || domain,
          description: initialMeta?.description || formattedUrl,
          favicon: initialMeta?.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          thumbnail: initialMeta?.thumbnail,
          ...initialMeta,
        };

        const newItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newItem: MoodboardItemData = {
          id: newItemId,
          type: 'bookmark',
          x: position.x,
          y: position.y,
          width: 340,
          height: 180,
          title: urlMeta.title,
          urlMeta,
        };

        const state = get();
        const updatedItems = [...state.items, newItem];
        get().saveToHistory(updatedItems);
        set({ selectedIds: [newItemId] });
        return newItemId;
      },

      // --- R3: Smart Alignment & Distribute Spacing Bar ---
      alignSelectedItems: (direction) => {
        const state = get();
        if (state.selectedIds.length < 2) return;

        const targetItems = state.items.filter(
          (item) => state.selectedIds.includes(item.id) && !item.isLocked
        );
        if (targetItems.length < 2) return;

        const minX = Math.min(...targetItems.map((i) => i.x));
        const maxX = Math.max(...targetItems.map((i) => i.x + (i.width || 100)));
        const centerX = (minX + maxX) / 2;

        const minY = Math.min(...targetItems.map((i) => i.y));
        const maxY = Math.max(...targetItems.map((i) => i.y + (i.height || 100)));
        const centerY = (minY + maxY) / 2;

        const updatedItems = state.items.map((item) => {
          if (!state.selectedIds.includes(item.id) || item.isLocked) return item;
          const w = item.width || 100;
          const h = item.height || 100;

          let newX = item.x;
          let newY = item.y;

          switch (direction) {
            case 'left':
              newX = minX;
              break;
            case 'center':
              newX = centerX - w / 2;
              break;
            case 'right':
              newX = maxX - w;
              break;
            case 'top':
              newY = minY;
              break;
            case 'middle':
              newY = centerY - h / 2;
              break;
            case 'bottom':
              newY = maxY - h;
              break;
          }

          return { ...item, x: newX, y: newY };
        });

        get().saveToHistory(updatedItems);
      },

      distributeSelectedItems: (axis) => {
        const state = get();
        if (state.selectedIds.length < 3) return;

        const targetItems = state.items.filter(
          (item) => state.selectedIds.includes(item.id) && !item.isLocked
        );
        if (targetItems.length < 3) return;

        const sorted = [...targetItems].sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));
        const n = sorted.length;

        if (axis === 'horizontal') {
          const firstX = sorted[0].x;
          const lastX = sorted[n - 1].x + (sorted[n - 1].width || 100);
          const span = lastX - firstX;
          const sumWidths = sorted.reduce((sum, item) => sum + (item.width || 100), 0);
          const gap = (span - sumWidths) / (n - 1);

          let currentX = firstX;
          const positionMap = new Map<string, number>();
          sorted.forEach((item) => {
            positionMap.set(item.id, currentX);
            currentX += (item.width || 100) + gap;
          });

          const updatedItems = state.items.map((item) => {
            if (positionMap.has(item.id)) {
              return { ...item, x: positionMap.get(item.id)! };
            }
            return item;
          });
          get().saveToHistory(updatedItems);
        } else {
          const firstY = sorted[0].y;
          const lastY = sorted[n - 1].y + (sorted[n - 1].height || 100);
          const span = lastY - firstY;
          const sumHeights = sorted.reduce((sum, item) => sum + (item.height || 100), 0);
          const gap = (span - sumHeights) / (n - 1);

          let currentY = firstY;
          const positionMap = new Map<string, number>();
          sorted.forEach((item) => {
            positionMap.set(item.id, currentY);
            currentY += (item.height || 100) + gap;
          });

          const updatedItems = state.items.map((item) => {
            if (positionMap.has(item.id)) {
              return { ...item, y: positionMap.get(item.id)! };
            }
            return item;
          });
          get().saveToHistory(updatedItems);
        }
      },

      // --- R4: Lock / Unlock Element Position ---
      toggleLockItems: (itemIds) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return;

        const targetItems = state.items.filter((item) => targetIds.includes(item.id));
        const allLocked = targetItems.length > 0 && targetItems.every((item) => item.isLocked);
        const newLockedState = !allLocked;

        const updatedItems = state.items.map((item) => {
          if (targetIds.includes(item.id)) {
            return { ...item, isLocked: newLockedState };
          }
          return item;
        });

        get().saveToHistory(updatedItems);
      },

      // --- R5: Section Frames / Group Containers ---
      createSectionFrame: (bounds, title, color) => {
        const frameId = `frame-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const frameItem: MoodboardItemData = {
          id: frameId,
          type: 'frame',
          isFrame: true,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          title: title || 'Section Frame',
          frameColor: color || '#cbd5e1',
        };

        const state = get();
        const updatedItems = state.items.map((item) => {
          if (item.type === 'frame' || item.isFrame) return item;
          const cx = item.x + (item.width || 100) / 2;
          const cy = item.y + (item.height || 100) / 2;
          const isInside =
            cx >= bounds.x &&
            cx <= bounds.x + bounds.width &&
            cy >= bounds.y &&
            cy <= bounds.y + bounds.height;
          if (isInside) {
            return { ...item, frameId };
          }
          return item;
        });

        const finalItems = [frameItem, ...updatedItems];
        get().saveToHistory(finalItems);
        set({ selectedIds: [frameId] });
        return frameId;
      },

      moveFrameWithChildren: (frameId, delta, isTransient = false) => {
        const state = get();
        const updatedItems = state.items.map((item) => {
          if (item.id === frameId || item.frameId === frameId) {
            if (item.type === 'arrow') {
              const updates: Partial<MoodboardItemData> = {};
              if (item.start) updates.start = { x: item.start.x + delta.dx, y: item.start.y + delta.dy };
              if (item.end) updates.end = { x: item.end.x + delta.dx, y: item.end.y + delta.dy };
              if (item.controlPoint) updates.controlPoint = { x: item.controlPoint.x + delta.dx, y: item.controlPoint.y + delta.dy };
              return { ...item, ...updates };
            }

            const updates: Partial<MoodboardItemData> = {
              x: item.x + delta.dx,
              y: item.y + delta.dy,
            };
            if (item.start) updates.start = { x: item.start.x + delta.dx, y: item.start.y + delta.dy };
            if (item.end) updates.end = { x: item.end.x + delta.dx, y: item.end.y + delta.dy };
            if (item.controlPoint) updates.controlPoint = { x: item.controlPoint.x + delta.dx, y: item.controlPoint.y + delta.dy };
            return { ...item, ...updates };
          }
          return item;
        });

        if (isTransient) {
          state.setItems(updatedItems);
        } else {
          state.saveToHistory(updatedItems);
        }
      },

      // --- R6: In-App Image Crop & Mask Presets ---
      updateCropMask: (itemId, cropMaskData) => {
        const state = get();
        const updatedItems = state.items.map((item) => {
          if (item.id === itemId) {
            const currentMask: CropMaskConfig = item.cropMask || {
              mode: 'crop',
              maskShape: 'none',
              zoom: 1,
              panX: 0,
              panY: 0,
            };
            return { ...item, cropMask: { ...currentMask, ...cropMaskData } };
          }
          return item;
        });
        get().saveToHistory(updatedItems);
      },

      // --- R7: Category Pills / Badges on Cards ---
      setItemCategories: (itemId, categories) => {
        const state = get();
        const updatedItems = state.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, categories };
          }
          return item;
        });
        get().saveToHistory(updatedItems);
      },

      setActiveCategoryFilter: (category) => {
        set({ activeCategoryFilter: category });
      },

      // --- R8: Pinpoint Comment & Annotation Pins ---
      addCommentPin: (param1, param2) => {
        let targetItemId: string | null = null;
        let pinData: { x: number; y: number; text: string; author?: string };

        if (typeof param1 === 'object' && param1 !== null && 'text' in param1) {
          pinData = param1;
          targetItemId = param1.targetItemId || null;
        } else {
          targetItemId = param1 as string | null;
          pinData = param2!;
        }

        const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newComment: CommentPin = {
          id: commentId,
          x: pinData.x,
          y: pinData.y,
          text: pinData.text,
          author: pinData.author || 'User',
          createdAt: new Date().toISOString(),
          resolved: false,
        };

        const state = get();
        let targetId = targetItemId;

        if (!targetId) {
          const itemUnder = [...state.items].reverse().find(
            (i) =>
              i.type !== 'frame' &&
              pinData.x >= i.x &&
              pinData.x <= i.x + (i.width || 100) &&
              pinData.y >= i.y &&
              pinData.y <= i.y + (i.height || 100)
          );
          if (itemUnder) targetId = itemUnder.id;
        }

        const updatedItems = state.items.map((item) => {
          if (targetId && item.id === targetId) {
            const existingComments = item.comments || [];
            return { ...item, comments: [...existingComments, newComment] };
          }
          return item;
        });

        let finalItems = updatedItems;
        if (!targetId && state.items.length > 0) {
          const firstItem = state.items[0];
          finalItems = state.items.map((item) => {
            if (item.id === firstItem.id) {
              const existingComments = item.comments || [];
              return { ...item, comments: [...existingComments, newComment] };
            }
            return item;
          });
        }

        get().saveToHistory(finalItems);
        return commentId;
      },

      resolveCommentPin: (param1, param2) => {
        const commentId = param2 || (param1 as string);
        const state = get();

        const updatedItems = state.items.map((item) => {
          if (!item.comments || item.comments.length === 0) return item;
          const updatedComments = item.comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, resolved: !comment.resolved };
            }
            return comment;
          });
          return { ...item, comments: updatedComments };
        });

        get().saveToHistory(updatedItems);
      },

      addCommentReply: (param1, param2, param3, param4) => {
        let commentId: string;
        let text: string;
        let author: string;

        if (param4 !== undefined || (typeof param1 === 'string' && typeof param2 === 'string' && typeof param3 === 'string')) {
          commentId = param2 as string;
          text = param3 as string;
          author = param4 || 'User';
        } else {
          commentId = param1 as string;
          text = param2 as string;
          author = param3 || 'User';
        }

        const reply: CommentReply = {
          id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          author,
          text,
          createdAt: new Date().toISOString(),
        };

        const state = get();
        const updatedItems = state.items.map((item) => {
          if (!item.comments) return item;
          const updatedComments = item.comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, replies: [...(comment.replies || []), reply] };
            }
            return comment;
          });
          return { ...item, comments: updatedComments };
        });

        get().saveToHistory(updatedItems);
      },

      deleteCommentPin: (param1, param2) => {
        const commentId = param2 || (param1 as string);
        const state = get();

        const updatedItems = state.items.map((item) => {
          if (!item.comments) return item;
          return {
            ...item,
            comments: item.comments.filter((c) => c.id !== commentId),
          };
        });

        get().saveToHistory(updatedItems);
      },

      // --- R9: Canvas Grid Customization ---
      setGridConfig: (config) => {
        set((state) => {
          const nextConfig = typeof config === 'function' ? config(state.gridConfig) : { ...state.gridConfig, ...config };
          return { gridConfig: nextConfig };
        });
      },

      // --- R10: Instant Duplicate ---
      duplicateItems: (itemIds, offset = { x: 20, y: 20 }) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return [];

        const targetItems = state.items.filter((item) => targetIds.includes(item.id));
        const newIds: string[] = [];
        const clonedItems: MoodboardItemData[] = targetItems.map((originalItem) => {
          const clone: MoodboardItemData = JSON.parse(JSON.stringify(originalItem));
          const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          clone.id = newId;
          clone.x += offset.x;
          clone.y += offset.y;

          if (clone.start) {
            clone.start = { x: clone.start.x + offset.x, y: clone.start.y + offset.y };
          }
          if (clone.end) {
            clone.end = { x: clone.end.x + offset.x, y: clone.end.y + offset.y };
          }
          if (clone.controlPoint) {
            clone.controlPoint = { x: clone.controlPoint.x + offset.x, y: clone.controlPoint.y + offset.y };
          }

          newIds.push(newId);
          return clone;
        });

        const updatedItems = [...state.items, ...clonedItems];
        get().saveToHistory(updatedItems);
        set({ selectedIds: newIds });
        return newIds;
      },

      // --- Stack level (z-order) control ---
      // Item order in the array is the render order, so reordering the array is
      // the z-order operation. Lifted out of MoodboardPage's inline handlers.
      bringToFront: (itemIds) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return;
        const selected = state.items.filter((i) => targetIds.includes(i.id));
        if (selected.length === 0) return;
        const rest = state.items.filter((i) => !targetIds.includes(i.id));
        get().saveToHistory([...rest, ...selected]);
      },

      sendToBack: (itemIds) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return;
        const selected = state.items.filter((i) => targetIds.includes(i.id));
        if (selected.length === 0) return;
        const rest = state.items.filter((i) => !targetIds.includes(i.id));
        get().saveToHistory([...selected, ...rest]);
      },

      bringForward: (itemIds) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return;
        const next = [...state.items];
        let changed = false;
        for (let i = next.length - 2; i >= 0; i--) {
          if (targetIds.includes(next[i].id) && !targetIds.includes(next[i + 1].id)) {
            const swap = next[i];
            next[i] = next[i + 1];
            next[i + 1] = swap;
            changed = true;
          }
        }
        if (changed) get().saveToHistory(next);
      },

      sendBackward: (itemIds) => {
        const state = get();
        const targetIds = itemIds && itemIds.length > 0 ? itemIds : state.selectedIds;
        if (targetIds.length === 0) return;
        const next = [...state.items];
        let changed = false;
        for (let i = 1; i < next.length; i++) {
          if (targetIds.includes(next[i].id) && !targetIds.includes(next[i - 1].id)) {
            const swap = next[i];
            next[i] = next[i - 1];
            next[i - 1] = swap;
            changed = true;
          }
        }
        if (changed) get().saveToHistory(next);
      },
    }),
    {
      name: 'moodboard-storage',
      storage: createFileStorage('moodboard', 2000),
      onRehydrateStorage: () => () => { useMoodboardStore.setState({ _hasHydrated: true }); },
      partialize: (state) => ({ 
        projectItems: state.projectItems, 
        projectViews: state.projectViews,
        currentProjectId: state.currentProjectId,
        items: state.items,
        view: state.view,
        gridConfig: state.gridConfig,
        activeCategoryFilter: state.activeCategoryFilter,
      }),
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.currentProjectId && merged.projectItems && merged.projectItems[merged.currentProjectId]) {
          merged.items = merged.projectItems[merged.currentProjectId];
        }
        if (merged.items && Array.isArray(merged.items)) {
          merged.history = [merged.items];
          merged.historyIndex = 0;
        }
        return merged;
      }
    }
  )
);

onStoreExternalUpdate('moodboard', () => {
  useMoodboardStore.persist.rehydrate();
  const current = useMoodboardStore.getState();
  if (current.items && current.items.length > 0) {
    useMoodboardStore.setState({ history: [current.items], historyIndex: 0 });
  }
});


