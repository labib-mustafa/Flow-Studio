import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Check, X, Search, Plus, Trash2 } from 'lucide-react';

interface ManageTagsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabel?: string;
  onSelectLabel?: (label: string) => void;
  
  // Customization
  title?: string;
  subtitle?: string;
  defaultLabels?: string[];
  listTitle?: string;
  searchPlaceholder?: string;
  showOnlySelected?: boolean;
  
  // Multi-selection mode
  isMulti?: boolean;
  selectedTags?: string[];
  onSelectTags?: (tags: string[]) => void;
}

export const ManageTagsSidebar: React.FC<ManageTagsSidebarProps> = ({
  isOpen,
  onClose,
  selectedLabel,
  onSelectLabel,
  title = "Manage Custom Labels",
  subtitle = "Tag network communication nodes",
  defaultLabels,
  listTitle = "Available Label",
  searchPlaceholder = "Search active labels...",
  showOnlySelected = false,
  isMulti = false,
  selectedTags = [],
  onSelectTags
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  
  // Local list of active tags/labels for communication channels or brand metadata
  const [labels, setLabels] = useState<string[]>([]);

  // Initialize labels on mount or when defaultLabels changes
  useEffect(() => {
    let initialLabels = defaultLabels || [
      'Direct',
      'Office',
      'Billing',
      'Urgent',
      'Slack Handle',
      'Discord Direct',
      'Creative Director',
      'Account Management',
      'General support',
      'Personal Alternate',
      'HQ Reception'
    ];
    
    if (selectedTags && selectedTags.length > 0) {
      const merged = new Set([...initialLabels, ...selectedTags]);
      initialLabels = Array.from(merged);
    }
    
    setLabels(initialLabels);
  }, [defaultLabels, selectedTags.join(',')]);

  // Sync state or reset search on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCustomLabel('');
    }
  }, [isOpen]);

  const handleAddCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    
    // Add to label options if not already present (insensitive)
    if (!labels.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
      setLabels(prev => [trimmed, ...prev]);
    }
    
    if (isMulti && onSelectTags) {
      if (!selectedTags.includes(trimmed)) {
        onSelectTags([...selectedTags, trimmed]);
      }
    } else if (onSelectLabel) {
      onSelectLabel(trimmed);
    }
    
    setCustomLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(prev => prev.filter(l => l !== labelToRemove));
    if (isMulti && onSelectTags && selectedTags.includes(labelToRemove)) {
      onSelectTags(selectedTags.filter(t => t !== labelToRemove));
    }
  };

  const filteredLabels = labels.filter(label =>
    label.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(label => {
    if (showOnlySelected && isMulti) {
      return selectedTags.includes(label);
    }
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[150] flex justify-end">
          {/* Backdrop with standard translucent screen, no blur to respect minimal style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/20 cursor-pointer"
          />

          {/* Drawer interface following the Cal.com aesthetic (grayscale boldness) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-sm bg-white border-l border-slate-100 shadow-2xl h-full flex flex-col z-10"
          >
            {/* Drawer Header */}
            <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center border border-gray-100 shadow-sm">
                  <Tag className="size-5 text-gray-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">{title}</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </header>

            {/* Sidebar Contents */}
            <div className="flex-1 flex flex-col px-6 py-5 space-y-6 overflow-hidden">
              
              {/* Add Custom Label Input Form */}
              <form onSubmit={handleAddCustomLabel} className="space-y-2 shrink-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">
                  Add New Label
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g. Creative Lead"
                    className="w-full rounded-lg py-2 pl-3 pr-20 text-xs bg-white border border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 transition-all duration-200 outline-none placeholder:text-gray-300"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-2.5 py-1.5 rounded-md text-[10px] font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Create</span>
                  </button>
                </div>
              </form>

              {/* Tag Search and Selection Area */}
              <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
                <div className="flex items-center justify-between shrink-0">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    {listTitle}
                  </label>
                  <span className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-hairline px-2 py-0.5 rounded-full">
                    {filteredLabels.length} items
                  </span>
                </div>

                {/* Filter Search */}
                <div className="relative flex items-center shrink-0">
                  <Search className="size-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-lg py-2.5 pl-9 pr-3 text-xs bg-white border border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 transition-all duration-200 outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Labels/Tags Grid list */}
                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                  {filteredLabels.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                      <p className="text-[11px] text-gray-400 font-medium">
                        {showOnlySelected && !searchQuery 
                          ? "No active tags found. Add a new label above to get started." 
                          : "No matching labels found"}
                      </p>
                    </div>
                  ) : (
                    filteredLabels.map((item) => {
                      const isSelected = isMulti ? selectedTags.includes(item) : selectedLabel === item;
                      return (
                        <div
                          key={item}
                          onClick={() => {
                            if (showOnlySelected) return; // Prevent row click from unselecting if we are in showOnlySelected mode
                            if (isMulti && onSelectTags) {
                              if (isSelected) {
                                onSelectTags(selectedTags.filter(t => t !== item));
                              } else {
                                onSelectTags([...selectedTags, item]);
                              }
                            } else if (onSelectLabel) {
                              onSelectLabel(item);
                              if (!isMulti) {
                                onClose();
                              }
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                            showOnlySelected ? 'cursor-default bg-slate-900 border-transparent text-white shadow-md' :
                            isSelected
                              ? 'cursor-pointer bg-slate-900 border-transparent text-white shadow-md'
                              : 'cursor-pointer bg-white border-slate-200/60 hover:border-slate-800 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1 rounded-md transition-colors ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                              <Tag className="size-3" />
                            </div>
                            <span className="text-xs font-bold truncate leading-none pt-[1px]">{item}</span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!showOnlySelected && isSelected && <Check className="size-3.5 text-white animate-fade-in" />}
                            
                            {(!isSelected || showOnlySelected) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (showOnlySelected && isMulti && onSelectTags) {
                                    onSelectTags(selectedTags.filter(t => t !== item));
                                  } else {
                                    handleRemoveLabel(item);
                                  }
                                }}
                                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all cursor-pointer ${
                                  isSelected ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 hover:text-red-500 text-slate-400'
                                }`}
                                title="Delete Label option"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Panel Actions */}
            <div className="px-6 py-3 border-t border-gray-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition-all uppercase tracking-wider cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

