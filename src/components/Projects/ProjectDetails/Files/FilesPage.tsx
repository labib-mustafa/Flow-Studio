import React from 'react';
import { useProjectStore } from '../../../../stores/projectStore';
import { FileExplorer } from '../../../GlobalComponents/FileExplorer/FileExplorer';

interface FilesPageProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes') => void;
}

export const FilesPage: React.FC<FilesPageProps> = () => {
  const { currentProject } = useProjectStore();

  if (!currentProject) return null;

  return (
    <div className="flex-1 relative overflow-hidden">
      <FileExplorer rootPath={currentProject.id} />
    </div>
  );
};
