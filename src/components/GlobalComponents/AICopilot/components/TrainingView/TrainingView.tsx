import React, { useState } from 'react';
import { GraduationCap, Plus, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import { TrainedRule } from '../../types';
import { formatLocalDate } from '../../utils/dateParser';
import { toast } from '../../../../../stores/toastStore';

interface TrainingViewProps {
  trainedRules: TrainedRule[];
  onAddRule: (rule: TrainedRule) => void;
  onDeleteRule: (id: string) => void;
  onResetDefaults: () => void;
  onTestInChat: (trigger: string) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  trainedRules,
  onAddRule,
  onDeleteRule,
  onResetDefaults,
  onTestInChat
}) => {
  const [newRuleTrigger, setNewRuleTrigger] = useState('');
  const [newRuleResponse, setNewRuleResponse] = useState('');

  const handleTeachRule = () => {
    if (!newRuleTrigger.trim() || !newRuleResponse.trim()) return;
    const newRule: TrainedRule = {
      id: `rule-${Date.now()}`,
      trigger: newRuleTrigger.trim(),
      response: newRuleResponse.trim(),
      createdAt: formatLocalDate(new Date())
    };
    onAddRule(newRule);
    setNewRuleTrigger('');
    setNewRuleResponse('');
    toast.success(`Trained Nova for "${newRule.trigger}"!`);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 flex flex-col gap-4 select-text bg-black">
      {/* Header / Intro Card */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shadow-2xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              Nova Training Studio
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                Ground Truth
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Teach custom answers, studio facts, or map shortcut triggers to instant app actions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Restore default training rules"
        >
          Reset Defaults
        </button>
      </div>

      {/* Quick Add Form */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#141416] flex flex-col gap-3">
        <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-zinc-400" /> Teach New Rule or Trigger
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">When I say (Trigger):</label>
            <input
              type="text"
              value={newRuleTrigger}
              onChange={(e) => setNewRuleTrigger(e.target.value)}
              placeholder='e.g. "survey meeting" or "brand colors"'
              className="w-full text-xs px-3 py-2 bg-[#0e0e10] rounded-lg border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Nova should answer / execute:</label>
            <input
              type="text"
              value={newRuleResponse}
              onChange={(e) => setNewRuleResponse(e.target.value)}
              placeholder='e.g. "schedule meeting Survey on 22 sep at 2pm" or knowledge text'
              className="w-full text-xs px-3 py-2 bg-[#0e0e10] rounded-lg border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 shadow-2xs"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <span className="text-[10px] text-zinc-500">
            💡 In chat anytime, type: <code className="text-zinc-300 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded font-mono">/train [trigger] -&gt; [answer]</code>
          </span>
          <button
            type="button"
            disabled={!newRuleTrigger.trim() || !newRuleResponse.trim()}
            onClick={handleTeachRule}
            className="px-4 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            Teach Nova
          </button>
        </div>
      </div>

      {/* List of Active Rules */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
          <span>Active Trained Rules ({trainedRules.length})</span>
          <span className="text-[10px] text-zinc-500">Instant fast-path synced directly to AI system prompt</span>
        </div>

        <div className="flex flex-col gap-2">
          {trainedRules.map((rule) => {
            const isAction = /^(?:schedule|create|make|add|start|track|go\s+to|open)\s+/i.test(rule.response);
            return (
              <div
                key={rule.id}
                className="p-3 rounded-xl border border-zinc-800 bg-[#141416] hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs group"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      "{rule.trigger}"
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    {isAction ? (
                      <span className="text-[10px] font-medium text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                        Instant Action
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                        Ground Truth
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed break-words font-mono text-[11px] bg-[#101012] p-2 rounded-lg border border-zinc-800">
                    {rule.response}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onTestInChat(rule.trigger)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Test trigger in chat"
                  >
                    Test in Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteRule(rule.id);
                      toast.info(`Deleted rule "${rule.trigger}"`);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {trainedRules.length === 0 && (
            <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-6 h-6 text-zinc-600" />
              <p className="text-xs font-medium text-zinc-400">No custom rules trained yet.</p>
              <button
                type="button"
                onClick={onResetDefaults}
                className="text-xs font-medium text-zinc-300 hover:underline cursor-pointer"
              >
                Load Studio Defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
