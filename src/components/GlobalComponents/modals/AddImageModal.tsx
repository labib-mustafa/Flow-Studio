import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (imageData: { url: string; title?: string; category?: string }) => void;
  initialUrl?: string;
  initialTitle?: string;
  initialCategory?: string;
}

export const AddImageModal: React.FC<AddImageModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddImage,
  initialUrl,
  initialTitle,
  initialCategory
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || '');
      setCategory(initialCategory || '');
      setPreviewUrl(initialUrl || null);
      setSelectedFile(null);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, initialUrl, initialTitle, initialCategory]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = () => {
    if (previewUrl) {
      onAddImage({
        url: previewUrl,
        title: title,
        category: category
      });
      resetForm();
      onClose();
    } else {
      // If no file selected, maybe use a placeholder or alert
      // For this demo, let's just use a placeholder if no file
      onAddImage({
        url: 'https://picsum.photos/300/200',
        title: title || 'New Image',
        category: category
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          role="dialog" 
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-slate-900/20" onClick={handleClose}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col pointer-events-auto"
            >
            <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Add Image</h3>
            <button 
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div 
            className="group cursor-pointer relative w-full h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/svg+xml"
              onChange={handleFileChange}
            />
            
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 to-accent/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300 z-10">
                  <span className="material-symbols-outlined text-accent text-3xl">cloud_upload</span>
                </div>
                <div className="text-center z-10">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-accent transition-colors">Click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">or drag and drop SVG, PNG, JPG</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="imageTitle">
              Image Title <span className="font-normal text-slate-400 normal-case ml-1">(Optional)</span>
            </label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400" 
              id="imageTitle" 
              placeholder="e.g. Modern Lobby Concept" 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="category">Category</label>
            <div className="relative">
              <select 
                className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer" 
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option disabled value="">Select a tag...</option>
                <option value="inspiration">Inspiration</option>
                <option value="architecture">Architecture</option>
                <option value="interior">Interior Design</option>
                <option value="typography">Typography</option>
                <option value="color">Color Palette</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-2 border-t border-slate-50 flex items-center justify-end gap-3 bg-white">
          <button 
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-accent shadow-lg shadow-accent/20 hover:bg-accent-hover hover:shadow-accent/30 transition-all active:scale-95 flex items-center gap-2"
          >
            Add to Moodboard
          </button>
        </div>
          </motion.div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
