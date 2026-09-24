import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useProjectStore } from '../../../../../stores/projectStore';
import { useMoodboardStore } from '../../../../../stores/moodboardStore';
import { MoodboardItemData, MoodboardItemType } from '../../../../Projects/ProjectDetails/MoodboardPage/MoodboardItem';
import { NAVIGABLE_VIEWS, isNavigableView } from '../agentNavigation';

interface ContentNavContext {
  activeProjId: string;
  setItems: (fn: (prev: any[]) => any[]) => void;
  setAvailableNotesCount: (count: number) => void;
}

const notifyNotesUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowstudio-notes-updated'));
  }
};

export function handleContentNavTools(
  call: AgentToolCall,
  ctx: ContentNavContext
): AgentToolResult | null {
  const { activeProjId, setItems, setAvailableNotesCount } = ctx;

  // 1. Create Project Note
  if (call.name === 'create_project_note') {
    const { title, content } = call.args;
    if (title && content) {
      const noteKey = `notes-list-${activeProjId}`;
      const existing = localStorage.getItem(noteKey);
      let notesArr: any[] = [];
      try {
        if (existing) notesArr = JSON.parse(existing);
      } catch {}
      const newNote = {
        id: `note-${Date.now()}`,
        title,
        content: content.replace(/\n/g, '<br/>'),
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      notesArr.unshift(newNote);
      localStorage.setItem(noteKey, JSON.stringify(notesArr));
      setAvailableNotesCount(notesArr.length);
      notifyNotesUpdated();

      toast.success(`Saved note "${title}" to project!`);
      return {
        toolName: 'create_project_note',
        description: `Created project note "${title}"`,
        data: newNote
      };
    }
  }

  // 2. Update Project Note
  if (call.name === 'update_project_note') {
    const { title, content } = call.args;
    if (title && content) {
      const noteKey = `notes-list-${activeProjId}`;
      const existing = localStorage.getItem(noteKey);
      if (existing) {
        try {
          const notesArr = JSON.parse(existing);
          const target = notesArr.find((n: any) => n.title.toLowerCase().includes(title.toLowerCase()));
          if (target) {
            target.content = content.replace(/\n/g, '<br/>');
            target.timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            localStorage.setItem(noteKey, JSON.stringify(notesArr));
            notifyNotesUpdated();
            toast.success(`Updated note "${target.title}"`);
            return {
              toolName: 'update_project_note',
              description: `Updated project note "${target.title}"`,
              data: target
            };
          }
        } catch {}
      }
    }
  }

  // 3. Delete Project Notes
  if (call.name === 'delete_project_notes') {
    const { deleteAll, noteTitle } = call.args;
    const noteKey = `notes-list-${activeProjId}`;
    const existing = localStorage.getItem(noteKey);
    if (existing) {
      try {
        let notesArr = JSON.parse(existing);
        if (deleteAll) {
          localStorage.setItem(noteKey, JSON.stringify([]));
          setAvailableNotesCount(0);
          notifyNotesUpdated();
          toast.success('Cleared all project notes');
          return {
            toolName: 'delete_project_notes',
            description: `Cleared ${notesArr.length} note(s)`,
            data: notesArr
          };
        } else if (noteTitle) {
          const target = notesArr.find((n: any) => n.title.toLowerCase().includes(noteTitle.toLowerCase()));
          if (target) {
            notesArr = notesArr.filter((n: any) => n.id !== target.id);
            localStorage.setItem(noteKey, JSON.stringify(notesArr));
            setAvailableNotesCount(notesArr.length);
            notifyNotesUpdated();
            toast.success(`Deleted note "${target.title}"`);
            return {
              toolName: 'delete_project_notes',
              description: `Deleted note "${target.title}"`,
              data: target
            };
          }
        }
      } catch {}
    }
  }

  // 4. Add Moodboard Items
  if (call.name === 'add_moodboard_items') {
    const rawItems = call.args.items || [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const timestamp = Date.now();
      const mbState = useMoodboardStore.getState();
      const { zoom = 1, pan = { x: -4500, y: -4500 } } = mbState.view || {};
      const currentItems = mbState.items || [];

      const vpW = typeof window !== 'undefined' ? Math.max(window.innerWidth - 320, 800) : 1200;
      const vpH = typeof window !== 'undefined' ? Math.max(window.innerHeight - 80, 600) : 800;
      const [minX, maxX] = [Math.round((0 - pan.x) / zoom), Math.round((vpW - pan.x) / zoom)];
      const [minY, maxY] = [Math.round((0 - pan.y) / zoom), Math.round((vpH - pan.y) / zoom)];
      const [centerX, centerY] = [Math.round((vpW / 2 - pan.x) / zoom), Math.round((vpH / 2 - pan.y) / zoom)];

      const isInside = (x: number, y: number) => x >= minX - 100 && x <= maxX + 100 && y >= minY - 100 && y <= maxY + 100;
      const count = rawItems.length;
      const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
      const [cardW, cardH, gap] = [240, 180, 20];
      const [gridW, gridH] = [cols * cardW + (cols - 1) * gap, Math.ceil(count / cols) * cardH + (Math.ceil(count / cols) - 1) * gap];

      let [startX, startY] = [Math.round(centerX - gridW / 2), Math.round(centerY - gridH / 2)];
      if (currentItems.some(ci => Math.abs(ci.x - startX) < 180 && Math.abs(ci.y - startY) < 150)) {
        startY = (startY + 210 + gridH > maxY) ? Math.max(minY + 40, startY - 240) : startY + 210;
      }

      const noteColors = ['#fffbeb', '#fef3c7', '#dcfce7', '#fee2e2', '#f1f5f9'];
      const formatted: MoodboardItemData[] = rawItems.map((item: any, i: number) => {
        const rawType = (item.type || '').toLowerCase();
        const itemType: MoodboardItemType = (rawType === 'note' || rawType === 'sticky') ? 'note' : rawType === 'color' ? 'color' : rawType === 'image' ? 'image' : rawType === 'bookmark' ? 'bookmark' : rawType === 'text' ? 'text' : 'note';
        const w = item.width || (itemType === 'color' ? 180 : itemType === 'bookmark' ? 320 : itemType === 'image' ? 300 : 240);
        const h = item.height || (itemType === 'color' ? 180 : itemType === 'bookmark' ? 140 : itemType === 'image' ? 220 : 180);
        let [posX, posY] = [Number(item.x), Number(item.y)];

        if (isNaN(posX) || isNaN(posY) || !isInside(posX, posY)) {
          posX = startX + (i % cols) * (cardW + gap);
          posY = startY + Math.floor(i / cols) * (cardH + gap);
        }

        return {
          id: `ai-${itemType}-${timestamp}-${i}`,
          type: itemType,
          x: Math.round(posX),
          y: Math.round(posY),
          width: w,
          height: h,
          title: item.title || (itemType === 'note' ? 'Note' : itemType === 'color' ? 'Color' : 'Design Inspiration'),
          content: item.content || (itemType === 'color' ? (item.color || '#3b82f6') : ''),
          color: item.color || (itemType === 'color' ? (item.content || '#3b82f6') : itemType === 'note' ? noteColors[i % noteColors.length] : undefined),
          url: item.url || '',
          categories: item.category ? [item.category] : undefined
        };
      });

      const nextItems = [...currentItems, ...formatted];
      mbState.setItems(nextItems);
      mbState.saveToHistory(nextItems);
      mbState.setSelectedIds(formatted.map(f => f.id));
      setItems(() => nextItems);

      toast.success(`Agent added ${formatted.length} items to Moodboard!`);
      return {
        toolName: 'add_moodboard_items',
        description: `Added ${formatted.length} item(s) to Moodboard Canvas`,
        data: formatted
      };
    }
  }

  // 5. Clear Moodboard
  if (call.name === 'clear_moodboard') {
    setItems(() => []);
    toast.success('Cleared moodboard canvas');
    return {
      toolName: 'clear_moodboard',
      description: 'Cleared moodboard canvas',
      data: { cleared: true }
    };
  }

  // 6. Navigate To View
  if (call.name === 'navigate_to') {
    const { view, projectTitle } = call.args;

    // Reject unknown destinations explicitly. Any string used to be dispatched
    // on the event bus, so an unroutable page looked like a successful nav.
    if (!isNavigableView(view)) {
      return {
        toolName: 'navigate_to',
        description: `Cannot navigate to "${view}". Valid destinations are: ${NAVIGABLE_VIEWS.join(', ')}.`,
        data: { view, validViews: NAVIGABLE_VIEWS }
      };
    }

    if (typeof window !== 'undefined') {
      if (projectTitle) {
        const projectStore = useProjectStore.getState();
        const q = String(projectTitle).toLowerCase().trim();
        const found = (projectStore.projects || []).find(
          (p) => (p.name && p.name.toLowerCase().includes(q)) || (p.title && p.title.toLowerCase().includes(q))
        );
        if (found) {
          projectStore.setCurrentProject(found);
        }
      }

      window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view } }));
      toast.info(`Navigated to ${view}`);
      return {
        toolName: 'navigate_to',
        description: `Navigated to ${view} page`,
        data: { view, projectTitle }
      };
    }
  }

  return null;
}

