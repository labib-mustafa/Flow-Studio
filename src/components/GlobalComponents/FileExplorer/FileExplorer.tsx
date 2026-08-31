import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { confirm } from '../../../stores/confirmStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Folder, File as FileIcon, Image as ImageIcon, FileText,
  Video, Plus, Search, ChevronRight, ChevronDown,
  Trash2, Edit2, Download, HardDrive, Monitor, ArrowLeft, ArrowRight, ArrowUp,
  Scissors, Copy, ClipboardPaste, List, LayoutGrid, X,
  ZoomIn, ZoomOut, Upload, Home, Network, Star, RefreshCcw,
  ExternalLink, Info, ArrowUpDown, Check, Pin, PinOff, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyFileState } from '../EmptyFileState';
import { useClipboardStore } from '../../../stores/clipboardStore';

const AsyncThumbnail: React.FC<{ path: string, mode?: string, className?: string, alt?: string }> = ({ path, mode, className, alt }) => {
  const [src, setSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px' });

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let active = true;
    const isDesktop = (window as any).electronAPI?.isDesktop;
    if (isDesktop) {
      (window as any).electronAPI.fs.readFileBase64(path, mode, { thumb: true })
        .then((base64: string) => {
          if (active) setSrc(`data:image/png;base64,${base64}`);
        })
        .catch(() => {
          if (active) setSrc(null);
        });
    } else {
      setSrc(`/api/fs/file?path=${encodeURIComponent(path)}&mode=${mode || ''}&thumb=true`);
    }
    return () => { active = false; };
  }, [path, mode, isVisible]);

  if (!src) return <div ref={imgRef} className={`bg-slate-100 animate-pulse ${className}`} />;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

interface FileExplorerProps {
  initialPath?: string;
  rootPath?: 'GLOBAL' | string;
  onFileSelect?: (path: string) => void;
  onPathChange?: (path: string, folderName: string) => void;
  className?: string;
}

interface FSEntry {
  name: string;
  isDir: boolean;
  size: number;
  freeSpace?: number;
  modifiedAt: string;
}

type ViewMode = 'details' | 'grid';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const AdobeFileDocumentIcon = ({ letter, bgColor, fgColor, borderColor, size = 16 }: { letter: string; bgColor: string; fgColor: string; borderColor?: string; size?: number }) => {
  const w = size;
  const h = Math.round(size * 1.18);
  const fontSize = Math.max(8, Math.floor(size * 0.46));

  return (
    <div
      className="relative shrink-0 flex items-center justify-center select-none inline-flex"
      style={{ width: w, height: h }}
    >
      <svg width={w} height={h} viewBox="0 0 16 19" fill="none" className="shrink-0">
        <path
          d="M2.5 0.5H10.5L15.5 5.5V16.5C15.5 17.6 14.6 18.5 13.5 18.5H2.5C1.4 18.5 0.5 17.6 0.5 16.5V2.5C0.5 1.4 1.4 0.5 2.5 0.5Z"
          fill={bgColor}
          stroke={borderColor || fgColor}
          strokeWidth="0.8"
        />
        <path d="M10.5 0.5V5.5H15.5L10.5 0.5Z" fill="rgba(255,255,255,0.3)" />
      </svg>
      <span
        className="absolute font-extrabold tracking-tighter"
        style={{
          color: fgColor,
          fontSize: fontSize,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          top: '56%',
          left: '50%',
          transform: 'translate(-50%, -45%)',
          lineHeight: 1
        }}
      >
        {letter}
      </span>
    </div>
  );
};

const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'psd': case 'psb': return 'Adobe Photoshop Document';
    case 'ai': case 'ait': case 'eps': return 'Adobe Illustrator Artwork';
    case 'prproj': case 'prel': return 'Adobe Premiere Pro Project';
    case 'aep': case 'aet': case 'aepx': return 'Adobe After Effects Project';
    case 'indd': case 'idml': case 'indt': return 'Adobe InDesign Document';
    case 'xd': return 'Adobe XD Document';
    case 'lrtemplate': case 'xmp': case 'dng': case 'cr2': case 'nef': case 'arw': return 'Adobe Lightroom Photo';
    case 'sesx': return 'Adobe Audition Session';
    case 'fla': case 'swf': return 'Adobe Animate Project';
    case 'sbs': case 'sbsar': return 'Adobe Substance 3D Asset';
    case 'chproj': return 'Character Animator Project';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': return 'Image File';
    case 'mp4': case 'mov': case 'avi': case 'mkv': return 'Video File';
    case 'pdf': return 'PDF Document';
    case 'doc': case 'docx': return 'Word Document';
    case 'txt': return 'Text Document';
    case 'zip': case 'rar': case '7z': return 'Archive File';
    case 'json': return 'JSON File';
    case 'js': case 'jsx': return 'JavaScript File';
    case 'ts': case 'tsx': return 'TypeScript File';
    case 'md': return 'Markdown File';
    default: return ext ? `${ext.toUpperCase()} File` : 'File';
  }
};

// Folder icon matching Windows 11 yellow style
const FolderIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 16" fill="none" className={className}>
    <path d="M0 2.5C0 1.12 1.12 0 2.5 0H7.28L9.28 2H17.5C18.88 2 20 3.12 20 4.5V13.5C20 14.88 18.88 16 17.5 16H2.5C1.12 16 0 14.88 0 13.5V2.5Z" fill="#DCB67A" />
    <path d="M0 5C0 3.9 0.9 3 2 3H18C19.1 3 20 3.9 20 5V14C20 15.1 19.1 16 18 16H2C0.9 16 0 15.1 0 14V5Z" fill="#F4C842" />
    <path d="M0 6C0 4.9 0.9 4 2 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H2C0.9 16 0 15.1 0 14V6Z" fill="#F6D155" />
  </svg>
);

const getFileIcon = (name: string, size = 16) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    // Adobe Application File Documents
    case 'psd': case 'psb':
      return <AdobeFileDocumentIcon letter="Ps" bgColor="#001e36" fgColor="#31a8ff" borderColor="#005fa3" size={size} />;
    case 'ai': case 'ait': case 'eps':
      return <AdobeFileDocumentIcon letter="Ai" bgColor="#330000" fgColor="#ff9a00" borderColor="#ff7700" size={size} />;
    case 'prproj': case 'prel':
      return <AdobeFileDocumentIcon letter="Pr" bgColor="#00005b" fgColor="#9999ff" borderColor="#7070ff" size={size} />;
    case 'aep': case 'aet': case 'aepx':
      return <AdobeFileDocumentIcon letter="Ae" bgColor="#2d0036" fgColor="#d291ff" borderColor="#b854ff" size={size} />;
    case 'indd': case 'idml': case 'indt':
      return <AdobeFileDocumentIcon letter="Id" bgColor="#2b0018" fgColor="#ff3366" borderColor="#ff1a53" size={size} />;
    case 'xd':
      return <AdobeFileDocumentIcon letter="Xd" bgColor="#470024" fgColor="#ff26be" borderColor="#e600a1" size={size} />;
    case 'lrtemplate': case 'xmp': case 'dng': case 'cr2': case 'nef': case 'arw':
      return <AdobeFileDocumentIcon letter="Lr" bgColor="#002d38" fgColor="#31ecff" borderColor="#00b8d4" size={size} />;
    case 'sesx':
      return <AdobeFileDocumentIcon letter="Au" bgColor="#003632" fgColor="#00e5d1" borderColor="#00b3a4" size={size} />;
    case 'fla': case 'swf':
      return <AdobeFileDocumentIcon letter="An" bgColor="#330a00" fgColor="#ff4500" borderColor="#e03d00" size={size} />;
    case 'sbs': case 'sbsar':
      return <AdobeFileDocumentIcon letter="Sb" bgColor="#331a00" fgColor="#ff8c00" borderColor="#e07b00" size={size} />;
    case 'chproj':
      return <AdobeFileDocumentIcon letter="Ch" bgColor="#1d0036" fgColor="#a855f7" borderColor="#9333ea" size={size} />;
    case 'pdf':
      return <AdobeFileDocumentIcon letter="Pdf" bgColor="#360000" fgColor="#ff3b30" borderColor="#e02d22" size={size} />;

    // General Formats
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp':
      return <ImageIcon className="text-blue-500 shrink-0" style={{ width: size, height: size }} />;
    case 'mp4': case 'mov': case 'avi': case 'mkv':
      return <Video className="text-purple-500 shrink-0" style={{ width: size, height: size }} />;
    case 'doc': case 'docx':
      return <FileText className="text-blue-600 shrink-0" style={{ width: size, height: size }} />;
    default:
      return <FileIcon className="text-slate-400 shrink-0" style={{ width: size, height: size }} />;
  }
};

interface TreeNode {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: TreeNode[];
  expanded?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ rootPath, initialPath, onFileSelect, onPathChange, className }) => {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const isGlobal = rootPath === 'GLOBAL';

  const onPathChangeRef = useRef(onPathChange);
  useEffect(() => {
    onPathChangeRef.current = onPathChange;
  }, [onPathChange]);

  useEffect(() => {
    if (onPathChangeRef.current) {
      let title = 'Home';
      if (currentPath) {
        const parts = currentPath.split(/[/\\]/).filter(Boolean);
        if (parts.length > 0) {
          title = parts[parts.length - 1];
        }
      } else if (!isGlobal && rootPath) {
        title = rootPath.split(/[/\\]/).filter(Boolean).pop() || 'Project';
      }
      onPathChangeRef.current(currentPath, title);
    }
  }, [currentPath, rootPath, isGlobal]);

  const [files, setFiles] = useState<FSEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [gridItemSize, setGridItemSize] = useState(96);
  const [quickAccess, setQuickAccess] = useState<Record<string, string>>({});
  
  interface PinnedFolder {
    name: string;
    path: string;
    icon?: 'desktop' | 'downloads' | 'pictures' | 'documents' | 'music' | 'videos' | 'folder';
  }

  const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>(() => {
    try {
      const saved = localStorage.getItem('flow_pinned_folders');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { name: 'Desktop', path: 'desktop', icon: 'desktop' },
      { name: 'Downloads', path: 'downloads', icon: 'downloads' },
      { name: 'Pictures', path: 'pictures', icon: 'pictures' },
      { name: 'Music', path: 'music', icon: 'music' },
      { name: 'Videos', path: 'videos', icon: 'videos' },
      { name: 'Documents', path: 'documents', icon: 'documents' },
      { name: 'Mockups', path: 'Mockups', icon: 'folder' },
      { name: 'Flow-Studio', path: 'Flow-Studio', icon: 'folder' },
    ];
  });

  const togglePinFolder = (folderName: string, folderPath?: string) => {
    setPinnedFolders((prev) => {
      const targetPath = folderPath || folderName;
      const isAlreadyPinned = prev.some((p) => p.name === folderName || p.path === targetPath);
      let updated: PinnedFolder[];
      if (isAlreadyPinned) {
        updated = prev.filter((p) => p.name !== folderName && p.path !== targetPath);
      } else {
        updated = [...prev, { name: folderName, path: targetPath, icon: 'folder' }];
      }
      try {
        localStorage.setItem('flow_pinned_folders', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const [showHidden, setShowHidden] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'view' | 'sort' | null>(null);

  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState('');
  const pathInputRef = useRef<HTMLInputElement>(null);

  const [viewingFile, setViewingFile] = useState<FSEntry | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { clipboard, setClipboard } = useClipboardStore();
  const [fileOpProgress, setFileOpProgress] = useState<{
    isOpen: boolean;
    type: 'copy' | 'move';
    fileName: string;
    source: string;
    target: string;
    progress: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FSEntry; type: 'file' | 'folder' | 'background' } | null>(null);
  const [history, setHistory] = useState<string[]>([initialPath || '']);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [inlineEdit, setInlineEdit] = useState<{
    id: string;
    originalName: string;
    isCreating: boolean;
    type: 'file' | 'folder';
  } | null>(null);

  const handleInlineEditSubmit = async (newName: string) => {
    if (!inlineEdit) return;
    const { id, isCreating, originalName, type } = inlineEdit;
    setInlineEdit(null); // Clear immediately
    
    if (!newName.trim() || newName.startsWith('___temp___') || (!isCreating && newName === originalName)) {
      if (isCreating) fetchFiles(); 
      return;
    }
    
    const targetDir = isGlobal ? currentPath : `${rootPath}/${currentPath}`.replace(/\/+/g, '/');
    const newPath = `${targetDir}/${newName}`.replace(/\\/g, '/').replace(/\/+/g, '/');
    const isDesktop = (window as any).electronAPI?.isDesktop;

    try {
      if (isCreating) {
        if (type === 'folder') {
          if (isDesktop) {
            await (window as any).electronAPI.fs.mkdir(targetDir, newName, isGlobal ? 'global' : undefined);
          } else {
            await fetch('/api/fs/mkdir', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: targetDir, name: newName, mode: isGlobal ? 'global' : undefined })
            });
          }
        } else {
          if (isDesktop) {
            await (window as any).electronAPI.fs.createFile(targetDir, newName, isGlobal ? 'global' : undefined);
          } else {
            await fetch('/api/fs/create-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: targetDir, name: newName, mode: isGlobal ? 'global' : undefined })
            });
          }
        }
      } else {
        const oldPath = `${targetDir}/${originalName}`.replace(/\\/g, '/').replace(/\/+/g, '/');
        if (isDesktop) {
          await (window as any).electronAPI.fs.rename(oldPath, newPath, isGlobal ? 'global' : undefined);
        } else {
          await fetch('/api/fs/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPath, newPath, mode: isGlobal ? 'global' : undefined })
          });
        }
      }
    } catch {
      alert(`Failed to ${isCreating ? 'create' : 'rename'}`);
    }
    
    fetchFiles();
  };

  const inlineEditInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inlineEdit && inlineEditInputRef.current) {
      inlineEditInputRef.current.focus();
      if (inlineEdit.type === 'file' && inlineEdit.originalName.includes('.')) {
        const lastDotIdx = inlineEdit.originalName.lastIndexOf('.');
        if (lastDotIdx > 0) {
          inlineEditInputRef.current.setSelectionRange(0, lastDotIdx);
        } else {
          inlineEditInputRef.current.select();
        }
      } else {
        inlineEditInputRef.current.select();
      }
    }
  }, [inlineEdit]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Sort
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'size'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  


  const [drives, setDrives] = useState<FSEntry[]>([]);

  useEffect(() => {
    const isDesktop = (window as any).electronAPI?.isDesktop;

    if (isGlobal) {
      if (isDesktop) {
        (window as any).electronAPI.fs.getQuickAccess()
          .then((data: any) => setQuickAccess(data))
          .catch(console.error);
      } else {
        fetch('/api/fs/quick-access')
          .then(res => res.json())
          .then(data => setQuickAccess(data))
          .catch(console.error);
      }
    }

    if (isDesktop) {
      (window as any).electronAPI.fs.getDrives()
        .then((data: any) => { if (data.files) setDrives(data.files); })
        .catch(console.error);
    } else {
      fetch('/api/fs/drives')
        .then(res => res.json())
        .then(data => { if (data.files) setDrives(data.files); })
        .catch(console.error);
    }
  }, [isGlobal]);

  const fetchSeqRef = useRef(0);

  const fetchFiles = async (forceRefresh = false) => {
    const seq = ++fetchSeqRef.current;
    if (!forceRefresh) setFiles([]);
    setLoading(true);
    setSelectedItems(new Set());
    try {
      const isDesktop = (window as any).electronAPI?.isDesktop;

      if (isGlobal && currentPath === '') {
        if (isDesktop) {
          const data = await (window as any).electronAPI.fs.getDrives();
          if (seq === fetchSeqRef.current && data.files) setFiles(data.files);
        } else {
          const res = await fetch('/api/fs/drives');
          const data = await res.json();
          if (seq === fetchSeqRef.current && data.files) setFiles(data.files);
        }
      } else {
        const targetPath = isGlobal ? currentPath : `${rootPath}/${currentPath}`.replace(/\/+/g, '/');
        if (isDesktop) {
          const data = await (window as any).electronAPI.fs.listFiles(targetPath, isGlobal ? 'global' : undefined, forceRefresh);
          if (seq === fetchSeqRef.current && data.files) setFiles(data.files);
        } else {
          const res = await fetch(`/api/fs/list?path=${encodeURIComponent(targetPath)}${isGlobal ? '&mode=global' : ''}`);
          const data = await res.json();
          if (seq === fetchSeqRef.current && data.files) setFiles(data.files);
        }
      }
    } catch (e) {
      console.error('Failed to fetch files', e);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [currentPath, rootPath]);

  useEffect(() => {
    const handleViewerWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setImageZoom(z => {
          const newZ = Math.max(0.2, Math.min(5, z + (e.deltaY < 0 ? 0.25 : -0.25)));
          if (newZ <= 1) setImagePan({ x: 0, y: 0 });
          return newZ;
        });
      }
    };
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('wheel', handleViewerWheel, { passive: false });
      return () => viewer.removeEventListener('wheel', handleViewerWheel);
    }
  }, [viewingFile]);

  const getAbsolutePath = (itemName: string) =>
    isGlobal
      ? `${currentPath}/${itemName}`.replace(/\\/g, '/').replace(/\/+/g, '/')
      : `${rootPath}/${currentPath}/${itemName}`.replace(/\/+/g, '/');

  const navigateTo = (newPath: string) => {
    if (newPath === currentPath) return;
    setFiles([]);
    setLoading(true);
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(newPath);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setCurrentPath(newPath);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setFiles([]);
      setLoading(true);
      setHistoryIdx(idx);
      setCurrentPath(history[idx]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      setFiles([]);
      setLoading(true);
      setHistoryIdx(idx);
      setCurrentPath(history[idx]);
    }
  };

  const goUp = () => {
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    parts.pop();
    navigateTo(parts.join('/'));
  };

  const handleCreateFolder = () => {
    setInlineEdit({ id: `___temp___${Date.now()}`, originalName: 'New folder', isCreating: true, type: 'folder' });
  };

  const handleCreateFile = (defaultName = 'New Text Document.txt') => {
    setInlineEdit({ id: `___temp___${Date.now()}`, originalName: defaultName, isCreating: true, type: 'file' });
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'background', item?: FSEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (item && !selectedItems.has(item.name)) {
      setSelectedItems(new Set([item.name]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const handleDelete = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (selectedItems.size === 0) return;
    const isPermanent = e && e.shiftKey;
    const ok = await confirm.danger(
      `Delete ${selectedItems.size} Item(s)?`,
      `Are you sure you want to delete ${selectedItems.size} item(s)${isPermanent ? ' permanently' : ' to the Trash'}?`
    );
    if (!ok) return;
    try {
      const isDesktop = (window as any).electronAPI?.isDesktop;
      for (const itemName of selectedItems) {
        const pathStr = getAbsolutePath(itemName);
        if (isDesktop) {
          if (isPermanent) {
            await (window as any).electronAPI.fs.delete(pathStr, isGlobal ? 'global' : undefined);
          } else {
            await (window as any).electronAPI.fs.trash(pathStr, isGlobal ? 'global' : undefined);
          }
        } else {
          await fetch('/api/fs/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: pathStr, mode: isGlobal ? 'global' : undefined })
          });
        }
      }
      fetchFiles();
    } catch { alert('Failed to delete some items'); }
  };

  const handleRename = () => {
    if (selectedItems.size !== 1) return;
    const itemName = Array.from(selectedItems)[0] as string;
    const item = files.find(f => f.name === itemName);
    if (!item) return;
    setInlineEdit({ id: itemName, originalName: itemName, isCreating: false, type: item.isDir ? 'folder' : 'file' });
  };

  const handleCopy = () => {
    if (selectedItems.size !== 1) return;
    setClipboard({ path: getAbsolutePath(Array.from(selectedItems)[0] as string), type: 'copy' });
  };

  const handleCut = () => {
    if (selectedItems.size !== 1) return;
    setClipboard({ path: getAbsolutePath(Array.from(selectedItems)[0] as string), type: 'cut' });
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    const fileName = clipboard.path.split(/[/\\]/).pop() || 'file';
    const destPath = getAbsolutePath(fileName);

    setFileOpProgress({
      isOpen: true,
      type: clipboard.type === 'copy' ? 'copy' : 'move',
      fileName,
      source: clipboard.path,
      target: destPath,
      progress: 20
    });

    const progressInterval = setInterval(() => {
      setFileOpProgress((prev) => (prev ? { ...prev, progress: Math.min(prev.progress + 18, 90) } : null));
    }, 100);

    try {
      const isDesktop = (window as any).electronAPI?.isDesktop;
      if (clipboard.type === 'copy') {
        if (isDesktop) {
          await (window as any).electronAPI.fs.copy(clipboard.path, destPath, isGlobal ? 'global' : undefined);
        } else {
          await fetch('/api/fs/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourcePath: clipboard.path, targetPath: destPath, mode: isGlobal ? 'global' : undefined })
          });
        }
      } else {
        if (isDesktop) {
          await (window as any).electronAPI.fs.rename(clipboard.path, destPath, isGlobal ? 'global' : undefined);
        } else {
          await fetch('/api/fs/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPath: clipboard.path, newPath: destPath, mode: isGlobal ? 'global' : undefined })
          });
        }
        setClipboard(null);
      }
      clearInterval(progressInterval);
      setFileOpProgress((prev) => (prev ? { ...prev, progress: 100 } : null));
      setTimeout(() => {
        setFileOpProgress(null);
        fetchFiles();
      }, 350);
    } catch {
      clearInterval(progressInterval);
      setFileOpProgress(null);
      alert('Failed to paste');
    }
  };

  const handleItemDoubleClick = (item: FSEntry) => {
    if (!item.name || item.name.startsWith('___temp___') || inlineEdit?.id === item.name) return;
    if (item.isDir) {
      navigateTo(currentPath ? `${currentPath}/${item.name}` : item.name);
    } else {
      setViewingFile(item);
      setImageZoom(1);
      setImagePan({ x: 0, y: 0 });
      const ext = item.name.split('.').pop()?.toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
      if (!isImage) {
        setIsLoadingContent(true);
        const targetPath = getAbsolutePath(item.name);
        const isDesktop = (window as any).electronAPI?.isDesktop;

        if (isDesktop) {
          (window as any).electronAPI.fs.readFileString(targetPath, isGlobal ? 'global' : undefined)
            .then((text: string) => { setFileContent(text); setIsLoadingContent(false); })
            .catch(() => { setFileContent('Error loading file content.'); setIsLoadingContent(false); });
        } else {
          fetch(`/api/fs/file?path=${encodeURIComponent(targetPath)}${isGlobal ? '&mode=global' : ''}`)
            .then(res => res.text())
            .then(text => { setFileContent(text); setIsLoadingContent(false); })
            .catch(() => { setFileContent('Error loading file content.'); setIsLoadingContent(false); });
        }
      }
    }
  };

  const handleOpenNative = async () => {
    if (selectedItems.size !== 1) return;
    const itemName = Array.from(selectedItems)[0] as string;
    const targetPath = getAbsolutePath(itemName);
    try {
      const isDesktop = (window as any).electronAPI?.isDesktop;
      if (isDesktop) {
        await (window as any).electronAPI.fs.openDefault(targetPath, isGlobal ? 'global' : undefined);
      } else {
        alert('Opening native apps is only supported in Desktop mode.');
      }
    } catch { alert('Failed to open native application'); }
  };

  const handleShowProperties = async () => {
    if (selectedItems.size !== 1) return;
    const itemName = Array.from(selectedItems)[0] as string;
    const targetPath = getAbsolutePath(itemName);
    try {
      const isDesktop = (window as any).electronAPI?.isDesktop;
      if (isDesktop) {
        const props = await (window as any).electronAPI.fs.getProperties(targetPath, isGlobal ? 'global' : undefined);
        alert(`Properties for ${itemName}:\n\nType: ${props.isDirectory ? 'Folder' : 'File'}\nSize: ${(props.size / 1024).toFixed(2)} KB\nCreated: ${new Date(props.created).toLocaleString()}\nModified: ${new Date(props.modified).toLocaleString()}`);
      } else {
        alert('Properties viewing is only supported in Desktop mode.');
      }
    } catch { alert('Failed to get properties'); }
  };

  const toggleSelection = (e: React.MouseEvent, itemName: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedItems);
    if (e.ctrlKey || e.metaKey) {
      if (newSet.has(itemName)) newSet.delete(itemName);
      else newSet.add(itemName);
    } else if (e.shiftKey && newSet.size > 0) {
      // range selection
      const allNames = sortedFiles.map(f => f.name);
      const lastSelected = Array.from(newSet)[newSet.size - 1];
      const start = allNames.indexOf(lastSelected);
      const end = allNames.indexOf(itemName);
      const range = allNames.slice(Math.min(start, end), Math.max(start, end) + 1);
      range.forEach(n => newSet.add(n));
    } else {
      newSet.clear();
      newSet.add(itemName);
    }
    setSelectedItems(newSet);
  };

  const breadcrumbs = currentPath.split(/[/\\]/).filter(Boolean);

  const handleBreadcrumbClick = (idx: number) => {
    navigateTo(breadcrumbs.slice(0, idx + 1).join('/'));
  };

  const handleSort = (col: 'name' | 'date' | 'type' | 'size') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const displayedFiles = useMemo(() => {
    return files.filter(f => {
      if (!showHidden && f.name.startsWith('.')) return false;
      return f.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    });
  }, [files, debouncedSearch, showHidden]);

  const sortedFiles = useMemo(() => {
    let arr = [...displayedFiles];
    if (inlineEdit?.isCreating) {
      arr.unshift({
        name: inlineEdit.id,
        isDir: inlineEdit.type === 'folder',
        size: 0,
        modifiedAt: new Date().toISOString()
      } as FSEntry);
    }
    return arr.sort((a, b) => {
      // Folders first
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'date') cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      else if (sortBy === 'size') cmp = a.size - b.size;
      else if (sortBy === 'type') {
        const ta = a.isDir ? 'File folder' : getFileType(a.name);
        const tb = b.isDir ? 'File folder' : getFileType(b.name);
        cmp = ta.localeCompare(tb);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [displayedFiles, sortBy, sortAsc, inlineEdit]);

  // ResizeObserver for dynamic column count in grid view
  const [contentWidth, setContentWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(320, window.innerWidth - 280);
    }
    return 800;
  });

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      setContentWidth(scrollContainerRef.current.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContentWidth(entry.contentRect.width);
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setGridItemSize(prev => {
          const delta = e.deltaY > 0 ? -16 : 16;
          const newSize = Math.max(48, Math.min(256, prev + delta));
          if (newSize !== prev) {
            if (newSize <= 64 && viewMode !== 'details') setViewMode('details');
            else if (newSize > 64 && viewMode !== 'grid') setViewMode('grid');
          }
          return newSize;
        });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  const gridCols = Math.max(1, Math.floor((contentWidth - 24) / (gridItemSize + 4)));

  const chunkedFiles = useMemo(() => {
    const chunks: FSEntry[][] = [];
    for (let i = 0; i < sortedFiles.length; i += gridCols) {
      chunks.push(sortedFiles.slice(i, i + gridCols));
    }
    return chunks;
  }, [sortedFiles, gridCols]);

  const detailsVirtualizer = useVirtualizer({
    count: sortedFiles.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 28,
    overscan: 10,
  });

  const gridVirtualizer = useVirtualizer({
    count: chunkedFiles.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => gridItemSize + 4,
    overscan: 5,
  });

  const SortArrow = ({ col }: { col: string }) =>
    sortBy === col ? (
      <span className="ml-1 text-[10px]">{sortAsc ? '↑' : '↓'}</span>
    ) : null;

  const hasSelection = selectedItems.size > 0;
  const hasSingleSelection = selectedItems.size === 1;

  // Sidebar quick access links
  const quickLinks = Object.entries(quickAccess).filter(([k]) => k !== 'home');

  // ── DRIVE VIEW ──────────────────────────────────────────────
  const renderDrivesView = () => (
    <table className="w-full text-left text-[13px] table-fixed">
      <colgroup>
        <col style={{ width: '50%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '20%' }} />
        <col style={{ width: '15%' }} />
      </colgroup>
      <tbody>
        {sortedFiles.map((drive, idx) => {
          const isSelected = selectedItems.has(drive.name);
          const usedSpace = drive.size - (drive.freeSpace || 0);
          const percentUsed = drive.size > 0 ? (usedSpace / drive.size) * 100 : 0;
          return (
            <tr
              key={idx}
              onClick={(e) => toggleSelection(e, drive.name)}
              onDoubleClick={() => handleItemDoubleClick(drive)}
              className={`cursor-pointer select-none border-b border-transparent h-[28px] group ${isSelected ? 'bg-blue-100 border-blue-200' : 'hover:bg-slate-100/70'
                }`}
            >
              <td className="px-3 py-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="text-slate-500 shrink-0" size={15} />
                  <span className={`font-medium truncate ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                    Local Disk ({drive.name})
                  </span>
                </div>
              </td>
              <td className="px-3 py-1 text-slate-500 text-[12px]">
                {formatBytes(drive.freeSpace || 0, 1)} free
              </td>
              <td className="px-3 py-1">
                <div className="w-full h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${percentUsed > 85 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </td>
              <td className="px-3 py-1 text-slate-500 text-[12px]">{formatBytes(drive.size, 1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // ── DETAILS VIEW ─────────────────────────────────────────────
  const renderDetailsView = () => (
    <table className="w-full text-left text-[13px] table-fixed">
      <colgroup>
        <col style={{ width: '45%' }} />
        <col style={{ width: '22%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '15%' }} />
      </colgroup>
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="border-b border-slate-200 h-[26px]">
          <th
            className="px-3 py-1 text-[12px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
            onClick={() => handleSort('name')}
          >
            Name <SortArrow col="name" />
          </th>
          <th
            className="px-3 py-1 text-[12px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
            onClick={() => handleSort('date')}
          >
            Date modified <SortArrow col="date" />
          </th>
          <th
            className="px-3 py-1 text-[12px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
            onClick={() => handleSort('type')}
          >
            Type <SortArrow col="type" />
          </th>
          <th
            className="px-3 py-1 text-[12px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none text-right"
            onClick={() => handleSort('size')}
          >
            Size <SortArrow col="size" />
          </th>
        </tr>
      </thead>
      <tbody>
        {detailsVirtualizer.getVirtualItems().length > 0 && detailsVirtualizer.getVirtualItems()[0].start > 0 && (
          <tr style={{ height: `${detailsVirtualizer.getVirtualItems()[0].start}px` }} />
        )}
        {detailsVirtualizer.getVirtualItems().map(virtualRow => {
          const f = sortedFiles[virtualRow.index];
          if (!f) return null;
          const isSelected = selectedItems.has(f.name);
          return (
            <tr
              key={virtualRow.key}
              onClick={(e) => toggleSelection(e, f.name)}
              onDoubleClick={() => handleItemDoubleClick(f)}
              onContextMenu={(e) => handleContextMenu(e, f.isDir ? 'folder' : 'file', f)}
              className={`cursor-pointer select-none h-[28px] group ${isSelected
                ? 'bg-[#cce4f7] text-slate-900'
                : virtualRow.index % 2 === 0
                  ? 'bg-white hover:bg-[#e8f4fd]'
                  : 'bg-[#f7f9fc] hover:bg-[#e8f4fd]'
                }`}
            >
              <td className="px-3 py-0.5">
                <div className="flex items-center gap-2 truncate">
                  {f.isDir
                    ? <FolderIcon size={16} />
                    : getFileIcon(f.name, 16)
                  }
                      {inlineEdit?.id === f.name ? (
                        <input
                          ref={inlineEditInputRef}
                          defaultValue={inlineEdit.originalName}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineEditSubmit(e.currentTarget.value);
                            if (e.key === 'Escape') setInlineEdit(null);
                          }}
                          onBlur={(e) => handleInlineEditSubmit(e.currentTarget.value)}
                          onClick={e => e.stopPropagation()}
                          onDoubleClick={e => e.stopPropagation()}
                          className="w-full text-slate-900 border border-blue-400 px-1 py-0 outline-none text-[12px] bg-white h-[20px]"
                        />
                  ) : (
                    <span className="truncate">{f.name}</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-0.5 text-[12px] text-slate-600 truncate">{formatDate(f.modifiedAt)}</td>
              <td className="px-3 py-0.5 text-[12px] text-slate-600 truncate">{f.isDir ? 'File folder' : getFileType(f.name)}</td>
              <td className="px-3 py-0.5 text-[12px] text-slate-600 text-right pr-4">
                {f.isDir ? '' : formatBytes(f.size, 0)}
              </td>
            </tr>
          );
        })}
        {detailsVirtualizer.getVirtualItems().length > 0 && (detailsVirtualizer.getTotalSize() - detailsVirtualizer.getVirtualItems()[detailsVirtualizer.getVirtualItems().length - 1].end) > 0 && (
          <tr style={{ height: `${detailsVirtualizer.getTotalSize() - detailsVirtualizer.getVirtualItems()[detailsVirtualizer.getVirtualItems().length - 1].end}px` }} />
        )}
      </tbody>
    </table>
  );

  // ── GRID VIEW ────────────────────────────────────────────────
  const renderGridView = () => (
    <div className="p-3 flex flex-col">
      {gridVirtualizer.getVirtualItems().length > 0 && gridVirtualizer.getVirtualItems()[0].start > 0 && (
        <div style={{ height: `${gridVirtualizer.getVirtualItems()[0].start}px` }} />
      )}
      {gridVirtualizer.getVirtualItems().map(virtualRow => {
        const rowItems = chunkedFiles[virtualRow.index] || [];
        return (
          <div
            key={virtualRow.key}
            className="grid gap-1 mb-1"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(${gridItemSize}px, 1fr))`,
              height: `${gridItemSize}px`
            }}
          >
            {rowItems.map(f => {
              const isSelected = selectedItems.has(f.name);
              const targetPath = getAbsolutePath(f.name);
              const iconSize = Math.max(24, Math.floor(gridItemSize * 0.45));
              return (
                <div
                  key={f.name}
                  onClick={(e) => toggleSelection(e, f.name)}
                  onDoubleClick={() => handleItemDoubleClick(f)}
                  onContextMenu={(e) => handleContextMenu(e, f.isDir ? 'folder' : 'file', f)}
                  className={`flex flex-col items-center justify-center p-2 cursor-pointer select-none rounded border transition-colors ${isSelected ? 'bg-[#cce4f7] border-[#005fb8]' : 'bg-transparent border-transparent hover:bg-slate-100'
                    }`}
                >
                  <div className="mb-1 flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
                    {f.isDir ? <FolderIcon size={iconSize} /> : <AsyncThumbnail path={targetPath} name={f.name} isGlobal={isGlobal} size={iconSize} />}
                  </div>
                  {inlineEdit?.id === f.name ? (
                    <input
                      ref={inlineEditInputRef}
                      defaultValue={inlineEdit.originalName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineEditSubmit(e.currentTarget.value);
                        if (e.key === 'Escape') setInlineEdit(null);
                      }}
                      onBlur={(e) => handleInlineEditSubmit(e.currentTarget.value)}
                      onClick={e => e.stopPropagation()}
                      onDoubleClick={e => e.stopPropagation()}
                      className="w-[90%] text-slate-900 border border-blue-400 px-1 py-0 outline-none text-[11px] bg-white text-center rounded-sm h-[20px]"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-800 text-center leading-tight w-full truncate px-1" title={f.name}>
                      {f.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {gridVirtualizer.getVirtualItems().length > 0 && (gridVirtualizer.getTotalSize() - gridVirtualizer.getVirtualItems()[gridVirtualizer.getVirtualItems().length - 1].end) > 0 && (
        <div style={{ height: `${gridVirtualizer.getTotalSize() - gridVirtualizer.getVirtualItems()[gridVirtualizer.getVirtualItems().length - 1].end}px` }} />
      )}
    </div>
  );

  return (
    <div
      className="flex flex-col h-full bg-white text-slate-800 overflow-hidden select-none outline-none"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 13 }}
      onClick={() => setSelectedItems(new Set())}
      tabIndex={0}
      onKeyDown={(e) => {
        if (sortedFiles.length === 0) return;

        const allNames = sortedFiles.map(f => f.name);
        const currentSelection = Array.from(selectedItems)[0];
        let currentIndex = currentSelection ? allNames.indexOf(currentSelection as string) : -1;

        if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
          e.preventDefault();
          if (currentIndex === -1) {
            currentIndex = 0;
          } else {
            if (viewMode === 'details') {
              if (e.key === 'ArrowDown') currentIndex = Math.min(currentIndex + 1, allNames.length - 1);
              if (e.key === 'ArrowUp') currentIndex = Math.max(currentIndex - 1, 0);
            } else {
              if (e.key === 'ArrowRight') currentIndex = Math.min(currentIndex + 1, allNames.length - 1);
              if (e.key === 'ArrowLeft') currentIndex = Math.max(currentIndex - 1, 0);
              if (e.key === 'ArrowDown') currentIndex = Math.min(currentIndex + gridCols, allNames.length - 1);
              if (e.key === 'ArrowUp') currentIndex = Math.max(currentIndex - gridCols, 0);
            }
          }
          const newSelection = allNames[currentIndex];
          if (newSelection) setSelectedItems(new Set([newSelection]));
        } else if (e.key === 'Enter') {
          if (currentSelection) {
            const item = sortedFiles.find(f => f.name === currentSelection);
            if (item) handleItemDoubleClick(item);
          }
        }
      }}
    >
      {/* ── TOP COMMAND BAR ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-200 bg-white shrink-0 h-[44px]">

        {/* Back / Forward / Up */}
        <button
          onClick={goBack}
          disabled={historyIdx <= 0}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
          title="Back"
        >
          <ArrowLeft size={15} />
        </button>
        <button
          onClick={goForward}
          disabled={historyIdx >= history.length - 1}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
          title="Forward"
        >
          <ArrowRight size={15} />
        </button>
        <button
          onClick={goUp}
          disabled={!currentPath}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
          title="Up"
        >
          <ArrowUp size={15} />
        </button>

        <button
          onClick={() => fetchFiles(true)}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCcw size={15} />
        </button>

        {/* Address bar */}
        <div
          className="flex-1 flex items-center h-[28px] px-2 bg-white border border-slate-300 rounded-full text-[13px] text-slate-800 cursor-text hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all mx-1 overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditingPath) {
              setPathInput(currentPath || 'This PC');
              setIsEditingPath(true);
              setTimeout(() => pathInputRef.current?.select(), 0);
            }
          }}
        >
          {isEditingPath ? (
            <input
              ref={pathInputRef}
              type="text"
              value={pathInput}
              onChange={e => setPathInput(e.target.value)}
              onBlur={() => {
                setIsEditingPath(false);
                navigateTo(pathInput === 'This PC' ? '' : pathInput);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { setIsEditingPath(false); navigateTo(pathInput === 'This PC' ? '' : pathInput); }
                else if (e.key === 'Escape') setIsEditingPath(false);
              }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-none outline-none text-[13px]"
            />
          ) : (
            <div className="flex items-center gap-0 whitespace-nowrap overflow-hidden">
              <button
                onClick={e => { e.stopPropagation(); navigateTo(''); }}
                className="text-slate-700 hover:text-blue-600 px-0.5 transition-colors shrink-0"
              >
                This PC
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  <button
                    className="text-slate-700 hover:text-blue-600 px-0.5 transition-colors truncate max-w-[150px]"
                    onClick={e => { e.stopPropagation(); handleBreadcrumbClick(idx); }}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-[200px] shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder={`Search ${breadcrumbs[breadcrumbs.length - 1] || 'This PC'}`}
            className="w-full h-[28px] pl-7 pr-3 text-[12px] bg-white border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 outline-none hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* ── RIBBON TOOLBAR ──────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-white shrink-0 h-[36px]">
        {/* New */}
        <button
          onClick={handleCreateFolder}
          className="flex items-center gap-1.5 px-2.5 h-[26px] rounded hover:bg-slate-100 text-[13px] text-slate-700 font-medium border border-transparent hover:border-slate-300 transition-colors"
        >
          <Plus size={14} className="text-blue-600" />
          New
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Cut / Copy / Paste / Rename */}
        <button onClick={handleCut} disabled={!hasSingleSelection} title="Cut" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <Scissors size={14} />
        </button>
        <button onClick={handleCopy} disabled={!hasSingleSelection} title="Copy" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <Copy size={14} />
        </button>
        <button onClick={handlePaste} disabled={!clipboard} title="Paste" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <ClipboardPaste size={14} />
        </button>
        <button onClick={handleRename} disabled={!hasSingleSelection} title="Rename" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <Edit2 size={14} />
        </button>
        <button onClick={(e) => handleDelete(e)} disabled={!hasSelection} title="Delete (Shift to delete permanently)" className="p-1.5 rounded hover:bg-red-50 text-slate-600 hover:text-red-600 disabled:opacity-30 transition-colors">
          <Trash2 size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Native Actions */}
        <button onClick={handleOpenNative} disabled={!hasSingleSelection} title="Open in default app" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <ExternalLink size={14} />
        </button>
        <button onClick={handleShowProperties} disabled={!hasSingleSelection} title="Properties" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors">
          <Info size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            className={`flex items-center gap-1.5 px-2.5 h-[26px] rounded hover:bg-slate-100 text-[13px] font-medium transition-colors ${activeDropdown === 'sort' ? 'bg-slate-100 text-slate-800' : 'text-slate-700'}`}
          >
            <ArrowUpDown size={14} className="text-slate-500" />
            Sort
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          
          {activeDropdown === 'sort' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
              <div className="absolute top-full mt-1 left-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-[13px] text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => { handleSort('name'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Name {sortBy === 'name' && <Check size={14} className="text-blue-600"/>}
                </button>
                <button onClick={() => { handleSort('date'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Date modified {sortBy === 'date' && <Check size={14} className="text-blue-600"/>}
                </button>
                <button onClick={() => { handleSort('type'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Type {sortBy === 'type' && <Check size={14} className="text-blue-600"/>}
                </button>
                <button onClick={() => { handleSort('size'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Size {sortBy === 'size' && <Check size={14} className="text-blue-600"/>}
                </button>
                <div className="h-px bg-slate-200 my-1" />
                <button onClick={() => { setSortAsc(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Ascending {sortAsc && <Check size={14} className="text-blue-600"/>}
                </button>
                <button onClick={() => { setSortAsc(false); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                  Descending {!sortAsc && <Check size={14} className="text-blue-600"/>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* View Dropdown */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'view' ? null : 'view')}
            className={`flex items-center gap-1.5 px-2.5 h-[26px] rounded hover:bg-slate-100 text-[13px] font-medium transition-colors ${activeDropdown === 'view' ? 'bg-slate-100 text-slate-800' : 'text-slate-700'}`}
          >
            <List size={14} className="text-slate-500" />
            View
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          
          {activeDropdown === 'view' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
              <div className="absolute top-full mt-1 right-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-[13px] text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => { setViewMode('grid'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={14} className="text-slate-500"/> Grid View
                  </div>
                  {viewMode === 'grid' && <Check size={14} className="text-blue-600"/>}
                </button>
                <button onClick={() => { setViewMode('details'); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <List size={14} className="text-slate-500"/> Details
                  </div>
                  {viewMode === 'details' && <Check size={14} className="text-blue-600"/>}
                </button>
                <div className="h-px bg-slate-200 my-1" />
                <div className="px-3 py-1.5 flex items-center justify-between text-slate-500">
                  <span className="font-medium">Show</span>
                </div>
                <button 
                  onClick={() => { setShowHidden(!showHidden); setActiveDropdown(null); }} 
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  Hidden items {showHidden && <Check size={14} className="text-blue-600"/>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Status label */}
        {selectedItems.size > 0 && (
          <span className="text-[12px] text-slate-500 ml-2 whitespace-nowrap">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <div className="w-[210px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar py-2 flex flex-col">

          {/* Top Links: Home & Gallery */}
          <div className="px-2 space-y-0.5 mb-1">
            <button
              onClick={() => navigateTo('')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1 rounded-md text-[13px] text-left font-medium transition-colors ${
                currentPath === '' ? 'bg-[#cce4f7] text-slate-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Home size={15} className="text-amber-600 shrink-0" />
              Home
            </button>
            <button
              onClick={() => navigateTo('Pictures')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1 rounded-md text-[13px] text-left font-medium transition-colors ${
                currentPath === 'Pictures' ? 'bg-[#cce4f7] text-slate-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ImageIcon size={15} className="text-blue-500 shrink-0" />
              Gallery
            </button>
          </div>

          <div className="h-px bg-slate-200/80 my-1.5 mx-3" />

          {/* Pinned Quick Access List */}
          <div className="px-2 space-y-0.5">
            {pinnedFolders.map((item) => {
              const resolvedPath = quickAccess[item.path.toLowerCase()] || item.path;
              const isActive = currentPath === resolvedPath || currentPath === item.path;

              let iconElement = <Folder size={14} className="text-amber-500 shrink-0" />;
              if (item.icon === 'desktop') iconElement = <Monitor size={14} className="text-blue-500 shrink-0" />;
              if (item.icon === 'downloads') iconElement = <Download size={14} className="text-emerald-600 shrink-0" />;
              if (item.icon === 'pictures') iconElement = <ImageIcon size={14} className="text-sky-500 shrink-0" />;
              if (item.icon === 'music') iconElement = <Music size={14} className="text-pink-500 shrink-0" />;
              if (item.icon === 'videos') iconElement = <Video size={14} className="text-purple-500 shrink-0" />;
              if (item.icon === 'documents') iconElement = <FileText size={14} className="text-slate-500 shrink-0" />;

              return (
                <div
                  key={item.name}
                  onClick={() => navigateTo(resolvedPath)}
                  className={`group flex items-center justify-between px-2.5 py-1 rounded-md text-[13px] text-left transition-colors cursor-pointer select-none ${
                    isActive ? 'bg-[#cce4f7] text-slate-900 font-medium' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1">
                    {iconElement}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinFolder(item.name, item.path);
                    }}
                    title="Unpin from Quick Access"
                    className="opacity-40 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200/70 transition-opacity shrink-0"
                  >
                    <Pin size={11} className="text-slate-500 fill-slate-500 rotate-45" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-slate-200/80 my-1.5 mx-3" />

          {/* This PC */}
          <div className="px-3 pb-0.5 pt-1">
            <div className="flex items-center gap-1 py-0.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
              <ChevronDown size={12} />
              This PC
            </div>
          </div>
          <div className="pl-5 pr-1 space-y-0.5 pb-2">
            {drives.map(drive => (
              <button
                key={drive.name}
                onClick={() => navigateTo(drive.name)}
                className="w-full flex items-center gap-2 px-2 py-0.5 rounded text-[13px] text-left hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <HardDrive size={14} className="text-slate-500 shrink-0" />
                Local Disk ({drive.name})
              </button>
            ))}
          </div>

          {/* Network */}
          <div className="px-3 pb-0.5 border-t border-slate-100 pt-2">
            <button className="flex items-center gap-1 py-0.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wide w-full">
              <ChevronRight size={12} />
              Network
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-white"
          onClick={() => setSelectedItems(new Set())}
          onContextMenu={(e) => handleContextMenu(e, 'background')}
        >
          {loading && files.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="size-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : sortedFiles.length === 0 && (localSearch || debouncedSearch || searchQuery).trim() ? (
            <EmptyFileState
              searchQuery={localSearch || debouncedSearch || searchQuery}
              onClearSearch={() => {
                setLocalSearch('');
                setDebouncedSearch('');
                setSearchQuery('');
              }}
              onNewDocument={(e) => handleContextMenu(e, 'background')}
            />
          ) : (
            <motion.div
              key={`view-${viewMode}-${currentPath}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {currentPath === '' && isGlobal
                ? renderDrivesView()
                : viewMode === 'details'
                  ? renderDetailsView()
                  : renderGridView()
              }
            </motion.div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ──────────────────────────────────────────── */}
      <div className="h-[22px] border-t border-slate-200 bg-white flex items-center px-3 gap-4 shrink-0">
        <span className="text-[12px] text-slate-500">{files.length} item{files.length !== 1 ? 's' : ''}</span>
        {selectedItems.size > 0 && (
          <>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[12px] text-slate-600">{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected</span>
            {selectedItems.size === 1 && (() => {
              const name = Array.from(selectedItems)[0] as string;
              const f = files.find(fi => fi.name === name);
              return f && !f.isDir ? (
                <span className="text-[12px] text-slate-500">{formatBytes(f.size)}</span>
              ) : null;
            })()}
          </>
        )}
        {clipboard && (
          <>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[12px] text-slate-500">
              {clipboard.type === 'copy' ? '📋' : '✂️'} {clipboard.path.split(/[/\\]/).pop()}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="range"
            min="48"
            max="256"
            step="8"
            value={gridItemSize}
            onChange={(e) => {
              const val = Number(e.target.value);
              setGridItemSize(val);
              if (val <= 64 && viewMode !== 'details') setViewMode('details');
              else if (val > 64 && viewMode !== 'grid') setViewMode('grid');
            }}
            className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* ── FILE VIEWER MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {viewingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
              style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  {getFileIcon(viewingFile.name, 16)}
                  <span className="text-[13px] font-semibold text-slate-800">{viewingFile.name}</span>
                  <span className="text-[11px] text-slate-400">· {formatBytes(viewingFile.size)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(viewingFile.name.split('.').pop()?.toLowerCase() || '') && (
                    <div className="flex items-center border border-slate-200 rounded overflow-hidden mr-2">
                      <button onClick={() => setImageZoom(z => { const nz = Math.max(0.2, z - 0.25); if (nz <= 1) setImagePan({ x: 0, y: 0 }); return nz; })} className="p-1.5 hover:bg-slate-100 border-r border-slate-200 text-slate-600">
                        <ZoomOut size={13} />
                      </button>
                      <button onClick={() => { setImageZoom(1); setImagePan({ x: 0, y: 0 }); }} className="px-2 py-1.5 hover:bg-slate-100 text-[11px] font-medium border-r border-slate-200 text-slate-700">
                        {Math.round(imageZoom * 100)}%
                      </button>
                      <button onClick={() => setImageZoom(z => Math.min(5, z + 0.25))} className="p-1.5 hover:bg-slate-100 text-slate-600">
                        <ZoomIn size={13} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => { setViewingFile(null); setFileContent(null); setImageZoom(1); setImagePan({ x: 0, y: 0 }); }}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div
                ref={viewerRef}
                className={`flex-1 overflow-hidden bg-slate-100 flex justify-center items-center relative ${imageZoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                onMouseDown={() => { if (imageZoom > 1) setIsDragging(true); }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={e => { if (isDragging && imageZoom > 1) setImagePan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); }}
              >
                {(() => {
                  const ext = viewingFile.name.split('.').pop()?.toLowerCase();
                  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
                  if (isImage) {
                    const url = `/api/fs/file?path=${encodeURIComponent(getAbsolutePath(viewingFile.name))}${isGlobal ? '&mode=global' : ''}`;
                    return (
                      <img
                        src={url}
                        alt={viewingFile.name}
                        className="max-w-[95%] max-h-[95%] object-contain shadow pointer-events-none select-none"
                        style={{ transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`, transformOrigin: 'center' }}
                        draggable={false}
                      />
                    );
                  }
                  return isLoadingContent ? (
                    <div className="size-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <pre className="w-full h-full bg-white p-5 text-[13px] font-mono text-slate-800 whitespace-pre-wrap overflow-auto">
                      {fileContent}
                    </pre>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTEXT MENU ────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[9999] w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'background' ? (
              <>
                <button onClick={() => { setContextMenu(null); handleCreateFolder(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <FolderIcon size={14} className="text-slate-400" /> New Folder
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); handleCreateFile('New Text Document.txt'); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <FileIcon size={14} className="text-slate-400" /> New Text Document
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); fetchFiles(true); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <RefreshCcw size={14} className="text-slate-400" /> Refresh
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); handlePaste(); }} disabled={!clipboard} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="text-[14px] text-slate-400">📋</span> Paste
                </button>
              </>
            ) : (
              <>
                {contextMenu.type === 'file' && (
                  <button onClick={() => { setContextMenu(null); handleOpenNative(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium">
                    <ExternalLink size={14} className="text-blue-500" /> Open Default
                  </button>
                )}
                {contextMenu.type === 'folder' && contextMenu.item && (
                  <>
                    <button onClick={() => { setContextMenu(null); navigateTo(contextMenu.item!.name); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium">
                      <FolderIcon size={14} className="text-amber-500" /> Open Folder
                    </button>
                    {pinnedFolders.some(p => p.name === contextMenu.item!.name || p.path === getAbsolutePath(contextMenu.item!.name)) ? (
                      <button onClick={() => { togglePinFolder(contextMenu.item!.name, getAbsolutePath(contextMenu.item!.name)); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                        <PinOff size={14} className="text-slate-400" /> Unpin from Quick Access
                      </button>
                    ) : (
                      <button onClick={() => { togglePinFolder(contextMenu.item!.name, getAbsolutePath(contextMenu.item!.name)); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                        <Pin size={14} className="text-blue-600" /> Pin to Quick Access
                      </button>
                    )}
                  </>
                )}
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); handleCopy(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <span className="text-[14px] text-slate-400">📋</span> Copy
                </button>
                <button onClick={() => { setContextMenu(null); handleCut(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <span className="text-[14px] text-slate-400">✂️</span> Cut
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); handleRename(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <Edit2 size={14} className="text-slate-400" /> Rename
                </button>
                <button onClick={(e) => { setContextMenu(null); handleDelete(e); }} className="w-full text-left px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={14} className="text-red-500" /> Delete
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); handleShowProperties(); }} className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <Info size={14} className="text-slate-400" /> Properties
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILE OPERATION PROGRESS MODAL ───────────────────────── */}
      <AnimatePresence>
        {fileOpProgress && fileOpProgress.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Copy className="size-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {fileOpProgress.type === 'copy' ? 'Copying Item' : 'Moving Item'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {fileOpProgress.type === 'copy' ? 'Creating a copy in target directory' : 'Relocating to target directory'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {fileOpProgress.progress}%
                </span>
              </div>

              {/* Path Info */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">File:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[240px]" title={fileOpProgress.fileName}>
                    {fileOpProgress.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-medium">Destination:</span>
                  <span className="truncate max-w-[240px] text-slate-600 font-mono text-[11px]" title={fileOpProgress.target}>
                    {fileOpProgress.target}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${fileOpProgress.progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>{fileOpProgress.progress < 100 ? 'Processing...' : 'Complete!'}</span>
                  <span>{fileOpProgress.progress}%</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
