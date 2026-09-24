import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useMoodboardStore } from '../../../../../stores/moodboardStore';
import { MoodboardItemData } from '../../../../Projects/ProjectDetails/MoodboardPage/MoodboardItem';

/**
 * Canvas actions operating on existing cards, as opposed to
 * contentNavHandlers' `add_moodboard_items` / `clear_moodboard`, which create
 * and destroy the canvas. These mirror UI affordances that previously had no
 * agent path: the floating property bar (colour, crop, categories, lock),
 * the alignment bar, the context-menu stack actions, comment pins, the grid
 * popover, and the viewport controls.
 *
 * Cards are addressed by title or id. Titles are what the model sees in the
 * canvas context it is given, so they are the practical handle; ids are
 * accepted for precision.
 */

const resolveItems = (refs?: unknown): MoodboardItemData[] => {
  const items = useMoodboardStore.getState().items || [];
  const list = Array.isArray(refs) ? refs.map((r) => String(r).trim().toLowerCase()).filter(Boolean) : [];
  if (list.length === 0) return [];
  return items.filter((item) => {
    const title = (item.title || '').toLowerCase();
    return list.some((ref) => item.id.toLowerCase() === ref || (title && (title === ref || title.includes(ref))));
  });
};

const describeTargets = (items: MoodboardItemData[]) =>
  items.map((i) => `"${i.title || i.id}"`).join(', ');

/** Selection drives the store's align/distribute actions, so set it first. */
const applySelection = (refs?: unknown): MoodboardItemData[] => {
  const resolved = resolveItems(refs);
  if (resolved.length > 0) {
    useMoodboardStore.getState().setSelectedIds(resolved.map((i) => i.id));
  }
  return resolved;
};

export function handleMoodboardTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // 1. Selection — the prerequisite for align / distribute / lock / duplicate
  if (call.name === 'select_moodboard_items') {
    const resolved = applySelection(args.items);
    if (resolved.length === 0) return null;
    toast.info(`Selected ${resolved.length} moodboard card(s)`);
    return {
      toolName: 'select_moodboard_items',
      description: `Selected ${describeTargets(resolved)}`,
      data: { ids: resolved.map((i) => i.id) }
    };
  }

  // 2. Alignment
  if (call.name === 'align_moodboard_items') {
    const valid = ['left', 'center', 'right', 'top', 'middle', 'bottom'];
    if (!valid.includes(args.direction)) return null;
    applySelection(args.items);
    const count = useMoodboardStore.getState().selectedIds.length;
    if (count < 2) {
      return {
        toolName: 'align_moodboard_items',
        description: `Align needs at least 2 cards selected; ${count} currently selected. Use select_moodboard_items first.`,
        data: { direction: args.direction, selected: count }
      };
    }
    useMoodboardStore.getState().alignSelectedItems(args.direction);
    toast.success(`Aligned ${count} cards (${args.direction})`);
    return {
      toolName: 'align_moodboard_items',
      description: `Aligned ${count} cards to ${args.direction}`,
      data: { direction: args.direction, count }
    };
  }

  // 3. Distribute
  if (call.name === 'distribute_moodboard_items') {
    const valid = ['horizontal', 'vertical'];
    if (!valid.includes(args.axis)) return null;
    applySelection(args.items);
    const count = useMoodboardStore.getState().selectedIds.length;
    if (count < 3) {
      return {
        toolName: 'distribute_moodboard_items',
        description: `Distribute needs at least 3 cards selected; ${count} currently selected. Use select_moodboard_items first.`,
        data: { axis: args.axis, selected: count }
      };
    }
    useMoodboardStore.getState().distributeSelectedItems(args.axis);
    toast.success(`Distributed ${count} cards (${args.axis})`);
    return {
      toolName: 'distribute_moodboard_items',
      description: `Evenly distributed ${count} cards on the ${args.axis} axis`,
      data: { axis: args.axis, count }
    };
  }

  // 4. Duplicate
  if (call.name === 'duplicate_moodboard_items') {
    const resolved = resolveItems(args.items);
    const ids = resolved.length > 0 ? resolved.map((i) => i.id) : useMoodboardStore.getState().selectedIds;
    if (ids.length === 0) return null;
    const offset = {
      x: Number(args.offsetX) || 20,
      y: Number(args.offsetY) || 20
    };
    const newIds = useMoodboardStore.getState().duplicateItems(ids, offset);
    toast.success(`Duplicated ${newIds.length} card(s)`);
    return {
      toolName: 'duplicate_moodboard_items',
      description: `Duplicated ${newIds.length} card(s) with a ${offset.x}x${offset.y} offset`,
      data: { ids: newIds }
    };
  }

  // 5. Stack level (z-order)
  if (call.name === 'arrange_moodboard_items') {
    const resolved = resolveItems(args.items);
    const ids = resolved.length > 0 ? resolved.map((i) => i.id) : useMoodboardStore.getState().selectedIds;
    if (ids.length === 0) return null;

    const positionMap: Record<string, () => void> = {
      front: () => useMoodboardStore.getState().bringToFront(ids),
      forward: () => useMoodboardStore.getState().bringForward(ids),
      backward: () => useMoodboardStore.getState().sendBackward(ids),
      back: () => useMoodboardStore.getState().sendToBack(ids)
    };
    const run = positionMap[args.position];
    if (!run) return null;

    run();
    toast.success(`Moved ${ids.length} card(s) ${args.position}`);
    return {
      toolName: 'arrange_moodboard_items',
      description: `Moved ${ids.length} card(s) to ${args.position} in the stack`,
      data: { position: args.position, ids }
    };
  }

  // 6. Lock / unlock
  if (call.name === 'toggle_lock_moodboard_items') {
    const resolved = resolveItems(args.items);
    const ids = resolved.length > 0 ? resolved.map((i) => i.id) : useMoodboardStore.getState().selectedIds;
    if (ids.length === 0) return null;
    const before = useMoodboardStore.getState().items.filter((i) => ids.includes(i.id));
    const wasAllLocked = before.length > 0 && before.every((i) => i.isLocked);
    useMoodboardStore.getState().toggleLockItems(ids);
    const nowLocked = !wasAllLocked;
    toast.success(`${nowLocked ? 'Locked' : 'Unlocked'} ${ids.length} card(s)`);
    return {
      toolName: 'toggle_lock_moodboard_items',
      description: `${nowLocked ? 'Locked' : 'Unlocked'} ${ids.length} card(s)`,
      data: { ids, isLocked: nowLocked }
    };
  }

  // 7. Edit a card in place (position, size, colour, text)
  if (call.name === 'update_moodboard_item') {
    const [target] = resolveItems([args.item]);
    if (!target) return null;

    const updates: Partial<MoodboardItemData> = {};
    if (args.x !== undefined) updates.x = Number(args.x);
    if (args.y !== undefined) updates.y = Number(args.y);
    if (args.width !== undefined) updates.width = Number(args.width);
    if (args.height !== undefined) updates.height = Number(args.height);
    if (args.color) updates.color = String(args.color);
    if (args.title) updates.title = String(args.title);
    if (args.content !== undefined) updates.content = String(args.content);

    const changed = Object.keys(updates);
    if (changed.length === 0) {
      return {
        toolName: 'update_moodboard_item',
        description: `No changes supplied for "${target.title || target.id}".`,
        data: { id: target.id }
      };
    }

    const nextItems = useMoodboardStore.getState().items.map((item) =>
      item.id === target.id ? { ...item, ...updates } : item
    );
    useMoodboardStore.getState().saveToHistory(nextItems);
    toast.success(`Updated "${target.title || target.id}"`);
    return {
      toolName: 'update_moodboard_item',
      description: `Updated "${target.title || target.id}" (${changed.join(', ')})`,
      data: { id: target.id, ...updates }
    };
  }

  // 8. Category pills
  if (call.name === 'set_moodboard_item_categories') {
    const [target] = resolveItems([args.item]);
    if (!target) return null;
    const categories = Array.isArray(args.categories) ? args.categories.map((c: any) => String(c)) : [];
    useMoodboardStore.getState().setItemCategories(target.id, categories);
    toast.success(`Set ${categories.length} category label(s)`);
    return {
      toolName: 'set_moodboard_item_categories',
      description: `Set categories [${categories.join(', ')}] on "${target.title || target.id}"`,
      data: { id: target.id, categories }
    };
  }

  // 9. Category filter
  if (call.name === 'filter_moodboard_by_category') {
    const category = args.category ? String(args.category) : null;
    useMoodboardStore.getState().setActiveCategoryFilter(category);
    return {
      toolName: 'filter_moodboard_by_category',
      description: category ? `Filtered the canvas to "${category}"` : 'Cleared the category filter',
      data: { category }
    };
  }

  // 10. Comment pins
  if (call.name === 'manage_moodboard_comments') {
    const action = args.action;
    const store_ = useMoodboardStore.getState();

    if (action === 'add') {
      const [target] = resolveItems([args.item]);
      const text = args.text ? String(args.text) : '';
      if (!text) return null;
      const pin = {
        x: Number(args.x) || (target ? target.x + (target.width || 100) / 2 : 0),
        y: Number(args.y) || (target ? target.y + (target.height || 100) / 2 : 0),
        text,
        author: 'Nova AI'
      };
      const id = target
        ? store_.addCommentPin({ ...pin, targetItemId: target.id })
        : store_.addCommentPin(pin);
      toast.success('Added comment pin');
      return {
        toolName: 'manage_moodboard_comments',
        description: `Added a comment pin${target ? ` on "${target.title || target.id}"` : ''}: "${text}"`,
        data: { commentId: id }
      };
    }

    if (!args.commentId) return null;
    const commentId = String(args.commentId);

    if (action === 'resolve') {
      store_.resolveCommentPin(commentId);
      toast.success('Toggled comment resolved');
      return {
        toolName: 'manage_moodboard_comments',
        description: `Toggled resolved state on comment ${commentId}`,
        data: { commentId }
      };
    }

    if (action === 'reply') {
      const text = args.text ? String(args.text) : '';
      if (!text) return null;
      store_.addCommentReply(commentId, text, 'Nova AI');
      toast.success('Replied to comment');
      return {
        toolName: 'manage_moodboard_comments',
        description: `Replied to comment ${commentId}: "${text}"`,
        data: { commentId }
      };
    }

    if (action === 'delete') {
      store_.deleteCommentPin(commentId);
      toast.success('Deleted comment pin');
      return {
        toolName: 'manage_moodboard_comments',
        description: `Deleted comment ${commentId}`,
        data: { commentId }
      };
    }

    return null;
  }

  // 11. Grid configuration
  if (call.name === 'configure_moodboard_grid') {
    const config: Record<string, any> = {};
    if (args.type && ['dot', 'line', 'none'].includes(args.type)) config.type = args.type;
    if (args.size !== undefined) config.size = Number(args.size);
    if (args.opacity !== undefined) config.opacity = Number(args.opacity);
    if (args.snapToGrid !== undefined) config.snapToGrid = Boolean(args.snapToGrid);
    if (Object.keys(config).length === 0) return null;
    useMoodboardStore.getState().setGridConfig(config);
    toast.success('Updated canvas grid');
    return {
      toolName: 'configure_moodboard_grid',
      description: `Updated canvas grid (${Object.keys(config).join(', ')})`,
      data: config
    };
  }

  // 12. Viewport
  if (call.name === 'control_moodboard_view') {
    const action = args.action;
    const current = useMoodboardStore.getState().view;

    if (action === 'zoomIn') {
      useMoodboardStore.getState().setView({ ...current, zoom: Math.min(current.zoom * 1.2, 5) });
      return { toolName: 'control_moodboard_view', description: 'Zoomed in', data: {} };
    }
    if (action === 'zoomOut') {
      useMoodboardStore.getState().setView({ ...current, zoom: Math.max(current.zoom / 1.2, 0.1) });
      return { toolName: 'control_moodboard_view', description: 'Zoomed out', data: {} };
    }
    if (action === 'reset') {
      useMoodboardStore.getState().setView({ zoom: 1, pan: { x: -4500, y: -4500 } });
      return { toolName: 'control_moodboard_view', description: 'Reset the viewport to 100%', data: {} };
    }
    if (action === 'center') {
      const items = useMoodboardStore.getState().items;
      if (items.length === 0) {
        return {
          toolName: 'control_moodboard_view',
          description: 'Canvas is empty — nothing to center on.',
          data: {}
        };
      }
      const minX = Math.min(...items.map((i) => i.x));
      const maxX = Math.max(...items.map((i) => i.x + (i.width || 100)));
      const minY = Math.min(...items.map((i) => i.y));
      const maxY = Math.max(...items.map((i) => i.y + (i.height || 100)));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      // Same viewport assumption the canvas context helper uses.
      const viewportW = typeof window !== 'undefined' ? Math.max(window.innerWidth - 320, 800) : 1200;
      const viewportH = typeof window !== 'undefined' ? Math.max(window.innerHeight - 80, 600) : 800;
      const zoom = Math.min(
        Math.max(Math.min(viewportW / Math.max(maxX - minX, 1), viewportH / Math.max(maxY - minY, 1)) * 0.9, 0.1),
        2
      );
      useMoodboardStore.getState().setView({
        zoom,
        pan: { x: Math.round(viewportW / 2 - cx * zoom), y: Math.round(viewportH / 2 - cy * zoom) }
      });
      return {
        toolName: 'control_moodboard_view',
        description: `Centered the viewport on ${items.length} card(s)`,
        data: { zoom }
      };
    }
    return null;
  }

  // 13. Palette extraction
  // The store action is async because it samples the image, but the dispatcher
  // calls handlers synchronously and pushes any truthy return straight into the
  // results array. Returning the promise would therefore register as a result
  // object. Start the work and report it as started instead.
  if (call.name === 'extract_moodboard_palette') {
    const [target] = resolveItems([args.item]);
    if (!target) return null;
    useMoodboardStore
      .getState()
      .extractImagePalette(target.id)
      .then((palette) => {
        toast.success(`Extracted ${palette.length} colours`);
      })
      .catch(() => {
        toast.error('Palette extraction failed');
      });
    return {
      toolName: 'extract_moodboard_palette',
      description: `Extracting a colour palette from "${target.title || target.id}"...`,
      data: { id: target.id }
    };
  }

  // 14. Crop & mask
  if (call.name === 'crop_moodboard_item') {
    const [target] = resolveItems([args.item]);
    if (!target) return null;
    const mask: Record<string, any> = {};
    if (args.mode && ['crop', 'mask'].includes(args.mode)) mask.mode = args.mode;
    if (args.maskShape) mask.maskShape = args.maskShape;
    if (args.zoom !== undefined) mask.zoom = Number(args.zoom);
    if (Object.keys(mask).length === 0) return null;
    useMoodboardStore.getState().updateCropMask(target.id, mask);
    toast.success('Updated crop & mask');
    return {
      toolName: 'crop_moodboard_item',
      description: `Updated crop/mask on "${target.title || target.id}" (${Object.keys(mask).join(', ')})`,
      data: { id: target.id, ...mask }
    };
  }

  // 15. Section frame
  if (call.name === 'create_moodboard_section') {
    if (args.width === undefined || args.height === undefined) return null;
    const bounds = {
      x: Number(args.x) || 0,
      y: Number(args.y) || 0,
      width: Number(args.width),
      height: Number(args.height)
    };
    const frameId = useMoodboardStore
      .getState()
      .createSectionFrame(bounds, args.title ? String(args.title) : undefined, args.color ? String(args.color) : undefined);
    toast.success('Created section frame');
    return {
      toolName: 'create_moodboard_section',
      description: `Created section frame "${args.title || 'Section Frame'}" (${bounds.width}x${bounds.height})`,
      data: { id: frameId, bounds }
    };
  }

  // 16-17. History
  if (call.name === 'undo_moodboard') {
    useMoodboardStore.getState().undo();
    return { toolName: 'undo_moodboard', description: 'Undid the last canvas change', data: {} };
  }
  if (call.name === 'redo_moodboard') {
    useMoodboardStore.getState().redo();
    return { toolName: 'redo_moodboard', description: 'Redid the last canvas change', data: {} };
  }

  return null;
}
