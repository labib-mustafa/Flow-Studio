import { useState, useEffect } from 'react';
import { TabMode } from '../types';
import { useProjectStore } from '../../../../stores/projectStore';
import { useTaskStore } from '../../../../stores/taskStore';
import { useSettings } from '../../../../hooks/useSettings';
import { toast } from '../../../../stores/toastStore';
import { geminiService, GeneratedTask, DesignBrief, MoodboardGeneratedItem } from '../../../../services/geminiService';

export const useClassicTools = () => {
  const { currentProject } = useProjectStore();
  const addTask = useTaskStore(state => state.addTask);
  const { settings } = useSettings();
  const aiSettings = settings?.aiSettings || { enabled: false, apiKey: '', model: 'gemini-1.5-flash' };

  const [activeTab, setActiveTab] = useState<TabMode>('tasks');
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableNotesCount, setAvailableNotesCount] = useState(0);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [extractedBrief, setExtractedBrief] = useState<DesignBrief | null>(null);
  const [generatedMoodboard, setGeneratedMoodboard] = useState<MoodboardGeneratedItem[]>([]);

  // Update notes count when project changes or notes update
  useEffect(() => {
    const updateCount = () => {
      const activeProjId = currentProject?.id || 'default';
      const noteKey = `notes-list-${activeProjId}`;
      const saved = localStorage.getItem(noteKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAvailableNotesCount(parsed.length);
            return;
          }
        } catch { }
      }
      setAvailableNotesCount(0);
    };

    updateCount();
    const handleNotesUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.projectId || detail.projectId === currentProject?.id) {
        updateCount();
      }
    };
    window.addEventListener('flowstudio-notes-updated', handleNotesUpdate);
    return () => window.removeEventListener('flowstudio-notes-updated', handleNotesUpdate);
  }, [currentProject?.id]);

  const handleInsertProjectNotes = () => {
    const noteKey = `notes-list-${currentProject?.id || 'default'}`;
    const saved = localStorage.getItem(noteKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const combined = parsed
            .map((n: any) => `## ${n.title}\n${(n.content || '').replace(/<[^>]*>?/gm, '')}`)
            .join('\n\n');
          setPromptText(combined);
          toast.success(`Inserted notes from ${currentProject?.title || currentProject?.name || 'Project'}`);
        }
      } catch { }
    }
  };

  const handleGenerate = async () => {
    if (!aiSettings.apiKey) return toast.error('Please configure your Gemini API key');
    if (!promptText.trim()) return toast.error('Please enter prompt text');

    setLoading(true);
    try {
      const activeProjId = currentProject?.id || 'default';
      const activeProjTitle = currentProject?.title || currentProject?.name || 'Project';

      if (activeTab === 'tasks') {
        const tasks = await geminiService.generateTasks(
          aiSettings.apiKey,
          promptText,
          activeProjId,
          activeProjTitle,
          aiSettings.model
        );
        setGeneratedTasks(tasks);
        setSelectedTaskIds(new Set(tasks.map(t => t.id)));
        toast.success(`Generated ${tasks.length} tasks!`);
      } else if (activeTab === 'brief') {
        const brief = await geminiService.extractBrief(aiSettings.apiKey, promptText, aiSettings.model);
        setExtractedBrief(brief);
        toast.success('Design brief generated!');
      } else {
        const items = await geminiService.generateMoodboard(aiSettings.apiKey, promptText, activeProjId, aiSettings.model);
        setGeneratedMoodboard(items);
        toast.success(`Generated ${items.length} moodboard cards!`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelectedTasks = () => {
    const tasksToAdd = generatedTasks.filter(t => selectedTaskIds.has(t.id));
    tasksToAdd.forEach(task => addTask({ ...task, projectId: currentProject?.id || 'default' }));
    toast.success(`Added ${tasksToAdd.length} tasks!`);
    setGeneratedTasks([]);
  };

  return {
    activeTab,
    setActiveTab,
    promptText,
    setPromptText,
    loading,
    availableNotesCount,
    setAvailableNotesCount,
    generatedTasks,
    selectedTaskIds,
    extractedBrief,
    generatedMoodboard,
    handleInsertProjectNotes,
    handleGenerate,
    handleApplySelectedTasks
  };
};
