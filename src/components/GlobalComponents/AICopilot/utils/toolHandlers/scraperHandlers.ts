import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useScraperStore } from '../../../../../stores/scraperStore';
import { ScraperType, ScrapedLead } from '../../../../../services/apifyService';

/**
 * Lead scraper configuration and staging-area operations.
 *
 * **`setApiKey` deliberately has no tool.** The Apify API key is a billable
 * credential; routing it through a tool call would place it in the model's
 * context and in conversation history. `list_scraper_config` reports only
 * whether a key is present, never its value. This is the same rule applied to
 * the SMTP password and the card number.
 *
 * Running an actual scrape is not exposed here either. The scraper's own UI
 * drives the Apify runs; these tools configure them and manage the results
 * that come back, which is what the agent can do without spending the user's
 * Apify credits unattended.
 *
 * Every action on this store is synchronous.
 */

const ALLOWED_CONFIG_KEYS: Record<ScraperType, string[]> = {
  'google-maps': ['searchTerms', 'location', 'category', 'maxResults', 'includeEmail', 'includePhone', 'includeWebsite'],
  instagram: ['searchTarget', 'searchType', 'maxProfiles', 'extractEmailBio', 'minFollowers'],
  linkedin: ['jobTitle', 'industry', 'location', 'companySize', 'maxProfiles'],
  'google-search': ['query', 'targetDomain', 'maxResults', 'extractEmails', 'extractPhones']
};

const CONFIG_SETTERS: Record<ScraperType, (config: any) => void> = {
  'google-maps': (c) => useScraperStore.getState().setGmapsConfig(c),
  instagram: (c) => useScraperStore.getState().setIgConfig(c),
  linkedin: (c) => useScraperStore.getState().setLiConfig(c),
  'google-search': (c) => useScraperStore.getState().setGsConfig(c)
};

const CONFIG_READERS: Record<ScraperType, () => any> = {
  'google-maps': () => useScraperStore.getState().gmapsConfig,
  instagram: () => useScraperStore.getState().igConfig,
  linkedin: () => useScraperStore.getState().liConfig,
  'google-search': () => useScraperStore.getState().gsConfig
};

const findScrapedLead = (ref: string): ScrapedLead | undefined => {
  const q = String(ref || '').trim().toLowerCase();
  if (!q) return undefined;
  const leads = useScraperStore.getState().scrapedLeads || [];
  return (
    leads.find((l) => l.id.toLowerCase() === q) ||
    leads.find((l) => (l.name || '').toLowerCase() === q) ||
    leads.find((l) => (l.email || '').toLowerCase() === q) ||
    leads.find((l) => (l.name || '').toLowerCase().includes(q))
  );
};

export function handleScraperTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // ---------- Read ----------
  if (call.name === 'list_scraper_config') {
    const state = useScraperStore.getState();
    const hasKey = Boolean(state.apiKey && state.apiKey.trim().length >= 10);
    return {
      toolName: 'list_scraper_config',
      description: `Scraper: ${state.scrapedLeads?.length || 0} staged lead(s); API key ${hasKey ? 'configured' : 'NOT configured'}.`,
      data: {
        // Presence only — the key itself is never returned.
        apiKeySet: hasKey,
        activeTab: state.activeTab,
        configs: {
          'google-maps': state.gmapsConfig,
          instagram: state.igConfig,
          linkedin: state.liConfig,
          'google-search': state.gsConfig
        },
        mustHaveFilters: state.mustHaveFilters,
        stagedCount: state.scrapedLeads?.length || 0,
        selectedCount: state.selectedIds?.length || 0,
        recentLogs: (state.logs || []).slice(-10)
      }
    };
  }

  if (call.name === 'list_scraped_leads') {
    const leads = useScraperStore.getState().scrapedLeads || [];
    const query = args.query ? String(args.query).toLowerCase() : '';
    const filtered = query
      ? leads.filter(
          (l) =>
            (l.name || '').toLowerCase().includes(query) ||
            (l.company || '').toLowerCase().includes(query) ||
            (l.email || '').toLowerCase().includes(query)
        )
      : leads;
    return {
      toolName: 'list_scraped_leads',
      description: `${filtered.length} staged lead(s)${query ? ` matching "${args.query}"` : ''}.`,
      data: filtered.slice(0, 50).map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        location: l.location,
        socials: l.socials
      }))
    };
  }

  // ---------- Configuration ----------
  if (call.name === 'update_scraper_config') {
    const platform = args.platform as ScraperType;
    if (!ALLOWED_CONFIG_KEYS[platform]) {
      return {
        toolName: 'update_scraper_config',
        description: `platform must be one of: ${Object.keys(ALLOWED_CONFIG_KEYS).join(', ')}.`,
        data: {}
      };
    }

    const incoming = args.config && typeof args.config === 'object' ? args.config : {};
    const allowed = ALLOWED_CONFIG_KEYS[platform];
    const updates: any = {};
    const rejected: string[] = [];
    for (const [key, value] of Object.entries(incoming)) {
      // Whitelisted per platform: an unknown key would otherwise be written
      // into the config object and silently ignored by the scraper.
      if (allowed.includes(key)) updates[key] = value;
      else rejected.push(key);
    }

    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_scraper_config',
        description: `No valid fields for ${platform}. Accepted fields: ${allowed.join(', ')}.`,
        data: { platform, rejected }
      };
    }

    const previous = { ...CONFIG_READERS[platform]() };
    CONFIG_SETTERS[platform](updates);
    toast.success(`Updated ${platform} scraper settings`);

    const warning = rejected.length ? ` Ignored unsupported field(s): ${rejected.join(', ')}.` : '';
    return {
      toolName: 'update_scraper_config',
      description: `Updated ${platform} settings (${Object.keys(updates).join(', ')}).${warning}`,
      data: { platform, ...updates, previous, rejected }
    };
  }

  if (call.name === 'set_scraper_filters') {
    const filters: any = {};
    for (const key of ['email', 'phone', 'instagram', 'facebook', 'website']) {
      if (args[key] !== undefined) filters[key] = Boolean(args[key]);
    }
    if (Object.keys(filters).length === 0) {
      return {
        toolName: 'set_scraper_filters',
        description: 'Provide at least one of: email, phone, instagram, facebook, website.',
        data: {}
      };
    }
    const previous = { ...useScraperStore.getState().mustHaveFilters };
    useScraperStore.getState().setMustHaveFilters(filters);
    toast.success('Updated must-have filters');
    return {
      toolName: 'set_scraper_filters',
      description: `Updated must-have filters (${Object.keys(filters).join(', ')})`,
      data: { ...filters, previous }
    };
  }

  if (call.name === 'set_scraper_tab') {
    const platform = args.platform as ScraperType;
    if (!ALLOWED_CONFIG_KEYS[platform]) {
      return {
        toolName: 'set_scraper_tab',
        description: `platform must be one of: ${Object.keys(ALLOWED_CONFIG_KEYS).join(', ')}.`,
        data: {}
      };
    }
    const previousTab = useScraperStore.getState().activeTab;
    useScraperStore.getState().setActiveTab(platform);
    return {
      toolName: 'set_scraper_tab',
      description: `Switched the scraper to ${platform}`,
      data: { platform, previous: { activeTab: previousTab } }
    };
  }

  // ---------- Staging area ----------
  if (call.name === 'select_scraped_leads') {
    const action = args.action;
    if (action === 'clear') {
      useScraperStore.getState().setSelectedIds([]);
      return { toolName: 'select_scraped_leads', description: 'Cleared the staged selection', data: {} };
    }
    if (action === 'all') {
      const ids = (useScraperStore.getState().scrapedLeads || []).map((l) => l.id);
      useScraperStore.getState().setSelectedIds(ids);
      return {
        toolName: 'select_scraped_leads',
        description: `Selected all ${ids.length} staged lead(s)`,
        data: { ids }
      };
    }
    if (action === 'specific') {
      const refs = Array.isArray(args.leads) ? args.leads.map((r: any) => String(r)) : [];
      const ids: string[] = [];
      const missed: string[] = [];
      for (const ref of refs) {
        const hit = findScrapedLead(ref);
        if (hit) ids.push(hit.id);
        else missed.push(ref);
      }
      if (ids.length === 0) {
        return {
          toolName: 'select_scraped_leads',
          description: `No staged leads matched${missed.length ? `: ${missed.join(', ')}` : ''}.`,
          data: { missed }
        };
      }
      useScraperStore.getState().setSelectedIds(ids);
      const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
      return {
        toolName: 'select_scraped_leads',
        description: `Selected ${ids.length} staged lead(s).${warning}`,
        data: { ids, missed }
      };
    }
    return null;
  }

  if (call.name === 'remove_scraped_lead') {
    const refs = Array.isArray(args.leads) ? args.leads.map((r: any) => String(r)) : [];
    if (refs.length === 0) return null;
    const removed: ScrapedLead[] = [];
    const missed: string[] = [];
    for (const ref of refs) {
      const hit = findScrapedLead(ref);
      if (hit) {
        removed.push({ ...hit });
        useScraperStore.getState().removeScrapedLead(hit.id);
      } else missed.push(ref);
    }
    if (removed.length === 0) {
      return {
        toolName: 'remove_scraped_lead',
        description: `No staged leads matched: ${missed.join(', ')}`,
        data: { missed }
      };
    }
    toast.success(`Removed ${removed.length} staged lead(s)`);
    const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'remove_scraped_lead',
      description: `Removed ${removed.length} staged lead(s).${warning}`,
      data: removed
    };
  }

  if (call.name === 'clear_scraped_leads') {
    const snapshot = (useScraperStore.getState().scrapedLeads || []).map((l) => ({ ...l }));
    if (snapshot.length === 0) {
      return {
        toolName: 'clear_scraped_leads',
        description: 'There are no staged leads to clear.',
        data: []
      };
    }
    useScraperStore.getState().clearScrapedLeads();
    toast.success(`Cleared ${snapshot.length} staged lead(s)`);
    return {
      toolName: 'clear_scraped_leads',
      description: `Cleared all ${snapshot.length} staged lead(s)`,
      data: snapshot
    };
  }

  if (call.name === 'add_scraped_leads') {
    const incoming = Array.isArray(args.leads) ? args.leads : [];
    if (incoming.length === 0) {
      return {
        toolName: 'add_scraped_leads',
        description: 'Provide at least one lead to add.',
        data: {}
      };
    }
    const built: ScrapedLead[] = incoming.map((l: any, i: number) => ({
      id: l.id || `scraped-${Date.now()}-${i}`,
      name: String(l.name || 'Unknown'),
      type: String(l.type || 'Business'),
      company: String(l.company || ''),
      contactPerson: String(l.contactPerson || l.name || ''),
      email: l.email ? String(l.email) : null,
      phone: String(l.phone || ''),
      socials: String(l.socials || ''),
      location: String(l.location || ''),
      estimated_value: Number(l.estimated_value) || 0,
      source: String(l.source || 'Manual'),
      notes_summary: String(l.notes_summary || ''),
      tags: Array.isArray(l.tags) ? l.tags.map((t: any) => String(t)) : [],
      status: 'New'
    }));
    useScraperStore.getState().addScrapedLeads(built);
    toast.success(`Added ${built.length} staged lead(s)`);
    return {
      toolName: 'add_scraped_leads',
      description: `Added ${built.length} lead(s) to the scraper staging area`,
      data: built
    };
  }

  if (call.name === 'clear_scraper_logs') {
    const count = (useScraperStore.getState().logs || []).length;
    useScraperStore.getState().clearLogs();
    return {
      toolName: 'clear_scraper_logs',
      description: `Cleared ${count} scraper log entries`,
      data: { cleared: count }
    };
  }

  return null;
}
