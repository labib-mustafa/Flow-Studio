import React from 'react';
import { TaskList } from './TaskList';
import { useTaskStore } from '../../../../stores/taskStore';
import { useProjectStore } from '../../../../stores/projectStore';
import FieldsSidebar from './FieldsSidebar';

interface TaskPageProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes') => void;
  projectId?: string;
}

import { AnimatePresence, motion } from 'motion/react';

export const TaskPage: React.FC<TaskPageProps> = ({ onTabChange, projectId }) => {
  const { tasks, addTask, updateTask, isFieldsSidebarOpen, setFieldsSidebarOpen, setProject } = useTaskStore();
  const { currentProject } = useProjectStore();

  const effectiveProjectId = projectId || currentProject?.id || 'default-project';

  React.useEffect(() => {
    if (effectiveProjectId) {
      setProject(effectiveProjectId);
    }
  }, [effectiveProjectId, setProject]);

  const projectTasks = React.useMemo(() => {
    if (!effectiveProjectId) return [];
    return tasks.filter(t => t.projectId === effectiveProjectId);
  }, [tasks, effectiveProjectId]);

  const handleAddTask = (phase?: string) => {
    if (!effectiveProjectId) return;
    addTask({
      projectId: effectiveProjectId,
      title: 'New Task',
      details: '',
      dueDate: '',
      priority: 'medium',
      phase: (phase as any) || 'todo',
      assignees: [],
      status: 'Incomplete'
    });
  };

  return (
    <div id="task-page-container" className="relative flex-1 flex overflow-hidden h-full leading-normal bg-white">
      <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col h-full min-w-0 px-8 py-6">
        <TaskList
          onAddTask={handleAddTask}
          onTaskClick={(task) => {
            const newTitle = prompt("Edit Task Title:", task.title);
            if (newTitle && newTitle.trim() !== "") {
              updateTask(task.id, { title: newTitle.trim() });
            }
          }}
          tasks={projectTasks}
        />
      </div>

      <AnimatePresence>
        {isFieldsSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-slate-950/15 cursor-pointer"
              onClick={() => setFieldsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="fixed right-0 top-0 bottom-0 w-[340px] z-[9999] border-l border-slate-200 bg-white shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.1)]"
            >
              <FieldsSidebar onClose={() => setFieldsSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

