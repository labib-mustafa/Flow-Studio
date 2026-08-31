import React, { useEffect } from 'react';
import { useExplorerTabStore } from '../../../stores/explorerTabStore';
import { FileExplorer } from './FileExplorer';
import { Plus, X, Folder, Home, Monitor, Download, FileText, Image, Video, HardDrive } from 'lucide-react';

interface TabbedFileExplorerProps {
  sessionId: string;
  rootPath?: 'GLOBAL' | string;
  initialPath?: string;
  className?: string;
}

const getTabIcon = (tab: { title?: string; path?: string; icon?: string }) => {
  const title = (tab.title || '').trim().toLowerCase();
  const path = (tab.path || '').trim().toLowerCase();
  const iconName = (tab.icon || '').trim().toLowerCase();

  if (iconName === 'home' || title === 'home' || path === '' || title === 'this pc') {
    return Home;
  }
  if (iconName === 'desktop' || iconName === 'monitor' || title === 'desktop' || path.endsWith('/desktop') || path.endsWith('\\desktop')) {
    return Monitor;
  }
  if (iconName === 'downloads' || title === 'downloads' || path.endsWith('/downloads') || path.endsWith('\\downloads')) {
    return Download;
  }
  if (iconName === 'documents' || title === 'documents' || path.endsWith('/documents') || path.endsWith('\\documents')) {
    return FileText;
  }
  if (iconName === 'pictures' || title === 'pictures' || path.endsWith('/pictures') || path.endsWith('\\pictures')) {
    return Image;
  }
  if (iconName === 'videos' || title === 'videos' || path.endsWith('/videos') || path.endsWith('\\videos')) {
    return Video;
  }
  if (title.includes('disk') || /^[a-z]:$/i.test(title) || /^[a-z]:[/\\]?$/i.test(path)) {
    return HardDrive;
  }

  return Folder;
};

export const TabbedFileExplorer: React.FC<TabbedFileExplorerProps> = ({ sessionId, rootPath, initialPath, className }) => {
  const { sessions, ensureSession, addTab, removeTab, setActiveTab, updateTabPath } = useExplorerTabStore();

  // Initialize session on mount
  useEffect(() => {
    ensureSession(sessionId, initialPath);
  }, [sessionId, initialPath, ensureSession]);

  const session = sessions[sessionId];

  if (!session || session.tabs.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className || ''}`}>
      {/* Tabs Bar - Flow Studio Theme */}
      <div className="flex items-center px-3 pt-1 bg-slate-100/70 border-b border-slate-200/80 overflow-x-auto shrink-0 scrollbar-none gap-1.5">
        {session.tabs.map((tab) => {
          const isActive = tab.id === session.activeTabId;
          const IconComponent = getTabIcon(tab);
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(sessionId, tab.id)}
              className={`group flex items-center gap-2.5 px-3.5 h-9 min-w-[130px] max-w-[210px] rounded-t-xl cursor-pointer select-none transition-colors border-t border-x border-b ${isActive
                ? 'bg-white text-slate-800 font-medium shadow-xs border-slate-200 border-b-white z-10'
                : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-transparent border-b-slate-200/80'
                }`}
            >
              <IconComponent size={14} className={isActive ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400 group-hover:text-amber-500 transition-colors'} />
              <span className="text-xs truncate flex-1 tracking-tight font-medium">{tab.title || 'Home'}</span>
              {session.tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(sessionId, tab.id);
                  }}
                  className={`p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors'
                    }`}
                  title="Close tab"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => addTab(sessionId, initialPath)}
          title="New tab"
          className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tab Contents - Conditionally hide inactive tabs to preserve their state */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {session.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${tab.id === session.activeTabId ? 'block' : 'hidden'}`}
          >
            <FileExplorer
              rootPath={rootPath}
              initialPath={tab.path}
              onPathChange={(newPath, folderName) => {
                updateTabPath(sessionId, tab.id, newPath, folderName);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
