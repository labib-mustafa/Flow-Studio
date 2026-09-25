import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Building2, Upload, Loader2, Sparkles } from 'lucide-react';
import { useWorkspaceRegistry } from '../../stores/workspaceStore';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: '$', label: 'CAD ($)' },
  { code: 'AUD', symbol: '$', label: 'AUD ($)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
];

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const createWorkspace = useWorkspaceRegistry((s) => s.createWorkspace);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logo, setLogo] = useState('');
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const curr = CURRENCIES[currencyIndex];
      await createWorkspace({
        name: name.trim(),
        tagline: tagline.trim(),
        logo,
        currency: curr.code,
        currencySymbol: curr.symbol,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create workspace:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-left relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Building2 className="size-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Create Workspace</h3>
              <p className="text-[11px] text-zinc-400">Add a dedicated studio or company hub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Logo Picker & Studio Name */}
          <div className="flex items-center gap-3.5">
            <label className="relative size-14 rounded-2xl bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group shrink-0">
              {logo ? (
                <img src={logo} alt="Logo" className="size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-zinc-500 group-hover:text-zinc-300">
                  <Upload className="size-4" />
                  <span className="text-[9px] mt-0.5 font-medium">Logo</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>

            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Studio / Company Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Creative Lab"
                className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
              />
            </div>
          </div>

          {/* Tagline / Studio Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-300">Studio Category or Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Digital Design & Branding Agency"
              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-300">Primary Billing Currency</label>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((curr, idx) => (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => setCurrencyIndex(idx)}
                  className={`h-9 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currencyIndex === idx
                      ? 'bg-zinc-800 border-zinc-600 text-white shadow-xs'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="font-semibold text-zinc-300">{curr.symbol}</span>
                  <span>{curr.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 h-9 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 h-9 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
