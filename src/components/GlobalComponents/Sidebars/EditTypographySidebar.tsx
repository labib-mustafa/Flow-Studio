import React, { useState, useEffect } from 'react';
import { CustomSelect } from '../CustomSelect';

interface EditTypographySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    styleName: string;
    fontFamily: string;
    weight: string;
    size: number;
    lineHeight: number;
    letterSpacing: number;
  };
  onSave: (data: {
    styleName: string;
    fontFamily: string;
    weight: string;
    size: number;
    lineHeight: number;
    letterSpacing: number;
  }) => void;
}

const defaultData = {
  styleName: 'Heading 1',
  fontFamily: 'Playfair Display',
  weight: 'Medium (500)',
  size: 32,
  lineHeight: 1.2,
  letterSpacing: -0.02,
};

export const EditTypographySidebar: React.FC<EditTypographySidebarProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState(defaultData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || defaultData);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter', icon: 'text_fields' },
    { value: 'Roboto', label: 'Roboto', icon: 'text_fields' },
    { value: 'Playfair Display', label: 'Playfair Display', icon: 'serif' },
    { value: 'Merriweather', label: 'Merriweather', icon: 'serif' },
    { value: 'Space Mono', label: 'Space Mono', icon: 'monospace' },
  ];

  const weightOptions = [
    { value: 'Regular (400)', label: 'Regular (400)', icon: 'format_bold' },
    { value: 'Medium (500)', label: 'Medium (500)', icon: 'format_bold' },
    { value: 'SemiBold (600)', label: 'SemiBold (600)', icon: 'format_bold' },
    { value: 'Bold (700)', label: 'Bold (700)', icon: 'format_bold' },
  ];

  return (
    <div 
      className={`absolute inset-y-0 right-0 z-40 flex max-w-full pointer-events-none transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="w-screen max-w-sm pointer-events-auto h-full no-pan" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <div className="flex h-full flex-col bg-white shadow-2xl border-l border-slate-200">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
            <h3 className="text-xl font-bold text-slate-900">Edit Typography</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {/* Preview Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center mb-8 relative group min-h-[160px]">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setFormData(defaultData)}
                  className="text-slate-400 hover:text-[#1978e5] transition-colors bg-white rounded-md p-1 shadow-sm border border-slate-100"
                  title="Reset to Default"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
              <h1 
                className="text-7xl text-slate-900 mb-2 transition-all duration-300"
                style={{ 
                  fontFamily: formData.fontFamily, 
                  fontWeight: formData.weight.includes('700') ? 700 : formData.weight.includes('600') ? 600 : formData.weight.includes('500') ? 500 : 400,
                  fontSize: `${formData.size}px`,
                  lineHeight: formData.lineHeight,
                  letterSpacing: `${formData.letterSpacing}em`
                }}
              >
                Aa
              </h1>
              <p 
                className="text-lg text-slate-600 text-center transition-all duration-300"
                style={{ fontFamily: formData.fontFamily }}
              >
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Style Name</label>
                <input 
                  className="w-full border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] py-2.5 px-3 bg-white outline-none transition-all" 
                  placeholder="e.g. Body Large" 
                  type="text" 
                  value={formData.styleName}
                  onChange={(e) => handleChange('styleName', e.target.value)}
                />
              </div>
              
              <CustomSelect
                label="Font Family"
                options={fontOptions}
                value={formData.fontFamily}
                onChange={(val) => handleChange('fontFamily', val)}
                width={340}
              />
              
              <CustomSelect
                label="Weight"
                options={weightOptions}
                value={formData.weight}
                onChange={(val) => handleChange('weight', val)}
                width={340}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Size</label>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#1978e5] focus-within:border-[#1978e5] transition-all">
                    <input 
                      className="w-full border-0 text-sm font-medium text-slate-700 focus:ring-0 py-2.5 px-3 outline-none" 
                      type="number" 
                      value={formData.size}
                      onChange={(e) => handleChange('size', Number(e.target.value))}
                    />
                    <span className="text-xs font-bold text-slate-400 pr-3 border-l border-slate-100 pl-3 py-2.5 bg-slate-50">px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Line Height</label>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#1978e5] focus-within:border-[#1978e5] transition-all">
                    <input 
                      className="w-full border-0 text-sm font-medium text-slate-700 focus:ring-0 py-2.5 px-3 outline-none" 
                      step="0.1" 
                      type="number" 
                      value={formData.lineHeight}
                      onChange={(e) => handleChange('lineHeight', Number(e.target.value))}
                    />
                    <span className="text-xs font-bold text-slate-400 pr-3 border-l border-slate-100 pl-3 py-2.5 bg-slate-50">em</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Letter Spacing</label>
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#1978e5] focus-within:border-[#1978e5] transition-all">
                  <input 
                    className="w-full border-0 text-sm font-medium text-slate-700 focus:ring-0 py-2.5 px-3 outline-none" 
                    step="0.01" 
                    type="number" 
                    value={formData.letterSpacing}
                    onChange={(e) => handleChange('letterSpacing', Number(e.target.value))}
                  />
                  <span className="text-xs font-bold text-slate-400 pr-3 border-l border-slate-100 pl-3 py-2.5 bg-slate-50">em</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3 z-10">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-5 py-2.5 bg-[#1978e5] hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
