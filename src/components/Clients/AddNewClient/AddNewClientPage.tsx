import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClientStore, BrandFont, BrandColor } from '../../../stores/clientStore';
import { ManageTagsSidebar } from '../Sidebars/ManageTagsSidebar';

const SYSTEM_AND_POPULAR_FONTS = [
  // Sans-Serif Default System Fonts
  'Arial',
  'Helvetica',
  'Verdana',
  'Trebuchet MS',
  'Tahoma',
  'Calibri',
  'Segoe UI',
  'BlinkMacSystemFont',
  'system-ui',
  'Geneva',
  'Impact',
  // Serif Default System Fonts
  'Georgia',
  'Times New Roman',
  'Garamond',
  'Palatino',
  'Bookman',
  'Century Schoolbook',
  'Didot',
  // Monospace Default System & Modern Web
  'Courier New',
  'Courier',
  'Consolas',
  'Monaco',
  'Space Mono',
  'Roboto Mono',
  'Fira Code',
  'JetBrains Mono',
  // Popular Editorial Web Fonts
  'Inter',
  'Playfair Display',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Poppins',
  'Oswald',
  'Source Sans Pro',
  'Merriweather',
  'PT Sans',
  'PT Serif',
  'Space Grotesk',
  'Outfit',
  'Cinzel',
  'Lora',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Fraunces',
  'Cabinet Grotesk',
  'Clash Display',
  'Satoshi',
  'General Sans',
  'Syne',
  'Cardo'
];

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | string[];
  className?: string;
  buttonClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, className = '', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // 240px is max-h-60
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const parsedOptions = (options || []).map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
  const selectedOption = parsedOptions.find(opt => opt.value === value) || parsedOptions[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between text-left text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none transition-all w-full ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption?.label || value || 'Select option'}</span>
        <span className="material-symbols-outlined text-slate-400 text-[16px] transition-transform duration-250 shrink-0 select-none ml-1 leading-none" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[100] left-0 right-0 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1 divide-y divide-slate-50 custom-scrollbar min-w-[124px] ${
              openUpwards ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'
            }`}
          >
            {parsedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-accent/10 text-accent hover:bg-accent/15 border-l-2 border-accent'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px] text-accent font-bold leading-none select-none">
                      done
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AddNewClientPageProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEditId?: string;
}

export const AddNewClientPage: React.FC<AddNewClientPageProps> = ({ isOpen, onClose, clientToEditId }) => {
  const addClient = useClientStore(state => state.addClient);
  const updateClient = useClientStore(state => state.updateClient);
  const clients = useClientStore(state => state.clients);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerAvatarUpload = () => {
    avatarFileInputRef.current?.click();
  };
  
  const handleImportBrandKit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.fonts && Array.isArray(json.fonts)) {
          setNewBrandFonts(json.fonts);
        }
        if (json.colors && Array.isArray(json.colors)) {
          setNewBrandColors(json.colors);
        }
      } catch (err) {
        console.error("Invalid JSON imported", err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Step 1: Client Basics
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Prospect' | 'Inactive'>('Active');

  // Step 2: Digital & Social
  const [newEmail, setNewEmail] = useState('');
  const [newBillingEmail, setNewBillingEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSocialProfiles, setNewSocialProfiles] = useState('');
  const [newWebsites, setNewWebsites] = useState('');
  const [draftContactType, setDraftContactType] = useState('Select Type');
  const [draftDomainType, setDraftDomainType] = useState('Select Domain');
  const [draftPlatformType, setDraftPlatformType] = useState('Select Platform');

  // Step 3: Style & Taste
  const [newBrandFonts, setNewBrandFonts] = useState<BrandFont[]>([
    { style: 'Headlines', fontName: 'Inter' },
    { style: 'Body Text', fontName: 'Inter' },
    { style: 'Accents', fontName: 'Playfair Display' }
  ]);
  const [newBrandColors, setNewBrandColors] = useState<BrandColor[]>([
    { name: 'Midnight', hex: '#0F172A' },
    { name: 'Brand Blue', hex: '#1978E5' },
    { name: 'Slate', hex: '#64748B' }
  ]);
  const [newPreferStylesText, setNewPreferStylesText] = useState('');
  const [newPreferStylesImages, setNewPreferStylesImages] = useState('');

  // Temp inputs for adding styles
  const [tempFontName, setTempFontName] = useState('');
  const [tempFontStyle, setTempFontStyle] = useState('Headlines');
  const [tempColorName, setTempColorName] = useState('');
  const [tempColorHex, setTempColorHex] = useState('#2563EB');

  // Autocomplete dropdown index monitoring states
  const [activeFontDropdownIdx, setActiveFontDropdownIdx] = useState<number | null>(null);
  const [isAddFontDropdownVisible, setIsAddFontDropdownVisible] = useState(false);

  const handleAddFont = () => {
    if (!tempFontName.trim()) return;
    setNewBrandFonts([
      ...newBrandFonts,
      { style: tempFontStyle, fontName: tempFontName.trim() }
    ]);
    setTempFontName('');
  };

  const handleRemoveFont = (index: number) => {
    setNewBrandFonts(newBrandFonts.filter((_, i) => i !== index));
  };

  const handleUpdateFontName = (index: number, name: string) => {
    const updated = [...newBrandFonts];
    updated[index].fontName = name;
    setNewBrandFonts(updated);
  };

  const handleUpdateFontStyle = (index: number, style: string) => {
    const updated = [...newBrandFonts];
    updated[index].style = style;
    setNewBrandFonts(updated);
  };

  const handleAddColor = () => {
    const hex = tempColorHex.trim();
    const name = tempColorName.trim() || 'Accent';
    setNewBrandColors([
      ...newBrandColors,
      { name, hex }
    ]);
    setTempColorName('');
    setTempColorHex('#2563EB');
  };

  const handleRemoveColor = (index: number) => {
    setNewBrandColors(newBrandColors.filter((_, i) => i !== index));
  };

  const handleUpdateColorName = (index: number, name: string) => {
    const updated = [...newBrandColors];
    updated[index].name = name;
    setNewBrandColors(updated);
  };

  const handleUpdateColorHex = (index: number, hex: string) => {
    const updated = [...newBrandColors];
    updated[index].hex = hex;
    setNewBrandColors(updated);
  };

  // Manage Tag/Label sidebar controls
  const [isManageTagsSidebarOpen, setIsManageTagsSidebarOpen] = useState(false);
  const [newContactLabel, setNewContactLabel] = useState('Direct');

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && clientToEditId) {
      const client = clients.find(c => c.id === clientToEditId);
      if (client) {
        setNewName(client.name || '');
        setNewCompany(client.company || '');
        setNewLocation(client.location || '');
        setNewStatus(client.status || 'Active');
        setNewAvatarUrl(client.avatarUrl || '');
        setNewEmail(client.email || '');
        setNewBillingEmail(client.billingEmail || '');
        setNewPhone(client.phone || '');
        setNewSocialProfiles(client.socialProfiles?.map(p => p.url).join(', ') || '');
        setNewWebsites(client.websites?.join(', ') || '');
        setNewPreferStylesText(client.stylePreferences?.description || '');
        setNewPreferStylesImages(client.stylePreferences?.imageUrls?.join(', ') || '');
        setNewBrandFonts(client.brandFonts && client.brandFonts.length > 0 ? [...client.brandFonts] : [
          { style: 'Headlines', fontName: 'Inter' },
          { style: 'Body Text', fontName: 'Inter' },
          { style: 'Accents', fontName: 'Playfair Display' }
        ]);
        setNewBrandColors(client.brandColors && client.brandColors.length > 0 ? [...client.brandColors] : [
          { name: 'Midnight', hex: '#0F172A' },
          { name: 'Brand Blue', hex: '#1978E5' },
          { name: 'Slate', hex: '#64748B' }
        ]);
        setStep(1); // Reset to first step when opening
      }
    } else if (isOpen) {
      // fresh onboarding
      setNewName('');
      setNewCompany('');
      setNewLocation('');
      setNewStatus('Active');
      setNewAvatarUrl('');
      setNewEmail('');
      setNewBillingEmail('');
      setNewPhone('');
      setNewSocialProfiles('');
      setNewWebsites('');
      setNewPreferStylesText('');
      setNewPreferStylesImages('');
      setNewBrandFonts([
        { style: 'Headlines', fontName: 'Inter' },
        { style: 'Body Text', fontName: 'Inter' },
        { style: 'Accents', fontName: 'Playfair Display' }
      ]);
      setNewBrandColors([
        { name: 'Midnight', hex: '#0F172A' },
        { name: 'Brand Blue', hex: '#1978E5' },
        { name: 'Slate', hex: '#64748B' }
      ]);
      setStep(1);
    }
  }, [isOpen, clientToEditId, clients]);

  React.useEffect(() => {
    const fontNames = newBrandFonts.map(f => f.fontName).filter(Boolean);
    if (fontNames.length === 0) return;
    const uniqueFonts = Array.from(new Set(fontNames)) as string[];
    const linkId = 'dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const query = uniqueFonts.map(name => `family=${name.trim().replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`).join('&');
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  }, [newBrandFonts]);

  const nextStep = () => {
    if (step < 3) setStep((step + 1) as any);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleCreateClient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !newCompany.trim()) return;

    if (clientToEditId) {
      updateClient(clientToEditId, {
        name: newName,
        company: newCompany,
        location: newLocation || '',
        avatarUrl: newAvatarUrl || undefined,
        email: newEmail || '',
        billingEmail: newBillingEmail || '',
        phone: newPhone || '',
        websites: newWebsites ? newWebsites.split(',').map(s => s.trim()) : [],
        socialProfiles: newSocialProfiles.split(',').filter(x => x.trim()).map(p => ({ platform: 'Social', url: p.trim() })),
        stylePreferences: {
          description: newPreferStylesText,
          imageUrls: newPreferStylesImages ? newPreferStylesImages.split(',').map(s => s.trim()) : []
        },
        brandColors: newBrandColors,
        brandFonts: newBrandFonts,
        status: newStatus,
      });
    } else {
      addClient({
        name: newName,
        company: newCompany,
        role: '',
        email: newEmail || '',
        billingEmail: newBillingEmail || '',
        phone: newPhone || '',
        location: newLocation || '',
        websites: newWebsites ? newWebsites.split(',').map(s => s.trim()) : [],
        socialProfiles: newSocialProfiles.split(',').filter(x => x.trim()).map(p => ({ platform: 'Social', url: p.trim() })),
        stylePreferences: {
          description: newPreferStylesText,
          imageUrls: newPreferStylesImages ? newPreferStylesImages.split(',').map(s => s.trim()) : []
        },
        status: newStatus,
        projectsCount: 1,
        rating: 5.0,
        totalVolume: 0,
        outstandingAmount: 0,
        outstandingPending: false,
        outstandingDueDays: 0,
        communicationRating: 5.0,
        speedRating: 5.0,
        brandColors: newBrandColors,
        brandFonts: newBrandFonts,
        projectHistory: [],
        avatarUrl: newAvatarUrl || undefined
      });
    }

    // Reset & Close
    setStep(1);
    setNewName('');
    setNewCompany('');
    setNewLocation('');
    setNewStatus('Active');
    setNewAvatarUrl('');
    setNewEmail('');
    setNewBillingEmail('');
    setNewPhone('');
    setNewSocialProfiles('');
    setNewWebsites('');
    setNewPreferStylesText('');
    setNewPreferStylesImages('');
    setNewBrandFonts([
      { style: 'Headlines', fontName: 'Inter' },
      { style: 'Body Text', fontName: 'Inter' },
      { style: 'Accents', fontName: 'Playfair Display' }
    ]);
    setNewBrandColors([
      { name: 'Midnight', hex: '#0F172A' },
      { name: 'Brand Blue', hex: '#1978E5' },
      { name: 'Slate', hex: '#64748B' }
    ]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex bg-white">
          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full h-full flex flex-col overflow-hidden"
          >
            <header className="px-8 py-5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl text-gray-900 font-bold tracking-tight">{clientToEditId ? 'Edit Client Info' : 'Add New Client'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{clientToEditId ? 'Modify partner information and style preferences' : 'Onboard a new creative partner to Flow Studio'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {step === 3 && (
                    <>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportBrandKit} 
                        accept=".json" 
                        className="hidden" 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">upload</span>
                        Import Brand Kit
                      </button>
                    </>
                  )}
                  <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 transition-colors rounded-full text-slate-400">
                     <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <aside className="w-64 border-r border-gray-50 p-4 flex flex-col gap-2 bg-slate-50/30 shrink-0 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2.5 px-2">Wizard Steps</p>
                  
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-3.5 w-full p-3.5 rounded-[14px] transition-all duration-300 text-left group ${step === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20 transform scale-[1.02]' : 'bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500 shadow-sm hover:shadow-md'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${step === 1 ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-primary/10'}`}>
                      <span className={`material-symbols-outlined !text-[20px] ${step === 1 ? '!text-white' : 'group-hover:!text-accent'}`}>person</span>
                    </div>
                    <div>
                      <p className={`text-[13px] font-bold leading-tight ${step === 1 ? 'text-white' : 'text-slate-700'}`}>Client Basics</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${step === 1 ? 'text-white/70' : 'text-gray-400'}`}>Step 01</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className={`flex items-center gap-3.5 w-full p-3.5 rounded-[14px] transition-all duration-300 text-left group ${step === 2 ? 'bg-primary text-white shadow-lg shadow-primary/20 transform scale-[1.02]' : 'bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500 shadow-sm hover:shadow-md'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${step === 2 ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-primary/10'}`}>
                      <span className={`material-symbols-outlined !text-[20px] ${step === 2 ? '!text-white' : 'group-hover:!text-accent'}`}>link</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] font-bold leading-tight ${step === 2 ? 'text-white' : 'text-slate-700'}`}>Contact Info</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${step === 2 ? 'text-white/70' : 'text-gray-400'}`}>Step 02</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStep(3)}
                    className={`flex items-center gap-3.5 w-full p-3.5 rounded-[14px] transition-all duration-300 text-left group ${step === 3 ? 'bg-primary text-white shadow-lg shadow-primary/20 transform scale-[1.02]' : 'bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500 shadow-sm hover:shadow-md'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${step === 3 ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-primary/10'}`}>
                      <span className={`material-symbols-outlined !text-[20px] ${step === 3 ? '!text-white' : 'group-hover:!text-accent'}`}>palette</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] font-bold leading-tight ${step === 3 ? 'text-white' : 'text-slate-700'}`}>Style & Taste</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${step === 3 ? 'text-white/70' : 'text-gray-400'}`}>Step 03</p>
                    </div>
                  </button>
                </div>
              </aside>

              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <form className="w-full flex-1 flex flex-col overflow-hidden" id="client-wizard-form" onSubmit={step === 3 ? handleCreateClient : (e) => { e.preventDefault(); nextStep(); }}>
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div 
                        key="step1" 
                        initial={{ opacity: 0, x: 4 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -4 }} 
                        transition={{ duration: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="p-4 sm:p-8 w-full overflow-y-auto custom-scrollbar flex-1 text-left"
                      >
                        <div className="space-y-6 max-w-5xl ml-0 mr-auto w-full">
                          <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-slate-800">Client Basics</h3>
                            <div className="px-2.5 py-1 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">Required</div>
                          </div>
                          <p className="text-gray-400 text-sm">Please provide the primary contact and company information.</p>
                        </div>

                        <div className="space-y-5">
                          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-4">
                            <div className="space-y-1.5 flex flex-col">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 flex-row">
                                <span className="material-symbols-outlined !text-sm">badge</span>
                                Full Name
                              </label>
                              <input 
                                className="w-full rounded-lg py-3 px-4 text-base bg-white border border-gray-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-200 outline-none placeholder:text-gray-300 shadow-sm" 
                                placeholder="Alexander Hamilton" 
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 flex-row">
                                <span className="material-symbols-outlined !text-sm">corporate_fare</span>
                                Company Name
                              </label>
                              <input 
                                className="w-full rounded-lg py-3 px-4 text-base bg-white border border-gray-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-200 outline-none placeholder:text-gray-300 shadow-sm" 
                                placeholder="Treasury Dept. Solutions" 
                                type="text"
                                value={newCompany}
                                onChange={e => setNewCompany(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-1.5 flex flex-col text-left">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 flex-row">
                                <span className="material-symbols-outlined !text-sm">info</span>
                                Client Status
                              </label>
                              <CustomSelect
                                value={newStatus}
                                onChange={(val) => setNewStatus(val as 'Active' | 'Prospect' | 'Inactive')}
                                options={[
                                  { label: 'Active', value: 'Active' },
                                  { label: 'Prospect', value: 'Prospect' },
                                  { label: 'Inactive', value: 'Inactive' }
                                ]}
                                buttonClassName="!py-3 !px-4 !text-base !bg-white !font-medium !rounded-lg border-gray-200 hover:border-gray-300 hover:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 shadow-sm"
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-4">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 flex-row">
                              <span className="material-symbols-outlined !text-sm">photo_camera</span>
                              Profile Picture
                            </label>
                            
                            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                              {/* Avatar Upload Hover Area */}
                              <div className="relative shrink-0">
                                <div 
                                  onClick={handleTriggerAvatarUpload}
                                  className="group relative w-20 h-20 rounded-2xl cursor-pointer overflow-hidden border border-slate-200 bg-slate-50 shadow-md transition-all hover:border-accent"
                                >
                                  {newAvatarUrl ? (
                                    <img 
                                      alt="Preview" 
                                      src={newAvatarUrl} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-200 text-slate-600 font-extrabold text-2xl flex items-center justify-center">
                                      {newName ? newName.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0, 2) : '?'}
                                    </div>
                                  )}
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-xl mb-0.5">photo_camera</span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                                  </div>
                                </div>
                                <input 
                                  type="file" 
                                  ref={avatarFileInputRef} 
                                  onChange={handleAvatarFileChange} 
                                  accept="image/*" 
                                  className="hidden" 
                                />
                              </div>

                              {/* Info and Action */}
                              <div className="flex-1 w-full space-y-3 pt-2 text-left">
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-700">Choose from device</p>
                                  <p className="text-[10px] text-gray-400 font-medium">Click on the image preview to select a photo from your files. JPEG, PNG or GIF are recommended.</p>
                                </div>

                                {newAvatarUrl && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setNewAvatarUrl('')}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">delete</span>
                                      Remove Photo
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 flex-row">
                                <span className="material-symbols-outlined !text-sm">location_on</span>
                                Physical Address
                            </label>
                            <textarea 
                              className="w-full rounded-lg py-3 px-4 text-base bg-white border border-gray-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-200 outline-none placeholder:text-gray-300 shadow-sm resize-none custom-scrollbar" 
                              placeholder="123 Creative Blvd, Design District, NY 10001, USA" 
                              rows={3}
                              value={newLocation}
                              onChange={e => setNewLocation(e.target.value)}
                            ></textarea>
                            <p className="text-[10px] text-gray-400 font-medium pt-1">Used for billing and physical document delivery.</p>
                          </div>
                        </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div 
                        key="step2" 
                        initial={{ opacity: 0, x: 4 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -4 }} 
                        transition={{ duration: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full w-full flex-1 min-h-0 overflow-y-auto lg:overflow-hidden"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-full lg:min-h-full">
                          
                          {/* Left Column */}
                          <div className="bg-white border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-4 sm:p-8 overflow-y-auto lg:h-full">
                            <div className="flex flex-col gap-10">
                              
                              <section className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white shadow-sm rounded-lg text-accent border border-slate-100 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[20px]">contact_mail</span>
                                    </div>
                                    <div>
                                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Core Contact</h2>
                                      <p className="text-[11px] sm:text-xs text-slate-500">Primary communication channels</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setIsManageTagsSidebarOpen(true);
                                    }}
                                    className="text-xs font-semibold text-accent hover:bg-accent/5 px-2 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    <span className="hidden sm:inline">Add Contact</span>
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {/* Primary Email */}
                                  <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-300">
                                    <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                      Email
                                    </div>
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/5 text-accent shadow-sm border border-accent/20">
                                          <span className="material-symbols-outlined text-[20px]">mail</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Primary Email</h3>
                                          <div className="flex gap-1.5">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Brand</span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 hidden sm:inline-block">Direct</span>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">alternate_email</span>
                                          <input 
                                            className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                            placeholder="hello@flowstudio.com" 
                                            type="email" 
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-1">
                                          <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                      </div>
                                    </div>
                                    <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Contact">
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                  </div>

                                  {/* Billing Email */}
                                  <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-orange-500/30 transition-all duration-300">
                                    <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                      Email
                                    </div>
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50">
                                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Billing Email</h3>
                                          <div className="flex gap-1.5">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100">Billing</span>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">alternate_email</span>
                                          <input 
                                            className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                            placeholder="billing@flowstudio.com" 
                                            type="email" 
                                            value={newBillingEmail}
                                            onChange={e => setNewBillingEmail(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-1">
                                          <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                      </div>
                                    </div>
                                    <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Contact">
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                  </div>

                                  {/* Phone */}
                                  <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-green-500/30 transition-all duration-300">
                                    <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                      Phone
                                    </div>
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600 shadow-sm border border-green-100/50">
                                          <span className="material-symbols-outlined text-[20px]">call</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition-colors">Direct Line</h3>
                                          <div className="flex gap-1.5">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/5 text-accent border border-accent/20">Office</span>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">dialpad</span>
                                          <input 
                                            className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                            placeholder="+1 (555) 000-0000" 
                                            type="tel"
                                            value={newPhone}
                                            onChange={e => setNewPhone(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-1">
                                          <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                      </div>
                                    </div>
                                    <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Contact">
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                  </div>

                                  {/* Add New Type */}
                                  <div className="group relative bg-slate-50 border-2 border-dashed border-accent/30 rounded-xl p-4 hover:border-accent/60 hover:bg-slate-50/80 transition-colors">
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 shadow-sm">
                                          <span className="material-symbols-outlined text-[20px]">add</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="relative flex-1 max-w-[140px] z-[90]">
                                            <CustomSelect value={draftContactType} onChange={setDraftContactType} options={['Select Type', 'Email', 'Phone', 'Slack']} buttonClassName="!border-none !bg-transparent !py-0 !pl-0 !pr-6 text-sm font-bold text-slate-700 hover:!bg-slate-50" />
                                          </div>
                                          <div className="flex gap-1.5">
                                            <button 
                                              type="button" 
                                              onClick={() => setIsManageTagsSidebarOpen(true)}
                                              className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200 border-dashed hover:border-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                                            >
                                              {newContactLabel ? `# ${newContactLabel}` : '+ Label'}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">edit</span>
                                          <input 
                                            className="w-full bg-transparent border-b border-transparent focus:border-slate-300 py-1 pl-6 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none transition-colors" 
                                            placeholder="Enter Email or Phone" 
                                            type="text" 
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-0.5 flex gap-0.5 items-center">
                                        <button type="button" className="p-1 text-slate-400 hover:text-accent transition-colors rounded" title="Save">
                                          <span className="material-symbols-outlined text-[16px]">check</span>
                                        </button>
                                        <button type="button" className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded" title="Cancel">
                                          <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </section>

                              <section className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white shadow-sm rounded-lg text-accent border border-slate-100 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[20px]">public</span>
                                    </div>
                                    <div>
                                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Digital Presence</h2>
                                      <p className="text-[11px] sm:text-xs text-slate-500">Websites & Domains</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setIsManageTagsSidebarOpen(true);
                                    }}
                                    className="text-xs font-semibold text-accent hover:bg-accent/5 px-2 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">add_link</span>
                                    <span className="hidden sm:inline">Add Domain</span>
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {/* Website */}
                                  <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                      Website
                                    </div>
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                                          <span className="material-symbols-outlined text-[20px]">language</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Main Domain</h3>
                                          <div className="flex gap-1.5">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Production</span>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">link</span>
                                          <input 
                                            className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                            placeholder="https://" 
                                            type="url" 
                                            value={newWebsites}
                                            onChange={e => setNewWebsites(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-1">
                                          <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                      </div>
                                    </div>
                                    <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Domain">
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                  </div>

                                  {/* Add New Domain Type */}
                                  <div className="group relative bg-slate-50 border-2 border-dashed border-accent/30 rounded-xl p-4 hover:border-accent/60 hover:bg-slate-50/80 transition-colors">
                                    <div className="flex items-start gap-4">
                                      <div className="mt-0.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 shadow-sm">
                                          <span className="material-symbols-outlined text-[20px]">public</span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="relative flex-1 max-w-[140px] z-[90]">
                                            <CustomSelect value={draftDomainType} onChange={setDraftDomainType} options={['Select Domain', 'Website', 'Portfolio', 'Store']} buttonClassName="!border-none !bg-transparent !py-0 !pl-0 !pr-6 text-sm font-bold text-slate-700 hover:!bg-slate-50" />
                                          </div>
                                          <div className="flex gap-1.5">
                                            <button type="button" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-slate-400 border border-slate-200 border-dashed hover:border-slate-300 hover:text-slate-600 transition-colors">
                                              + Tag
                                            </button>
                                          </div>
                                        </div>
                                        <div className="relative flex items-center">
                                          <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">link</span>
                                          <input 
                                            className="w-full bg-transparent border-b border-transparent focus:border-slate-300 py-1 pl-6 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none transition-colors" 
                                            placeholder="https://" 
                                            type="url" 
                                          />
                                        </div>
                                      </div>
                                      <div className="pt-0.5 flex gap-0.5 items-center">
                                        <button type="button" className="p-1 text-slate-400 hover:text-accent transition-colors rounded" title="Save">
                                          <span className="material-symbols-outlined text-[16px]">check</span>
                                        </button>
                                        <button type="button" className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded" title="Cancel">
                                          <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </section>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="bg-white px-4 py-4 sm:p-8 overflow-y-auto lg:h-full">
                            <section className="space-y-6 h-full max-w-lg mx-auto">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Social Profiles</h2>
                                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Connect your brand accounts</p>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setIsManageTagsSidebarOpen(true);
                                  }}
                                  className="text-xs font-semibold text-accent hover:bg-accent/5 px-2 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">add</span>
                                  <span className="hidden sm:inline">Add Platform</span>
                                </button>
                              </div>

                              <div className="space-y-3">
                                {/* Facebook */}
                                <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-300">
                                  <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                    Platform
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="mt-0.5">
                                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/5 text-[#1877F2] shadow-sm border border-accent/30">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-[#1877F2] transition-colors">Connect on Facebook</h3>
                                      <div className="relative flex items-center">
                                        <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">link</span>
                                        <input 
                                          className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                          placeholder="facebook.com/brand" 
                                          type="text" 
                                          value={newSocialProfiles}
                                          onChange={e => setNewSocialProfiles(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="pt-1">
                                        <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                    </div>
                                  </div>
                                  <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Platform">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>

                                {/* LinkedIn */}
                                <div className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-300">
                                  <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 rounded shadow-sm">
                                    Platform
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="mt-0.5">
                                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/5 text-[#0A66C2] shadow-sm border border-accent/30">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-[#0A66C2] transition-colors">Connect on LinkedIn</h3>
                                      <div className="relative flex items-center">
                                        <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">link</span>
                                        <input 
                                          className="w-full bg-transparent border-none py-1 pl-6 text-xs font-medium text-slate-600 placeholder-slate-400 focus:ring-0 focus:outline-none group-hover:text-slate-900 transition-colors" 
                                          placeholder="Profile URL" 
                                          type="text" 
                                        />
                                      </div>
                                    </div>
                                    <div className="pt-1">
                                        <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
                                    </div>
                                  </div>
                                  <button type="button" className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded" title="Remove Platform">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>

                                {/* Add New Platform */}
                                <div className="group relative bg-slate-50 border-2 border-dashed border-accent/30 rounded-xl p-4 hover:border-accent/60 hover:bg-slate-50/80 transition-colors">
                                  <div className="flex items-start gap-4">
                                    <div className="mt-0.5">
                                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 shadow-sm">
                                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="relative flex-1 max-w-[140px] z-[90]">
                                          <CustomSelect value={draftPlatformType} onChange={setDraftPlatformType} options={['Select Platform', 'Twitter / X', 'YouTube', 'TikTok']} buttonClassName="!border-none !bg-transparent !py-0 !pl-0 !pr-6 text-sm font-bold text-slate-700 hover:!bg-slate-50" />
                                        </div>
                                        <div className="flex gap-1.5">
                                          <button type="button" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-slate-400 border border-slate-200 border-dashed hover:border-slate-300 hover:text-slate-600 transition-colors">
                                            + Label
                                          </button>
                                        </div>
                                      </div>
                                      <div className="relative flex items-center">
                                        <span className="material-symbols-outlined absolute left-0 text-slate-400 pointer-events-none text-[16px]">link</span>
                                        <input 
                                          className="w-full bg-transparent border-b border-transparent focus:border-slate-300 py-1 pl-6 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none transition-colors" 
                                          placeholder="Handle or URL" 
                                          type="text" 
                                        />
                                      </div>
                                    </div>
                                    <div className="pt-0.5 flex gap-0.5 items-center">
                                      <button type="button" className="p-1 text-slate-400 hover:text-accent transition-colors rounded" title="Save">
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                      </button>
                                      <button type="button" className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded" title="Cancel">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>

                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div 
                        key="step3" 
                        initial={{ opacity: 0, x: 4 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -4 }} 
                        transition={{ duration: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full flex flex-col relative w-full flex-1 min-h-0"
                      >
                        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-white">
                          {/* Typography Sections (Left Col) */}
                          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-white lg:h-full relative shrink-0">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent">text_fields</span>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Typography & Fonts</h3>
                              </div>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar flex flex-col justify-between">
                              <div className="divide-y divide-slate-100">
                                {newBrandFonts.map((font, idx) => (
                                  <div key={idx} className="bg-white p-6 relative group transition-all hover:bg-slate-50/55">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <CustomSelect
                                          value={font.style}
                                          onChange={(val) => handleUpdateFontStyle(idx, val)}
                                          options={['Headlines', 'Body Text', 'Accents', 'Display', 'Captions']}
                                          buttonClassName="!border-none !bg-accent/5 !text-accent hover:!bg-accent/10"
                                        />
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <div className="relative">
                                          <input 
                                            type="text" 
                                            value={font.fontName} 
                                            onChange={e => handleUpdateFontName(idx, e.target.value)}
                                            onFocus={() => {
                                              setActiveFontDropdownIdx(idx);
                                              setIsAddFontDropdownVisible(false);
                                            }}
                                            onBlur={() => {
                                              setTimeout(() => {
                                                setActiveFontDropdownIdx(prev => prev === idx ? null : prev);
                                              }, 200);
                                            }}
                                            className="w-[185px] text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-accent focus:bg-white focus:outline-none transition-all placeholder-slate-400"
                                            placeholder="Edit font (e.g., Inter)"
                                          />

                                           {/* Autocomplete Menu Dropdown for Inline Edit */}
                                          {activeFontDropdownIdx === idx && (
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 divide-y divide-slate-50 custom-scrollbar">
                                              {(() => {
                                                const currentVal = font.fontName;
                                                const uniqueFonts = Array.from(new Set(SYSTEM_AND_POPULAR_FONTS)) as string[];
                                                
                                                // Heuristic: If current input value matches a known font exactly, or input is empty, show all.
                                                const isExactOrEmpty = !currentVal || uniqueFonts.some(f => f.toLowerCase() === currentVal.trim().toLowerCase());
                                                
                                                let finalOptions: { font: string; isSelected: boolean }[] = [];
                                                
                                                if (isExactOrEmpty) {
                                                  finalOptions = uniqueFonts.map(f => ({
                                                    font: f,
                                                    isSelected: f.toLowerCase() === currentVal.trim().toLowerCase()
                                                  })).sort((a, b) => {
                                                    if (a.isSelected) return -1;
                                                    if (b.isSelected) return 1;
                                                    return a.font.localeCompare(b.font);
                                                  });
                                                } else {
                                                  const query = currentVal.trim().toLowerCase();
                                                  const matches = uniqueFonts.filter(f => f.toLowerCase().includes(query));
                                                  finalOptions = matches.map(f => ({
                                                    font: f,
                                                    isSelected: f.toLowerCase() === currentVal.trim().toLowerCase()
                                                  })).sort((a, b) => {
                                                    if (a.isSelected) return -1;
                                                    if (b.isSelected) return 1;
                                                    return a.font.localeCompare(b.font);
                                                  });
                                                }
                                                
                                                if (finalOptions.length === 0) {
                                                  return (
                                                    <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">
                                                      Press Enter/Type custom font
                                                    </div>
                                                  );
                                                }
                                                
                                                return finalOptions.map(({ font: suggestedFont, isSelected }) => (
                                                  <button
                                                    key={suggestedFont}
                                                    type="button"
                                                    onMouseDown={() => {
                                                      handleUpdateFontName(idx, suggestedFont);
                                                      setActiveFontDropdownIdx(null);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                                                      isSelected 
                                                        ? 'bg-accent/10 text-accent hover:bg-accent/15 border-l-2 border-accent' 
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                  >
                                                    <span style={{ fontFamily: `"${suggestedFont}", sans-serif` }}>{suggestedFont}</span>
                                                    {isSelected ? (
                                                      <div className="flex items-center gap-1 bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 mr-1 shadow-sm">
                                                        <span className="material-symbols-outlined text-[9px] font-extrabold leading-none">done</span>
                                                        <span>Selected</span>
                                                      </div>
                                                    ) : (
                                                      <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Preview</span>
                                                    )}
                                                  </button>
                                                ));
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveFont(idx)}
                                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Remove Font"
                                        >
                                          <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Preview Block with Real Custom Font Sync */}
                                    <div className="mt-1">
                                      <div 
                                        className="text-slate-900 leading-tight select-all font-medium transition-all" 
                                        style={{ 
                                          fontFamily: `"${font.fontName}", sans-serif`,
                                          fontSize: font.style === 'Headlines' || font.style === 'Display' ? '28px' : '15px',
                                          fontWeight: font.style === 'Headlines' || font.style === 'Display' ? 'bold' : 'normal',
                                          fontStyle: font.style === 'Accents' ? 'italic' : 'normal'
                                        }}
                                      >
                                        {font.style === 'Body Text' ? (
                                          `The quick brown fox jumps over the lazy dog. Used for primary narrative, body layouts and standard instructions.`
                                        ) : font.style === 'Accents' ? (
                                          `Elegant quote rendering in ${font.fontName} italic style.`
                                        ) : (
                                          `The Quick Brown Fox — Headline`
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {newBrandFonts.length === 0 && (
                                  <div className="p-8 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300 block">font_download</span>
                                    No liked fonts configured yet. Add some below!
                                  </div>
                                )}
                              </div>

                              {/* Form to append Font */}
                              <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Add Liked Custom Font</h4>
                                <div className="flex gap-2 items-center">
                                  <div className="relative flex-1">
                                    <input 
                                      type="text" 
                                      placeholder="Font Family (e.g., Space Grotesk, Roboto)" 
                                      value={tempFontName}
                                      onChange={e => setTempFontName(e.target.value)}
                                      onFocus={() => {
                                        setIsAddFontDropdownVisible(true);
                                        setActiveFontDropdownIdx(null);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          setIsAddFontDropdownVisible(false);
                                        }, 200);
                                      }}
                                      className="w-full text-xs bg-white border border-slate-250 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-accent focus:outline-none placeholder-slate-400"
                                    />                                     {/* Autocomplete Menu Dropdown for Adding Font */}
                                    {isAddFontDropdownVisible && (
                                      <div className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 divide-y divide-slate-50 custom-scrollbar">
                                        {(() => {
                                          const currentVal = tempFontName;
                                          const uniqueFonts = Array.from(new Set(SYSTEM_AND_POPULAR_FONTS)) as string[];
                                          
                                          // Heuristic: If current input value matches exactly, or is empty, show all available suggestions.
                                          const isExactOrEmpty = !currentVal || uniqueFonts.some(f => f.toLowerCase() === currentVal.trim().toLowerCase());
                                          
                                          let finalOptions: { font: string; isSelected: boolean }[] = [];
                                          
                                          if (isExactOrEmpty) {
                                            finalOptions = uniqueFonts.map(f => ({
                                              font: f,
                                              isSelected: f.toLowerCase() === currentVal.trim().toLowerCase()
                                            })).sort((a, b) => {
                                              if (a.isSelected) return -1;
                                              if (b.isSelected) return 1;
                                              return a.font.localeCompare(b.font);
                                            });
                                          } else {
                                            const query = currentVal.trim().toLowerCase();
                                            const matches = uniqueFonts.filter(f => f.toLowerCase().includes(query));
                                            finalOptions = matches.map(f => ({
                                              font: f,
                                              isSelected: f.toLowerCase() === currentVal.trim().toLowerCase()
                                            })).sort((a, b) => {
                                              if (a.isSelected) return -1;
                                              if (b.isSelected) return 1;
                                              return a.font.localeCompare(b.font);
                                            });
                                          }
                                          
                                          if (finalOptions.length === 0) {
                                            return (
                                              <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">
                                                Press Add to include custom font
                                              </div>
                                            );
                                          }
                                          
                                          return finalOptions.map(({ font: suggestedFont, isSelected }) => (
                                            <button
                                              key={suggestedFont}
                                              type="button"
                                              onMouseDown={() => {
                                                setTempFontName(suggestedFont);
                                                setIsAddFontDropdownVisible(false);
                                              }}
                                              className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                                                isSelected 
                                                  ? 'bg-accent/10 text-accent hover:bg-accent/15 border-l-2 border-accent' 
                                                  : 'text-slate-700 hover:bg-slate-50'
                                              }`}
                                            >
                                              <span style={{ fontFamily: `"${suggestedFont}", sans-serif` }}>{suggestedFont}</span>
                                              {isSelected ? (
                                                <div className="flex items-center gap-1 bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 mr-1 shadow-sm">
                                                  <span className="material-symbols-outlined text-[9px] font-extrabold leading-none">done</span>
                                                  <span>Selected</span>
                                                </div>
                                              ) : (
                                                <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Preview</span>
                                              )}
                                            </button>
                                          ));
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  <CustomSelect
                                    value={tempFontStyle}
                                    onChange={(val) => setTempFontStyle(val)}
                                    options={['Headlines', 'Body Text', 'Accents', 'Display', 'Captions']}
                                  />
                                  <button 
                                    type="button" 
                                    onClick={handleAddFont}
                                    className="bg-primary text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1 shrink-0 h-9"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    <span>Add</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Brand Colors Section (Right Col) */}
                          <div className="w-full lg:w-1/2 flex flex-col bg-white lg:h-full relative shrink-0">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent">palette</span>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Brand Color Palette</h3>
                              </div>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar flex flex-col justify-between">
                              <div className="p-6 space-y-6">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">Palette Builder</label>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Interactive Pickers</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    {newBrandColors.map((color, idx) => (
                                      <div key={idx} className="group relative bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col">
                                        <div 
                                          className="relative w-full h-20 rounded-lg shadow-inner mb-2.5 overflow-hidden border border-white flex items-center justify-center transition-transform hover:scale-[1.02]" 
                                          style={{ backgroundColor: color.hex }}
                                        >
                                          {/* Invisible Hex Color picker overlays entire swatch box */}
                                          <input 
                                            type="color" 
                                            value={color.hex} 
                                            onChange={e => handleUpdateColorHex(idx, e.target.value)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                            title="Click to select custom color"
                                          />
                                          <span className="text-[10px] bg-black/50 text-white px-2 py-1 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                                            Change Color
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          {/* Inline HEX Text input */}
                                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                            <span className="text-[10px] font-mono text-slate-400 font-bold">#</span>
                                            <input 
                                              type="text" 
                                              value={color.hex.replace('#', '')} 
                                              onChange={e => {
                                                const val = e.target.value;
                                                const updateValue = val.startsWith('#') ? val : `#${val}`;
                                                handleUpdateColorHex(idx, updateValue);
                                              }}
                                              maxLength={7}
                                              className="w-full bg-transparent border-none text-[11px] font-mono font-bold text-slate-800 focus:ring-0 focus:outline-none p-0"
                                            />
                                          </div>
                                          
                                          {/* Inline Name text input */}
                                          <input 
                                            type="text" 
                                            value={color.name} 
                                            onChange={e => handleUpdateColorName(idx, e.target.value)}
                                            placeholder="Color Tag"
                                            className="w-full bg-transparent border-none text-[10px] font-bold text-slate-500 uppercase tracking-wider focus:ring-0 focus:outline-none p-0 text-center mt-1"
                                          />
                                        </div>

                                        {/* Remove color node */}
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveColor(idx)}
                                          className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-md border border-slate-100 transition-all opacity-0 group-hover:opacity-100 z-20"
                                          title="Remove Color"
                                        >
                                          <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                      </div>
                                    ))}

                                    {newBrandColors.length === 0 && (
                                      <div className="col-span-3 py-10 text-center text-slate-400">
                                        <span className="material-symbols-outlined text-3xl mb-1 text-slate-300 block font-light">palette</span>
                                        No colors configured in palette. Create one below!
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Form to Append solid Color */}
                              <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Add Custom Color to Palette</h4>
                                <div className="flex gap-2 items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                                  {/* Swatch picker button */}
                                  <div 
                                    className="relative w-9 h-9 rounded-lg overflow-hidden border border-white shrink-0 shadow-sm transition-transform hover:scale-[1.05]"
                                    style={{ backgroundColor: tempColorHex }}
                                  >
                                    <input 
                                      type="color" 
                                      value={tempColorHex}
                                      onChange={e => setTempColorHex(e.target.value)}
                                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <input 
                                      type="text" 
                                      placeholder="Color Label (e.g. Coral Accent)" 
                                      value={tempColorName}
                                      onChange={e => setTempColorName(e.target.value)}
                                      className="w-full h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-800 focus:bg-white focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none placeholder-slate-400 transition-all"
                                    />
                                  </div>
                                  <div className="w-[85px] shrink-0">
                                    <input 
                                      type="text" 
                                      value={tempColorHex}
                                      onChange={e => setTempColorHex(e.target.value)}
                                      className="w-full h-9 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-800 focus:bg-white focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-all"
                                    />
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={handleAddColor}
                                    className="bg-primary text-white rounded-lg px-4 py-1.5 text-xs font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1 shrink-0 h-9 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    <span>Add</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-gray-50 bg-white flex justify-between items-center shrink-0">
              <div>
                {step > 1 && (
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-[12px] text-xs font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  className="bg-white border border-gray-200 text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-[12px] text-xs font-bold shadow-sm hover:bg-gray-50 transition-all uppercase tracking-widest"
                  onClick={onClose}
                >
                  <span>Cancel</span>
                </button>
                {step < 3 ? (
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="bg-primary text-white px-8 py-2.5 rounded-[12px] text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all uppercase tracking-widest"
                  >
                    Continue
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => handleCreateClient()}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-[12px] text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2 uppercase tracking-widest"
                  >
                    <span>{clientToEditId ? 'Save Changes' : 'Create Client'}</span>
                    <span className="material-symbols-outlined !text-white !text-[16px]">{clientToEditId ? 'check' : 'add'}</span>
                  </button>
                )}
              </div>
            </footer>
          </motion.main>

          <ManageTagsSidebar
            isOpen={isManageTagsSidebarOpen}
            onClose={() => setIsManageTagsSidebarOpen(false)}
            selectedLabel={newContactLabel}
            onSelectLabel={setNewContactLabel}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
