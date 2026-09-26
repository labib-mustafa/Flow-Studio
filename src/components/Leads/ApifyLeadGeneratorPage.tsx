import React, { useState } from 'react';
import {
  Bot,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Copy,
  UserPlus,
  ArrowLeft,
  MapPin,
  Camera,
  Briefcase,
  Globe,
  Search,
  Check,
  Terminal,
  RefreshCw,
  Zap,
  Filter,
  Users,
  Trash2,
  PhoneCall,
  Mail,
  Share2,
  Link as LinkIcon,
  BookUser,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useLeadStore } from '../../stores/leadStore';
import { useScraperStore } from '../../stores/scraperStore';
import { PillTab } from '../GlobalComponents/PillTab';
import {
  runApifyScraper,
  fetchApifyUserUsage,
  ApifyUserUsage,
  ScrapedLead,
  ScraperType
} from '../../services/apifyService';

interface ApifyLeadGeneratorPageProps {
  onNavigate?: (view: string) => void;
}

const formatUsd = (val: number): string => {
  if (val === 0) return '0.00';
  if (val > 0 && val < 0.01) return val.toFixed(4);
  return val.toFixed(2);
};

export const ApifyLeadGeneratorPage: React.FC<ApifyLeadGeneratorPageProps> = ({ onNavigate }) => {
  const addLead = useLeadStore((state) => state.addLead);

  // Zustand Scraper Store (Persisted across reloads!)
  const {
    apiKey,
    setApiKey,
    activeTab,
    setActiveTab,
    scrapedLeads,
    addScrapedLeads,
    clearScrapedLeads,
    removeScrapedLead,
    selectedIds,
    setSelectedIds,
    logs,
    setLogs,
    clearLogs,
    mustHaveFilters,
    setMustHaveFilters,
    gmapsConfig,
    setGmapsConfig,
    igConfig,
    setIgConfig,
    liConfig,
    setLiConfig,
    gsConfig,
    setGsConfig,
  } = useScraperStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTerminalLogs, setShowTerminalLogs] = useState(true);
  const [previewSearch, setPreviewSearch] = useState('');
  const [usageInfo, setUsageInfo] = useState<ApifyUserUsage | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load usage info from Apify API
  const loadUsageInfo = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      setUsageInfo(null);
      return;
    }
    setIsLoadingUsage(true);
    try {
      const usage = await fetchApifyUserUsage(apiKey);
      setUsageInfo(usage);
    } catch (err) {
      console.warn('Could not fetch Apify account limits:', err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    loadUsageInfo();
  }, [apiKey]);

  // Save API key
  const handleSaveApiKey = () => {
    setIsKeySaved(true);
    loadUsageInfo();
    setTimeout(() => setIsKeySaved(false), 2500);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run Scraper Trigger
  const handleRunScraper = async () => {
    setIsRunning(true);
    setProgress(0);
    clearLogs();

    let config: any = gmapsConfig;
    if (activeTab === 'instagram') config = igConfig;
    if (activeTab === 'linkedin') config = liConfig;
    if (activeTab === 'google-search') config = gsConfig;

    try {
      const results = await runApifyScraper(
        activeTab,
        config,
        apiKey,
        (newLog) => setLogs((prev) => [...prev, newLog]),
        (pct) => setProgress(pct)
      );

      addScrapedLeads(results);
      const newIds = results.map((l) => l.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    } catch (err: any) {
      console.error('Scraper execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // MUST HAVE FILTERING LOGIC
  const checkMustHaveRequirements = (lead: ScrapedLead): boolean => {
    if (mustHaveFilters.email && (!lead.email || lead.email.trim() === '')) {
      return false;
    }
    if (mustHaveFilters.phone && (!lead.phone || lead.phone.trim() === '')) {
      return false;
    }
    if (mustHaveFilters.website && (!lead.socials || !lead.socials.includes('.'))) {
      return false;
    }
    if (mustHaveFilters.instagram && (!lead.socials || !lead.socials.toLowerCase().includes('instagram'))) {
      return false;
    }
    if (mustHaveFilters.facebook && (!lead.socials || !lead.socials.toLowerCase().includes('facebook'))) {
      return false;
    }
    return true;
  };

  // Filtered preview search + Must Have filters
  const filteredLeads = scrapedLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(previewSearch.toLowerCase()) ||
      l.company.toLowerCase().includes(previewSearch.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(previewSearch.toLowerCase())) ||
      (l.location && l.location.toLowerCase().includes(previewSearch.toLowerCase()));

    return matchesSearch && checkMustHaveRequirements(l);
  });

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const lastSelectedRef = React.useRef<string | null>(null);

  const handleRowSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (e.shiftKey) {
      let anchorId = lastSelectedRef.current;
      if (!anchorId || !filteredLeads.some((l) => l.id === anchorId)) {
        anchorId = filteredLeads[0]?.id || id;
      }

      const lastIdx = filteredLeads.findIndex((l) => l.id === anchorId);
      const currIdx = filteredLeads.findIndex((l) => l.id === id);

      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = filteredLeads.slice(start, end + 1).map((l) => l.id);

        setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        lastSelectedRef.current = id;
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
    lastSelectedRef.current = id;
  };

  // Import Selected Leads into Main Store
  const handleImportToLeadsStore = () => {
    const leadsToImport = scrapedLeads.filter((l) => selectedIds.includes(l.id));
    if (leadsToImport.length === 0) return;

    [...leadsToImport].reverse().forEach((lead) => {
      addLead({
        name: lead.name,
        type: lead.type,
        company: lead.company,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        status: 'New',
        socials: lead.socials,
        location: lead.location,
        estimated_value: lead.estimated_value,
        source: lead.source,
        notes_summary: lead.notes_summary,
        tags: lead.tags,
      });
    });

    showNotification(`Successfully imported ${leadsToImport.length} leads to your main database!`);
  };

  // Export Utilities
  const getExportData = () => {
    const leadsToExport = scrapedLeads.filter((l) => selectedIds.includes(l.id));
    const targetArray = leadsToExport.length > 0 ? leadsToExport : filteredLeads;

    return targetArray.map((l) => ({
      'Name': l.name,
      'Company': l.company,
      'Category': l.type,
      'Contact Person': l.contactPerson,
      'Email': l.email || '',
      'Phone': l.phone || '',
      'Website / Socials': l.socials || '',
      'Location': l.location || '',
      'Estimated Value ($)': l.estimated_value,
      'Origin Source': l.source,
      'Notes': l.notes_summary,
    }));
  };

  const handleExportXLSX = () => {
    const exportData = getExportData();
    if (exportData.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staged Leads');

    XLSX.writeFile(workbook, `Apify_Leads_Staging_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification('Exported Excel file (.xlsx) successfully!');
  };

  const handleExportCSV = () => {
    const exportData = getExportData();
    if (exportData.length === 0) return;

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData
      .map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apify_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Exported CSV file successfully!');
  };

  // Metrics
  const totalScraped = scrapedLeads.length;
  const filteredCount = filteredLeads.length;
  const emailsCount = filteredLeads.filter((l) => l.email).length;
  const phonesCount = filteredLeads.filter((l) => l.phone).length;
  const totalValue = filteredLeads.reduce((acc, curr) => acc + curr.estimated_value, 0);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 overflow-y-auto custom-scrollbar relative font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-8 z-[999] bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 text-xs font-semibold shadow-2xl"
          >
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <header className="px-8 py-5 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center shadow-lg shadow-accent/20">
            <Bot className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Prospect Scraper</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-accent/5 text-accent border border-accent/20">
                PRO SPECTING
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Scrape and stage high-quality leads dynamically from global sources</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate('leads')}
              className="bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 outline-none border border-slate-200/80 shadow-sm hover:shadow cursor-pointer"
            >
              <BookUser className="size-4 text-slate-500" />
              View Leads Directory
            </button>
          )}
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-[1600px] w-full mx-auto">
        
        {/* Card 1: API Token & Account Status Panel */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 size-48 bg-gradient-to-bl from-accent/5 to-transparent rounded-bl-full -z-10 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-md">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 border border-slate-200/50 shrink-0 shadow-sm">
                <Key className="size-5 text-slate-650" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Apify Platform Connection</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">
                  Connect your Apify account. Leaving this empty runs the scraper in <strong className="text-accent">Demo Simulation Mode</strong> for quick previews.
                </p>
              </div>
            </div>

            <div className="flex-1 w-full lg:w-auto max-w-xl flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter Apify API Token (apify_api_...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-850 outline-none font-mono transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                className={`px-5 py-3 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isKeySaved
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/15'
                }`}
              >
                {isKeySaved ? (
                  <>
                    <Check className="size-4" /> Connected!
                  </>
                ) : (
                  'Connect Token'
                )}
              </button>
            </div>

            <div className="shrink-0 flex items-center w-full lg:w-auto justify-end">
              {apiKey.trim().length > 10 ? (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold shadow-sm">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Integrations Active
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold shadow-sm">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  Demo Preview Mode
                </div>
              )}
            </div>
          </div>

          {/* Monthly Usage Limit Indicator */}
          {usageInfo && (
            <div className="pt-5 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span>Monthly Cloud Compute Usage:</span>
                    <span className="text-slate-900 font-extrabold">${formatUsd(usageInfo.monthlyUsageUsd)} / ${formatUsd(usageInfo.monthlyUsageLimitUsd)}</span>
                  </div>
                  <span className={usageInfo.usagePercentage > 85 ? 'text-red-600 font-extrabold' : 'text-accent'}>
                    {usageInfo.usagePercentage.toFixed(1)}% Used (${formatUsd(usageInfo.remainingUsd)} left)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      usageInfo.usagePercentage > 85
                        ? 'bg-red-500'
                        : usageInfo.usagePercentage > 60
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-accent to-accent-hover'
                    }`}
                    style={{ width: `${Math.max(3, usageInfo.usagePercentage)}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={loadUsageInfo}
                disabled={isLoadingUsage}
                className="p-2.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
                title="Refresh API Limit usage stats"
              >
                <RefreshCw className={`size-4 ${isLoadingUsage ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Scraper Setup & Target Parameters Deck */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft space-y-6">
          
          {/* Channel Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4.5 flex-wrap gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="size-4 text-accent" /> Select Prospect Channel
            </h3>

            {/* Standard Flow Studio Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <PillTab
                label="Google Maps"
                icon={<img src="/assets/google-logos/google-maps.png" className="size-3.5 object-contain" alt="Google Maps" />}
                isActive={activeTab === 'google-maps'}
                onClick={() => setActiveTab('google-maps')}
              />
              <PillTab
                label="Instagram"
                icon={<Camera className="size-3.5" />}
                isActive={activeTab === 'instagram'}
                onClick={() => setActiveTab('instagram')}
              />
              <PillTab
                label="LinkedIn B2B"
                icon={<Briefcase className="size-3.5" />}
                isActive={activeTab === 'linkedin'}
                onClick={() => setActiveTab('linkedin')}
              />
              <PillTab
                label="Google Search"
                icon={<img src="/assets/google-logos/google.png" className="size-3.5 object-contain" alt="Google Search" />}
                isActive={activeTab === 'google-search'}
                onClick={() => setActiveTab('google-search')}
              />
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {activeTab === 'google-maps' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Search Term / Niche</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={gmapsConfig.searchTerms}
                      onChange={(e) => setGmapsConfig({ searchTerms: e.target.value })}
                      placeholder="e.g. Creative Studio, Dentist"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={gmapsConfig.location}
                      onChange={(e) => setGmapsConfig({ location: e.target.value })}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Category Filter</label>
                  <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={gmapsConfig.category}
                      onChange={(e) => setGmapsConfig({ category: e.target.value })}
                      placeholder="e.g. Advertising Agency"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Max Results Limit</label>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent/5 text-accent rounded border border-accent/20">{gmapsConfig.maxResults} leads</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={gmapsConfig.maxResults}
                    onChange={(e) => setGmapsConfig({ maxResults: parseInt(e.target.value) })}
                    className="w-full accent-accent cursor-pointer mt-3"
                  />
                </div>
              </>
            )}

            {activeTab === 'instagram' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Hashtag / Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={igConfig.searchTarget}
                      onChange={(e) => setIgConfig({ searchTarget: e.target.value })}
                      placeholder="e.g. startups, model"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Search Strategy</label>
                  <select
                    value={igConfig.searchType}
                    onChange={(e) => setIgConfig({ searchType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold cursor-pointer"
                  >
                    <option value="user">User Profiles</option>
                    <option value="hashtag">Hashtag Posts</option>
                    <option value="place">Geotagged Locations</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Min. Followers Threshold</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="number"
                      value={igConfig.minFollowers}
                      onChange={(e) => setIgConfig({ minFollowers: parseInt(e.target.value) || 500 })}
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Max Profiles Limit</label>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent/5 text-accent rounded border border-accent/20">{igConfig.maxProfiles} leads</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={igConfig.maxProfiles}
                    onChange={(e) => setIgConfig({ maxProfiles: parseInt(e.target.value) })}
                    className="w-full accent-accent cursor-pointer mt-3"
                  />
                </div>
              </>
            )}

            {activeTab === 'linkedin' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Job Title / Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={liConfig.jobTitle}
                      onChange={(e) => setLiConfig({ jobTitle: e.target.value })}
                      placeholder="e.g. CMO, VP Sales, Owner"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Industry Segment</label>
                  <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={liConfig.industry}
                      onChange={(e) => setLiConfig({ industry: e.target.value })}
                      placeholder="e.g. Tech Services"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Location / Region</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={liConfig.location}
                      onChange={(e) => setLiConfig({ location: e.target.value })}
                      placeholder="e.g. United Kingdom"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Max Profiles Limit</label>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent/5 text-accent rounded border border-accent/20">{liConfig.maxProfiles} leads</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={liConfig.maxProfiles}
                    onChange={(e) => setLiConfig({ maxProfiles: parseInt(e.target.value) })}
                    className="w-full accent-accent cursor-pointer mt-3"
                  />
                </div>
              </>
            )}

            {activeTab === 'google-search' && (
              <>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Search Query String</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={gsConfig.query}
                      onChange={(e) => setGsConfig({ query: e.target.value })}
                      placeholder="e.g. site:linkedin.com/in 'software architect' New York"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Domain (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={gsConfig.targetDomain}
                      onChange={(e) => setGsConfig({ targetDomain: e.target.value })}
                      placeholder="e.g. github.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-800 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Max Results Limit</label>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent/5 text-accent rounded border border-accent/20">{gsConfig.maxResults} leads</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={gsConfig.maxResults}
                    onChange={(e) => setGsConfig({ maxResults: parseInt(e.target.value) })}
                    className="w-full accent-accent cursor-pointer mt-3"
                  />
                </div>
              </>
            )}
          </div>

          {/* Mandatory Contact Info Requirements Section */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Filter className="size-4 text-accent" /> Mandatory Contact Fields
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">
                Show & import only prospects matching the checked elements below:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { key: 'email', label: 'Email', icon: <Mail className="size-4" /> },
                { key: 'phone', label: 'Phone Number', icon: <PhoneCall className="size-4" /> },
                { key: 'instagram', label: 'Instagram Profile', icon: <Camera className="size-4" /> },
                { key: 'facebook', label: 'Facebook / Socials', icon: <Share2 className="size-4" /> },
                { key: 'website', label: 'Website URL', icon: <LinkIcon className="size-4" /> }
              ].map((filt) => {
                const isSelected = (mustHaveFilters as any)[filt.key];
                return (
                  <button
                    key={filt.key}
                    type="button"
                    onClick={() => setMustHaveFilters({ [filt.key]: !isSelected })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-slate-400'}>{filt.icon}</span>
                    <span>{filt.label}</span>
                    {isSelected && <Check className="size-3.5 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger & Progress Bar */}
          <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleRunScraper}
                disabled={isRunning}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-white border border-primary shadow-lg shadow-primary/15 active:scale-[0.98]'
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="size-4 animate-spin text-slate-500" />
                    Running Scraper Worker...
                  </>
                ) : (
                  <>
                    <Play className="size-4 fill-white" />
                    Launch Scraper Job
                  </>
                )}
              </button>

              <button
                onClick={() => setShowTerminalLogs(!showTerminalLogs)}
                className="px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Terminal className="size-4 text-slate-500" />
                {showTerminalLogs ? 'Hide Console' : 'Show Console'}
              </button>
            </div>

            {isRunning && (
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Worker Job Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cyberpunk IDE Terminal Console Output Drawer */}
          <AnimatePresence>
            {showTerminalLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="bg-[#0b0f19] text-[#e2e8f0] p-5 rounded-2xl font-mono text-[11px] max-h-56 overflow-y-auto space-y-2 custom-scrollbar border border-slate-800 shadow-inner">
                  {logs.length === 0 && <div className="text-slate-500 flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent animate-pulse" />Worker idle. Ready to deploy scraper daemon...</div>}
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 py-0.5 border-b border-white/5 last:border-b-0 leading-relaxed">
                      <span className="text-slate-500 text-[10px] shrink-0 font-medium select-none">{log.timestamp}</span>
                      <span
                        className={`font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded shrink-0 select-none tracking-wide ${
                          log.level === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.level === 'warning'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : log.level === 'error'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-accent/10 text-accent border border-accent/20'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-slate-350">{log.message}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 3: Persistent Lead Staging Table & Export Suite */}
        {scrapedLeads.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft space-y-6">
            
            {/* Table Header & Metrics */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Users className="size-5 text-accent" /> Staged Leads Library
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                    {scrapedLeads.length} total
                  </span>
                  <button
                    onClick={clearScrapedLeads}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-xl border border-red-200/50 transition-all cursor-pointer"
                  >
                    <Trash2 className="size-3.5" /> Clear Staging
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed">
                  Scraped leads automatically persist on your local device. Set mandatory filters above, select high-intent profiles and import them.
                </p>
              </div>

              {/* Stats Summary Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200">
                  <span className="text-slate-400">Match:</span>
                  <span className="text-slate-900 font-extrabold">{filteredCount}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <Mail className="size-3.5 text-emerald-500" />
                  <span>Emails:</span>
                  <span className="text-emerald-950 font-extrabold">{emailsCount}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-accent/5 text-accent text-xs font-bold flex items-center gap-2 border border-accent/20">
                  <PhoneCall className="size-3.5 text-accent" />
                  <span>Phones:</span>
                  <span className="text-accent-hover font-extrabold">{phonesCount}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-2 border border-purple-200">
                  <span className="text-purple-400">$</span>
                  <span>Value:</span>
                  <span className="text-purple-950 font-extrabold">${totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Toolbar & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  placeholder="Filter staged results..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 outline-none font-semibold transition-all"
                />
              </div>

              {/* Action Suite Buttons */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <button
                  onClick={handleImportToLeadsStore}
                  disabled={selectedIds.length === 0}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                    selectedIds.length > 0
                      ? 'bg-primary hover:bg-primary-hover text-white border border-primary shadow-md shadow-primary/10 active:scale-98'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <UserPlus className="size-4" />
                  Import Selected ({selectedIds.length})
                </button>

                <button
                  onClick={handleExportXLSX}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  Export Excel
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <Download className="size-4 text-slate-550" />
                  CSV
                </button>

                <button
                  onClick={() => {
                    const data = getExportData();
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    showNotification('Copied JSON data to clipboard!');
                  }}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <Copy className="size-4 text-slate-550" />
                  Copy JSON
                </button>
              </div>
            </div>

            {/* Table Data View */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-soft">
              <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                      <th className="p-4 w-12 text-center select-none">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === filteredLeads.length}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 accent-accent focus:ring-accent cursor-pointer size-4"
                        />
                      </th>
                      <th className="p-4 w-48">Prospect Name</th>
                      <th className="p-4 w-44">Company</th>
                      <th className="p-4 w-28 text-center">Source</th>
                      <th className="p-4 w-52">Email Contact</th>
                      <th className="p-4 w-40">Phone Number</th>
                      <th className="p-4 w-48">Location</th>
                      <th className="p-4 w-32 text-right">Est. Value</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-500 font-semibold space-y-3">
                          <div className="text-sm">No leads match the active search query or contact requirements.</div>
                          {scrapedLeads.length > 0 && (
                            <button
                              onClick={() => setMustHaveFilters({ email: false, phone: false, instagram: false, facebook: false, website: false })}
                              className="text-xs font-extrabold text-accent hover:text-accent-hover underline cursor-pointer"
                            >
                              Clear Mandatory Filters ({scrapedLeads.length} leads in background staging)
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedIds.includes(lead.id);
                        return (
                          <tr
                            key={lead.id}
                            onClick={(e) => handleRowSelect(e, lead.id)}
                            className={`transition-colors cursor-pointer group ${
                              isSelected ? 'bg-accent/5' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleRowSelect(e as any, lead.id)}
                                className="rounded border-slate-300 accent-accent focus:ring-accent cursor-pointer size-4"
                              />
                            </td>
                            <td className="p-4 text-slate-900 font-extrabold truncate" title={lead.name}>{lead.name}</td>
                            <td className="p-4 text-slate-700 font-bold truncate" title={lead.company}>{lead.company}</td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-650 border border-slate-200">
                                {lead.type}
                              </span>
                            </td>
                            <td className="p-4 truncate">
                              {lead.email ? (
                                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                                  <Mail className="size-3.5 text-emerald-500 shrink-0" />
                                  {lead.email}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">None</span>
                              )}
                            </td>
                            <td className="p-4 truncate">
                              {lead.phone ? (
                                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                                  <PhoneCall className="size-3.5 text-accent shrink-0" />
                                  {lead.phone}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">None</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 truncate" title={lead.location}>{lead.location}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900">
                              ${lead.estimated_value.toLocaleString()}
                            </td>
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => removeScrapedLead(lead.id)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove from staging list"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Floating Selection Action Bar (Matches flow-studio table dashboard action style) */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 30, x: '-50%' }}
                  className="fixed bottom-8 left-1/2 z-[50] shadow-2xl border border-slate-800 bg-slate-950/95 backdrop-blur text-white rounded-2xl px-5 py-3.5 flex items-center gap-4"
                >
                  <span className="bg-accent text-white font-mono px-3 py-0.5 rounded-full text-xs font-extrabold tracking-wide">
                    {selectedIds.length} Profiles Selected
                  </span>
                  
                  <div className="w-px h-5 bg-white/10 shrink-0" />

                  <button
                    onClick={handleImportToLeadsStore}
                    className="flex items-center gap-2 hover:text-accent text-xs font-bold transition-colors cursor-pointer"
                  >
                    <UserPlus className="size-4" />
                    <span>Import to Leads Database</span>
                  </button>

                  <div className="w-px h-5 bg-white/10 shrink-0" />

                  <button
                    onClick={() => {
                      const data = getExportData();
                      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                      showNotification(`Copied JSON content of ${selectedIds.length} profiles!`);
                    }}
                    className="flex items-center gap-2 hover:text-slate-300 text-xs font-bold transition-colors cursor-pointer text-slate-400"
                  >
                    <Copy className="size-4" />
                    <span>Copy JSON</span>
                  </button>

                  <div className="w-px h-5 bg-white/10 shrink-0" />

                  <button
                    onClick={() => setSelectedIds([])}
                    className="hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer text-slate-500"
                  >
                    Deselect All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
