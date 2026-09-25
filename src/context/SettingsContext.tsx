import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import defaultSettings from '../settings.json';

export interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  provider: 'groq' | 'gemini' | 'openrouter' | 'unknown';
  isActive: boolean;
  isEnabled?: boolean;
  createdAt: string;
}

export interface AISettings {
  enabled: boolean;
  apiKey: string;
  model: string;
  apiKeys?: ApiKeyEntry[];
}

export interface Settings {
  baseProjectPath: string;
  shipFolderName: string;
  metadataPath: string;
  defaultProjectName: string;
  defaultAuthor: string;
  displayName: string;
  role: string;
  email: string;
  bio: string;
  profileImage: string;
  editorExperience: {
    darkCanvas: boolean;
    pixelSnap: boolean;
    autoSave: boolean;
  };
  defaults: {
    canvasSize: 'social' | 'hd' | 'portrait' | 'custom';
    initialStatus: 'draft' | 'in-review' | 'approved';
    autoAssignTeam: string[];
    typography: {
      headingFont: string;
      bodyFont: string;
      baseSize: number;
    };
  };
  dataLocation: {
    currentPath: string;
    storageUsage: {
      used: number;
      total: number;
      projects: number;
      cache: number;
    };
    cloudSync: {
      enabled: boolean;
      frequency: 'real-time' | 'every-hour' | 'daily' | 'manual';
      bandwidthLimit: 'unlimited' | 'high' | 'medium' | 'low';
    };
  };
  notifications: {
    app: {
      newProject: boolean;
      taskCompleted: boolean;
      newComments: boolean;
      deadlineApproaching: boolean;
    };
    email: {
      dailyDigest: boolean;
      productUpdates: boolean;
    };
    sounds: {
      soundEffects: boolean;
    };
  };
  trashSettings: {
    retentionDays: number;
  };
  aiSettings?: AISettings;
  timeZone?: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/** Deep-merge parsed settings with defaults to handle missing nested keys */
function mergeWithDefaults(parsed: any): Settings {
  return {
    ...defaultSettings,
    ...parsed,
    timeZone: parsed.timeZone || (defaultSettings as any).timeZone || 'auto',
    notifications: {
      app: { ...defaultSettings.notifications.app, ...(parsed.notifications?.app || {}) },
      email: { ...defaultSettings.notifications.email, ...(parsed.notifications?.email || {}) },
      sounds: { ...defaultSettings.notifications.sounds, ...(parsed.notifications?.sounds || {}) }
    },
    editorExperience: {
      ...defaultSettings.editorExperience,
      ...(parsed.editorExperience || {})
    },
    defaults: {
      ...defaultSettings.defaults,
      ...(parsed.defaults || {}),
      typography: {
        ...defaultSettings.defaults.typography,
        ...(parsed.defaults?.typography || {})
      }
    },
    dataLocation: {
      ...defaultSettings.dataLocation,
      ...(parsed.dataLocation || {}),
      storageUsage: {
        ...defaultSettings.dataLocation.storageUsage,
        ...(parsed.dataLocation?.storageUsage || {})
      },
      cloudSync: {
        ...defaultSettings.dataLocation.cloudSync,
        ...(parsed.dataLocation?.cloudSync || {})
      }
    },
    trashSettings: {
      ...defaultSettings.trashSettings,
      ...(parsed.trashSettings || {})
    },
    aiSettings: (() => {
      const baseAI = { ...(defaultSettings as any).aiSettings, ...(parsed.aiSettings || {}) };
      let keys: ApiKeyEntry[] = Array.isArray(baseAI.apiKeys) ? baseAI.apiKeys : [];
      if (baseAI.apiKey && keys.length === 0) {
        const isGroq = baseAI.apiKey.startsWith('gsk_');
        keys = [{
          id: 'key-primary',
          name: isGroq ? 'Groq Primary Key' : 'Gemini Primary Key',
          key: baseAI.apiKey,
          provider: isGroq ? 'groq' : 'gemini',
          isActive: true,
          isEnabled: true,
          createdAt: new Date().toISOString()
        }];
      } else {
        keys = keys.map(k => ({
          ...k,
          isEnabled: k.isEnabled !== undefined ? k.isEnabled : true
        }));
      }
      return { ...baseAI, apiKeys: keys };
    })()
  } as Settings;
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Start with localStorage (synchronous) for instant render
    const saved = localStorage.getItem('flowstudio-settings');
    if (!saved) return defaultSettings as Settings;
    try {
      return mergeWithDefaults(JSON.parse(saved));
    } catch {
      return defaultSettings as Settings;
    }
  });

  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // On mount, try to load from API (async, higher priority)
  useEffect(() => {
    fetch('/api/store/settings')
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        // Zustand persist format: { state: {...}, version: 0 }
        const stateData = data?.state || data;
        if (stateData && typeof stateData === 'object') {
          const merged = mergeWithDefaults(stateData);
          setSettings(merged);
          localStorage.setItem('flowstudio-settings', JSON.stringify(merged));
        }
      })
      .catch(() => {
        // API unavailable — stick with localStorage data
      })
      .finally(() => {
        isInitializedRef.current = true;
      });
  }, []);

  // Persist to localStorage + API on every settings change (debounced API write)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    localStorage.setItem('flowstudio-settings', JSON.stringify(settings));

    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const payload = JSON.stringify({ state: settings, version: 0 });
      fetch('/api/store/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {
        console.warn('[Settings] Failed to write settings to API');
      });
    }, 300);
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings as Settings);
    localStorage.removeItem('flowstudio-settings');
    // Also clear from API
    fetch('/api/store/settings', { method: 'DELETE' }).catch(() => {});
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
