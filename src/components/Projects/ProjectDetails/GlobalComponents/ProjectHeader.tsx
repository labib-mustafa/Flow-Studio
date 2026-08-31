import React from 'react';
import { useProjectStore } from '../../../../stores/projectStore';
import { useTaskStore } from '../../../../stores/taskStore';
import { useMoodboardStore } from '../../../../stores/moodboardStore';
import { Dock, CircleCheck, FileText, NotepadText, PanelsTopLeft } from 'lucide-react';

import { PillTab } from '../../../GlobalComponents/PillTab';

interface ProjectHeaderProps {
  currentTab: 'overview' | 'tasks' | 'files' | 'notes' | 'moodboard';
  onTabChange: (tab: 'overview' | 'tasks' | 'files' | 'notes' | 'moodboard') => void;
  onBack: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ currentTab, onTabChange, onBack }) => {
  const { currentProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const { items: moodboardItems } = useMoodboardStore();

  if (!currentProject) {
    return null;
  }
  const { name, client, status, deadline } = currentProject;

  const [notesCount, setNotesCount] = React.useState(0);
  const [filesCount, setFilesCount] = React.useState(0);

  React.useEffect(() => {
    const updateCounts = () => {
      try {
        const savedNotes = localStorage.getItem('notes-list');
        if (savedNotes) {
          setNotesCount(JSON.parse(savedNotes).length);
        }
      } catch (_) { }

      try {
        const savedFiles = localStorage.getItem(`files-list-${currentProject.id}`);
        if (savedFiles) {
          setFilesCount(JSON.parse(savedFiles).length);
        } else {
          setFilesCount(0);
        }
      } catch (_) { }
    };

    updateCounts();

    const interval = setInterval(updateCounts, 1000);
    return () => clearInterval(interval);
  }, [currentProject.id, currentTab]);

  const tasksCount = React.useMemo(() => {
    return tasks.filter((t) => t.projectId === currentProject.id).length;
  }, [tasks, currentProject.id]);

  return (
    <header id="project-header" className="bg-white shrink-0 border-b border-slate-100 px-10">
      <div id="project-navigation-tabs" className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group mr-1 shrink-0 cursor-pointer"
          title="Back to Projects"
        >
          <svg 
            viewBox="416.66 432.14 158.84 158.84" 
            className="size-8"
          >
            <polyline 
              fill="none"
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
              points="507.33 540.98 478.51 512.16 507.33 483.34"
              className="group-hover:-translate-x-[6px] transition-transform duration-200"
            />
          </svg>
        </button>


        <div className="flex items-center gap-1.5 shrink-0">
          <PillTab
            label="Overview"
            icon={<Dock size={16} />}
            isActive={currentTab === 'overview'}
            onClick={() => onTabChange('overview')}
          />
          <PillTab
            label="Tasks"
            icon={<CircleCheck size={16} />}
            isActive={currentTab === 'tasks'}
            onClick={() => onTabChange('tasks')}
          />
          <PillTab
            label="Files"
            icon={<FileText size={16} />}
            isActive={currentTab === 'files'}
            onClick={() => onTabChange('files')}
          />
          <PillTab
            label="Notes"
            icon={<NotepadText size={16} />}
            isActive={currentTab === 'notes'}
            onClick={() => onTabChange('notes')}
          />
          <PillTab
            label="Moodboard"
            icon={<PanelsTopLeft size={16} />}
            isActive={currentTab === 'moodboard'}
            onClick={() => onTabChange('moodboard')}
          />
        </div>
      </div>
    </header>
  );
};
