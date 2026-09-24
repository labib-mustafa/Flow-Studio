import React, { useState } from 'react';
import { Key, Eye, EyeOff, RefreshCw, Check, Sparkles, Zap } from 'lucide-react';
import { useSettings } from '../../../../hooks/useSettings';
import { geminiService, getProviderFromKey } from '../../../../services/geminiService';
import { toast } from '../../../../stores/toastStore';

export const ApiKeyBanner: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const aiSettings = settings?.aiSettings || { apiKey: '', enabled: false, model: 'llama-3.1-8b-instant' };
  const hasApiKey = Boolean(aiSettings.apiKey && aiSettings.enabled);

  const [inlineKey, setInlineKey] = useState('');
  const [showInlineKey, setShowInlineKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  if (hasApiKey) return null;

  const detectedProvider = getProviderFromKey(inlineKey);

  const handleSaveInlineKey = async () => {
    const trimmed = inlineKey.trim();
    if (!trimmed) {
      setKeyError('Please enter a valid API key.');
      return;
    }

    const provider = getProviderFromKey(trimmed);
    const targetModel = provider === 'gemini' ? 'gemini-3.6-flash' : 'llama-3.1-8b-instant';

    setIsTestingKey(true);
    setKeyError(null);
    const result = await geminiService.testKey(trimmed, targetModel);
    setIsTestingKey(false);

    if (result.success) {
      const entry = {
        id: `key-${Date.now()}`,
        name: provider === 'groq' ? 'Groq Primary' : 'Gemini Primary',
        key: trimmed,
        provider,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      updateSettings({
        aiSettings: {
          ...aiSettings,
          enabled: true,
          apiKey: trimmed,
          model: targetModel,
          apiKeys: [entry]
        }
      });
      setKeyError(null);
      toast.success(result.message || 'AI Co-Pilot successfully connected!');
    } else {
      setKeyError(result.message);
      toast.error(result.message);
    }
  };

  return (
    <div className="p-3 sm:p-4 mx-3 sm:mx-4.5 mt-2.5 sm:mt-3 bg-[#141416] rounded-xl border border-zinc-800 flex flex-col gap-2.5 text-left shrink-0 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
          <Key className="w-4 h-4 text-zinc-400" />
          <span>Connect Free AI Co-Pilot API Key</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-zinc-400 hover:text-white underline flex items-center gap-0.5"
            title="14,400 free requests per day, zero rate limits"
          >
            <Zap className="w-3 h-3 text-zinc-400 inline" />
            Get Free Groq Key (14.4k/day) ↗
          </a>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-zinc-400 hover:text-white underline flex items-center gap-0.5"
          >
            Gemini ↗
          </a>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Recommended: Use <strong className="font-medium text-zinc-200">Groq Cloud</strong> for 14,400 free requests/day with blazing sub-second inference and zero rate-limiting. Paste key below:
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showInlineKey ? 'text' : 'password'}
            value={inlineKey}
            onChange={(e) => {
              setInlineKey(e.target.value);
              if (keyError) setKeyError(null);
            }}
            placeholder="Paste Groq (gsk_...) or Gemini (AIzaSy...) key"
            className="w-full text-xs font-mono px-3 py-1.5 pr-20 rounded-lg border border-zinc-800 bg-[#0e0e10] text-zinc-100 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
          />

          <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
            {detectedProvider === 'groq' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Groq
              </span>
            )}
            {detectedProvider === 'gemini' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Gemini
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowInlineKey(!showInlineKey)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
            >
              {showInlineKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveInlineKey}
          disabled={isTestingKey || !inlineKey.trim()}
          className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
        >
          {isTestingKey ? <RefreshCw className="w-3 h-3 animate-spin text-zinc-300" /> : <Check className="w-3 h-3 text-zinc-200" />}
          <span>Save</span>
        </button>
      </div>

      {keyError && (
        <div className="text-[10px] text-zinc-400 font-medium">{keyError}</div>
      )}
    </div>
  );
};
