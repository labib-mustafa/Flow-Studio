import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { confirm } from '../../stores/confirmStore';
import { motion, AnimatePresence } from 'motion/react';

interface StorageInfo {
  totalBytes: number;
  files: Array<{ name: string; bytes: number }>;
}

interface BrowseResult {
  current: string;
  parent: string | null;
  directories: Array<{ name: string; path: string }>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const DataLocationTab: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [dataPath, setDataPath] = useState<string>(settings.dataLocation.currentPath);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Directory browser modal state
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isChangingDir, setIsChangingDir] = useState(false);

  // Inline path editing states & native folder picker state
  const [isEditingInlinePath, setIsEditingInlinePath] = useState(false);
  const [editedInlinePath, setEditedInlinePath] = useState('');
  const [isSavingInlinePath, setIsSavingInlinePath] = useState(false);
  const [isSelectingNativeFolder, setIsSelectingNativeFolder] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const config = await res.json();
          if (config.dataPath) {
            setDataPath(config.dataPath);
            updateSettings({
              dataLocation: {
                ...settings.dataLocation,
                currentPath: config.dataPath,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
    };
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch storage info on mount + every 30s
  const fetchStorageInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/storage-info');
      if (res.ok) {
        const data: StorageInfo = await res.json();
        setStorageInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch storage info:', err);
    }
  }, []);

  useEffect(() => {
    fetchStorageInfo();
    const interval = setInterval(fetchStorageInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchStorageInfo]);

  // Reveal in Explorer
  const handleRevealInExplorer = async () => {
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dataPath }),
      });
      if (res.ok) {
        setShowToast('Opening storage location in Explorer...');
      } else {
        setShowToast('Failed to open Explorer.');
      }
    } catch (err) {
      setShowToast('Failed to open Explorer.');
    }
  };

  // Save inline edited path
  const handleSaveInlinePath = async () => {
    const trimmed = editedInlinePath.trim();
    if (!trimmed) {
      setShowToast('Path cannot be empty.');
      return;
    }
    if (trimmed === dataPath) {
      setIsEditingInlinePath(false);
      return;
    }
    setIsSavingInlinePath(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPath: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedPath = data.dataPath || trimmed;
        setDataPath(updatedPath);
        updateSettings({
          dataLocation: {
            ...settings.dataLocation,
            currentPath: updatedPath,
          },
        });
        setShowToast('Storage location updated.');
        setIsEditingInlinePath(false);
        fetchStorageInfo();
      } else {
        const errData = await res.json().catch(() => ({}));
        setShowToast(errData.error || 'Failed to update storage location.');
      }
    } catch (err) {
      setShowToast('Failed to connect to server.');
    } finally {
      setIsSavingInlinePath(false);
    }
  };

  // Open native system file manager folder picker
  const handleNativeSelectFolder = async () => {
    setIsSelectingNativeFolder(true);
    try {
      let selectedPath: string | null = null;

      if ((window as any).electronAPI?.fs?.selectFolder) {
        const res = await (window as any).electronAPI.fs.selectFolder(dataPath);
        if (res && !res.canceled && res.path) {
          selectedPath = res.path;
        }
      } else {
        const res = await fetch('/api/select-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPath: dataPath }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.canceled && data.path) {
            selectedPath = data.path;
          }
        }
      }

      if (selectedPath) {
        setIsChangingDir(true);
        const updateRes = await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataPath: selectedPath }),
        });

        if (updateRes.ok) {
          const data = await updateRes.json();
          const updatedPath = data.dataPath || selectedPath;
          setDataPath(updatedPath);
          updateSettings({
            dataLocation: {
              ...settings.dataLocation,
              currentPath: updatedPath,
            },
          });
          setShowToast(`Data directory changed to ${updatedPath}`);
          fetchStorageInfo();
        } else {
          const errData = await updateRes.json().catch(() => ({}));
          setShowToast(errData.error || 'Failed to change directory.');
        }
      }
    } catch (err) {
      console.error('Failed to open native file explorer:', err);
      setShowToast('Failed to open File Explorer dialog.');
    } finally {
      setIsSelectingNativeFolder(false);
      setIsChangingDir(false);
    }
  };

  // Browse directory
  const browseTo = async (path: string) => {
    setBrowseLoading(true);
    setBrowseError(null);
    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        const data: BrowseResult = await res.json();
        setBrowseResult(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setBrowseError(errData.error || 'Failed to browse directory.');
      }
    } catch (err) {
      setBrowseError('Failed to connect to server.');
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleOpenBrowser = () => {
    setIsBrowsing(true);
    setIsCreatingFolder(false);
    setNewFolderName('');
    browseTo(dataPath);
  };

  const handleCloseBrowser = () => {
    setIsBrowsing(false);
    setBrowseResult(null);
    setBrowseError(null);
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleSelectFolder = async () => {
    if (!browseResult) return;
    setIsChangingDir(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPath: browseResult.current }),
      });
      if (res.ok) {
        setDataPath(browseResult.current);
        updateSettings({
          dataLocation: {
            ...settings.dataLocation,
            currentPath: browseResult.current,
          },
        });
        setShowToast('Data migrated to new location.');
        handleCloseBrowser();
        fetchStorageInfo();
      } else {
        const errData = await res.json().catch(() => ({}));
        setShowToast(errData.error || 'Failed to change directory.');
      }
    } catch (err) {
      setShowToast('Failed to connect to server.');
    } finally {
      setIsChangingDir(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !browseResult) return;
    const newPath = browseResult.current.replace(/[\\/]$/, '') + '\\' + newFolderName.trim();
    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: browseResult.current, createFolder: newFolderName.trim() }),
      });
      if (res.ok) {
        const data: BrowseResult = await res.json();
        setBrowseResult(data);
        setIsCreatingFolder(false);
        setNewFolderName('');
        // Navigate into the newly created folder
        browseTo(newPath);
      } else {
        const errData = await res.json().catch(() => ({}));
        setBrowseError(errData.error || 'Failed to create folder.');
      }
    } catch (err) {
      setBrowseError('Failed to create folder.');
    }
  };

  // Cloud sync (kept as-is)
  const handleCloudSyncChange = (newCloudSync: Partial<typeof settings.dataLocation.cloudSync>) => {
    updateSettings({
      dataLocation: {
        ...settings.dataLocation,
        cloudSync: {
          ...settings.dataLocation.cloudSync,
          ...newCloudSync,
        },
      },
    });
  };

  const handleReset = async () => {
    const ok = await confirm.warning(
      'Reset All Settings?',
      'Are you sure you want to reset all settings to defaults? This will not delete your files.'
    );
    if (ok) {
      resetSettings();
      setShowToast('Settings reset to defaults.');
    }
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Breadcrumb segments from a path
  const pathSegments = browseResult
    ? browseResult.current.split(/[\\/]/).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-8 pb-12 relative text-left">
      {/* Toast Notification (Snackbar) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-50 bg-[#111111] text-white px-5 py-3 rounded-lg border border-slate-800 shadow-xl flex items-center gap-2.5 font-medium min-w-[300px]"
          >
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span className="text-sm">{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory Browser Modal */}
      <AnimatePresence>
        {isBrowsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#111111]/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={handleCloseBrowser}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="max-w-lg w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[#111111] text-xl">folder_open</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111111] font-display -tracking-[0.02em]">Choose Directory</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a folder for project storage</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseBrowser}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
                </button>
              </div>

              {/* Breadcrumb */}
              {browseResult && (
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-hide">
                    {pathSegments.map((segment, idx) => {
                      const fullPath = pathSegments.slice(0, idx + 1).join('\\');
                      // Add back the drive colon for first segment if needed (e.g., C:)
                      const clickPath = idx === 0 ? fullPath + '\\' : fullPath;
                      return (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <span className="material-symbols-outlined text-slate-300 text-sm shrink-0">chevron_right</span>
                          )}
                          <button
                            onClick={() => browseTo(clickPath)}
                            className="text-slate-500 hover:text-[#111111] hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors font-medium whitespace-nowrap cursor-pointer truncate max-w-[120px]"
                            title={segment}
                          >
                            {segment}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Directory List */}
              <div className="px-5 pb-2">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-[#f8f9fa]">
                  <div className="max-h-[280px] overflow-y-auto">
                    {browseLoading && (
                      <div className="flex items-center justify-center py-12 gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-xl animate-spin">progress_activity</span>
                        <span className="text-xs text-slate-400 font-medium">Loading...</span>
                      </div>
                    )}

                    {browseError && (
                      <div className="flex items-center justify-center py-12 px-4 text-center">
                        <div>
                          <span className="material-symbols-outlined text-red-400 text-2xl mb-2">error</span>
                          <p className="text-xs text-red-500 font-medium">{browseError}</p>
                        </div>
                      </div>
                    )}

                    {!browseLoading && !browseError && browseResult && (
                      <>
                        {/* Go up to parent */}
                        {browseResult.parent && (
                          <button
                            onClick={() => browseTo(browseResult.parent!)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors text-left cursor-pointer border-b border-slate-200/60"
                          >
                            <span className="material-symbols-outlined text-slate-400 text-lg">drive_folder_upload</span>
                            <span className="text-xs font-medium text-slate-500">..</span>
                          </button>
                        )}

                        {/* Directories */}
                        {browseResult.directories.map((dir) => (
                          <button
                            key={dir.path}
                            onClick={() => browseTo(dir.path)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors text-left cursor-pointer border-b border-slate-200/60 last:border-b-0"
                          >
                            <span className="material-symbols-outlined text-amber-500 text-lg">folder</span>
                            <span className="text-xs font-medium text-[#111111] truncate">{dir.name}</span>
                          </button>
                        ))}

                        {/* New Folder inline input */}
                        {isCreatingFolder && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200/60">
                            <span className="material-symbols-outlined text-amber-500 text-lg">create_new_folder</span>
                            <input
                              type="text"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') {
                                  setIsCreatingFolder(false);
                                  setNewFolderName('');
                                }
                              }}
                              placeholder="Folder name..."
                              className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-[#111111] placeholder:text-slate-300"
                              autoFocus
                            />
                            <button
                              onClick={handleCreateFolder}
                              disabled={!newFolderName.trim()}
                              className="text-[10px] font-bold text-[#111111] hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              CREATE
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingFolder(false);
                                setNewFolderName('');
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        )}

                        {browseResult.directories.length === 0 && !browseResult.parent && !isCreatingFolder && (
                          <div className="flex items-center justify-center py-10">
                            <p className="text-xs text-slate-400 font-medium">No subdirectories found</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setNewFolderName('');
                  }}
                  disabled={browseLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#111111] hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
                  New Folder
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleCloseBrowser}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectFolder}
                    disabled={isChangingDir || browseLoading}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#111111] hover:bg-[#242424] text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingDir ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Migrating...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Select This Folder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Project Storage Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="local-storage-section">
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-50 rounded-full animate-pulse opacity-50"></div>
            <div className="w-14 h-14 bg-slate-100 border border-slate-200/50 rounded-full flex items-center justify-center relative z-10 shadow-xs">
              <span className="material-symbols-outlined text-3xl text-[#111111]">folder_data</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-[#111111] mb-1.5 tracking-tight font-display -tracking-[0.02em]">Local Project Storage</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            All your offline projects, assets, and auto-save caches are currently stored in this directory.
          </p>

          {/* Current Location */}
          <div className="w-full max-w-xl bg-[#f8f9fa] rounded-lg p-5 border border-slate-200/60 mb-6">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <span>Current Location</span>
              <button
                onClick={handleRevealInExplorer}
                className="text-[#111111] hover:bg-slate-200/65 px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer"
                id="reveal-finder-btn"
              >
                REVEAL IN EXPLORER
              </button>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-xs min-h-[48px]">
              <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">hard_drive</span>
              {isEditingInlinePath ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editedInlinePath}
                    onChange={(e) => setEditedInlinePath(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveInlinePath();
                      } else if (e.key === 'Escape') {
                        setIsEditingInlinePath(false);
                      }
                    }}
                    disabled={isSavingInlinePath}
                    className="text-xs font-mono text-[#111111] bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900 w-full"
                    placeholder="Enter folder path..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveInlinePath}
                    disabled={isSavingInlinePath}
                    className="flex items-center justify-center p-1.5 bg-[#111111] hover:bg-[#242424] text-white rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Save location (Enter)"
                  >
                    <span className="material-symbols-outlined text-base">check</span>
                  </button>
                  <button
                    onClick={() => setIsEditingInlinePath(false)}
                    disabled={isSavingInlinePath}
                    className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Cancel (Esc)"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-1 group gap-2 overflow-hidden">
                  <code
                    onClick={() => {
                      setEditedInlinePath(dataPath);
                      setIsEditingInlinePath(true);
                    }}
                    className="text-xs font-mono text-[#111111] break-all text-left flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                    title="Click to edit path inline"
                  >
                    {dataPath}
                  </code>
                  <button
                    onClick={() => {
                      setEditedInlinePath(dataPath);
                      setIsEditingInlinePath(true);
                    }}
                    className="text-slate-400 hover:text-[#111111] hover:bg-slate-100 p-1.5 rounded transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-medium"
                    title="Edit location path inline"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Storage Usage */}
          <div className="w-full max-w-xl mb-8">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-[#111111]">Storage Usage</span>
              <span className="text-slate-500">
                {storageInfo ? formatBytes(storageInfo.totalBytes) : '—'}
              </span>
            </div>
            {storageInfo && storageInfo.totalBytes > 0 && (
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-3">
                <motion.div
                  className="bg-[#111111] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.6 }}
                ></motion.div>
              </div>
            )}
            {/* File breakdown */}
            {storageInfo && storageInfo.files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {storageInfo.files.map((file) => (
                  <div key={file.name} className="flex items-center justify-between text-[11px] px-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-300 text-sm">description</span>
                      <span className="font-medium text-slate-600 truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">{formatBytes(file.bytes)}</span>
                  </div>
                ))}
              </div>
            )}
            {!storageInfo && (
              <div className="flex items-center gap-2 justify-center py-2">
                <span className="material-symbols-outlined text-slate-300 text-sm animate-spin">progress_activity</span>
                <span className="text-[11px] text-slate-400 font-medium">Loading storage info...</span>
              </div>
            )}
          </div>

          {/* Change Directory Button */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleNativeSelectFolder}
              disabled={isSelectingNativeFolder}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#111111] hover:bg-[#242424] text-white rounded-lg text-xs font-semibold shadow-sm transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
              id="change-directory-btn"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSelectingNativeFolder ? 'progress_activity' : 'folder_open'}
              </span>
              {isSelectingNativeFolder ? 'Opening File Explorer...' : 'Change Directory'}
            </button>
          </div>
        </div>
      </section>

      {/* Cloud Synchronization Section (kept as-is) */}
      <section className="flex flex-col gap-4 text-left" id="cloud-sync-section">
        <h3 className="text-xs font-semibold text-[#6b7280] px-2 uppercase tracking-widest">Cloud Synchronization</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[#111111] text-[24px]">cloud_sync</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">Enable Cloud Backup</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  Automatically back up your local project files to the cloud when an internet connection is available.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6 shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.dataLocation.cloudSync.enabled}
                onChange={() => handleCloudSyncChange({ enabled: !settings.dataLocation.cloudSync.enabled })}
              />
              <div className={`w-11 h-6 rounded-full relative transition-all duration-200 shrink-0 ${settings.dataLocation.cloudSync.enabled ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-200 shadow-sm ${settings.dataLocation.cloudSync.enabled ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>

          <div className={`p-6 bg-[#f8f9fa] border-t border-slate-200 transition-all duration-300 ${settings.dataLocation.cloudSync.enabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sync Frequency</label>
                <select
                  className="block w-full rounded-lg border-slate-200 bg-white text-[#111111] shadow-xs focus:border-[#111111] focus:ring-[#111111] font-semibold text-xs py-2 px-3 transition-all outline-none"
                  value={settings.dataLocation.cloudSync.frequency}
                  onChange={(e) => handleCloudSyncChange({ frequency: e.target.value as any })}
                >
                  <option value="real-time">Real-time</option>
                  <option value="every-hour">Every hour</option>
                  <option value="daily">Daily</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bandwidth Limit</label>
                <select
                  className="block w-full rounded-lg border-slate-200 bg-white text-[#111111] shadow-xs focus:border-[#111111] focus:ring-[#111111] font-semibold text-xs py-2 px-3 transition-all outline-none"
                  value={settings.dataLocation.cloudSync.bandwidthLimit}
                  onChange={(e) => handleCloudSyncChange({ bandwidthLimit: e.target.value as any })}
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="high">High (10 MB/s)</option>
                  <option value="medium">Medium (5 MB/s)</option>
                  <option value="low">Low (1 MB/s)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Section (kept as-is) */}
      <section className="mt-4" id="reset-section">
        <div className="bg-red-50/50 rounded-xl border border-red-200/60 p-6 flex items-start gap-4 shadow-xs text-left">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200/50">
            <span className="material-symbols-outlined text-red-600 text-xl">warning</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900">Reset Data Configuration</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Restoring default paths will not delete your files, but the application might lose track of recent projects until re-indexed.
            </p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100/50 transition-colors cursor-pointer shadow-xs"
              id="reset-defaults-btn"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
