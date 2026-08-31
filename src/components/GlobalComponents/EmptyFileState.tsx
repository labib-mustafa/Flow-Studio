import React from 'react';
import { motion } from 'motion/react';
import { FileText, LayoutGrid, ImageIcon, Video, Folder, Plus } from 'lucide-react';

interface EmptyFileStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  onNewDocument?: (e: React.MouseEvent) => void;
}

export const EmptyFileState: React.FC<EmptyFileStateProps> = ({
  searchQuery,
  onClearSearch,
  onNewDocument
}) => {
  return (
    <motion.div
      id="empty-file-state"
      key="empty"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center p-10 w-full"
    >
      <div className="relative size-[340px] flex items-center justify-center mb-4">
        {/* Outer dashed ring */}
        <div className="absolute inset-0 border border-dashed border-slate-200/80 rounded-full" />
        {/* Middle solid ring */}
        <div className="absolute inset-10 border border-slate-100 rounded-full" />
        {/* Inner solid ring */}
        <div className="absolute inset-[84px] border border-slate-50 bg-slate-50/50 rounded-full" />

        {/* Center Icon Background */}
        <div className="relative size-16 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center z-20">
          <FileText className="size-8 text-slate-900" fill="currentColor" />
        </div>

        {/* Floating Icons */}
        <div className="absolute top-[22%] left-[28%] bg-white p-0.5 z-10 text-slate-400">
          <LayoutGrid size={15} />
        </div>
        <div className="absolute top-[8%] right-[45%] bg-white p-0.5 z-10 text-slate-400">
          <FileText size={15} />
        </div>
        <div className="absolute top-[30%] right-[18%] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-2 z-10 text-slate-700 flex items-center justify-center">
          <LayoutGrid size={18} strokeWidth={2.5} />
        </div>
        <div className="absolute bottom-[40%] right-[8%] bg-white p-0.5 z-10 text-slate-400">
          <ImageIcon size={15} />
        </div>
        <div className="absolute bottom-[20%] right-[32%] bg-white p-0.5 z-10 text-slate-400">
          <Video size={15} />
        </div>
        <div className="absolute bottom-[30%] left-[18%] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-2 z-10 text-slate-700 flex items-center justify-center">
          <Folder size={18} strokeWidth={2.5} />
        </div>
        <div className="absolute bottom-[42%] left-[12%] bg-white p-0.5 z-10 text-slate-400">
          <FileText size={15} />
        </div>
      </div>

      <div className="text-center space-y-2 mb-6">
        <h3 className="text-slate-900 font-bold text-base">
          No files found
        </h3>
        <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
          {searchQuery
            ? `Your search "${searchQuery}" did not match any files or folders. Please try again.`
            : "This folder is empty. Create a new document to get started."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            Clear search
          </button>
        )}
        <button
          onClick={onNewDocument}
          className="px-4 py-2.5 bg-[#1a1a1a] text-white font-bold text-sm rounded-xl shadow-sm hover:bg-black transition-colors flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          New document
        </button>
      </div>
    </motion.div>
  );
};
