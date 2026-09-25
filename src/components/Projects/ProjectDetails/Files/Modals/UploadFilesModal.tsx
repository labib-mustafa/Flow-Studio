import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadFilesModal: React.FC<UploadFilesModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [targetLocation, setTargetLocation] = React.useState<'all' | 'ready'>('all');
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const [filesList, setFilesList] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFilesList(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesList(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    // Simulate upload or post to API
    setTimeout(() => {
      setIsUploading(false);
      setFilesList([]);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} style={{ width: 'calc(100vw - var(--sidebar-width))', marginLeft: 'var(--sidebar-width)' }}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ width: 'calc(100vw - var(--sidebar-width))', marginLeft: 'var(--sidebar-width)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900">Upload Files</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 md:w-5/12 flex flex-col gap-6 bg-slate-50/50 overflow-y-auto">
              <div 
                className={`relative group cursor-pointer flex-1 min-h-[240px] ${isDragging ? 'border-accent' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className={`relative border-2 border-dashed rounded-xl h-full p-6 flex flex-col items-center justify-center text-center transition-colors bg-white/40 ${isDragging ? 'border-accent bg-blue-50' : 'border-accent/30 group-hover:border-accent'}`}>
                  <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-3xl text-accent">cloud_upload</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Drag and drop files here</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">or click to browse from your computer</p>
                  <button onClick={handleBrowse} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:border-accent hover:text-accent transition-colors">
                    Browse Files
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Location</h4>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => setTargetLocation('all')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all text-xs font-bold ${targetLocation === 'all' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    All Assets
                  </button>
                  <button 
                    onClick={() => setTargetLocation('ready')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all text-xs font-bold ${targetLocation === 'ready' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                    Ready to Ship
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 md:w-7/12 flex flex-col overflow-hidden bg-white">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Files ({filesList.length})</h4>
                <button onClick={() => setFilesList([])} className="text-[10px] font-bold text-accent hover:underline">Clear All</button>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {filesList.length > 0 ? (
                  filesList.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="size-10 rounded bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-500">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{f.name}</p>
                          <span className="text-[10px] font-bold text-emerald-600">Ready</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <button onClick={() => setFilesList(filesList.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No files added yet. Browse or drop files to upload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button onClick={handleUploadAll} disabled={isUploading || filesList.length === 0} className="px-6 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">{isUploading ? 'sync' : 'upload'}</span>
            {isUploading ? 'Uploading...' : 'Upload All'}
          </button>
        </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
