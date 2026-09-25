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
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            {greeting}, {name}
          </h1>
        </div>
      </div>
    </header>
  );
};
