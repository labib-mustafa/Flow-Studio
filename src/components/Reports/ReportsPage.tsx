import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, FolderKanban, CheckCircle2, DollarSign, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useProjectStore } from '../../stores/projectStore';
import { useLeadStore } from '../../stores/leadStore';
import { useClientStore } from '../../stores/clientStore';
import { useTaskStore } from '../../stores/taskStore';
import { useBillingStore } from '../../stores/billingStore';
import { useActivityStore, ActivityEvent } from '../../stores/activityStore';
import { useTeamStore } from '../../stores/teamStore';
import { useMailStore } from '../../stores/mailStore';
import { PillTab } from '../GlobalComponents/PillTab';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Clock, ArrowRight, UserPlus, FileEdit, CheckSquare, MessageSquare, AlertCircle, Activity } from 'lucide-react';
import { formatLocalDate } from '../../lib/timezone';

type TimePeriod = 'week' | 'month' | 'quarter' | 'all';
type ReportsTab = 'Overview' | 'Project' | 'Team' | 'Lead' | 'Client';

const CHART_COLORS = {
  blue: '#1978e5',
  indigo: '#3713ec',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
  sky: '#38bdf8',
  violet: '#8b5cf6',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

/* ─── Custom Recharts Tooltip ────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700">
      <p className="font-bold mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Activity Heatmap ───────────────────────────────────────────── */
const ActivityHeatmap: React.FC<{ activityCounts: Record<string, number> }> = ({ activityCounts }) => {
  const weeks = 52;
  const days = 7;
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeks * 7) - todayDay + 1);

  const cells: { date: string; count: number; week: number; day: number }[] = [];
  const monthLabels: { label: string; week: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);
      if (cellDate > today) continue;
      const dateStr = formatLocalDate(cellDate);
      const count = activityCounts[dateStr] || 0;
      cells.push({ date: dateStr, count, week: w, day: d });

      if (cellDate.getMonth() !== lastMonth && d === 0) {
        lastMonth = cellDate.getMonth();
        monthLabels.push({ label: cellDate.toLocaleString('en', { month: 'short' }), week: w });
      }
    }
  }

  const maxCount = Math.max(1, ...cells.map(c => c.count));

  const getColor = (count: number) => {
    if (count === 0) return '#ebedf0';
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#9be9a8';
    if (intensity < 0.5) return '#40c463';
    if (intensity < 0.75) return '#30a14e';
    return '#216e39';
  };

  const cellSize = 13;
  const gap = 3;

  return (
    <div className="overflow-x-auto custom-scrollbar pb-2">
      <svg width={(weeks + 1) * (cellSize + gap) + 30} height={days * (cellSize + gap) + 30} className="block">
        {/* Month labels */}
        {monthLabels.map((m, i) => (
          <text key={i} x={30 + m.week * (cellSize + gap)} y={10} className="fill-slate-400" fontSize={10} fontWeight={600}>
            {m.label}
          </text>
        ))}
        {/* Day labels */}
        {dayLabels.map((label, i) => (
          <text key={i} x={0} y={22 + i * (cellSize + gap) + cellSize / 2} className="fill-slate-400" fontSize={10} fontWeight={500} dominantBaseline="middle">
            {label}
          </text>
        ))}
        {/* Cells */}
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={30 + cell.week * (cellSize + gap)}
            y={18 + cell.day * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={2.5}
            fill={getColor(cell.count)}
            className="transition-colors duration-100"
          >
            <title>{`${cell.date}: ${cell.count} activities`}</title>
          </rect>
        ))}
      </svg>
      <div className="flex items-center gap-1.5 mt-2 ml-8">
        <span className="text-[10px] text-slate-400 font-medium">Less</span>
        {['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((c, i) => (
          <div key={i} className="size-[10px] rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-slate-400 font-medium">More</span>
      </div>
    </div>
  );
};

/* ─── Main ReportsPage ───────────────────────────────────────────── */
export const ReportsPage: React.FC = () => {
  const { projects } = useProjectStore();
  const { leads } = useLeadStore();
  const { clients } = useClientStore();
  const { tasks } = useTaskStore();
  const { paymentHistory } = useBillingStore();
  const { getActivityCounts, activities } = useActivityStore();
  const { members } = useTeamStore();
  const { sentEmails } = useMailStore();

  const [period, setPeriod] = useState<TimePeriod>('all');
  const [activeTab, setActiveTab] = useState<ReportsTab>('Overview');
  const activityCounts = getActivityCounts();

  /* ─── Computed Data ──────────────────────────────────────────── */

  // KPI metrics
  const totalRevenue = useMemo(() =>
    paymentHistory.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0),
    [paymentHistory]
  );
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length, [projects]);
  const pipelineValue = useMemo(() => leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0), [leads]);
  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === 'Complete').length / tasks.length) * 100);
  }, [tasks]);

  // Revenue trend data (group payments by month)
  const revenueTrend = useMemo(() => {
    const monthMap: Record<string, number> = {};
    paymentHistory
      .filter(p => p.status === 'Completed')
      .forEach(p => {
        const d = new Date(p.date);
        const key = `${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`;
        monthMap[key] = (monthMap[key] || 0) + p.amount;
      });

    // Sort by date and take last 12
    const sortedKeys = Object.keys(monthMap);
    return sortedKeys.map(k => ({ month: k, Revenue: monthMap[k] }));
  }, [paymentHistory]);

  // Lead pipeline
  const leadPipeline = useMemo(() => {
    const statusOrder: string[] = ['New', 'Contacted', 'Proposal Sent', 'Archived'];
    const counts: Record<string, number> = {};
    statusOrder.forEach(s => (counts[s] = 0));
    leads.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return statusOrder.map(s => ({ stage: s, count: counts[s] || 0 }));
  }, [leads]);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      const s = p.status || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      'In Progress': CHART_COLORS.blue,
      'Active': CHART_COLORS.blue,
      'Completed': CHART_COLORS.emerald,
      'On Hold': CHART_COLORS.amber,
      'Planning': CHART_COLORS.violet,
      'Cancelled': CHART_COLORS.rose,
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || CHART_COLORS.slate,
    }));
  }, [projects]);

  // Task breakdown by priority
  const taskBreakdown = useMemo(() => {
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const phases = ['todo', 'inprogress', 'review', 'done'];
    return phases.map(phase => {
      const row: any = { phase: phase === 'inprogress' ? 'In Progress' : phase === 'todo' ? 'To Do' : phase.charAt(0).toUpperCase() + phase.slice(1) };
      priorities.forEach(p => {
        row[p] = tasks.filter(t => t.phase === phase && t.priority === p).length;
      });
      return row;
    });
  }, [tasks]);

  // Top clients by revenue
  const topClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
      .slice(0, 6)
      .map(c => ({
        name: c.name,
        company: c.company,
        revenue: c.totalVolume || 0,
        outstanding: c.outstandingAmount || 0,
        projects: c.projectsCount || 0,
        status: c.status,
      }));
  }, [clients]);

  // Activity Feed
  const recentActivities = useMemo(() => {
    return activities.slice(0, 20); // Last 20 activities
  }, [activities]);

  const getActivityIcon = (category?: string) => {
    switch (category) {
      case 'email_sent': return <Mail className="size-4 text-blue-500" />;
      case 'lead_added': return <UserPlus className="size-4 text-emerald-500" />;
      case 'lead_status_changed': return <ArrowRight className="size-4 text-amber-500" />;
      case 'task_completed': return <CheckSquare className="size-4 text-indigo-500" />;
      case 'task_created': return <FileEdit className="size-4 text-slate-500" />;
      case 'lead_promoted': return <ArrowUpRight className="size-4 text-violet-500" />;
      default: return <Activity className="size-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfdfd] overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Reports</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/60 rounded-xl p-1">
            {([['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['all', 'All Time']] as [TimePeriod, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="px-6 py-3 border-b border-slate-200/80 bg-slate-50/50 shrink-0 flex items-center gap-2 z-10 overflow-x-auto custom-scrollbar">
        {(['Overview', 'Project', 'Team', 'Lead', 'Client'] as ReportsTab[]).map(tab => (
          <PillTab
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-8">

          {/* ─── Overview Tab ──────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <>
              {/* KPI Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    label: 'Total Revenue',
                    value: `$${totalRevenue.toLocaleString()}`,
                    icon: DollarSign,
                    color: 'bg-emerald-50 text-emerald-600',
                    trend: '+12%',
                    trendUp: true,
                  },
                  {
                    label: 'Active Projects',
                    value: activeProjects,
                    icon: FolderKanban,
                    color: 'bg-blue-50 text-blue-600',
                    trend: `${projects.length} total`,
                    trendUp: null,
                  },
                  {
                    label: 'Pipeline Value',
                    value: `$${pipelineValue.toLocaleString()}`,
                    icon: TrendingUp,
                    color: 'bg-indigo-50 text-indigo-600',
                    trend: `${leads.length} leads`,
                    trendUp: null,
                  },
                  {
                    label: 'Task Completion',
                    value: `${taskCompletionRate}%`,
                    icon: CheckCircle2,
                    color: 'bg-amber-50 text-amber-600',
                    trend: `${tasks.filter(t => t.status === 'Complete').length}/${tasks.length}`,
                    trendUp: null,
                  },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                      <div className={`size-8 rounded-xl flex items-center justify-center ${kpi.color}`}>
                        <kpi.icon className="size-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{kpi.value}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      {kpi.trendUp !== null && (
                        kpi.trendUp 
                          ? <ArrowUpRight className="size-3.5 text-emerald-500" />
                          : <ArrowDownRight className="size-3.5 text-rose-500" />
                      )}
                      <span className={kpi.trendUp === true ? 'text-emerald-600' : kpi.trendUp === false ? 'text-rose-600' : 'text-slate-400'}>
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Revenue Trend */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Revenue Trend</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly</span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Revenue" stroke={CHART_COLORS.emerald} strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: CHART_COLORS.emerald }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity Heatmap */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Studio Activity</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 52 Weeks</span>
                  </div>
                  <ActivityHeatmap activityCounts={activityCounts} />
                </div>
              </motion.div>
            </>
          )}

          {/* ─── Project Tab ───────────────────────────────────── */}
          {activeTab === 'Project' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Project Status Donut */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Project Status</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{projects.length} Projects</span>
                </div>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {projectStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2.5 flex-1">
                    {projectStatusData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task Breakdown by Priority */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Task Breakdown</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Phase × Priority</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={taskBreakdown} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="phase" tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                    <Bar dataKey="urgent" name="Urgent" stackId="a" fill={CHART_COLORS.rose} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" name="High" stackId="a" fill={CHART_COLORS.amber} />
                    <Bar dataKey="medium" name="Medium" stackId="a" fill={CHART_COLORS.blue} />
                    <Bar dataKey="low" name="Low" stackId="a" fill={CHART_COLORS.slate} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ─── Team Tab ──────────────────────────────────────── */}
          {activeTab === 'Team' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Team size card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Team Overview</h3>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{members.length}</span>
                  <span className="text-xs font-semibold text-slate-400 mb-0.5">members</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {(() => {
                    const deptCounts: Record<string, number> = {};
                    members.forEach(m => {
                      const dept = m.department || 'General';
                      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                    });
                    return Object.entries(deptCounts).slice(0, 5).map(([dept, count], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">{dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-slate-100 w-24">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(count / members.length) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-5 text-right">{count}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col max-h-[500px]">
                <div className="flex items-center justify-between mb-5 shrink-0">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="size-4" /> Activity Feed
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Log</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">No recent activity</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {recentActivities.map((act) => (
                        <div key={act.id} className="flex gap-3">
                          <div className="mt-0.5 bg-slate-50 border border-slate-100 size-8 rounded-full flex items-center justify-center shrink-0">
                            {getActivityIcon(act.category)}
                          </div>
                          <div className="flex flex-col flex-1">
                            <p className="text-sm text-slate-700 leading-snug">
                              {act.actorName && <span className="font-bold text-slate-900 mr-1">{act.actorName}</span>}
                              {act.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" /> {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                              </span>
                              {act.category && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {act.category.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Lead Tab ──────────────────────────────────────── */}
          {activeTab === 'Lead' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Lead Pipeline */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Lead Pipeline</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leads.length} Total</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={leadPipeline} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                      {leadPipeline.map((_, i) => (
                        <Cell key={i} fill={[CHART_COLORS.blue, CHART_COLORS.indigo, CHART_COLORS.amber, CHART_COLORS.slate][i] || CHART_COLORS.slate} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Email Log */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col max-h-[500px]">
                <div className="flex items-center justify-between mb-5 shrink-0">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Mail className="size-4" /> Outreach Log
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sentEmails.length} Sent</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {sentEmails.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">No emails sent yet</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent By</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sentEmails.slice().reverse().slice(0, 15).map((email, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 pr-2">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{email.leadName || 'Unknown Lead'}</span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{email.sentToEmail || '—'}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-2">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{email.sentBy || 'System'}</span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{email.subject}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                                {new Date(email.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Client Tab ────────────────────────────────────── */}
          {activeTab === 'Client' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5">
              {/* Top Clients */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Clients by Revenue</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{clients.length} Clients</span>
                </div>
                {topClients.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm font-medium">No client data available</div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Outstanding</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Projects</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClients.map((client, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{client.name}</span>
                                <span className="text-xs text-slate-400 font-medium">{client.company}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-sm font-bold text-slate-900">${client.revenue.toLocaleString()}</span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`text-sm font-bold ${client.outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {client.outstanding > 0 ? `$${client.outstanding.toLocaleString()}` : '—'}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-sm font-bold text-slate-700">{client.projects}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                client.status === 'Prospect' ? 'bg-blue-50 text-blue-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {client.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
