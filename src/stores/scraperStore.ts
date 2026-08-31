import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
import {
  ScraperType,
  GoogleMapsConfig,
  InstagramConfig,
  LinkedInConfig,
  GoogleSearchConfig,
  ScrapedLead,
  ScraperLog
} from '../services/apifyService';

export interface MustHaveFilters {
  email: boolean;
  phone: boolean;
  instagram: boolean;
  facebook: boolean;
  website: boolean;
}

export interface ScraperState {
  apiKey: string;
  activeTab: ScraperType;
  scrapedLeads: ScrapedLead[];
  selectedIds: string[];
  logs: ScraperLog[];
  mustHaveFilters: MustHaveFilters;

  // Configs
  gmapsConfig: GoogleMapsConfig;
  igConfig: InstagramConfig;
  liConfig: LinkedInConfig;
  gsConfig: GoogleSearchConfig;

  // Actions
  setApiKey: (key: string) => void;
  setActiveTab: (tab: ScraperType) => void;
  setScrapedLeads: (leads: ScrapedLead[]) => void;
  addScrapedLeads: (leads: ScrapedLead[]) => void;
  clearScrapedLeads: () => void;
  removeScrapedLead: (id: string) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setLogs: (logs: ScraperLog[] | ((prev: ScraperLog[]) => ScraperLog[])) => void;
  clearLogs: () => void;
  setMustHaveFilters: (filters: Partial<MustHaveFilters>) => void;
  setGmapsConfig: (config: Partial<GoogleMapsConfig>) => void;
  setIgConfig: (config: Partial<InstagramConfig>) => void;
  setLiConfig: (config: Partial<LinkedInConfig>) => void;
  setGsConfig: (config: Partial<GoogleSearchConfig>) => void;
}

export const useScraperStore = create<ScraperState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      activeTab: 'google-maps',
      scrapedLeads: [],
      selectedIds: [],
      logs: [],
      mustHaveFilters: {
        email: false,
        phone: false,
        instagram: false,
        facebook: false,
        website: false,
      },

      gmapsConfig: {
        searchTerms: 'Marketing Agency',
        location: 'Austin, TX',
        category: 'Digital Agency',
        maxResults: 15,
        includeEmail: true,
        includePhone: true,
        includeWebsite: true,
      },

      igConfig: {
        searchTarget: 'creativeagency',
        searchType: 'hashtag',
        maxProfiles: 15,
        extractEmailBio: true,
        minFollowers: 1000,
      },

      liConfig: {
        jobTitle: 'Founder & CEO',
        industry: 'Design & Technology',
        location: 'New York, NY',
        companySize: '11-50 employees',
        maxProfiles: 15,
      },

      gsConfig: {
        query: 'Top Branding Studios in California',
        targetDomain: '',
        maxResults: 15,
        extractEmails: true,
        extractPhones: true,
      },

      setApiKey: (key: string) => set({ apiKey: key }),
      setActiveTab: (tab: ScraperType) => set({ activeTab: tab }),
      setScrapedLeads: (leads: ScrapedLead[]) => set({ scrapedLeads: leads }),
      addScrapedLeads: (newLeads: ScrapedLead[]) =>
        set((state) => ({ scrapedLeads: [...newLeads, ...state.scrapedLeads] })),
      clearScrapedLeads: () => set({ scrapedLeads: [], selectedIds: [] }),
      removeScrapedLead: (id: string) =>
        set((state) => ({
          scrapedLeads: state.scrapedLeads.filter((l) => l.id !== id),
          selectedIds: state.selectedIds.filter((item) => item !== id),
        })),

      setSelectedIds: (updater) =>
        set((state) => ({
          selectedIds: typeof updater === 'function' ? updater(state.selectedIds) : updater,
        })),

      setLogs: (updater) =>
        set((state) => ({
          logs: typeof updater === 'function' ? updater(state.logs) : updater,
        })),
      clearLogs: () => set({ logs: [] }),

      setMustHaveFilters: (filters) =>
        set((state) => ({
          mustHaveFilters: { ...state.mustHaveFilters, ...filters },
        })),

      setGmapsConfig: (config) =>
        set((state) => ({
          gmapsConfig: { ...state.gmapsConfig, ...config },
        })),

      setIgConfig: (config) =>
        set((state) => ({
          igConfig: { ...state.igConfig, ...config },
        })),

      setLiConfig: (config) =>
        set((state) => ({
          liConfig: { ...state.liConfig, ...config },
        })),

      setGsConfig: (config) =>
        set((state) => ({
          gsConfig: { ...state.gsConfig, ...config },
        })),
    }),
    {
      name: 'flowstudio-scraper-storage',
      storage: createFileStorage('scraper'),
    }
  )
);


onStoreExternalUpdate('scraper', () => {
  useScraperStore.persist.rehydrate();
});
