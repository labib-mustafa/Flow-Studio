import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export const DefaultsTab: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleDefaultsChange = (newDefaults: Partial<typeof settings.defaults>) => {
    updateSettings({
      defaults: {
        ...settings.defaults,
        ...newDefaults
      }
    });
  };

  const handleTypographyChange = (newTypography: Partial<typeof settings.defaults.typography>) => {
    updateSettings({
      defaults: {
        ...settings.defaults,
        typography: {
          ...settings.defaults.typography,
          ...newTypography
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-12 text-left">
      <section className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#111111] font-display -tracking-[0.02em]">New Project Defaults</h3>
            <p className="text-xs text-[#6b7280] mt-0.5">Configure the standard setup for any new project you create.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <label className="block text-xs font-semibold text-[#6b7280] mb-5 uppercase tracking-widest">Default Canvas Size</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'social', label: 'Social Square', size: '1080 × 1080 px', icon: 'crop_square', aspect: 'aspect-[1/1]' },
              { id: 'hd', label: 'Full HD', size: '1920 × 1080 px', icon: 'aspect_ratio', aspect: 'aspect-[16/9]' },
              { id: 'portrait', label: 'Mobile Portrait', size: '1080 × 1920 px', icon: 'ad_units', aspect: 'aspect-[9/16]' },
              { id: 'custom', label: 'Custom Size', size: 'Define manually', icon: 'tune', aspect: '' }
            ].map((item) => (
              <label key={item.id} className="group relative flex flex-col cursor-pointer">
                <input 
                  className="peer sr-only" 
                  name="canvas_size" 
                  type="radio" 
                  value={item.id}
                  checked={settings.defaults.canvasSize === item.id}
                  onChange={() => handleDefaultsChange({ canvasSize: item.id as any })}
                />
                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 transition-all peer-checked:border-[#111111] peer-checked:bg-[#f5f5f5] hover:bg-slate-50">
                  {item.id !== 'custom' ? (
                    <div className={`${item.aspect} w-full bg-[#f8f9fa] rounded-lg mb-4 flex items-center justify-center border border-slate-200/60 ${item.id === 'portrait' ? 'mx-auto max-w-[50%]' : ''}`}>
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200/50 shadow-xs">
                        <span className="material-symbols-outlined text-xl text-[#111111]">{item.icon}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/9] w-full border border-dashed border-slate-300 rounded-lg mb-4 flex flex-col items-center justify-center text-center group-hover:border-[#111111] transition-colors">
                      <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#111111]">{item.icon}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-semibold text-[#111111]">{item.label}</span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${settings.defaults.canvasSize === item.id ? 'border-[#111111]' : 'border-slate-300'}`}>
                      <div className={`h-2 w-2 rounded-full bg-[#111111] transition-transform duration-200 ${settings.defaults.canvasSize === item.id ? 'scale-100' : 'scale-0'}`}></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{item.size}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col text-left">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Initial Project Status</label>
              <span className="material-symbols-outlined text-[#111111] text-xl">flag</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">Select the status applied to all newly created projects immediately.</p>
            <div className="bg-[#f8f9fa] border border-[#e5e7eb] p-1 rounded-xl flex items-center">
              {(['draft', 'in-review', 'approved'] as const).map((status) => (
                <button 
                  key={status}
                  onClick={() => handleDefaultsChange({ initialStatus: status })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    settings.defaults.initialStatus === status 
                      ? 'bg-white shadow-sm text-[#111111] border border-slate-200/60' 
                      : 'text-slate-500 hover:text-[#111111]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col text-left">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Auto-assign Team</label>
              <span className="material-symbols-outlined text-[#111111] text-xl">group_add</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">Automatically add these members to every new project as collaborators.</p>
            <div className="relative">
              <div className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-left shadow-xs focus-within:ring-1 focus-within:ring-[#111111] focus-within:border-[#111111] text-xs cursor-text min-h-[40px] flex items-center flex-wrap gap-1.5 transition-all">
                {settings.defaults.autoAssignTeam.map((member) => (
                  <span key={member} className="inline-flex items-center gap-1 rounded bg-[#f5f5f5] border border-slate-200/50 px-2 py-1 text-[11px] font-semibold text-[#111111]">
                    {member}
                    <button 
                      onClick={() => handleDefaultsChange({ 
                        autoAssignTeam: settings.defaults.autoAssignTeam.filter(m => m !== member) 
                      })}
                      className="ml-1 text-slate-400 hover:text-[#111111] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px] leading-none">close</span>
                    </button>
                  </span>
                ))}
                <input 
                  className="border-none bg-transparent p-0 text-xs placeholder-slate-400 focus:ring-0 w-24 outline-none" 
                  placeholder="Add member..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val && !settings.defaults.autoAssignTeam.includes(val)) {
                        handleDefaultsChange({ autoAssignTeam: [...settings.defaults.autoAssignTeam, val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#f8f9fa]">
            <div>
              <h4 className="text-sm font-semibold text-[#111111]">Default Typography</h4>
              <p className="text-[11px] text-slate-500">Set the base font family for text layers.</p>
            </div>
            <button className="text-xs font-semibold text-[#111111] bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs">Manage Fonts</button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Heading Font</label>
                <select 
                  value={settings.defaults.typography.headingFont}
                  onChange={(e) => handleTypographyChange({ headingFont: e.target.value })}
                  className="block w-full rounded-lg border-slate-200 bg-white text-[#111111] py-2 px-3 shadow-xs focus:border-[#111111] focus:ring-[#111111] text-xs transition-all outline-none"
                >
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Montserrat</option>
                  <option>Playfair Display</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Body Font</label>
                <select 
                  value={settings.defaults.typography.bodyFont}
                  onChange={(e) => handleTypographyChange({ bodyFont: e.target.value })}
                  className="block w-full rounded-lg border-slate-200 bg-white text-[#111111] py-2 px-3 shadow-xs focus:border-[#111111] focus:ring-[#111111] text-xs transition-all outline-none"
                >
                  <option>Inter</option>
                  <option>Open Sans</option>
                  <option>Lato</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Base Size</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input 
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#111111]" 
                    max="24" 
                    min="12" 
                    type="range" 
                    value={settings.defaults.typography.baseSize}
                    onChange={(e) => handleTypographyChange({ baseSize: parseInt(e.target.value) })}
                  />
                  <span className="text-xs font-mono font-bold text-[#111111] bg-slate-100 px-2 py-1 rounded border border-slate-200/50 min-w-[42px] text-center">{settings.defaults.typography.baseSize}px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
