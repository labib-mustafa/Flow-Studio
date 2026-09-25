import React, { useRef } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { toast } from '../../stores/toastStore';
import { Building2, Globe, Mail, MapPin, Receipt, Clock, Upload, RotateCcw } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'CAD', symbol: '$', label: 'CAD ($) — Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD ($) — Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) — Japanese Yen' },
  { code: 'CHF', symbol: 'Fr.', label: 'CHF (Fr.) — Swiss Franc' },
];

export const StudioTab: React.FC = () => {
  const workspace = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      workspace.updateWorkspace({ logo: reader.result as string });
      toast.success('Studio logo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleCurrencyChange = (code: string) => {
    const option = CURRENCIES.find((c) => c.code === code);
    if (option) {
      workspace.updateWorkspace({ currency: option.code, currencySymbol: option.symbol });
      toast.success(`Default currency set to ${option.code}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* SECTION 1: Brand & Studio Identity */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Studio & Company Identity</h3>
              <p className="text-xs text-slate-500">Brand identity used across Flow Studio and client documents.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              workspace.resetWorkspace();
              toast.info('Restored default workspace settings');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative group size-20 rounded-2xl overflow-hidden flex items-center justify-center">
              {workspace.logo ? (
                <img src={workspace.logo} alt="Studio Logo" className="size-full object-cover" />
              ) : (
                <img src="/logo.png" alt="Flow Studio" className="size-20 object-contain" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer"
              >
                <Upload className="size-3.5" /> Change
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            {workspace.logo && (
              <button
                type="button"
                onClick={() => workspace.updateWorkspace({ logo: '' })}
                className="text-[11px] font-semibold text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Name</label>
              <input
                type="text"
                value={workspace.name}
                onChange={(e) => workspace.updateWorkspace({ name: e.target.value })}
                placeholder="e.g. Acme Creative Studio"
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tagline</label>
              <input
                type="text"
                value={workspace.tagline}
                onChange={(e) => workspace.updateWorkspace({ tagline: e.target.value })}
                placeholder="e.g. Brand & Digital Product Studio"
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Website</label>
              <div className="relative flex items-center">
                <Globe className="size-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={workspace.website}
                  onChange={(e) => workspace.updateWorkspace({ website: e.target.value })}
                  placeholder="https://acme.design"
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Studio Email</label>
              <div className="relative flex items-center">
                <Mail className="size-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={workspace.email}
                  onChange={(e) => workspace.updateWorkspace({ email: e.target.value })}
                  placeholder="hello@acme.design"
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Legal & Invoicing Defaults */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
          <div className="size-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-xs">
            <Receipt className="size-4 text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Legal & Invoicing Defaults</h3>
            <p className="text-xs text-slate-500">Auto-populates client invoices, contracts, and payment receipts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Legal Business Name</label>
            <input
              type="text"
              value={workspace.legalName}
              onChange={(e) => workspace.updateWorkspace({ legalName: e.target.value })}
              placeholder="e.g. Acme Creative LLC"
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tax ID / VAT</label>
            <input
              type="text"
              value={workspace.taxId}
              onChange={(e) => workspace.updateWorkspace({ taxId: e.target.value })}
              placeholder="e.g. US-12345678 or VAT-GB999"
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Business Address</label>
            <div className="relative flex items-start">
              <MapPin className="size-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                value={workspace.address}
                onChange={(e) => workspace.updateWorkspace({ address: e.target.value })}
                placeholder="100 Design St, Suite 400, New York, NY 10001, USA"
                rows={2}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900 resize-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Default Currency</label>
            <select
              value={workspace.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900 cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Operating Hours</label>
            <div className="relative flex items-center">
              <Clock className="size-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={workspace.workingHours}
                onChange={(e) => workspace.updateWorkspace({ workingHours: e.target.value })}
                placeholder="Mon - Fri, 9:00 AM - 6:00 PM"
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 focus:border-zinc-900 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
