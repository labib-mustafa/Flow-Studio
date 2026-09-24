import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useProjectStore } from '../../../../../stores/projectStore';

interface ProjectDetailsContext {
  activeProjId: string;
  activeProjTitle: string;
  currentProject: any;
  setCurrentProject: (proj: any) => void;
  setItems: (fn: (prev: any[]) => any[]) => void;
}

const resolveTargetProject = (projectTitle?: string, fallback?: any) => {
  const projectStore = useProjectStore.getState();
  const projects = projectStore.projects || [];
  if (projectTitle) {
    const q = projectTitle.toLowerCase().trim();
    const found = projects.find(
      (p) => (p.name && p.name.toLowerCase().includes(q)) || (p.title && p.title.toLowerCase().includes(q))
    );
    if (found) return found;
  }
  return projectStore.currentProject || fallback;
};

export function handleProjectDetailsTools(
  call: AgentToolCall,
  ctx: ProjectDetailsContext
): AgentToolResult | null {
  const { currentProject, setItems } = ctx;
  const projectStore = useProjectStore.getState();

  // 1. Manage Project Tags / Taxonomy
  if (call.name === 'manage_project_tags') {
    const { action, tag, projectTitle } = call.args;
    const target = resolveTargetProject(projectTitle, currentProject);
    if (target && tag) {
      const cleanTag = String(tag).trim();
      const currentTags = Array.isArray(target.tags) ? [...target.tags] : [];
      let updatedTags: string[];

      if (action === 'remove') {
        updatedTags = currentTags.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase());
      } else {
        updatedTags = currentTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())
          ? currentTags
          : [...currentTags, cleanTag];
      }

      projectStore.updateProject(target.id, { tags: updatedTags });
      const verb = action === 'remove' ? 'Removed' : 'Added';
      toast.success(`${verb} tag "${cleanTag}" on "${target.name || target.title}"`);
      return {
        toolName: 'manage_project_tags',
        description: `${verb} tag "${cleanTag}" for "${target.name || target.title}"`,
        data: { projectId: target.id, tags: updatedTags }
      };
    }
  }

  // 2. Link Project Resource (Figma Master or Client Brief)
  if (call.name === 'link_project_resource') {
    const { type, url, projectTitle } = call.args;
    const target = resolveTargetProject(projectTitle, currentProject);
    if (target && url) {
      const cleanUrl = String(url).trim();
      const isFigma = type === 'figma' || cleanUrl.includes('figma.com');
      const updates = isFigma ? { figmaUrl: cleanUrl } : { briefUrl: cleanUrl };

      projectStore.updateProject(target.id, updates as any);
      const label = isFigma ? 'Figma Master' : 'Client Brief';
      toast.success(`Linked ${label} to "${target.name || target.title}"`);
      return {
        toolName: 'link_project_resource',
        description: `Linked ${label} URL to "${target.name || target.title}"`,
        data: { projectId: target.id, ...updates }
      };
    }
  }

  // 3. Update Project Banner / Cover
  if (call.name === 'update_project_banner') {
    const { url, projectTitle } = call.args;
    const target = resolveTargetProject(projectTitle, currentProject);
    if (target && url) {
      const cleanUrl = String(url).trim();
      projectStore.updateProject(target.id, {
        thumbnail: cleanUrl,
        image: cleanUrl
      });
      toast.success(`Updated banner for "${target.name || target.title}"`);
      return {
        toolName: 'update_project_banner',
        description: `Updated cover banner image for "${target.name || target.title}"`,
        data: { projectId: target.id, thumbnail: cleanUrl }
      };
    }
  }

  // 4. Create Project Filesystem Folder
  if (call.name === 'create_project_folder') {
    const { projectTitle } = call.args;
    const target = resolveTargetProject(projectTitle, currentProject);
    if (target) {
      const name = target.title || target.name || 'Project';
      const isDesktop = (window as any).electronAPI?.isDesktop;

      if (isDesktop && (window as any).electronAPI?.projects?.createFolder) {
        (window as any).electronAPI.projects.createFolder(target.id, name).catch(() => {});
      } else {
        fetch('/api/projects/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: target.id, projectName: name })
        }).catch(() => {});
      }

      toast.success(`Created project workspace folder for "${name}"`);
      return {
        toolName: 'create_project_folder',
        description: `Created workspace folder for "${name}"`,
        data: { projectId: target.id, projectName: name }
      };
    }
  }

  // 5. Delete Specific Moodboard Item
  if (call.name === 'delete_moodboard_item') {
    const { itemTitle, itemId } = call.args;
    if (itemTitle || itemId) {
      const q = (itemTitle || '').toLowerCase().trim();
      setItems((prev: any[]) =>
        (Array.isArray(prev) ? prev : []).filter((item: any) => {
          if (itemId && item.id === itemId) return false;
          if (q && item.title && item.title.toLowerCase().includes(q)) return false;
          if (q && item.content && item.content.toLowerCase().includes(q)) return false;
          return true;
        })
      );

      const label = itemTitle || itemId;
      toast.success(`Removed "${label}" from moodboard`);
      return {
        toolName: 'delete_moodboard_item',
        description: `Removed "${label}" from moodboard`,
        data: { itemTitle, itemId }
      };
    }
  }

  return null;
}
