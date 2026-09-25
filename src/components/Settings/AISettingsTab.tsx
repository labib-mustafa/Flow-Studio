import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Sparkles } from 'lucide-react';
import { ApiKeyManager } from './ApiKeyManager';

export const AISettingsTab: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const aiSettings = settings.aiSettings || {
    enabled: false,
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    apiKeys: []
  };

  const handleToggle = () => {
    const updated = {
      ...aiSettings,
      enabled: !aiSettings.enabled
    };
    updateSettings({ aiSettings: updated });
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#111111] mb-1 flex items-center gap-2 font-display">
              Flow Studio AI Design Co-Pilot
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Multi-Key & 14.4k Req/Day
              </span>
            </h3>
            <p className="text-sm text-[#6b7280] max-w-xl">
              An autonomous AI assistant that can help you like your coworker. Connect one or more Groq or Google Gemini API keys.
            </p>
          </div>
        </div>

        {/* Master Enable/Disable Toggle */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs font-semibold text-slate-700">
            {aiSettings.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${aiSettings.enabled ? 'bg-slate-900' : 'bg-slate-200'
              }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${aiSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Multiple API Keys Manager */}
      <ApiKeyManager />
    </div>
  );
};
