import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Cpu } from 'lucide-react';
import { useSettings } from '../../../../hooks/useSettings';

interface ModelOption {
  id: string;
  name: string;
  provider: 'groq' | 'gemini';
  badge: string;
  description: string;
}

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'gemini',
    badge: 'High Stability',
    description: 'High-throughput multimodal model with 1M context'
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'gemini',
    badge: 'Ultra Fast',
    description: 'Fast multimodal intelligence with 1M context'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    badge: 'Flagship',
    description: 'Deep reasoning & advanced project intelligence'
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'gemini',
    badge: 'Recommended',
    description: 'Google AI Studio recommended model'
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    provider: 'groq',
    badge: 'Groq LPU',
    description: 'Sub-second inference with tool calling support'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'groq',
    badge: 'Groq Deep',
    description: 'Deep reasoning architecture on Groq hardware'
  }
];

interface ModelSelectorProps {
  isCompact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isCompact = false }) => {
  const { settings, updateSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(DEFAULT_MODELS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const aiSettings = settings.aiSettings || { enabled: false, apiKey: '', model: 'gemini-3.5-flash' };
  const enabledKeys = (aiSettings.apiKeys || []).filter((k) => k.isEnabled !== false);
  const activeKey = enabledKeys.find((k) => k.isActive) || enabledKeys[0] || { key: aiSettings.apiKey, provider: aiSettings.apiKey.startsWith('gsk_') ? 'groq' : 'gemini' };
  const activeProvider = activeKey?.provider || (activeKey?.key?.startsWith('gsk_') ? 'groq' : 'gemini');

  // Discover live models offered by user's enabled keys
  useEffect(() => {
    const keysToQuery = enabledKeys.length > 0 ? enabledKeys : (aiSettings.apiKey ? [{ key: aiSettings.apiKey }] : []);
    if (keysToQuery.length === 0) return;

    fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: keysToQuery })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.models) && data.models.length > 0) {
          // Merge detected models with defaults, avoiding duplicates
          setModelOptions((prev) => {
            const map = new Map<string, ModelOption>();
            [...DEFAULT_MODELS, ...data.models].forEach(m => map.set(m.id, m));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => { });
  }, [aiSettings.apiKeys, aiSettings.apiKey]);

  // Auto-heal deprecated or non-working models
  useEffect(() => {
    let target = aiSettings.model;
    const deprecated = [
      'claude-opus-4.6-thinking',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'canopylabs/orpheus-v1-english',
      'canopylabs/orpheus-arabic-saudi',
      'allam-2-7b',
      'llama-3.3-70b-versatile'
    ];
    if (!target || deprecated.includes(target)) {
      target = activeProvider === 'groq' ? 'qwen/qwen3.8-27b' : 'gemini-3.5-flash';
      updateSettings({ aiSettings: { ...aiSettings, model: target } });
    }
  }, [activeProvider, aiSettings.model]);

  const currentModelId = aiSettings.model || 'gemini-3.5-flash';
  const activeModel = modelOptions.find((m) => m.id === currentModelId) || {
    id: currentModelId,
    name: currentModelId.includes('gemini') ? 'Gemini 3.5 Flash' : currentModelId,
    provider: currentModelId.includes('gemini') ? ('gemini' as const) : ('groq' as const),
    badge: 'Active',
    description: 'Active model'
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = (model: ModelOption) => {
    updateSettings({
      aiSettings: {
        ...aiSettings,
        model: model.id
      }
    });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center min-w-0 select-none ${isOpen ? 'z-50' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none group focus:outline-none"
        title={`Current Model: ${activeModel.name}. Click to change.`}
      >
        <span className="truncate max-w-[150px] sm:max-w-[210px] text-zinc-300 group-hover:text-zinc-100 font-normal">
          {activeModel.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180 text-zinc-300' : ''
            }`}
        />
      </button>

      {/* Upward Popover */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-[350] w-[calc(100vw-36px)] max-w-[280px] sm:w-76 rounded-xl bg-[#141416] border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-1 text-left animate-in fade-in-0 zoom-in-95 duration-100 font-sans">
          <div className="px-2 py-1 border-b border-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              Available Models ({modelOptions.length})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
            {modelOptions.map((m) => {
              const isSelected = m.id === currentModelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectModel(m)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${isSelected
                    ? 'bg-zinc-800 text-white font-medium shadow-2xs'
                    : 'hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {m.name}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${isSelected ? 'bg-zinc-900 text-zinc-200 border-zinc-700' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800'
                        }`}>
                        {m.badge}
                      </span>
                    </div>
                    <span className={`text-[10px] leading-snug truncate ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {m.description}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
