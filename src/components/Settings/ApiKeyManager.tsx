import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  ExternalLink,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { ApiKeyEntry } from '../../context/SettingsContext';
import { geminiService, getProviderFromKey, cleanErrorMessage } from '../../services/geminiService';
import { toast } from '../../stores/toastStore';

export const ApiKeyManager: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const aiSettings = settings.aiSettings || {
    enabled: false,
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    apiKeys: []
  };

  const rawKeys: ApiKeyEntry[] = Array.isArray(aiSettings.apiKeys) ? aiSettings.apiKeys : [];

  // If there's an existing single key but no apiKeys array, normalize it
  const keys: ApiKeyEntry[] = (rawKeys.length > 0
    ? rawKeys
    : aiSettings.apiKey
      ? [
        {
          id: 'key-initial',
          name: aiSettings.apiKey.startsWith('gsk_') ? 'Groq Primary' : 'Gemini Primary',
          key: aiSettings.apiKey,
          provider: aiSettings.apiKey.startsWith('gsk_') ? 'groq' : 'gemini',
          isActive: true,
          isEnabled: true,
          createdAt: new Date().toISOString()
        }
      ]
      : []).map((k) => ({
        ...k,
        isEnabled: k.isEnabled !== undefined ? k.isEnabled : true
      }));

  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [setAsActiveImmediately, setSetAsActiveImmediately] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addKeyError, setAddKeyError] = useState<string | null>(null);

  // Per-key reveal and testing state
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const detectedNewProvider = getProviderFromKey(newKeyValue);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 10) return '••••••••••';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleSetActiveKey = (keyEntry: ApiKeyEntry) => {
    const updatedKeys = keys.map((k) => ({
      ...k,
      isActive: k.id === keyEntry.id,
      isEnabled: k.id === keyEntry.id ? true : (k.isEnabled !== undefined ? k.isEnabled : true)
    }));

    // Auto-align recommended model when switching between providers
    let targetModel = aiSettings.model;
    if (keyEntry.provider === 'groq' && (!targetModel || targetModel.includes('gemini'))) {
      targetModel = 'qwen/qwen3.8-27b';
    } else if (keyEntry.provider === 'gemini' && (!targetModel || !targetModel.includes('gemini'))) {
      targetModel = 'gemini-3.5-flash';
    }

    updateSettings({
      aiSettings: {
        ...aiSettings,
        enabled: true,
        apiKey: keyEntry.key,
        model: targetModel,
        apiKeys: updatedKeys
      }
    });
  };

  const handleToggleKeyEnabled = (id: string) => {
    const target = keys.find((k) => k.id === id);
    if (!target) return;

    const willBeEnabled = target.isEnabled === false;
    let updatedActiveKey = aiSettings.apiKey;
    let nextKeys = keys.map((k) => {
      if (k.id === id) {
        return { ...k, isEnabled: willBeEnabled };
      }
      return k;
    });

    if (!willBeEnabled && target.isActive) {
      // Find another enabled key to become active
      const nextCandidate = nextKeys.find((k) => k.id !== id && k.isEnabled !== false);
      if (nextCandidate) {
        nextKeys = nextKeys.map((k) => ({
          ...k,
          isActive: k.id === nextCandidate.id
        }));
        updatedActiveKey = nextCandidate.key;
      }
    }

    updateSettings({
      aiSettings: {
        ...aiSettings,
        apiKey: updatedActiveKey,
        apiKeys: nextKeys
      }
    });
  };

  const handleDeleteKey = (id: string) => {
    const target = keys.find((k) => k.id === id);
    if (!target) return;

    const remaining = keys.filter((k) => k.id !== id);

    let nextActiveKey = '';
    let nextEnabled = aiSettings.enabled;

    if (target.isActive) {
      if (remaining.length > 0) {
        remaining[0].isActive = true;
        nextActiveKey = remaining[0].key;
      } else {
        nextActiveKey = '';
        nextEnabled = false;
      }
    } else {
      nextActiveKey = aiSettings.apiKey;
    }

    updateSettings({
      aiSettings: {
        ...aiSettings,
        enabled: nextEnabled,
        apiKey: nextActiveKey,
        apiKeys: remaining
      }
    });

    toast.success(`Removed API key: ${target.name}`);
  };

  const handleTestSpecificKey = async (keyEntry: ApiKeyEntry) => {
    setTestingKeyId(keyEntry.id);
    setTestResults((prev) => {
      const copy = { ...prev };
      delete copy[keyEntry.id];
      return copy;
    });

    const testModel = keyEntry.provider === 'gemini' ? 'gemini-3.6-flash' : 'llama-3.1-8b-instant';
    const result = await geminiService.testKey(keyEntry.key, testModel);

    setTestingKeyId(null);
    setTestResults((prev) => ({
      ...prev,
      [keyEntry.id]: result
    }));

    if (result.success) {
      toast.success(`${keyEntry.name}: Connection verified!`);
    } else {
      toast.error(`${keyEntry.name}: ${result.message}`);
    }
  };

  const handleAddNewKey = async () => {
    const trimmedVal = newKeyValue.trim();
    if (!trimmedVal) {
      setAddKeyError('Please enter an API key.');
      return;
    }

    const provider = getProviderFromKey(trimmedVal);
    const testModel = provider === 'gemini' ? 'gemini-3.6-flash' : 'llama-3.1-8b-instant';

    setIsSaving(true);
    setAddKeyError(null);

    const testResult = await geminiService.testKey(trimmedVal, testModel);
    setIsSaving(false);

    if (!testResult.success) {
      setAddKeyError(testResult.message);
      toast.error(testResult.message);
      return;
    }

    const defaultName = provider === 'groq'
      ? `Groq Key (${keys.filter((k) => k.provider === 'groq').length + 1})`
      : `Gemini Key (${keys.filter((k) => k.provider === 'gemini').length + 1})`;

    const newEntry: ApiKeyEntry = {
      id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newKeyName.trim() || defaultName,
      key: trimmedVal,
      provider,
      isActive: setAsActiveImmediately || keys.length === 0,
      createdAt: new Date().toISOString()
    };

    let updatedKeys: ApiKeyEntry[];
    if (newEntry.isActive) {
      updatedKeys = keys.map((k) => ({ ...k, isActive: false })).concat(newEntry);
    } else {
      updatedKeys = [...keys, newEntry];
    }

    const activeSecret = newEntry.isActive ? newEntry.key : (aiSettings.apiKey || newEntry.key);
    let targetModel = aiSettings.model;
    if (newEntry.isActive) {
      if (provider === 'groq' && (!targetModel || targetModel.includes('gemini'))) {
        targetModel = 'llama-3.1-8b-instant';
      } else if (provider === 'gemini' && (!targetModel || targetModel.includes('llama'))) {
        targetModel = 'gemini-3.6-flash';
      }
    }

    updateSettings({
      aiSettings: {
        ...aiSettings,
        enabled: true,
        apiKey: activeSecret,
        model: targetModel,
        apiKeys: updatedKeys
      }
    });

    toast.success(`Added API key: ${newEntry.name}`);
    setNewKeyName('');
    setNewKeyValue('');
    setIsAddingKey(false);
    setAddKeyError(null);
  };

  const enabledKeysCount = keys.filter((k) => k.isEnabled !== false).length;

  return (
    <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-[#111111] mb-1 font-display flex items-center gap-2 flex-wrap">
            API Keys & Multi-Key Pool
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'} saved
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              enabledKeysCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {enabledKeysCount} active in rotation pool
            </span>
          </h4>
          <p className="text-xs text-[#6b7280]">
            Store and enable multiple Groq and Google Gemini keys. Flow Studio uses all enabled keys and automatically switches between them if rate limits or any errors occur.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingKey(!isAddingKey)}
          className="self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Key</span>
        </button>
      </div>

      {/* Add New Key Form Card */}
      {isAddingKey && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3.5 text-left animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              Add API Key
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAddingKey(false);
                setAddKeyError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Key Label / Friendly Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Groq Work, Personal Gemini"
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Secret API Key</span>
                {detectedNewProvider === 'groq' && (
                  <span className="text-[10px] font-bold text-emerald-700">Groq Detected</span>
                )}
                {detectedNewProvider === 'gemini' && (
                  <span className="text-[10px] font-bold text-blue-700">Gemini Detected</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showNewKey ? 'text' : 'password'}
                  value={newKeyValue}
                  onChange={(e) => {
                    setNewKeyValue(e.target.value);
                    if (addKeyError) setAddKeyError(null);
                  }}
                  placeholder="Paste gsk_... or AIzaSy..."
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewKey(!showNewKey)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showNewKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={setAsActiveImmediately}
                onChange={(e) => setSetAsActiveImmediately(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Set as active key immediately</span>
            </label>

            <button
              type="button"
              onClick={handleAddNewKey}
              disabled={isSaving || !newKeyValue.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Verifying...' : 'Test & Save Key'}</span>
            </button>
          </div>

          {addKeyError && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addKeyError}</span>
            </div>
          )}
        </div>
      )}

      {/* Configured Keys List */}
      <div className="flex flex-col gap-2.5">
        {keys.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
            <Key className="w-8 h-8 text-slate-300" />
            <div className="text-sm font-semibold text-slate-700">No API keys saved yet</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Add your free Groq key (14,400 req/day) or Google Gemini key to unlock Nova AI autonomous tools.
            </p>
          </div>
        ) : (
          keys.map((k) => {
            const isVisible = Boolean(visibleKeys[k.id]);
            const isTesting = testingKeyId === k.id;
            const result = testResults[k.id];

            return (
              <div
                key={k.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  k.isActive
                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                    : k.isEnabled === false
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleSetActiveKey(k)}
                    className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${k.isActive ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:border-slate-500'
                      }`}
                    title={k.isActive ? 'Active Key' : 'Click to make active'}
                  >
                    {k.isActive && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">{k.name}</span>

                      {k.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Engine
                        </span>
                      )}

                      {k.isEnabled !== false ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Pool Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Disabled
                        </span>
                      )}

                      {k.provider === 'groq' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          Groq (14.4k/day)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Gemini
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-500">
                        {isVisible ? k.key : maskKey(k.key)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility(k.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title={isVisible ? 'Hide Key' : 'Reveal Key'}
                      >
                        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(k.key)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title="Copy to Clipboard"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    {result && (
                      <div className="mt-1.5 text-[11px] flex items-center gap-1">
                        {result.success ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Verified connected
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3" /> {result.message}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleKeyEnabled(k.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      k.isEnabled !== false
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                    title={
                      k.isEnabled !== false
                        ? 'Key is enabled for automatic rotation/failover. Click to disable.'
                        : 'Key is disabled from rotation pool. Click to enable.'
                    }
                  >
                    <span className={`w-2 h-2 rounded-full ${k.isEnabled !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{k.isEnabled !== false ? 'Pool: On' : 'Pool: Off'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSpecificKey(k)}
                    disabled={isTesting}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>Test</span>
                  </button>

                  {!k.isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActiveKey(k)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Make Active
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Helper Links Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-500">
          Get additional free keys: Groq (14.4k requests/day) or Google AI Studio.
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold hover:underline"
          >
            <Zap className="w-3 h-3 text-emerald-600" />
            Get Free Groq Key
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Gemini Key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
