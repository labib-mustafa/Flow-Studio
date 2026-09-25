import React, { useRef, useMemo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../stores/authStore';
import { getUserTimeZone, getUserTimeZoneDetails, COMMON_TIMEZONES } from '../../lib/timezone';

export const GeneralTab: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedTz = useMemo(() => getUserTimeZone(), []);
  const resolvedTz = settings.timeZone && settings.timeZone !== 'auto' ? settings.timeZone : detectedTz;
  const timeZoneDetails = useMemo(() => getUserTimeZoneDetails(resolvedTz), [resolvedTz]);

  const avatarUrl = settings.profileImage && (settings.profileImage.startsWith('data:') || !settings.profileImage.includes('aida-public'))
    ? settings.profileImage
    : (user?.photoURL || settings.profileImage || '');

  const displayName = settings.displayName || user?.displayName || '';

  const handleEditorToggle = (setting: keyof typeof settings.editorExperience) => {
    updateSettings({
      editorExperience: {
        ...settings.editorExperience,
        [setting]: !settings.editorExperience[setting]
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-10 text-left">
      <section>
        <div className="bg-white rounded-xl overflow-hidden border border-[#e5e7eb] shadow-sm">
          <div className="h-32 bg-[#f5f5f5] border-b border-[#e5e7eb]"></div>
          <div className="px-10 pb-10 -mt-16 flex flex-col md:flex-row gap-10 items-end md:items-start relative z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-md border border-[#e5e7eb]">
                  <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${avatarUrl}')` }}></div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={triggerFileInput}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-[#111111] text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Edit Photo
                </button>
              </div>
            </div>
            <div className="flex-1 w-full pt-10 md:pt-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <div className="relative group/input bg-transparent px-0 py-0 flex flex-col gap-1.5">
                    <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Display Name</label>
                    <input
                      className="block w-full h-10 px-3.5 text-sm bg-white border border-slate-200 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all rounded-lg text-[#111111] placeholder-slate-400 outline-none"
                      type="text"
                      value={displayName}
                      onChange={(e) => updateSettings({ displayName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative group/input bg-transparent px-0 py-0 flex flex-col gap-1.5">
                    <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Email Address</label>
                    <input
                      className="block w-full h-10 px-3.5 text-sm bg-white border border-slate-200 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all rounded-lg text-[#111111] placeholder-slate-400 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      type="email"
                      value={user?.email || settings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      disabled={!!user}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <div className="relative group/input bg-transparent px-0 py-0 flex flex-col gap-1.5">
                    <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Profession / Role</label>
                    <input
                      className="block w-full h-10 px-3.5 text-sm bg-white border border-slate-200 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all rounded-lg text-[#111111] placeholder-slate-400 outline-none"
                      type="text"
                      value={settings.role}
                      onChange={(e) => updateSettings({ role: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="relative group/input bg-transparent px-0 py-0 flex flex-col gap-1.5">
                <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Bio</label>
                <textarea
                  className="block w-full py-2.5 px-3.5 text-sm bg-white border border-slate-200 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all rounded-lg text-[#111111] placeholder-slate-400 outline-none resize-none h-24"
                  placeholder="Tell us a bit about yourself..."
                  value={settings.bio}
                  onChange={(e) => updateSettings({ bio: e.target.value })}
                ></textarea>
              </div>

              {user && (
                <div className="mt-8 pt-6 border-t border-[#e5e7eb] flex justify-end">
                  <button
                    onClick={() => {
                      const { logout } = useAuthStore.getState();
                      if (logout) logout();
                    }}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm border border-red-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#111111] mb-6 flex items-center gap-2 px-2 font-display -tracking-[0.03em]">
          <span className="material-symbols-outlined text-[#111111] text-xl">tune</span>
          Editor Experience
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <label className="relative cursor-pointer group">
            <input
              checked={settings.editorExperience.darkCanvas}
              className="peer sr-only"
              type="checkbox"
              onChange={() => handleEditorToggle('darkCanvas')}
            />
            <div className="bg-white rounded-xl p-6 h-full transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:bg-[#f8f9fa] peer-checked:border-[#111111] peer-checked:bg-[#f5f5f5] shadow-xs">
              <div className="flex justify-between items-start mb-6">
                <div className="p-2.5 rounded-lg bg-slate-100 text-[#111111] transition-colors border border-slate-200/50">
                  <span className="material-symbols-outlined text-xl">dark_mode</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-all duration-200 shrink-0 ${settings.editorExperience.darkCanvas ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-200 shadow-sm ${settings.editorExperience.darkCanvas ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </div>
              <h4 className="text-base font-semibold text-[#111111] mb-1.5 font-display -tracking-[0.02em]">Dark Canvas</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">Reduces eye strain by using a dark background for the artboard.</p>
            </div>
          </label>
          <label className="relative cursor-pointer group">
            <input
              checked={settings.editorExperience.pixelSnap}
              className="peer sr-only"
              type="checkbox"
              onChange={() => handleEditorToggle('pixelSnap')}
            />
            <div className="bg-white rounded-xl p-6 h-full transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:bg-[#f8f9fa] peer-checked:border-[#111111] peer-checked:bg-[#f5f5f5] shadow-xs">
              <div className="flex justify-between items-start mb-6">
                <div className="p-2.5 rounded-lg bg-slate-100 text-[#111111] transition-colors border border-slate-200/50">
                  <span className="material-symbols-outlined text-xl">grid_4x4</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-all duration-200 shrink-0 ${settings.editorExperience.pixelSnap ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-200 shadow-sm ${settings.editorExperience.pixelSnap ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </div>
              <h4 className="text-base font-semibold text-[#111111] mb-1.5 font-display -tracking-[0.02em]">Pixel Snap</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">Layers automatically align to the nearest full pixel for crisp edges.</p>
            </div>
          </label>
          <label className="relative cursor-pointer group">
            <input
              checked={settings.editorExperience.autoSave}
              className="peer sr-only"
              type="checkbox"
              onChange={() => handleEditorToggle('autoSave')}
            />
            <div className="bg-white rounded-xl p-6 h-full transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:bg-[#f8f9fa] peer-checked:border-[#111111] peer-checked:bg-[#f5f5f5] shadow-xs">
              <div className="flex justify-between items-start mb-6">
                <div className="p-2.5 rounded-lg bg-slate-100 text-[#111111] transition-colors border border-slate-200/50">
                  <span className="material-symbols-outlined text-xl">save_as</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-all duration-200 shrink-0 ${settings.editorExperience.autoSave ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-200 shadow-sm ${settings.editorExperience.autoSave ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </div>
              <h4 className="text-base font-semibold text-[#111111] mb-1.5 font-display -tracking-[0.02em]">Auto-Save</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">Automatically save your project changes every 5 minutes.</p>
            </div>
          </label>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#111111] mb-6 flex items-center gap-2 px-2 font-display -tracking-[0.03em]">
          <span className="material-symbols-outlined text-[#111111] text-xl">schedule</span>
          Time & Regional Timezone
        </h3>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-semibold text-[#111111] font-display -tracking-[0.02em]">
                  Device Timezone
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-picked from Device
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Flow Studio automatically synchronizes calendar schedules, tasks, billable timers, and AI prompts with your device's local clock.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Device Local Time</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {timeZoneDetails.currentTime}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {timeZoneDetails.currentDate} • {timeZoneDetails.offset}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                Active Timezone
              </label>
              <select
                value={settings.timeZone || 'auto'}
                onChange={(e) => updateSettings({ timeZone: e.target.value })}
                className="h-10 px-3.5 text-xs font-medium bg-white border border-slate-200 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all rounded-lg text-[#111111] outline-none cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.value === 'auto' ? `Auto (${detectedTz})` : tz.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Current resolved timezone: <strong className="text-slate-700">{timeZoneDetails.label}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-purple-600 text-xl shrink-0 mt-0.5">smart_toy</span>
              <div className="text-xs text-purple-950 leading-relaxed">
                <span className="font-bold block">AI Agent Grounding Active</span>
                Nova uses this device timezone ({timeZoneDetails.offset}) so commands like "tomorrow" or "22 sep" always resolve to your exact local day without timezone shifts.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
