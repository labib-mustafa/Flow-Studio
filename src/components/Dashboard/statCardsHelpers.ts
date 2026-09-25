import { useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useClientStore } from '../../stores/clientStore';
import { useBillingStore } from '../../stores/billingStore';
import { useLeadStore } from '../../stores/leadStore';
import { useActivityStore } from '../../stores/activityStore';
import {
  ClientBarItem,
  RevenueMonthItem,
  PipelineStageItem,
  ProjectPhaseItem
} from './StatCardCharts';

export const useStatCardsData = () => {
  const { projects } = useProjectStore();
  const { clients } = useClientStore();
  const { balance, paymentHistory } = useBillingStore();
  const { leads } = useLeadStore();
  const { activities } = useActivityStore();

  /* ── 1. Projects Calculations ── */
  const { activeProjects, avgCompletion, projectPhases } = useMemo(() => {
    const active = projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived');
    const avg = active.length > 0
      ? Math.round(active.reduce((acc, p) => acc + (p.completion || p.progress || 0), 0) / active.length)
      : 0;

    const phases: ProjectPhaseItem[] = [
      { name: 'Planning', count: active.filter(p => (p.completion || p.progress || 0) < 25).length },
      { name: 'In Dev', count: active.filter(p => (p.completion || p.progress || 0) >= 25 && (p.completion || p.progress || 0) < 75).length },
      { name: 'Review', count: active.filter(p => (p.completion || p.progress || 0) >= 75).length },
      { name: 'Done', count: projects.filter(p => p.status === 'Completed').length }
    ];

    return { activeProjects: active, avgCompletion: avg, projectPhases: phases };
  }, [projects]);

  /* ── 2. Clients Calculations ── */
  const { activeClients, prospectClients, activeRatio, clientBars } = useMemo(() => {
    const active = clients.filter(c => c.status === 'Active');
    const prospect = clients.filter(c => c.status === 'Prospect');
    const total = clients.length;
    const ratio = total > 0 ? Math.round((active.length / total) * 100) : (active.length > 0 ? 100 : 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayBars: ClientBarItem[] = [];
    let touchpointsCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayActs = activities.filter(a => {
        const aDate = a.timestamp ? a.timestamp.slice(0, 10) : '';
        return aDate === dateStr && (a.type === 'client' || a.type === 'project' || a.type === 'invoice');
      });

      touchpointsCount += dayActs.length;
      dayBars.push({
        label: dayName,
        count: dayActs.length,
        subtitle: `${dayName}: ${dayActs.length} touchpoint${dayActs.length !== 1 ? 's' : ''}`
      });
    }

    if (touchpointsCount > 0) {
      return { activeClients: active, prospectClients: prospect, activeRatio: ratio, clientBars: dayBars };
    }

    const sorted = [...active].sort((a, b) => (b.projectsCount || 0) - (a.projectsCount || 0));
    const fallbackBars: ClientBarItem[] = [];
    for (let i = 0; i < 7; i++) {
      const c = sorted[i];
      if (c) {
        const pCount = c.projectsCount || (c.projectHistory?.length) || 1;
        fallbackBars.push({
          label: c.initials || c.name.slice(0, 2).toUpperCase(),
          count: pCount,
          subtitle: `${c.name}: ${pCount} proj`
        });
      } else {
        fallbackBars.push({ label: `S${i + 1}`, count: 0, subtitle: 'Available Capacity' });
      }
    }

    return { activeClients: active, prospectClients: prospect, activeRatio: ratio, clientBars: fallbackBars };
  }, [clients, activities]);

  /* ── 3. Billing & Revenue Calculations ── */
  const { formattedCollected, formattedBalance, collectionRate, revenueMonths } = useMemo(() => {
    const col = paymentHistory
      .filter(p => p.status === 'Completed')
      .reduce((acc, p) => acc + p.amount, 0);

    const totalRev = col + balance;
    const rate = totalRev > 0 ? Math.round((col / totalRev) * 100) : (col > 0 ? 100 : 0);

    const today = new Date();
    const months: RevenueMonthItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthNum = d.getMonth();

      const monthRev = paymentHistory
        .filter(p => {
          if (p.status !== 'Completed') return false;
          const pDate = new Date(p.date);
          return pDate.getFullYear() === year && pDate.getMonth() === monthNum;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      months.push({
        month: monthShort,
        year,
        revenue: monthRev,
        isCurrent: i === 0
      });
    }

    const totalInMonths = months.reduce((s, m) => s + m.revenue, 0);
    if (totalInMonths === 0 && col > 0) {
      months[months.length - 1].revenue = col;
    }

    return {
      formattedCollected: col >= 1000 ? `${(col / 1000).toFixed(1)}k` : `${col}`,
      formattedBalance: balance >= 1000 ? `${(balance / 1000).toFixed(1)}k` : `${balance}`,
      collectionRate: rate,
      revenueMonths: months
    };
  }, [paymentHistory, balance]);

  /* ── 4. Pipeline & Leads Calculations ── */
  const { activeLeads, newLeadsCount, conversionRate, leadStages } = useMemo(() => {
    const active = leads.filter(l => l.status !== 'Archived');
    const newCount = leads.filter(l => l.status === 'New').length;
    const contactCount = leads.filter(l => l.status === 'Contacted').length;
    const proposalCount = leads.filter(l => l.status === 'Proposal Sent').length;
    const wonCount = leads.filter(l =>
      l.notes_summary?.toLowerCase().includes('promoted') ||
      l.tags?.includes('promoted') ||
      l.timeline?.some(t => t.event?.toLowerCase().includes('promoted')) ||
      (l.status === 'Archived' && l.notes_summary?.toLowerCase().includes('client'))
    ).length;

    const total = leads.length;
    const converted = proposalCount + wonCount;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

    const stages: PipelineStageItem[] = [
      { label: 'NEW', name: 'New Leads', count: newCount },
      { label: 'CONT', name: 'Contacted', count: contactCount },
      { label: 'PROP', name: 'Proposal Sent', count: proposalCount },
      { label: 'WON', name: 'Converted / Won', count: wonCount }
    ];

    return { activeLeads: active, newLeadsCount: newCount, conversionRate: rate, leadStages: stages };
  }, [leads]);

  return {
    projectsCount: projects.length,
    activeProjects,
    avgCompletion,
    projectPhases,
    activeClients,
    prospectClients,
    activeRatio,
    clientBars,
    formattedCollected,
    formattedBalance,
    collectionRate,
    revenueMonths,
    activeLeads,
    newLeadsCount,
    conversionRate,
    leadStages
  };
};
