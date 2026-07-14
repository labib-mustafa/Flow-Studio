import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TextCursorInput, Check, Info, AlertTriangle, Eye } from 'lucide-react';
import { ColorPicker } from '../../../BlockEditor/ColorPicker/ColorPicker';
import { createHighlightColor, getReadableTextColor, ensureContrast, rgbToHexStr, getLuminance } from '../../../../utils/colorUtils';

interface NotesPageProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes') => void;
  onFullScreenToggle?: (isFullScreen: boolean) => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: string;
  time: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({ onTabChange, onFullScreenToggle }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isNotesListOpen, setIsNotesListOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isInsideTable, setIsInsideTable] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (showImageModal) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showImageModal]);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageMenuPos, setImageMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [linkPrompt, setLinkPrompt] = useState<{ isOpen: boolean; range: Range | null, url: string }>({ isOpen: false, range: null, url: 'https://' });
  const [imagePrompt, setImagePrompt] = useState<{ isOpen: boolean; range: Range | null, url: string }>({ isOpen: false, range: null, url: '' });

  // Track previous states to restore after exiting full screen
  const [expandedSidebars, setExpandedSidebars] = useState<string[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes-list');
    const lastActiveId = localStorage.getItem('active-note-id');

    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      if (lastActiveId && parsedNotes.find((n: Note) => n.id === lastActiveId)) {
        setActiveNoteId(lastActiveId);
      } else if (parsedNotes.length > 0) {
        setActiveNoteId(parsedNotes[0].id);
      }
    } else {
      // Default notes
      const defaultNotes: Note[] = [
        {
          id: '1',
          title: 'Discovery Phase Notes',
          content: `
            <h2 class="text-xl font-bold text-slate-900">1. Key Competitors</h2>
            <p>We've identified three main competitors in the architectural space that Apex needs to differentiate from. The focus is on sustainable urban planning.</p>
            <ul class="list-disc pl-5 space-y-2 marker:text-slate-400">
              <li><strong>UrbanForm:</strong> Known for high-density residential projects.</li>
              <li><strong>EcoBuild:</strong> Strong emphasis on green materials, but their branding feels dated.</li>
              <li><strong>Structura:</strong> Direct competitor in commercial sector.</li>
            </ul>
            <h2 class="text-xl font-bold text-slate-900 mt-8">2. Next Steps</h2>
            <p>Based on the initial stakeholder interviews, we need to prioritize the moodboard creation. Sarah mentioned she prefers minimalist aesthetics.</p>
            <div class="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p class="text-sm font-bold text-slate-900 mb-2">Note: Implementation Reference</p>
              <p class="text-xs text-slate-600">Add perfect invert styling to the I-beam text selection cursor icon that appears on text hover in your React 19 + Tailwind Notes editor.</p>
            </div>
          `,
          category: 'Research',
          timestamp: '10:45 AM',
          time: 'Today'
        },
        {
          id: '2',
          title: 'Client Kickoff Meeting',
          content: '<p>Attendees: Sarah (Client), Mark, Julia. Goal: Align on creative direction and project timeline...</p>',
          category: 'Meeting',
          timestamp: 'Oct 15',
          time: 'Oct 15'
        },
        {
          id: '3',
          title: 'Initial Feedback - Oct 12',
          content: '<p>Summary of the first draft review. Positive feedback on typography, concerns about the logo mark being too complex...</p>',
          category: 'Feedback',
          timestamp: 'Oct 12',
          time: 'Oct 12'
        }
      ];
      setNotes(defaultNotes);
      setActiveNoteId('1');
      localStorage.setItem('notes-list', JSON.stringify(defaultNotes));
    }
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId);

  useEffect(() => {
    if (activeNote && editorRef.current && titleRef.current) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content;
      }
      if (titleRef.current.innerText !== activeNote.title) {
        titleRef.current.innerText = activeNote.title;
      }
    }
  }, [activeNoteId]);

  const saveContent = () => {
    if (!activeNoteId) return;

    const now = new Date();
    const currentTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedNotes = notes.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: titleRef.current?.innerText || n.title,
          content: editorRef.current?.innerHTML || n.content,
          timestamp: currentTimestamp,
          time: 'Today'
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    localStorage.setItem('notes-list', JSON.stringify(updatedNotes));
    localStorage.setItem('active-note-id', activeNoteId);
  };

  const addNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '<p>Start writing...</p>',
      category: 'General',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      time: 'Today'
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    localStorage.setItem('notes-list', JSON.stringify(updatedNotes));
    localStorage.setItem('active-note-id', newNote.id);
  };

  const selectNote = (id: string) => {
    saveContent(); // Save current before switching
    setActiveNoteId(id);
    localStorage.setItem('active-note-id', id);
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('notes-list', JSON.stringify(updatedNotes));

    if (activeNoteId === id) {
      if (updatedNotes.length > 0) {
        setActiveNoteId(updatedNotes[0].id);
        localStorage.setItem('active-note-id', updatedNotes[0].id);
      } else {
        setActiveNoteId(null);
        localStorage.removeItem('active-note-id');
      }
    }
  };

  const toggleFullScreen = () => {
    const nextFullScreen = !isFullScreen;

    if (nextFullScreen) {
      // Entering full screen: record currently expanded sidebars
      const currentlyExpanded = [];
      if (isNotesListOpen) currentlyExpanded.push('notesList');
      if (isCommentsOpen) currentlyExpanded.push('comments');
      setExpandedSidebars(currentlyExpanded);

      // Collapse all sidebars in the notes page
      setIsNotesListOpen(false);
      setIsCommentsOpen(false);
    } else {
      // Exiting full screen: restore previously expanded sidebars
      setIsNotesListOpen(expandedSidebars.includes('notesList'));
      setIsCommentsOpen(expandedSidebars.includes('comments'));
      setExpandedSidebars([]);
    }

    setIsFullScreen(nextFullScreen);
    if (onFullScreenToggle) onFullScreenToggle(nextFullScreen);
  };

  const [activeColorPicker, setActiveColorPicker] = useState<'text' | 'highlight' | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<'align' | 'list' | null>(null);

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
  ];

  const pastelColors = [
    '#FFEBEE', '#FCE4EC', '#F3E5F5', '#EDE7F6', '#E8EAF6', '#E3F2FD', '#E1F5FE', '#E0F7FA',
    '#E0F2F1', '#E8F5E9', '#F1F8E9', '#F9FBE7', '#FFFDE7', '#FFF8E1', '#FFF3E0', '#FBE9E7',
    '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2',
    '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC'
  ];

  const [commandStates, setCommandStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    foreColor: '#000000',
    hiliteColor: 'transparent',
  });

  const normalizeColor = (color: any) => {
    if (!color) return null;
    if (typeof color === 'number') {
      const b = (color & 0xFF).toString(16).padStart(2, '0');
      const g = ((color >> 8) & 0xFF).toString(16).padStart(2, '0');
      const r = ((color >> 16) & 0xFF).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return color;
  };

  const updateCommandStates = () => {
    const getSelectionStyle = (command: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);

      let startValue = normalizeColor(document.queryCommandValue(command));
      // For highlight, also try backColor as it's more standard in some browsers
      if (command === 'hiliteColor' && (!startValue || startValue === 'transparent' || startValue === 'rgba(0, 0, 0, 0)')) {
        startValue = normalizeColor(document.queryCommandValue('backColor'));
      }

      // If collapsed or queryCommandValue failed, try computed style
      if (range.collapsed && (!startValue || startValue === 'transparent' || startValue === 'rgba(0, 0, 0, 0)' || startValue === 'rgb(0, 0, 0)')) {
        let node: Node | null = range.startContainer;

        // If the cursor is between nodes, try to get the node before the cursor
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (range.startOffset > 0) {
            node = node.childNodes[range.startOffset - 1];
          } else if (range.startOffset < node.childNodes.length) {
            node = node.childNodes[range.startOffset];
          }
        }

        if (node && node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }

        if (node instanceof HTMLElement) {
          let current: HTMLElement | null = node;
          let foundColor = 'transparent';

          if (command === 'hiliteColor') {
            // Background color is not inherited, so we must traverse up
            while (current && current !== editorRef.current) {
              const style = window.getComputedStyle(current);
              if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
                foundColor = style.backgroundColor;
                break;
              }
              current = current.parentElement;
            }
          } else {
            // Text color is inherited, so computed style on the immediate parent is sufficient
            const style = window.getComputedStyle(current);
            foundColor = style.color;
          }

          if (foundColor && foundColor !== 'rgba(0, 0, 0, 0)' && foundColor !== 'transparent') {
            const hex = rgbToHexStr(foundColor);
            if (hex) startValue = hex;
          }
        }
      }

      if (range.collapsed) return startValue;

      // Basic mixed state detection for non-collapsed selections
      const fragment = range.cloneContents();
      const container = document.createElement('div');
      container.appendChild(fragment);

      const elements = container.querySelectorAll('*');
      let isMixed = false;
      let firstFoundValue = startValue;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const styleValue = command === 'foreColor' ? el.style.color : el.style.backgroundColor;
        if (styleValue) {
          const normalized = normalizeColor(styleValue);
          if (normalized && firstFoundValue && normalized !== firstFoundValue) {
            isMixed = true;
            break;
          }
          if (!firstFoundValue) firstFoundValue = normalized;
        }
      }

      return isMixed ? 'mixed' : firstFoundValue;
    };

    setCommandStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      foreColor: getSelectionStyle('foreColor') || '#000000',
      hiliteColor: getSelectionStyle('hiliteColor') || 'transparent',
    });
    checkTableContext();
    updateCaretColor();
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
        updateCommandStates();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const updateCaretColor = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;

    // If node is a text node, get its parent element
    if (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    if (node instanceof HTMLElement) {
      // Find the first parent with a background color
      let current: HTMLElement | null = node;
      let foundBg = 'transparent';

      while (current) {
        const style = window.getComputedStyle(current);
        foundBg = style.backgroundColor;

        // If we found a non-transparent background, stop
        if (foundBg && foundBg !== 'rgba(0, 0, 0, 0)' && foundBg !== 'transparent') {
          break;
        }

        // Don't go outside the editor
        if (current === editorRef.current) {
          foundBg = '#FFFFFF'; // Default editor background
          break;
        }
        current = current.parentElement;
      }

      const hexBg = rgbToHexStr(foundBg) || '#FFFFFF';
      const caretColor = getReadableTextColor(hexBg);

      if (editorRef.current.style.caretColor !== caretColor) {
        editorRef.current.style.caretColor = caretColor;
      }
    }
  };

  const checkTableContext = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && (node.nodeName === 'TABLE' || (node as HTMLElement).closest?.('table'))) {
          setIsInsideTable(true);
          return;
        }
        node = node?.parentNode || null;
      }
    }
    setIsInsideTable(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const html = e.clipboardData.getData('text/html');
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Check if text is a URL
      try {
        const url = new URL(text);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          e.preventDefault();
          document.execCommand('createLink', false, text);
          saveContent();
          return;
        }
      } catch (_) {
        // Not a URL
      }
    }

    if (html) {
      e.preventDefault();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Fix contrast for all elements in the pasted HTML
      const elements = doc.querySelectorAll('*');
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        const bgColor = style.backgroundColor;
        const textColor = style.color;

        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const hexBg = rgbToHexStr(bgColor);
          const hexText = rgbToHexStr(textColor);
          if (hexBg && hexText) {
            htmlEl.style.color = ensureContrast(hexText, hexBg);
          }
        }
      });

      document.execCommand('insertHTML', false, doc.body.innerHTML);
    }

    saveContent();
    updateCommandStates();
  };

  const insertTable = () => {
    const rows = 3;
    const cols = 3;
    let tableHtml = '<table class="border-collapse border border-slate-300 w-full my-4"><tbody>';
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td class="border border-slate-300 p-2 min-w-[50px]">Cell</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';
    execCommand('insertHTML', tableHtml);
  };

  const addRow = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && node.nodeName === 'TR') {
          const tr = node as HTMLTableRowElement;
          const table = tr.closest('table');
          if (table) {
            const newRow = table.insertRow(tr.rowIndex + 1);
            for (let i = 0; i < tr.cells.length; i++) {
              const cell = newRow.insertCell();
              cell.className = "border border-slate-300 p-2 min-w-[50px]";
              cell.innerHTML = "New Cell";
            }
            saveContent();
          }
          return;
        }
        node = node?.parentNode || null;
      }
    }
  };

  const addColumn = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
          const cell = node as HTMLTableCellElement;
          const table = cell.closest('table');
          if (table) {
            const colIndex = cell.cellIndex;
            for (let i = 0; i < table.rows.length; i++) {
              const newCell = table.rows[i].insertCell(colIndex + 1);
              newCell.className = "border border-slate-300 p-2 min-w-[50px]";
              newCell.innerHTML = "New Cell";
            }
            saveContent();
          }
          return;
        }
        node = node?.parentNode || null;
      }
    }
  };

  const deleteRow = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && node.nodeName === 'TR') {
          const tr = node as HTMLTableRowElement;
          const table = tr.closest('table');
          if (table) {
            if (table.rows.length > 1) {
              table.deleteRow(tr.rowIndex);
            } else {
              table.remove();
            }
            saveContent();
          }
          return;
        }
        node = node?.parentNode || null;
      }
    }
  };

  const deleteColumn = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
          const cell = node as HTMLTableCellElement;
          const table = cell.closest('table');
          if (table) {
            const colIndex = cell.cellIndex;
            if (table.rows[0].cells.length > 1) {
              for (let i = 0; i < table.rows.length; i++) {
                table.rows[i].deleteCell(colIndex);
              }
            } else {
              table.remove();
            }
            saveContent();
          }
          return;
        }
        node = node?.parentNode || null;
      }
    }
  };

  const deleteTable = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node && (node.nodeName === 'TABLE' || (node as HTMLElement).closest?.('table'))) {
          const table = node.nodeName === 'TABLE' ? node as HTMLTableElement : (node as HTMLElement).closest('table');
          table?.remove();
          saveContent();
          setIsInsideTable(false);
          return;
        }
        node = node?.parentNode || null;
      }
    }
  };
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      const rect = img.getBoundingClientRect();
      setImageMenuPos({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + (rect.width / 2) - 100
      });
    } else {
      setSelectedImage(null);
      setImageMenuPos(null);
    }
    checkTableContext();
  };

  const updateImageStyle = (style: { width?: string, float?: string, display?: string, margin?: string }) => {
    if (selectedImage) {
      if (style.width) selectedImage.style.width = style.width;
      if (style.float) {
        selectedImage.style.float = style.float;
        selectedImage.style.display = style.float === 'none' ? 'block' : 'inline';
        selectedImage.style.margin = style.float === 'none' ? '1rem auto' : '1rem';
      }
      saveContent();
    }
  };

  const deleteImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      setImageMenuPos(null);
      saveContent();
    }
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        execCommand('insertImage', base64);
        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    updateCommandStates();
    saveContent();
  };

  const handleImageUpload = () => {
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      let isInsideEditor = false;
      while (node) {
        if (node === editorRef.current) {
          isInsideEditor = true;
          break;
        }
        node = node.parentNode;
      }

      if (isInsideEditor) {
        range = selection.getRangeAt(0).cloneRange();
      }
    }

    setImagePrompt({ isOpen: true, range, url: '' });
  };

  const submitImage = () => {
    const { url, range } = imagePrompt;
    if (url) {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      const selection = window.getSelection();
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand('insertImage', false, url);
      updateCommandStates();
      saveContent();
    }
    setImagePrompt({ isOpen: false, range: null, url: '' });
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      alert('Please place the cursor inside the editor to create a link.');
      return;
    }

    let node = selection.anchorNode;
    let isInsideEditor = false;
    while (node) {
      if (node === editorRef.current) {
        isInsideEditor = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isInsideEditor) {
      alert('Please place the cursor inside the editor to create a link.');
      return;
    }

    // Save selection range before prompt
    const range = selection.getRangeAt(0).cloneRange();

    setLinkPrompt({ isOpen: true, range, url: 'https://' });
  };

  const submitLink = () => {
    const { url, range } = linkPrompt;
    if (url && url !== 'https://') {
      if (editorRef.current) {
        editorRef.current.focus();
      }

      const selection = window.getSelection();
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Ensure URL has protocol
      const formattedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;

      if (range && range.collapsed) {
        // If no text was selected, insert the URL as text
        document.execCommand('insertHTML', false, `<a href="${formattedUrl}">${formattedUrl}</a>`);
      } else {
        document.execCommand('createLink', false, formattedUrl);
      }

      updateCommandStates();
      saveContent();
    }
    setLinkPrompt({ isOpen: false, range: null, url: 'https://' });
  };

  const handleHighlightSelect = (color: { bg: string; text: string } | null) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (color === null) {
      // Reset both highlight and text color to default
      document.execCommand('hiliteColor', false, 'transparent');
      document.execCommand('foreColor', false, '#000000');
    } else {
      // Apply background color
      document.execCommand('hiliteColor', false, color.bg);
      // Apply smart text color to ensure contrast
      document.execCommand('foreColor', false, color.text);
    }

    updateCommandStates();
    saveContent();
    setActiveColorPicker(null);
  };

  const handleColorSelect = (color: string | null) => {
    if (activeColorPicker === 'text') {
      if (color === null) {
        execCommand('foreColor', '#000000');
      } else {
        // Check if there's a highlight at the current position to ensure contrast
        const currentBg = normalizeColor(document.queryCommandValue('hiliteColor'));
        let finalColor = color;
        if (currentBg && currentBg !== 'transparent' && currentBg !== 'rgba(0, 0, 0, 0)') {
          finalColor = ensureContrast(color, currentBg);
        }
        execCommand('foreColor', finalColor);
      }
    }
    setActiveColorPicker(null);
  };

  // Close color picker and dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeColorPicker && !(e.target as HTMLElement).closest('.color-picker-container')) {
        setActiveColorPicker(null);
      }
      if (activeDropdown && !(e.target as HTMLElement).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeColorPicker, activeDropdown]);

  const [isHoveringEditor, setIsHoveringEditor] = useState(false);

  return (
    <div id="notes-page-container" className="flex-1 flex flex-col h-full">
      {/* Notes Workspace */}
      <div id="notes-workspace" className="flex-1 flex overflow-hidden bg-white shadow-sm min-h-[600px]">
        {/* Notes List */}
        <div id="notes-sidebar-list" className={`border-r border-slate-200 flex flex-col h-full bg-slate-50/50 shrink-0 transition-all duration-300 relative ${isNotesListOpen ? 'w-72' : 'w-12'}`}>
          {/* Toggle Button for Notes List */}
          <button
            onClick={() => setIsNotesListOpen(!isNotesListOpen)}
            className={`absolute top-1/2 -translate-y-1/2 -right-3 z-[99999] flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-all duration-300 ${!isNotesListOpen ? 'rotate-180' : ''}`}
            title={isNotesListOpen ? "Collapse List" : "Expand List"}
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          <div id="notes-search-add" className={`p-4 space-y-3 border-b border-slate-100 bg-white min-w-[288px] transition-opacity duration-300 ${!isNotesListOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-base">search</span>
              </span>
              <input id="notes-search-input" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="Search notes..." type="text" />
            </div>
            <button
              id="add-new-note-button"
              onClick={addNewNote}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base font-bold">add</span>
              New Note
            </button>
          </div>

          <div id="notes-list-items" className={`flex-1 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${!isNotesListOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-slate-400">note_add</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">No notes yet</p>
                <p className="text-xs text-slate-500">Create your first note to get started.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note.id)}
                  className={`p-4 cursor-pointer border-b border-slate-100 transition-colors border-l-4 relative group ${activeNoteId === note.id ? 'border-primary bg-slate-100' : 'bg-white border-transparent hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className={`text-sm font-bold truncate pr-10 ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-700'}`}>
                      {note.title.trim() || 'Untitled Note'}
                    </h5>
                    <span className="text-[10px] text-slate-400 shrink-0">{note.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pr-10">
                    {note.content.replace(/<[^>]*>/g, '').trim() || 'No content...'}
                  </p>

                  <button
                    onClick={(e) => deleteNote(e, note.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete Note"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Collapsed State Icons */}
          {!isNotesListOpen && (
            <div className="absolute inset-0 flex flex-col items-center pt-6 gap-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setIsNotesListOpen(true)}>
              <span className="material-symbols-outlined text-slate-400">search</span>
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <div className="w-6 h-px bg-slate-200"></div>
              <span className="material-symbols-outlined text-slate-400">description</span>
              <span className="material-symbols-outlined text-slate-400">description</span>
              <span className="material-symbols-outlined text-slate-400">description</span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div
          id="notes-editor-area"
          className="flex-1 flex flex-col h-full bg-white relative min-w-0 overflow-visible group"
        >
          {!activeNoteId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-300 text-4xl">edit_note</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No note selected</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">Select a note from the sidebar or create a new one to start writing.</p>
              <button
                onClick={addNewNote}
                className="flex items-center gap-2 py-2.5 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg active:scale-95 mx-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Create New Note
              </button>
            </div>
          ) : (
            <>
              <div id="notes-editor-toolbar" className="min-h-[53px] py-2 border-b border-slate-200 flex items-center justify-start px-2 sm:px-4 shrink-0 bg-white sticky top-0 z-40 overflow-visible flex-wrap gap-1 notes-toolbar-compact">
                {/* Prompts */}
                <AnimatePresence>
                  {linkPrompt.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[60px] left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-lg p-3 flex items-center gap-2 z-50"
                    >
                      <span className="text-sm font-medium text-slate-700">Link URL:</span>
                      <input
                        type="text"
                        value={linkPrompt.url}
                        onChange={(e) => setLinkPrompt(prev => ({ ...prev, url: e.target.value }))}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            submitLink();
                          } else if (e.key === 'Escape') {
                            setLinkPrompt({ isOpen: false, range: null, url: 'https://' });
                          }
                        }}
                      />
                      <button
                        onClick={submitLink}
                        className="bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-hover transition-colors font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setLinkPrompt({ isOpen: false, range: null, url: 'https://' })}
                        className="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded text-sm transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                  {imagePrompt.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[60px] left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-lg p-3 flex items-center gap-2 z-50"
                    >
                      <span className="text-sm font-medium text-slate-700">Image URL:</span>
                      <input
                        type="text"
                        value={imagePrompt.url}
                        onChange={(e) => setImagePrompt(prev => ({ ...prev, url: e.target.value }))}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            submitImage();
                          } else if (e.key === 'Escape') {
                            setImagePrompt({ isOpen: false, range: null, url: '' });
                          }
                        }}
                      />
                      <button
                        onClick={submitImage}
                        className="bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-hover transition-colors font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setImagePrompt({ isOpen: false, range: null, url: '' })}
                        className="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded text-sm transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('undo')}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                  title="Undo"
                >
                  <span className="material-symbols-outlined text-[16px]">undo</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('redo')}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                  title="Redo"
                >
                  <span className="material-symbols-outlined text-[16px]">redo</span>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {isInsideTable ? (
                  <>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={addRow}
                      className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                      title="Add Row"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_row</span>
                      <span className="text-[10px] font-bold">+ROW</span>
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={deleteRow}
                      className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                      title="Delete Row"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span className="text-[10px] font-bold">-ROW</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={addColumn}
                      className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                      title="Add Column"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_column</span>
                      <span className="text-[10px] font-bold">+COL</span>
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={deleteColumn}
                      className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                      title="Delete Column"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span className="text-[10px] font-bold">-COL</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={deleteTable}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                      title="Delete Table"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                      <span className="text-[10px] font-bold">TABLE</span>
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      onChange={(e) => execCommand('formatBlock', e.target.value)}
                      className="text-xs font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer w-20 outline-none"
                    >
                      <option value="p">Normal text</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>
                    <div className="h-4 w-px bg-slate-300 mx-1"></div>
                    <select
                      onChange={(e) => execCommand('fontName', e.target.value)}
                      className="text-xs font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer w-16 outline-none"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Courier New, monospace">Courier</option>
                    </select>
                  </>
                )}
                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                <select
                  onChange={(e) => execCommand('fontSize', e.target.value)}
                  defaultValue="3"
                  className="text-xs font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer w-12 outline-none"
                >
                  <option value="1">10px</option>
                  <option value="2">13px</option>
                  <option value="3">16px</option>
                  <option value="4">18px</option>
                  <option value="5">24px</option>
                  <option value="6">32px</option>
                  <option value="7">48px</option>
                </select>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('bold')}
                  className={`p-1 rounded font-bold transition-colors w-6 h-6 flex items-center justify-center ${commandStates.bold ? 'bg-slate-200 text-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('italic')}
                  className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center border ${commandStates.italic ? 'bg-slate-200 text-primary border-primary' : 'text-slate-700 hover:bg-slate-100 border-slate-200'}`}
                  title="Italic"
                >
                  <span className="material-symbols-outlined text-[16px]">format_italic</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('underline')}
                  className={`p-1 rounded underline transition-colors w-6 h-6 flex items-center justify-center ${commandStates.underline ? 'bg-slate-200 text-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                  title="Underline"
                >
                  U
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                <div className="relative color-picker-container overflow-visible">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveColorPicker(activeColorPicker === 'text' ? null : 'text')}
                    className={`relative p-1 rounded transition-all duration-200 w-7 h-7 flex items-center justify-center ${activeColorPicker === 'text' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                    title={`Text Color${commandStates.foreColor && commandStates.foreColor !== 'mixed' ? ': ' + commandStates.foreColor : ''}`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px] text-slate-700"
                      style={{ clipPath: 'inset(0px 0px 4px 0px)' }}
                    >
                      format_color_text
                    </span>
                    <div
                      className="absolute bottom-[6px] w-[16px] h-[3px] transition-all duration-200"
                      style={{
                        backgroundColor: commandStates.foreColor === 'mixed' ? 'transparent' : commandStates.foreColor,
                        backgroundImage: commandStates.foreColor === 'mixed' ? 'linear-gradient(to right, #ff0000, #00ff00, #0000ff)' : 'none',
                        border: commandStates.foreColor !== 'mixed' && getLuminance(commandStates.foreColor) > 0.85 ? '1px solid #000000' : 'none'
                      }}
                    ></div>
                  </button>
                  <AnimatePresence>
                    {activeColorPicker === 'text' && (
                      <ColorPicker
                        onSelect={(color) => handleColorSelect(color ? color.bg : null)}
                        onClose={() => setActiveColorPicker(null)}
                        activeColor={commandStates.foreColor}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative color-picker-container overflow-visible">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveColorPicker(activeColorPicker === 'highlight' ? null : 'highlight')}
                    className={`relative p-1 rounded transition-all duration-200 w-7 h-7 flex items-center justify-center ${activeColorPicker === 'highlight' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                    title={`Highlight Color${commandStates.hiliteColor && commandStates.hiliteColor !== 'mixed' && commandStates.hiliteColor !== 'transparent' ? ': ' + commandStates.hiliteColor : ''}`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px] text-slate-700"
                      style={{ clipPath: 'inset(0px 0px 4px 0px)' }}
                    >
                      format_ink_highlighter
                    </span>
                    <div
                      className="absolute bottom-[6px] w-[16px] h-[3px] transition-all duration-200"
                      style={{
                        backgroundColor: commandStates.hiliteColor === 'mixed'
                          ? 'transparent'
                          : (commandStates.hiliteColor === 'transparent' || commandStates.hiliteColor === 'rgba(0, 0, 0, 0)' ? '#000000' : commandStates.hiliteColor),
                        backgroundImage: commandStates.hiliteColor === 'mixed'
                          ? 'linear-gradient(to right, #ff0000, #00ff00, #0000ff)'
                          : 'none',
                        border: commandStates.hiliteColor !== 'mixed' && commandStates.hiliteColor !== 'transparent' && commandStates.hiliteColor !== 'rgba(0, 0, 0, 0)' && getLuminance(commandStates.hiliteColor) > 0.85
                          ? '1px solid #000000'
                          : 'none'
                      }}
                    ></div>
                  </button>
                  <AnimatePresence>
                    {activeColorPicker === 'highlight' && (
                      <ColorPicker
                        onSelect={handleHighlightSelect}
                        onClose={() => setActiveColorPicker(null)}
                        activeColor={commandStates.hiliteColor}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {/* Independent Alignment Buttons (Large Screens) */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('justifyLeft')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyLeft ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Align Left"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_align_left</span>
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('justifyCenter')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyCenter ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Align Center"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_align_center</span>
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('justifyRight')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyRight ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Align Right"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_align_right</span>
                  </button>
                </div>

                {/* Grouped Alignment Dropdown (Small Screens) */}
                <div className="relative dropdown-container sm:hidden">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveDropdown(activeDropdown === 'align' ? null : 'align')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyCenter || commandStates.justifyRight ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    title="Alignment"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_align_left</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'align' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50 flex flex-col gap-1"
                      >
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { execCommand('justifyLeft'); setActiveDropdown(null); }}
                          className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyLeft ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                          title="Align Left"
                        >
                          <span className="material-symbols-outlined text-[16px]">format_align_left</span>
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { execCommand('justifyCenter'); setActiveDropdown(null); }}
                          className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyCenter ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                          title="Align Center"
                        >
                          <span className="material-symbols-outlined text-[16px]">format_align_center</span>
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { execCommand('justifyRight'); setActiveDropdown(null); }}
                          className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.justifyRight ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                          title="Align Right"
                        >
                          <span className="material-symbols-outlined text-[16px]">format_align_right</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {/* Independent List Buttons (Large Screens) */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('insertUnorderedList')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.insertUnorderedList ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Bullet List"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('insertOrderedList')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.insertOrderedList ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Numbered List"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
                  </button>
                </div>

                {/* Grouped List Dropdown (Small Screens) */}
                <div className="relative dropdown-container sm:hidden">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveDropdown(activeDropdown === 'list' ? null : 'list')}
                    className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.insertUnorderedList || commandStates.insertOrderedList ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    title="Lists"
                  >
                    <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'list' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50 flex flex-col gap-1"
                      >
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { execCommand('insertUnorderedList'); setActiveDropdown(null); }}
                          className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.insertUnorderedList ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                          title="Bullet List"
                        >
                          <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { execCommand('insertOrderedList'); setActiveDropdown(null); }}
                          className={`p-1 rounded transition-colors w-6 h-6 flex items-center justify-center ${commandStates.insertOrderedList ? 'bg-slate-200 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                          title="Numbered List"
                        >
                          <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleLink}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors w-6 h-6 flex items-center justify-center"
                  title="Insert Link"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowImageModal(true)}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors w-6 h-6 flex items-center justify-center"
                  title="Insert Image"
                >
                  <span className="material-symbols-outlined text-[16px]">image</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertTable}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors w-6 h-6 flex items-center justify-center"
                  title="Insert Table"
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('insertHorizontalRule')}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors w-6 h-6 flex items-center justify-center"
                  title="Horizontal Line"
                >
                  <span className="material-symbols-outlined text-[16px]">horizontal_rule</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand('removeFormat')}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors w-6 h-6 flex items-center justify-center"
                  title="Clear Formatting"
                >
                  <span className="material-symbols-outlined text-[16px]">format_clear</span>
                </button>
                <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
                  <button className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">lock</span> Share
                  </button>
                  <div className="h-4 w-px bg-slate-300 mx-1"></div>
                  <button
                    onClick={toggleFullScreen}
                    className={`p-1 rounded transition-colors ${isFullScreen ? 'text-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    <span className="material-symbols-outlined text-[18px]">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                  </button>
                </div>
              </div>
              <div id="notes-editor-content-wrapper" className="flex flex-1 overflow-hidden relative">
                <div
                  id="notes-editor-content"
                  className="flex-1 overflow-y-auto p-8 md:p-12 w-full bg-white custom-scrollbar outline-none"
                >
                  <header className="mb-8 border-b border-slate-100 pb-6">
                    <h1
                      ref={titleRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 outline-none"
                      onInput={saveContent}
                      onBlur={saveContent}
                    >
                      {activeNote?.title}
                    </h1>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{activeNote?.category}</span>
                      <span>
                        Last edited {activeNote?.time === 'Today' ? `today at ${activeNote?.timestamp}` : activeNote?.time === activeNote?.timestamp ? `on ${activeNote?.timestamp}` : `on ${activeNote?.time} at ${activeNote?.timestamp}`}
                      </span>
                    </div>
                  </header>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="prose prose-slate max-w-none text-slate-700 space-y-6 leading-relaxed pb-20 outline-none min-h-[500px]"
                    onInput={saveContent}
                    onBlur={saveContent}
                    onKeyUp={updateCommandStates}
                    onMouseUp={updateCommandStates}
                    onPaste={handlePaste}
                    onClick={handleEditorClick}
                  >
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comments Sidebar */}
        <aside id="notes-comments-sidebar" className={`bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 h-full relative transition-all duration-300 ${isCommentsOpen ? 'w-80' : 'w-[54px]'}`}>
          {/* Toggle Button for Comments Sidebar */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`absolute top-1/2 -translate-y-1/2 -left-3 z-[99999] flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-all duration-300 ${!isCommentsOpen ? 'rotate-180' : ''}`}
            title={isCommentsOpen ? "Collapse Comments" : "Expand Comments"}
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>

          <div className="py-4 pr-4 pl-2 flex items-center justify-end h-[53px] w-full shrink-0 bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsCommentsOpen(!isCommentsOpen)}>
            <span className="material-symbols-outlined text-lg text-slate-500 ml-auto">comment</span>
          </div>



          {isCommentsOpen && (
            <div className="flex flex-col flex-1 h-full overflow-hidden animate-in fade-in duration-300">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-start gap-3 mb-2">
                    <img alt="Avatar" className="w-7 h-7 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGJiDXQrlF8Uo0-U-iFqhwJHxifeSYcvXJ-U0D--PDPtzE6INzM6BAXWM9qw970o1de023RZwyzJhXqa7xy6blnoio4TCteo8lQ7nf2INIWgCHa0eyGn0_Gpe1iI_dv0fPVzUcjaDzQ6NYFjlP98gLXqet-dF-vU0GKApHImm7FFjdkS1wHJJC7JxqdkOylJAbfLSmLX-j5ArAv4ros-SCy_XXNcz_1ojYHy2JTkOSAk_bSV_iMegkGvkVCAkSRSFkw-EhpCtRYVM" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm text-slate-800">Sarah J.</span>
                        <span className="text-[10px] text-slate-400">10:23 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Can we add more details about their pricing models?</p>
                    </div>
                  </div>
                  <div className="pl-11">
                    <div className="flex items-center gap-2 mt-2 border-t border-slate-50 pt-2">
                      <button className="text-[10px] text-slate-500 font-semibold hover:text-primary">Reply</button>
                      <button className="text-[10px] text-slate-500 font-semibold hover:text-emerald-600">Resolve</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-pink-200 ring-1 ring-pink-100 shadow-sm relative">
                  <div className="flex items-start gap-3 mb-2">
                    <img alt="Avatar" className="w-7 h-7 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlhQoWAjxH5I7j648Tu59hQZAr_BCg74hgw-H5TKajqVPH8LiE9nZl7Bi9m4tR_o-mueNp45DxrnnMM62d63ACj0zT0CIiq2dIxLw7Y1d_AGICtV3fonRYsbLotu44euJak3Q3Yg2gBMq875DlW0br6_ZlVYCV02eOVlLdhp4m7zkeNTa1tmKHZlBKqDCrVKeHh_HfbJ0ydkdJfY1mCffRcfZ4kxWE1i77k3HGlcBlxxdLI2XQZiHbXiaD_rdmKqkodaeqyF2ka0g" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm text-slate-800">Mark K.</span>
                        <span className="text-[10px] text-slate-400">10:45 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Let's expand on this point. I think sustainable urban planning is a major differentiator.</p>
                    </div>
                  </div>
                  <div className="pl-11">
                    <div className="flex items-center gap-2 mt-2 border-t border-slate-50 pt-2">
                      <button className="text-[10px] text-slate-500 font-semibold hover:text-primary">Reply</button>
                      <button className="text-[10px] text-slate-500 font-semibold hover:text-emerald-600">Resolve</button>
                    </div>
                  </div>
                </div>

                <div className="opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 px-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Resolved</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">JM</div>
                      <div>
                        <p className="text-xs text-slate-500 line-through">Check the font size here.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="relative">
                  <input className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400 outline-none" placeholder="Add a comment..." type="text" />
                  <button className="absolute right-2 top-1 text-slate-400 hover:text-primary p-1">
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
      {/* Image Editing Menu */}
      {selectedImage && imageMenuPos && (
        <div
          className="fixed z-[150] bg-white border border-slate-200 rounded-lg shadow-xl p-1 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ top: imageMenuPos.top, left: imageMenuPos.left }}
        >
          <button onClick={() => updateImageStyle({ float: 'left' })} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Align Left">
            <span className="material-symbols-outlined text-[16px]">format_align_left</span>
          </button>
          <button onClick={() => updateImageStyle({ float: 'none' })} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Align Center">
            <span className="material-symbols-outlined text-[16px]">format_align_center</span>
          </button>
          <button onClick={() => updateImageStyle({ float: 'right' })} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Align Right">
            <span className="material-symbols-outlined text-[16px]">format_align_right</span>
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button onClick={() => updateImageStyle({ width: '25%' })} className="px-2 py-1 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600">S</button>
          <button onClick={() => updateImageStyle({ width: '50%' })} className="px-2 py-1 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600">M</button>
          <button onClick={() => updateImageStyle({ width: '75%' })} className="px-2 py-1 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600">L</button>
          <button onClick={() => updateImageStyle({ width: '100%' })} className="px-2 py-1 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600">XL</button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button onClick={deleteImage} className="p-1 hover:bg-red-50 rounded text-red-500" title="Delete Image">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Upload Image</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary">cloud_upload</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 text-center">PNG, JPG, GIF up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or use URL</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const url = (e.target as HTMLInputElement).value;
                        if (url) {
                          execCommand('insertImage', url);
                          setShowImageModal(false);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                      if (input.value) {
                        execCommand('insertImage', input.value);
                        setShowImageModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
