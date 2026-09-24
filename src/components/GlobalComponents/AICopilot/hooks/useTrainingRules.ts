import { useState, useEffect, useCallback } from 'react';
import { TrainedRule } from '../types';
import { DEFAULT_TRAINED_RULES, STORAGE_KEYS } from '../constants';
import { toast } from '../../../../stores/toastStore';
import { sound } from '../../../../stores/soundStore';
import { formatLocalDate } from '../utils/dateParser';

/**
 * Rule ids retired because their trigger collides with a real app command. The
 * rule short-circuit in useCopilotChat runs before the tool dispatcher, so a
 * rule matching e.g. "delete all tasks" makes that command impossible to
 * execute. Filtered out of persisted storage so existing installs get the fix
 * without the user having to clear their saved rules.
 */
const RETIRED_RULE_IDS = new Set([
  'rule-del-notes',
  'rule-clear-notes',
  'rule-del-tasks',
  'rule-project-counts',
  'rule-status-breakdown'
]);

const loadRules = (): TrainedRule[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRAINING_RULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((r: TrainedRule) => r && !RETIRED_RULE_IDS.has(r.id));
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch { }
  return DEFAULT_TRAINED_RULES;
};

export const useTrainingRules = () => {
  const [trainedRules, setTrainedRules] = useState<TrainedRule[]>(loadRules);

  const [ruleTrigger, setRuleTrigger] = useState('');
  const [ruleResponse, setRuleResponse] = useState('');

  // Persist trained rules
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINING_RULES, JSON.stringify(trainedRules));
    } catch { }
  }, [trainedRules]);

  const addRule = useCallback((triggerOrRule: string | TrainedRule, response?: string) => {
    let newRule: TrainedRule;
    if (typeof triggerOrRule === 'object') {
      newRule = triggerOrRule;
    } else {
      const t = triggerOrRule.trim();
      const r = (response || '').trim();
      if (!t || !r) return false;
      newRule = {
        id: `rule-${Date.now()}`,
        trigger: t,
        response: r,
        createdAt: formatLocalDate(new Date())
      };
    }
    setTrainedRules(prev => [newRule, ...prev]);
    sound.pop();
    toast.success(`Trained Nova: "${newRule.trigger}"`);
    return true;
  }, []);

  const deleteRule = useCallback((id: string) => {
    setTrainedRules(prev => prev.filter(r => r.id !== id));
    sound.delete();
    toast.info('Rule removed from Nova memory');
  }, []);

  const resetToDefaults = useCallback(() => {
    setTrainedRules(DEFAULT_TRAINED_RULES);
    sound.pop();
    toast.success('Restored default training rules');
  }, []);

  const findMatchingRule = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    return trainedRules.find(r => {
      const trigger = r.trigger.toLowerCase().trim();
      return lower === trigger || lower.includes(trigger);
    });
  }, [trainedRules]);

  return {
    trainedRules,
    setTrainedRules,
    ruleTrigger,
    setRuleTrigger,
    ruleResponse,
    setRuleResponse,
    addRule,
    deleteRule,
    resetToDefaults,
    findMatchingRule
  };
};
