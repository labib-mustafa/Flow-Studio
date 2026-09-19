import React, { useState } from 'react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { sound } from '../../stores/soundStore';
import { toast } from '../../stores/toastStore';
import { Sunrise, Sun, Moon, Plus, Sparkles, CornerDownLeft } from 'lucide-react';

interface DashboardHeaderProps {
  onNavigate?: (view: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigate }) => {
  const { settings } = useSettingsContext();
  const { user } = useAuthStore();
  const { projects, currentProject } = useProjectStore();
  const { tasks, addTask, deleteTask } = useTaskStore();
  const [quickInput, setQuickInput] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const GreetingIcon = hour < 12 ? Sunrise : hour < 18 ? Sun : Moon;
  const greetingColor = hour < 12 ? 'text-amber-500' : hour < 18 ? 'text-orange-500' : 'text-indigo-400';

  const name = settings?.displayName || user?.displayName || 'Creator';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const activeProjectsCount = projects.filter(
    (p) => p.status !== 'Completed' && p.status !== 'Archived'
  ).length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'Complete').length;

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickInput.trim();
    if (!title) return;

    const targetProject = currentProject || projects[0];
    const projectId = targetProject?.id || 'rebrand-2024';
    const projectName = targetProject?.title || targetProject?.name || 'Current Project';

    sound.pop();
    const newTask = {
      projectId,
      title,
      details: '',
      dueDate: '',
      priority: 'medium' as const,
      phase: 'todo' as const,
      status: 'Incomplete' as const,
      assignees: [],
      taskType: 'task' as const,
    };

    addTask(newTask);
    setQuickInput('');

    // Fetch the newly added task to support instant Undo
    const addedTask = useTaskStore.getState().tasks.slice(-1)[0];

    toast.success('Task captured', `"${title}" added to ${projectName}`, {
      actionText: 'Undo',
      duration: 4000,
      onAction: () => {
        if (addedTask?.id) {
          deleteTask(addedTask.id);
          sound.tick();
        }
      },
    });
  };

  return (
    <header className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <GreetingIcon className={`size-4 ${greetingColor}`} />
            <span>{formattedDate}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeProjectsCount} active projects • {pendingTasksCount} tasks pending
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            {greeting}, {name}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sound.pop();
              onNavigate?.('new-project');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer select-none active:scale-97"
          >
            <Plus className="size-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Apple-Style Instant Quick-Capture Bar */}
      <form onSubmit={handleQuickCapture} className="mt-4 relative group">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            <Sparkles className="size-4" />
          </div>
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Quick capture a task, idea, or note for your active project... (Press Enter ⏎)"
            className="w-full pl-10 pr-12 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 focus:border-blue-500/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 shadow-2xs transition-all"
          />
          {quickInput.trim() ? (
            <button
              type="submit"
              className="absolute right-2.5 p-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all cursor-pointer shadow-xs"
              title="Save task"
            >
              <CornerDownLeft className="size-3" />
            </button>
          ) : (
            <div className="absolute right-3 hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400 pointer-events-none">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] shadow-2xs">Enter ⏎</kbd>
            </div>
          )}
        </div>
      </form>
    </header>
  );
};
