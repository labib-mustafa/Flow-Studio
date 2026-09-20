import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useClientStore } from '../stores/clientStore';
import { useTeamStore } from '../stores/teamStore';
import { useLeadStore } from '../stores/leadStore';
import { useBillingStore } from '../stores/billingStore';
import { useEventStore } from '../stores/eventStore';
import { useActivityStore } from '../stores/activityStore';

/**
 * Returns true when all critical stores have finished hydrating from disk,
 * or after a max 1.5s timeout safety fallback to ensure the app always renders.
 */
export function useAppReady(): boolean {
  const p = useProjectStore((s) => s._hasHydrated);
  const t = useTaskStore((s) => s._hasHydrated);
  const c = useClientStore((s) => s._hasHydrated);
  const tm = useTeamStore((s) => s._hasHydrated);
  const l = useLeadStore((s) => s._hasHydrated);
  const b = useBillingStore((s) => s._hasHydrated);
  const e = useEventStore((s) => s._hasHydrated);
  const a = useActivityStore((s) => s._hasHydrated);

  const storesReady = p && t && c && tm && l && b && e && a;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Safety fallback: ensure app renders after 1.5s no matter what
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return storesReady || timedOut;
}
