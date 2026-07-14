import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export const NotificationsTab: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleToggle = (category: keyof typeof settings.notifications, setting: string) => {
    const currentCategory = settings.notifications[category] as Record<string, boolean>;
    updateSettings({
      notifications: {
        ...settings.notifications,
        [category]: {
          ...currentCategory,
          [setting]: !currentCategory[setting]
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-10 text-left">
      <section className="flex flex-col gap-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold text-[#111111] font-display -tracking-[0.02em]">App Notifications</h3>
          <p className="text-xs text-[#6b7280] mt-0.5">Manage what you see inside the application interface.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">assignment</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">New Project Assigned</span>
                <span className="text-xs text-[#6b7280] mt-0.5">Receive a notification when you are added to a project.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.app.newProject}
                onChange={() => handleToggle('app', 'newProject')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.app.newProject ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.app.newProject ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">Task Completed</span>
                <span className="text-xs text-[#6b7280] mt-0.5">Alerts when a task in your project is marked as done.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.app.taskCompleted}
                onChange={() => handleToggle('app', 'taskCompleted')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.app.taskCompleted ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.app.taskCompleted ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">New Comments</span>
                <span className="text-xs text-[#6b7280] mt-0.5">Notify me when someone comments on my designs.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.app.newComments}
                onChange={() => handleToggle('app', 'newComments')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.app.newComments ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.app.newComments ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">Task Deadline Approaching</span>
                <span className="text-xs text-[#6b7280] mt-0.5">Get warned 24 hours before a task is due.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.app.deadlineApproaching}
                onChange={() => handleToggle('app', 'deadlineApproaching')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.app.deadlineApproaching ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.app.deadlineApproaching ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold text-[#111111] font-display -tracking-[0.02em]">Email Alerts</h3>
          <p className="text-xs text-[#6b7280] mt-0.5">Control which emails you receive in your inbox.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">Daily Digest</span>
                <span className="text-xs text-[#6b7280] mt-0.5">A summary of project activity sent every morning.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.email.dailyDigest}
                onChange={() => handleToggle('email', 'dailyDigest')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.email.dailyDigest ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.email.dailyDigest ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">Product Updates</span>
                <span className="text-xs text-[#6b7280] mt-0.5">News about features and improvements.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.email.productUpdates}
                onChange={() => handleToggle('email', 'productUpdates')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.email.productUpdates ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.email.productUpdates ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold text-[#111111] font-display -tracking-[0.02em]">Desktop Sounds</h3>
          <p className="text-xs text-[#6b7280] mt-0.5">Customize auditory feedback while using the app.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#f5f5f5] border border-slate-200/50 flex items-center justify-center text-[#111111] shrink-0">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111111]">Sound Effects</span>
                <span className="text-xs text-[#6b7280] mt-0.5">Play sounds for actions like completing a task or sending a message.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.sounds.soundEffects}
                onChange={() => handleToggle('sounds', 'soundEffects')}
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.notifications.sounds.soundEffects ? 'bg-[#111111]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${settings.notifications.sounds.soundEffects ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
};
