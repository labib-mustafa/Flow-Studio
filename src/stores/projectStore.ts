import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
import { useActivityStore } from './activityStore';
import { useTrashStore } from './trashStore';


export interface Project {
  id: string;
  name: string; // compatibility with detailed views (ProjectHeader, OverviewPage, etc)
  title?: string; // compatibility with NewProject/ProjectOverview
  client: string;
  status: string;
  deadline: string;
  thumbnail: string; // compatibility with detailed views
  image?: string; // compatibility with NewProject/ProjectOverview
  tags: string[]; // compatibility with detailed views
  completion: number; // compatibility with detailed views
  progress?: number; // compatibility with NewProject/ProjectOverview
  category?: string;
  statusColor?: string;
  isPortfolio?: boolean;
  tasksCount?: number;
  commentsCount?: number;
  isPinned?: boolean;
  createdAt?: string;
  pinnedAt?: string;
}

interface ProjectState {
  _hasHydrated: boolean;
  projects: Project[];
  currentProject: Project;
  addProject: (project: Project) => void;
  updateProject: {
    (updates: Partial<Project>): void;
    (id: string, updates: Partial<Project>): void;
  };
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  setCurrentProject: (project: Project) => void;
  togglePinProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      projects: [],
      currentProject: null,
      addProject: (project) => set((state) => {
        useActivityStore.getState().logActivity('project', `Created project: ${project.name || project.title || 'Untitled'}`);
        // Build compatible fields if some are missing
        const completeProject: Project = {
          ...project,
          name: project.name || project.title || 'Untitled Project',
          title: project.title || project.name || 'Untitled Project',
          thumbnail: project.thumbnail || project.image || '',
          image: project.image || project.thumbnail || '',
          tags: project.tags || [],
          completion: typeof project.completion === 'number' ? project.completion : (project.progress || 0),
          progress: typeof project.progress === 'number' ? project.progress : (project.completion || 0),
          createdAt: project.createdAt || new Date().toISOString()
        };
        return {
          projects: [completeProject, ...state.projects]
        };
      }),
      updateProject: (idOrUpdates: any, maybeUpdates?: any) => set((state) => {
        let updatedProjects = state.projects;
        let nextCurrentProject = state.currentProject;

        if (typeof idOrUpdates === 'string') {
          // Signature: updateProject(id, updates)
          const id = idOrUpdates;
          const updates = maybeUpdates || {};
          
          updatedProjects = state.projects.map((p) => {
            if (p.id === id) {
              const updated = {
                ...p,
                ...updates,
                name: updates.name || updates.title || p.name,
                title: updates.title || updates.name || p.title,
                thumbnail: updates.thumbnail || updates.image || p.thumbnail,
                image: updates.image || updates.thumbnail || p.image,
                completion: typeof updates.completion === 'number' ? updates.completion : (updates.progress !== undefined ? updates.progress : p.completion),
                progress: typeof updates.progress === 'number' ? updates.progress : (updates.completion !== undefined ? updates.completion : p.progress),
              };
              if (state.currentProject.id === id) {
                nextCurrentProject = updated;
              }
              return updated;
            }
            return p;
          });
        } else {
          // Signature: updateProject(updates)
          const updates = idOrUpdates || {};
          const currentId = state.currentProject.id;
          
          nextCurrentProject = {
            ...state.currentProject,
            ...updates,
            name: updates.name || updates.title || state.currentProject.name,
            title: updates.title || updates.name || state.currentProject.title,
            thumbnail: updates.thumbnail || updates.image || state.currentProject.thumbnail,
            image: updates.image || updates.thumbnail || state.currentProject.image,
            completion: typeof updates.completion === 'number' ? updates.completion : (updates.progress !== undefined ? updates.progress : state.currentProject.completion),
            progress: typeof updates.progress === 'number' ? updates.progress : (updates.completion !== undefined ? updates.completion : state.currentProject.progress),
          };

          updatedProjects = state.projects.map((p) => (p.id === currentId ? nextCurrentProject : p));
        }

        return {
          projects: updatedProjects,
          currentProject: nextCurrentProject
        };
      }),
      deleteProject: (id) => {
        const state = get();
        const projectToDelete = state.projects.find((p) => p.id === id);
        if (projectToDelete) {
          useTrashStore.getState().moveToTrash('project', projectToDelete.id, projectToDelete.name || projectToDelete.title || 'Untitled', projectToDelete);
        }
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject.id === id ? state.projects.filter(p => p.id !== id)[0] || state.currentProject : state.currentProject
        }));
      },
      duplicateProject: (id) => {
        const state = get();
        const target = state.projects.find((p) => p.id === id);
        if (!target) return;
        const dupName = `${target.name || target.title || 'Untitled'} (Copy)`;
        const newId = 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const duplicate: Project = {
          ...target,
          id: newId,
          name: dupName,
          title: dupName,
          isPinned: false,
          pinnedAt: undefined,
          createdAt: new Date().toISOString()
        };
        state.addProject(duplicate);
      },
      setCurrentProject: (project) => set({ currentProject: project }),
      togglePinProject: (id) => set((state) => {
        const updatedProjects = state.projects.map((p) => {
          if (p.id === id) {
            const nextPinned = !p.isPinned;
            useActivityStore.getState().logActivity('project', `${nextPinned ? 'Pinned' : 'Unpinned'} project: ${p.name || p.title || 'Untitled'}`);
            return {
              ...p,
              isPinned: nextPinned,
              pinnedAt: nextPinned ? new Date().toISOString() : undefined
            };
          }
          return p;
        });

        let nextCurrent = state.currentProject;
        if (nextCurrent && nextCurrent.id === id) {
          const nextPinned = !nextCurrent.isPinned;
          nextCurrent = {
            ...nextCurrent,
            isPinned: nextPinned,
            pinnedAt: nextPinned ? new Date().toISOString() : undefined
          };
        }

        return {
          projects: updatedProjects,
          currentProject: nextCurrent
        };
      })
    }),
    {
      name: 'project-storage',
      storage: createFileStorage('projects'),
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
      onRehydrateStorage: () => () => { useProjectStore.setState({ _hasHydrated: true }); },
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.projects && Array.isArray(merged.projects)) {
          let timeOffset = 0;
          merged.projects = merged.projects.map((p: any) => {
            const healed = {
              tags: [],
              ...p
            };
            if (!healed.createdAt) {
              healed.createdAt = new Date(Date.now() - (timeOffset++) * 60000).toISOString();
            }
            return healed;
          });
        } else {
          merged.projects = currentState.projects;
        }
        if (merged.currentProject) {
          merged.currentProject = {
            tags: [],
            ...merged.currentProject
          };
        } else {
          merged.currentProject = currentState.currentProject;
        }
        return merged;
      }
    }
  )
);

onStoreExternalUpdate('projects', () => {
  useProjectStore.persist.rehydrate();
});

