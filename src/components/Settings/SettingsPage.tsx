import React, { useState } from 'react';
import { GeneralTab } from './GeneralTab';
import { StudioTab } from './StudioTab';
import { NotificationsTab } from './NotificationsTab';
import { DefaultsTab } from './DefaultsTab';
import { AISettingsTab } from './AISettingsTab';
import { Sparkles, Building2 } from 'lucide-react';

type Tab = 'general' | 'studio' | 'notifications' | 'defaults' | 'ai';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'general':
        return { title: 'Settings', subtitle: 'Manage your personal profile and application preferences.' };
      case 'studio':
        return { title: 'Studio & Company Profile', subtitle: 'Manage your company branding, legal identity, and invoicing defaults.' };
      case 'notifications':
        return { title: 'Notification Settings', subtitle: 'Control how you receive updates and alerts.' };
      case 'defaults':
        return { title: 'Default Settings', subtitle: 'Configure standard preferences for new projects.' };
      case 'ai':
        return { title: 'AI Co-Pilot Settings', subtitle: 'Configure your free Google Gemini API key and model preferences.' };
      default:
        return { title: 'Settings', subtitle: 'Manage your profile and application preferences.' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 z-10 relative custom-scrollbar bg-[#f5f5f7] h-screen">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
        <div className="flex justify-between items-end px-2 text-left">
          <div>
            <h2 className="text-3xl md:text-4xl leading-tight font-semibold text-[#111111] -tracking-[0.04em] mb-2 font-display">
              {title}
            </h2>
            <p className="text-[#6b7280] text-sm md:text-base font-normal">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl w-fit self-center md:self-start flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 cursor-pointer ${activeTab === 'general' ? 'bg-white text-[#111111] shadow-sm font-semibold border border-slate-200/60' : 'text-[#6b7280] hover:text-[#111111] font-medium'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab === 'studio' ? 'bg-white text-[#111111] shadow-sm font-semibold border border-slate-200/60' : 'text-[#6b7280] hover:text-[#111111] font-medium'}`}
          >
            Studio Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 cursor-pointer ${activeTab === 'notifications' ? 'bg-white text-[#111111] shadow-sm font-semibold border border-slate-200/60' : 'text-[#6b7280] hover:text-[#111111] font-medium'}`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('defaults')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 cursor-pointer ${activeTab === 'defaults' ? 'bg-white text-[#111111] shadow-sm font-semibold border border-slate-200/60' : 'text-[#6b7280] hover:text-[#111111] font-medium'}`}
          >
            Defaults
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab === 'ai' ? 'bg-white text-[#111111] shadow-sm font-semibold border border-slate-200/60' : 'text-[#6b7280] hover:text-[#111111] font-medium'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            AI Co-Pilot
          </button>
        </div>

        <div className="mt-2">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'studio' && <StudioTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'defaults' && <DefaultsTab />}
          {activeTab === 'ai' && <AISettingsTab />}
        </div>
      </div>
    </div>
  );
};
