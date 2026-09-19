import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../../../stores/projectStore';
import { TabbedFileExplorer } from '../../../GlobalComponents/FileExplorer/TabbedFileExplorer';
import { FilesSkeleton } from '../../../GlobalComponents/Skeletons/FilesSkeleton';

interface FilesPageProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes') => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({ onTabChange }) => {
  const { currentProject } = useProjectStore();
  const [projectFolderPath, setProjectFolderPath] = useState<string | null>(null);
  const [projectDataPath, setProjectDataPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFolder = () => {
    setLoading(true);
    setProjectFolderPath(null);
    setProjectDataPath(null);

    const isDesktop = (window as any).electronAPI?.isDesktop;

    if (isDesktop) {
      (window as any).electronAPI.projects
        .getFolder(currentProject?.id, currentProject?.title || currentProject?.name)
        .then((result: { path: string | null, dataPath?: string }) => {
          setProjectFolderPath(result.path);
          setProjectDataPath(result.dataPath || 'GLOBAL');
        })
        .catch(() => {
          setProjectFolderPath(null);
          setProjectDataPath('GLOBAL');
        })
        .finally(() => setLoading(false));
    } else {
      fetch('/api/projects/get-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject?.id, projectName: currentProject?.title || currentProject?.name }),
      })
        .then(res => res.json())
        .then((data: { path: string | null, dataPath?: string }) => {
          setProjectFolderPath(data.path);
          setProjectDataPath(data.dataPath || 'GLOBAL');
        })
        .catch(() => {
          setProjectFolderPath(null);
          setProjectDataPath('GLOBAL');
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchFolder();
    }
  }, [currentProject?.id]);

  if (!currentProject) return null;

  if (loading) {
    return <FilesSkeleton />;
  }

  const handleCreateFolder = () => {
    setLoading(true);
    const isDesktop = (window as any).electronAPI?.isDesktop;
    const name = currentProject.title || currentProject.name || 'Unnamed Project';
    
    if (isDesktop) {
      (window as any).electronAPI.projects.createFolder(currentProject.id, name)
        .then(() => fetchFolder())
        .catch(() => setLoading(false));
    } else {
      fetch('/api/projects/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id, projectName: name }),
      })
        .then(() => fetchFolder())
        .catch(() => setLoading(false));
    }
  };

  if (!projectFolderPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
        <div className="size-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-slate-400">folder_off</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Folder Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          We couldn't find a dedicated folder for this project. Would you like to create one now, or go back to the project overview?
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('tasks')}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Go Back
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">create_new_folder</span>
            Create Project Folder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <TabbedFileExplorer
        sessionId={`PROJECT_${currentProject.id}`}
        rootPath="GLOBAL"
        initialPath={projectFolderPath}
      />
    </div>
  );
};
