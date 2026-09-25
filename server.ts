import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, Type } from '@google/genai';
import { groqTools, geminiTools, selectGroqTools, estimateTokens } from './serverAiTools.js';
import {
  createGroqRateLedger,
  providerForModel,
  planGroqRequest,
  GROQ_DEFAULT_TPM,
  GROQ_OUTPUT_RESERVE,
} from './serverAiRateLimit.js';

// In CJS (production esbuild output), __filename is a global.
// In ESM (dev), we derive it from import.meta.url.
let __server_filename: string;
try {
  __server_filename = fileURLToPath(import.meta.url);
} catch {
  // @ts-ignore - __filename is available in CJS context
  __server_filename = typeof __filename !== 'undefined' ? __filename : __dirname + '/server.cjs';
}
const app = express();
const CONFIG_FILE = path.resolve(process.cwd(), 'flowstudio.config.json');

const APP_LEVEL_STORES = ['settings', 'notifications', 'dev', 'workspaces'];

function getAppDataDir(): string {
  const base = process.env.APPDATA || 
    (process.platform === 'darwin' 
      ? path.join(os.homedir(), 'Library', 'Application Support') 
      : path.join(os.homedir(), '.config'));
  const appDir = path.join(base, 'FlowStudio');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  return appDir;
}

function getEmptyStoreState(name: string): Record<string, any> {
  switch (name) {
    case 'projects':
      return { projects: [], currentProject: null };
    case 'clients':
      return { clients: [], notes: [], selectedClientId: '', searchQuery: '', statusFilter: 'All' };
    case 'clientDetails':
      return { appointments: [], documents: [], contracts: [] };
    case 'leads':
      return { leads: [], selectedLeadId: null, filter: 'all' };
    case 'tasks':
      return { tasks: [] };
    case 'billing':
      return { invoices: [], expenses: [], receipts: [] };
    case 'moodboard':
      return { projectItems: {}, personalItems: [] };
    case 'team':
      return { members: [], invites: [], customRoles: [] };
    case 'activities':
      return { activities: [] };
    case 'events':
      return { events: [] };
    case 'notes':
      return { notes: [] };
    case 'time':
      return { timeEntries: [] };
    case 'mail':
      return { emails: [] };
    case 'mailTemplates':
      return { templates: [] };
    case 'leadDummies':
      return { dummies: [] };
    case 'teamMessages':
      return { messages: [] };
    case 'trash':
      return { trashItems: [] };
    case 'scraper':
      return { scrapedLeads: [], selectedIds: [], logs: [] };
    case 'workspace':
      return {
        name: 'Untitled Workspace',
        tagline: '',
        logo: '',
        legalName: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        currency: 'USD',
        currencySymbol: '$',
        website: '',
        workingHours: 'Mon - Fri, 9:00 AM - 6:00 PM',
        timezone: 'auto'
      };
    default:
      return {};
  }
}

function getStoreFilePath(name: string, workspaceId: string = 'default'): string {
  if (APP_LEVEL_STORES.includes(name)) {
    const appDir = getAppDataDir();
    const appFilePath = path.join(appDir, `${name}.json`);
    
    // Auto-migrate settings from dataPath if it exists there but not in AppData
    if (!fs.existsSync(appFilePath)) {
      try {
        const { dataPath } = getConfig();
        const oldFilePath = path.join(dataPath, `${name}.json`);
        if (fs.existsSync(oldFilePath)) {
          fs.copyFileSync(oldFilePath, appFilePath);
          console.log(`[FlowStudio Server] Migrated ${name}.json from dataPath to AppData directory: ${appFilePath}`);
        }
      } catch (e) {
        console.error(`[FlowStudio Server] Error migrating ${name}.json:`, e);
      }
    }
    return appFilePath;
  }

  const { dataPath } = getConfig();
  const safeWorkspaceId = (workspaceId || 'default').replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
  const workspaceDir = path.join(dataPath, 'workspaces', safeWorkspaceId);
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  const targetFilePath = path.join(workspaceDir, `${name}.json`);

  // Auto-migrate existing root files to default workspace folder so zero user data is lost
  if (safeWorkspaceId === 'default' && !fs.existsSync(targetFilePath)) {
    try {
      const rootLegacyPath = path.join(dataPath, `${name}.json`);
      if (fs.existsSync(rootLegacyPath)) {
        fs.copyFileSync(rootLegacyPath, targetFilePath);
        console.log(`[FlowStudio Server] Auto-migrated ${name}.json to default workspace: ${targetFilePath}`);
      }
    } catch (e) {
      console.error(`[FlowStudio Server] Migration error for ${name}.json:`, e);
    }
  }

  // Non-default workspaces: if file doesn't exist yet, initialize clean empty store
  if (safeWorkspaceId !== 'default' && !fs.existsSync(targetFilePath)) {
    try {
      const emptyState = getEmptyStoreState(name);
      fs.writeFileSync(targetFilePath, JSON.stringify({ state: emptyState, version: 0 }, null, 2), 'utf-8');
      console.log(`[FlowStudio Server] Initialized clean empty store for ${name}.json in workspace ${safeWorkspaceId}`);
    } catch (e) {
      console.error(`[FlowStudio Server] Failed to initialize store ${name}.json:`, e);
    }
  }

  return targetFilePath;
}

function getConfig(): { dataPath: string; backendPort?: number } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.dataPath) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[FlowStudio Server] Error reading config:', e);
  }
  const defaultPath = path.join(os.homedir(), 'Documents', 'FlowStudio-Data');
  return { dataPath: defaultPath, backendPort: 3010 };
}

const initialConfig = getConfig();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (initialConfig.backendPort || 3010);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Apply security headers (relaxed for dev/localhost proxy compatibility)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));

// Apply CORS policy
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global Rate Limiter (skip localhost/loopback for desktop app API sync)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
  },
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use(globalLimiter);

// Specific Rate Limiter for Mail / Auth-like endpoints
const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
  },
  message: { error: "Too many mail requests from this IP, please try again later." }
});

app.use(express.raw({ type: ['application/octet-stream', 'image/*', 'video/*', 'application/pdf'], limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Error handling helper
function sendError(res: any, error: any, customMessage: string = 'Internal Server Error') {
  const correlationId = Math.random().toString(36).substring(2, 15);
  console.error(`[Error ${correlationId}]`, error);
  res.status(500).json({ error: customMessage, correlationId });
}

// Apify usage proxy endpoint
app.get('/api/apify/usage', async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: 'Apify API token is required' });

    const apifyRes = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token.trim())}`);
    if (!apifyRes.ok) {
      return res.status(apifyRes.status).json({ error: `Apify API HTTP ${apifyRes.status}` });
    }

    const data = await apifyRes.json();
    res.json(data);
  } catch (error: any) {
    sendError(res, error, 'Failed to fetch Apify usage details');
  }
});

// Mail endpoints

app.post('/api/mail/send', mailLimiter, async (req, res) => {
  try {
    const { host, port, secure, user, pass, accessToken, to, subject, html, text, fromName } = req.body;
    
    if (!user || (!pass && !accessToken)) return res.status(400).json({ error: 'Missing SMTP credentials' });

    const transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port || 465,
      secure: secure !== undefined ? secure : true,
      auth: accessToken ? {
        type: 'OAuth2',
        user: user,
        accessToken: accessToken
      } : {
        user: user,
        pass: pass
      }
    });

    const info = await transporter.sendMail({
      from: fromName ? `"${fromName}" <${user}>` : user,
      to,
      subject,
      html,
      text
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    sendError(res, error);
  }
});

app.post('/api/mail/sync', mailLimiter, async (req, res) => {
  try {
    const { host, port, tls, user, pass, accessToken, since } = req.body;
    if (!user || (!pass && !accessToken)) return res.status(400).json({ error: 'Missing IMAP credentials' });

    const imapConfig: any = {
      user,
      host: host || 'imap.gmail.com',
      port: port || 993,
      tls: tls !== undefined ? tls : true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000
    };

    if (accessToken) {
      imapConfig.xoauth2 = Buffer.from(`user=${user}\x01auth=Bearer ${accessToken}\x01\x01`).toString('base64');
    } else {
      imapConfig.password = pass;
    }

    const config = {
      imap: imapConfig
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = since ? ['UNSEEN', ['SINCE', since]] : ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const parsedMessages = [];

    for (const msg of messages) {
      const allParts = msg.parts.find(p => p.which === '');
      if (allParts) {
        const id = msg.attributes.uid;
        const idHeader = 'Imap-Id: ' + id + '\r\n';
        const mail = await simpleParser(idHeader + allParts.body);
        parsedMessages.push({
          uid: id,
          from: mail.from?.value[0]?.address,
          subject: mail.subject,
          body: mail.text || mail.html,
          date: mail.date
        });
      }
    }

    connection.end();
    res.json({ success: true, messages: parsedMessages });
  } catch (error: any) {
    sendError(res, error);
  }
});

app.post('/api/mail/drafts', mailLimiter, async (req, res) => {
  try {
    const { host, port, tls, user, pass, accessToken } = req.body;
    if (!user || (!pass && !accessToken)) return res.status(400).json({ error: 'Missing IMAP credentials' });

    const imapConfig: any = {
      user,
      host: host || 'imap.gmail.com',
      port: port || 993,
      tls: tls !== undefined ? tls : true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000
    };

    if (accessToken) {
      imapConfig.xoauth2 = Buffer.from(`user=${user}\x01auth=Bearer ${accessToken}\x01\x01`).toString('base64');
    } else {
      imapConfig.password = pass;
    }

    const config = {
      imap: imapConfig
    };

    const connection = await imaps.connect(config);
    
    // Attempt to open Gmail Drafts folder. Fallback to standard Drafts.
    let boxName = '[Gmail]/Drafts';
    try {
      await connection.openBox(boxName);
    } catch (e) {
      boxName = 'Drafts';
      await connection.openBox(boxName);
    }

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const parsedMessages = [];

    // Process only the last 20 drafts to avoid huge payloads
    const recentMessages = messages.slice(-20);

    for (const msg of recentMessages) {
      const allParts = msg.parts.find(p => p.which === '');
      if (allParts) {
        const id = msg.attributes.uid;
        const idHeader = 'Imap-Id: ' + id + '\r\n';
        const mail = await simpleParser(idHeader + allParts.body);
        parsedMessages.push({
          uid: id,
          from: mail.from?.value[0]?.address,
          to: Array.isArray(mail.to) ? mail.to.map(t => t.text).join(', ') : mail.to?.text, // Usually drafts have a 'to' or it is empty
          subject: mail.subject || 'No Subject',
          body: mail.text || mail.html || '',
          date: mail.date
        });
      }
    }

    connection.end();
    res.json({ success: true, drafts: parsedMessages });
  } catch (error: any) {
    sendError(res, error);
  }
});

app.use('/api/store/*', express.text({ type: '*/*', limit: '50mb' }));

function saveConfig(config: { dataPath: string; backendPort?: number }): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[FlowStudio Server] Error saving config:', e);
  }
}

// Seed data definitions
const SEED_CLIENTS = {
  clients: [
    {"id":"alexander-hamilton","initials":"AH","name":"Alexander Hamilton","company":"Treasury Dept","role":"Secretary of Treasury","status":"Active","projectsCount":8,"rating":5.0,"email":"a.hamilton@treasury.gov","phone":"(212) 555-1789","location":"55 Wall Street, New York, NY 10005","totalVolume":852000,"outstandingAmount":24500,"outstandingPending":true,"outstandingDueDays":5,"communicationRating":5.0,"speedRating":4.9,"avatarBg":"bg-emerald-600 text-white","brandColors":[{"name":"Emerald","hex":"#059669"},{"name":"Gold","hex":"#D97706"}],"brandFonts":[{"style":"Aa","fontName":"Playfair Display"}],"projectHistory":[{"id":"ah-p1","title":"Submit Q3 treasury audit report","phase":"Audit Phase","statusType":"ongoing","desc":"Submit Q3 treasury audit report","dueText":"Mon, 18 Oct"},{"id":"ah-p2","title":"Schedule infrastructure review meeting","phase":"Review Phase","statusType":"upcoming","desc":"Schedule infrastructure review meeting","dueText":"Wed, 20 Oct"},{"id":"ah-p3","title":"Review FedMint creative concepts","phase":"Creative Phase","statusType":"completed","desc":"Review FedMint creative concepts","dueText":"Completed"}],"tags":["GOVERNMENT","STRATEGIC","FINTECH"]},
    {"id":"john-doe","initials":"JD","name":"John Doe","company":"Acme Corp","role":"CEO at Acme Corp","status":"Active","projectsCount":12,"rating":4.8,"email":"john.doe@acmecorp.com","phone":"+1 (555) 123-4567","location":"San Francisco, CA","totalVolume":124500,"outstandingAmount":2450,"outstandingPending":true,"outstandingDueDays":3,"communicationRating":5.0,"speedRating":4.5,"avatarBg":"bg-primary text-white","brandColors":[{"name":"Dark","hex":"#0F172A"},{"name":"Primary","hex":"#3B82F6"},{"name":"Accent","hex":"#F59E0B"}],"brandFonts":[{"style":"Aa","fontName":"Inter Bold"},{"style":"Aa","fontName":"Inter Regular"}],"projectHistory":[{"id":"p1","title":"E-commerce","phase":"Redesign Phase 2","statusType":"ongoing","desc":"Redesign Phase 2","dueText":"Due in 12 days"},{"id":"p2","title":"Brand Guide","phase":"Version 2.0","statusType":"upcoming","desc":"Version 2.0","dueText":"Starts Nov 1"},{"id":"p3","title":"Mobile MVP","phase":"iOS & Android","statusType":"completed","desc":"iOS & Android","dueText":"Completed Aug 2023"}],"tags":[]},
    {"id":"sarah-miller","initials":"SM","name":"Sarah Miller","company":"Design Co.","role":"Art Director at Design Co.","status":"Prospect","projectsCount":2,"rating":null,"email":"sarah.m@designco.com","phone":"+1 (555) 987-6543","location":"Brooklyn, NY","totalVolume":8500,"outstandingAmount":0,"outstandingPending":false,"outstandingDueDays":0,"communicationRating":4.0,"speedRating":4.2,"avatarBg":"bg-amber-100 text-amber-600","brandColors":[{"name":"Earth","hex":"#78350F"},{"name":"Sand","hex":"#FCD34D"}],"brandFonts":[{"style":"Aa","fontName":"Playfair Display"},{"style":"Aa","fontName":"Inter Light"}],"projectHistory":[{"id":"p4","title":"Website Concept","phase":"Pitch Presentation","statusType":"ongoing","desc":"Pitch Presentation","dueText":"Due in 5 days"}],"tags":[]},
    {"id":"tech-flow","initials":"TF","name":"Tech Flow Inc","company":"Tech Solutions","role":"VP Engineering at Tech Flow","status":"Inactive","projectsCount":8,"rating":4.2,"email":"contact@techflow.io","phone":"+1 (415) 800-1122","location":"Austin, TX","totalVolume":56000,"outstandingAmount":1200,"outstandingPending":true,"outstandingDueDays":14,"communicationRating":4.5,"speedRating":4.0,"avatarBg":"bg-purple-100 text-purple-600","brandColors":[{"name":"Violet","hex":"#6D28D9"},{"name":"Neon","hex":"#EC4899"}],"brandFonts":[{"style":"Aa","fontName":"Fira Code"},{"style":"Aa","fontName":"Geist Sans"}],"projectHistory":[{"id":"p5","title":"API Gateway","phase":"Infrastructure Refactor","statusType":"completed","desc":"Infrastructure Refactor","dueText":"Completed Sep 2023"}],"tags":[]},
    {"id":"global-media","initials":"GM","name":"Global Media","company":"Media Group","role":"Head of Brand at Global Media","status":"Active","projectsCount":24,"rating":4.9,"email":"billing@globalmedia.com","phone":"+44 20 7946 0958","location":"London, UK","totalVolume":324000,"outstandingAmount":15400,"outstandingPending":true,"outstandingDueDays":8,"communicationRating":4.9,"speedRating":4.9,"avatarBg":"bg-indigo-100 text-indigo-600","brandColors":[{"name":"Navy","hex":"#1E3A8A"},{"name":"Sky","hex":"#38BDF8"}],"brandFonts":[{"style":"Aa","fontName":"Cabinet Grotesque"},{"style":"Aa","fontName":"Inter Regular"}],"projectHistory":[{"id":"p6","title":"Streaming App UI","phase":"High-fi Wireframes","statusType":"ongoing","desc":"High-fi Wireframes","dueText":"Due in 2 days"},{"id":"p7","title":"Ad Campaigns","phase":"Q3 Creatives","statusType":"completed","desc":"Q3 Creatives","dueText":"Completed Oct 2024"}],"tags":[]},
    {"id":"creative-spark","initials":"CS","name":"Creative Spark","company":"Marketing Agency","role":"Founder at Creative Spark","status":"Prospect","projectsCount":1,"rating":null,"email":"hello@creativespark.co","phone":"+1 (212) 555-0199","location":"New York, NY","totalVolume":4200,"outstandingAmount":0,"outstandingPending":false,"outstandingDueDays":0,"communicationRating":4.5,"speedRating":4.8,"avatarBg":"bg-pink-100 text-pink-600","brandColors":[{"name":"Coral","hex":"#F43F5E"},{"name":"Peach","hex":"#FDE047"}],"brandFonts":[{"style":"Aa","fontName":"Satoshi Variable"}],"projectHistory":[],"tags":[]},
    {"id":"next-gen","initials":"NG","name":"Next Gen","company":"Startup Hub","role":"Incubator Director at Next Gen","status":"Active","projectsCount":5,"rating":4.6,"email":"partnerships@nextgenhub.com","phone":"+1 (650) 555-4433","location":"Palo Alto, CA","totalVolume":45000,"outstandingAmount":4900,"outstandingPending":true,"outstandingDueDays":6,"communicationRating":4.6,"speedRating":4.7,"avatarBg":"bg-cyan-100 text-cyan-600","brandColors":[{"name":"Teal","hex":"#0D9488"},{"name":"Mint","hex":"#A7F3D0"}],"brandFonts":[{"style":"Aa","fontName":"Plus Jakarta Sans"}],"projectHistory":[{"id":"p8","title":"Startup Pitch Deck","phase":"Feedback Cycle 4","statusType":"ongoing","desc":"Feedback Cycle 4","dueText":"Due in 4 days"}],"tags":[]}
  ],
  notes: [
    {"id":"n1","clientId":"john-doe","clientInitials":"JD","type":"Meeting","content":"Discussed Q4 roadmap with Sarah. Need to prioritize mobile responsiveness for the new dashboard.","authorInitials":"JD","timeText":"2 hours ago","date":"Oct 24, 2024","tags":["Strategy","Roadmap"]},
    {"id":"n2","clientId":"tech-flow","clientInitials":"TF","type":"Idea","content":"Potential feature: Automated invoice reminders. Check feasibility with the dev team next sprint.","authorInitials":"TF","timeText":"Yesterday","date":"Oct 23, 2024","tags":["Billing","Automations"]},
    {"id":"n3","clientId":"sarah-miller","clientInitials":"SM","type":"Feedback","content":"Client loved the new color palette! \"Fresh and modern\" were the exact words.","authorInitials":"SM","timeText":"Oct 24","date":"Oct 24, 2024","tags":["Creative","Colors"]},
    {"id":"n4","clientId":"john-doe","clientInitials":"JD","type":"Urgent","content":"Server migration scheduled for Friday night. Inform all active clients about potential downtime.","authorInitials":"JD","timeText":"Oct 22","date":"Oct 22, 2024","tags":["Infrastructure","Maintenance"]}
  ],
  selectedClientId: "john-doe",
  searchQuery: "",
  statusFilter: "All"
};

const SEED_LEADS = {
  leads: [
    {"id":"lead_1","name":"Sarah Jenkins","company":"Acme Corp","email":"sarah.j@acme.inc","phone":"+1 (555) 123-4567","status":"New","estimated_value":12000,"source":"Website Form","notes_summary":"Interested in a full brand overhaul.","tags":["branding","urgent"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_2","name":"Marcus Thorne","company":"Nexus Tech","email":"marcus@nexustech.io","status":"Contacted","estimated_value":25000,"source":"Referral","notes_summary":"Looking for SaaS platform UI/UX design.","tags":["saas","ui/ux"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_3","name":"Elena Rodriguez","company":"Flora Boutique","email":"elena@flora.local","phone":"555-987-6543","status":"Discovery","estimated_value":5000,"source":"Social Media","notes_summary":"Needs new ecommerce website.","tags":["ecommerce","local"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_4","name":"David Kim","company":"BlueSky Ventures","email":"dkim@bluesky.vc","status":"Proposal Sent","estimated_value":45000,"source":"Networking Event","notes_summary":"Requested pitch deck presentation design.","tags":["investor","presentation"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_5","name":"Lisa Patel","company":"Bright Future Edu","email":"lisa.p@brightfuture.edu","status":"New","estimated_value":18000,"source":"Website Form","notes_summary":"Educational materials redesign.","tags":["education","print"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_6","name":"James Wilson","company":"Wilson & Sons","email":"james@wilsonsons.com","phone":"+(44) 7700 900077","status":"Contacted","estimated_value":8500,"source":"Cold Outreach","notes_summary":"Family business updating their ancient logo.","tags":["logo"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]},
    {"id":"lead_7","name":"Rachel Greene","company":"Style Box","email":"rachel@stylebox.co","status":"Archived","estimated_value":15000,"source":"Website Form","notes_summary":"Went cold after initial discovery call.","tags":["ecommerce","fashion"],"last_updated_at":"2026-01-01T00:00:00.000Z","timeline":[{"date":"2026-01-01T00:00:00.000Z","event":"Lead Created"}]}
  ],
  columns: [
    {"id":"name","title":"Name","width":240},
    {"id":"type","title":"Type","width":140},
    {"id":"email","title":"Email","width":180},
    {"id":"phone","title":"Phone","width":150},
    {"id":"status","title":"Pipeline Stage","width":130},
    {"id":"socials","title":"Socials","width":150},
    {"id":"location","title":"Location","width":160},
    {"id":"actions","title":"Workspace Actions","width":180}
  ],
  columnLabels: {"name":"Name","type":"Type","email":"Email","phone":"Phone","status":"Status","socials":"Socials","location":"Location","company":"Company","estimated_value":"Forecast Value","source":"Origin Source","tags":"Classification Tags"},
  searchQuery: "",
  statusFilter: "All"
};

const SEED_PROJECTS = {
  projects: [
    {
      id: "rebrand-2024",
      name: "Apex Architecture Rebrand",
      title: "Apex Architecture Rebrand",
      description: "Complete visual identity overhaul, typography guidelines, and marketing collateral suite.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
      category: "Branding",
      status: "In Progress",
      statusColor: "bg-blue-600/90",
      progress: 75,
      completion: 75,
      client: "Alexander Hamilton",
      deadline: "2026-10-15",
      isPortfolio: true,
      tasksCount: 4,
      commentsCount: 6,
      tags: ["Branding", "Architecture", "Identity"]
    },
    {
      id: "neon-brand-identity",
      name: "Luminal Neon Brand Identity",
      title: "Luminal Neon Brand Identity",
      description: "Cyberpunk-inspired luminous branding system for immersive light studio storefront.",
      image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1000&auto=format&fit=crop",
      category: "3D & Vector",
      status: "In Progress",
      statusColor: "bg-purple-600/90",
      progress: 60,
      completion: 60,
      client: "Tech Flow Inc",
      deadline: "2026-11-01",
      isPortfolio: false,
      tasksCount: 4,
      commentsCount: 3,
      tags: ["Neon", "3D", "Lighting"]
    },
    {
      id: "psychedelic-poster-series",
      name: "Sonic Wave Music Festival",
      title: "Sonic Wave Music Festival",
      description: "Silk-screened psychedelic festival poster series featuring custom typography and surreal vectors.",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
      category: "Print & Poster",
      status: "In Progress",
      statusColor: "bg-amber-600/90",
      progress: 85,
      completion: 85,
      client: "Global Media",
      deadline: "2026-09-30",
      isPortfolio: true,
      tasksCount: 4,
      commentsCount: 2,
      tags: ["Print", "Festival", "Posters"]
    },
    {
      id: "retro-packaging-revival",
      name: "Retro Soda Packaging",
      title: "Retro Soda Packaging",
      description: "1970s nostalgia-driven packaging design system for artisanal botanical soda craft cans.",
      image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=1000&auto=format&fit=crop",
      category: "Packaging",
      status: "Completed",
      statusColor: "bg-emerald-600/90",
      progress: 100,
      completion: 100,
      client: "Acme Corp",
      deadline: "2026-07-20",
      isPortfolio: true,
      tasksCount: 4,
      commentsCount: 5,
      tags: ["Packaging", "Vintage", "Botanical"]
    },
    {
      id: "vibrant-vector-illustrations",
      name: "Fintech App UI & Mascot Suite",
      title: "Fintech App UI & Mascot Suite",
      description: "Custom isometric scenes, flat character illustrations, and 24 iconography vectors for mobile onboarding.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
      category: "UI/UX",
      status: "Completed",
      statusColor: "bg-indigo-600/90",
      progress: 100,
      completion: 100,
      client: "Next Gen",
      deadline: "2026-06-30",
      isPortfolio: false,
      tasksCount: 3,
      commentsCount: 1,
      tags: ["Fintech", "UI/UX", "Illustration"]
    }
  ],
  currentProject: null
};

const SEED_TASKS = {
  tasks: [
    {"id":"1","projectId":"rebrand-2024","title":"Finalize Brand Guidelines","details":"Complete the final draft of the brand guidelines including color scales and typography pairings.","dueDate":"2026-09-20","priority":"high","phase":"todo","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Incomplete"},
    {"id":"2","projectId":"rebrand-2024","title":"Logo Exporting & Packaging","details":"Export all logo variants in SVG, PNG, and AI formats.","dueDate":"2026-09-21","priority":"medium","phase":"inprogress","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Incomplete"},
    {"id":"3","projectId":"rebrand-2024","title":"Social Media Launch Assets","details":"Create banners and profile pictures for LinkedIn, Twitter, and Instagram.","dueDate":"2026-09-23","priority":"high","phase":"todo","assignees":[{"id":"m2","name":"Sarah Miller","avatar":"SM"},{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Incomplete"},
    {"id":"4","projectId":"rebrand-2024","title":"Client Website Wireframes","details":"Draft initial wireframes for the new client portal.","dueDate":"2026-09-25","priority":"low","phase":"done","assignees":[],"status":"Complete"},
    {"id":"n1","projectId":"neon-brand-identity","title":"Moodboard & Color Palette Selection","details":"Research neon aesthetics and define the primary/secondary color scales.","dueDate":"2026-09-15","priority":"high","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"n2","projectId":"neon-brand-identity","title":"Logo Concept Sketches","details":"Develop at least 3 distinct vector routes for the neon logo.","dueDate":"2026-09-18","priority":"medium","phase":"inprogress","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Incomplete"},
    {"id":"n3","projectId":"neon-brand-identity","title":"Typography System Definition","details":"Select neon-compatible display fonts and geometric body text.","dueDate":"2026-09-22","priority":"low","phase":"todo","assignees":[],"status":"Incomplete"},
    {"id":"n4","projectId":"neon-brand-identity","title":"3D Brand Mockups","details":"Render neon signage mockup for Luminal Studio storefront.","dueDate":"2026-09-28","priority":"high","phase":"todo","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Incomplete"},
    {"id":"p1","projectId":"psychedelic-poster-series","title":"Concept ideation and sketch approval","details":"Draft initial layouts for the 3 festival posters.","dueDate":"2026-09-08","priority":"high","phase":"done","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Complete"},
    {"id":"p2","projectId":"psychedelic-poster-series","title":"First poster illustration (Acid Rock)","details":"Finalize vector artwork for the Acid Rock poster.","dueDate":"2026-09-15","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"p3","projectId":"psychedelic-poster-series","title":"Second poster illustration (Dream Pop)","details":"Finalize pastel-gradient vector artwork for Dream Pop.","dueDate":"2026-09-20","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"p4","projectId":"psychedelic-poster-series","title":"Typography layout & printing setup","details":"Set up print-ready PDF files with crop marks and Pantone colors.","dueDate":"2026-09-25","priority":"high","phase":"inprogress","assignees":[{"id":"m2","name":"Sarah Miller","avatar":"SM"}],"status":"Incomplete"},
    {"id":"r1","projectId":"retro-packaging-revival","title":"Historical brand research","details":"Gather reference material of 1970s soda cans and typography.","dueDate":"2026-08-15","priority":"low","phase":"done","assignees":[],"status":"Complete"},
    {"id":"r2","projectId":"retro-packaging-revival","title":"Color palette & mascot design","details":"Create the vector mascot character and retro warm color theme.","dueDate":"2026-08-22","priority":"high","phase":"done","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Complete"},
    {"id":"r3","projectId":"retro-packaging-revival","title":"Die-line layout mapping","details":"Map the designs onto the official can manufacturer die-lines.","dueDate":"2026-08-29","priority":"medium","phase":"done","assignees":[{"id":"m4","name":"Elena Rostova","avatar":"ER"}],"status":"Complete"},
    {"id":"r4","projectId":"retro-packaging-revival","title":"Client feedback round 3 modifications","details":"Make final minor edits to the nutrition facts label layout.","dueDate":"2026-09-04","priority":"low","phase":"inprogress","assignees":[{"id":"m2","name":"Sarah Miller","avatar":"SM"}],"status":"Incomplete"},
    {"id":"v1","projectId":"vibrant-vector-illustrations","title":"Character design sheets","details":"Draw 5 flat-design character illustrations with vibrant outfits.","dueDate":"2026-08-10","priority":"high","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"v2","projectId":"vibrant-vector-illustrations","title":"Interface background illustrations","details":"Create 3 detailed isometric backgrounds for the app scenes.","dueDate":"2026-08-18","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"v3","projectId":"vibrant-vector-illustrations","title":"Icon set exporting","details":"Export 24 vector icons in SVG and PDF formats.","dueDate":"2026-08-24","priority":"low","phase":"done","assignees":[{"id":"m4","name":"Elena Rostova","avatar":"ER"}],"status":"Complete"}
  ],
  columns: [],
  columnNames: {},
  sortBy: null,
  columnOrder: ["title","assignee","dueDate","priority","status","comments","customField","pics"],
  isFieldsSidebarOpen: false,
  hiddenColumns: [],
  statusConfigs: {}
};

const SEED_TEAM = {
  members: [
    {"id":"m1","name":"John Doe","email":"john.doe@flowstudio.com","role":"Owner","phone":"+1 (555) 234-5678","bio":"Founder & Lead Product Designer driving creative vision across all major accounts.","department":"Leadership","status":"active","joinDate":"Jan 15, 2023","assignedProjects":["Apex Architecture Rebrand","Sonic Wave Music Festival"],"activeFocus":"🎨 Designing Flow Studio visual guidelines & core architecture","skills":["Creative Direction","Brand Strategy","Product UI","Figma","Design Systems"]},
    {"id":"m2","name":"Sarah Miller","email":"sarah.m@flowstudio.com","role":"Admin","phone":"+1 (555) 987-6543","bio":"Operations Director & Account Manager coordinating client feedback and sprints.","department":"Operations","status":"active","joinDate":"Mar 10, 2023","assignedProjects":["Retro Soda Packaging","Apex Architecture Rebrand"],"activeFocus":"📊 Aligning Q3 sprint deliverables with stakeholder timelines","skills":["Client Relations","Agile Sprints","Account Management","Roadmapping","Notion"]},
    {"id":"m3","name":"Alex Rivera","email":"alex.r@flowstudio.com","role":"Designer","phone":"+1 (555) 456-7890","bio":"Senior UX/UI Designer specializing in micro-interactions and design systems.","department":"Design","status":"active","joinDate":"Jun 22, 2023","assignedProjects":["Luminal Neon Brand Identity","Fintech App UI & Mascot Suite"],"activeFocus":"✨ Refining micro-interactions for the component library","skills":["UI/UX Design","Micro-interactions","Prototyping","Design Tokens","Figma"]},
    {"id":"m4","name":"Elena Rostova","email":"elena.r@flowstudio.com","role":"Developer","phone":"+1 (555) 345-6789","bio":"Frontend Architect implementing responsive web apps and animations.","department":"Engineering","status":"active","joinDate":"Sep 05, 2023","assignedProjects":["Fintech App UI & Mascot Suite","Retro Soda Packaging"],"activeFocus":"⚡ Optimizing frontend rendering performance and web animation framerates","skills":["React","TypeScript","Tailwind CSS","Framer Motion","Zustand","Performance"]}
  ],
  invites: [
    {"id":"inv1","email":"david.kim@flowstudio.com","role":"Designer","sentDate":"Yesterday"},
    {"id":"inv2","email":"claire.voyant@flowstudio.com","role":"Guest","sentDate":"3 days ago"}
  ],
  customRoles: []
};

const SEED_MOODBOARD = {
  items: [
    {"id":"1","type":"image","x":100,"y":100,"title":"Editorial Typography Inspiration","content":"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop","width":340,"height":240,"rotation":0,"category":"Inspiration"},
    {"id":"2","type":"color","x":480,"y":100,"title":"Deep Obsidian","color":"#0F172A","content":"#0F172A","width":160,"height":160,"rotation":0,"category":"Brand Colors"},
    {"id":"3","type":"color","x":660,"y":100,"title":"Electric Indigo","color":"#4F46E5","content":"#4F46E5","width":160,"height":160,"rotation":0,"category":"Brand Colors"},
    {"id":"4","type":"color","x":840,"y":100,"title":"Luminous Amber","color":"#F59E0B","content":"#F59E0B","width":160,"height":160,"rotation":0,"category":"Brand Colors"},
    {"id":"5","type":"sticky","x":480,"y":290,"title":"Typography Rule","content":"💡 Use Cabinet Grotesque for bold display headlines and Inter for ultra-clean body copy.","width":260,"height":180,"rotation":0,"color":"#fef3c7","category":"Typography"},
    {"id":"6","type":"bookmark","x":100,"y":380,"title":"Modern Architecture Design System","url":"https://unsplash.com","width":340,"height":140,"rotation":0,"category":"References"},
    {"id":"7","type":"image","x":760,"y":290,"title":"Minimalist Architectural Form","content":"https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop","width":320,"height":220,"rotation":0,"category":"Inspiration"}
  ],
  projectItems: {
    "rebrand-2024": [
      {"id":"p-1","type":"image","x":100,"y":100,"title":"Architectural Minimal Grid","content":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop","width":340,"height":240,"rotation":0,"category":"Inspiration"},
      {"id":"p-2","type":"color","x":480,"y":100,"title":"Slate Dark","color":"#1E293B","content":"#1E293B","width":160,"height":160,"rotation":0,"category":"Brand Colors"},
      {"id":"p-3","type":"color","x":660,"y":100,"title":"Warm Sand","color":"#E2D9CC","content":"#E2D9CC","width":160,"height":160,"rotation":0,"category":"Brand Colors"},
      {"id":"p-4","type":"sticky","x":480,"y":290,"title":"Design Directive","content":"Preserve strong brutalist structural lines while softening secondary cards with 8px radius.","width":260,"height":180,"rotation":0,"color":"#e0f2fe","category":"Directives"}
    ]
  },
  projectViews: {},
  currentProjectId: null,
  selectedIds: [],
  view: { zoom: 1, pan: { x: 0, y: 0 } },
  history: [],
  historyIndex: -1,
  activeCategoryFilter: null,
  gridConfig: { type: 'dot', size: 20, opacity: 0.15, snapToGrid: false }
};

const SEED_BILLING = {
  balance: 14250,
  nextPaymentAmount: 4800,
  nextPaymentDate: '2026-09-15',
  savedCard: {
    cardNumber: '•••• •••• •••• 4242',
    cardHolder: 'Alex Rivera',
    validThru: '08/28',
    brand: 'visa'
  },
  billingAddress: {
    name: 'Flow Studio HQ',
    addressLine1: '540 Howard Street, Suite 300',
    addressLine2: 'San Francisco, CA 94105'
  },
  paymentHistory: [
    { id: 'INV-2026-001', clientName: 'Alexander Hamilton', project: 'Apex Architecture Rebrand', amount: 8500, date: '2026-08-15', status: 'Paid', method: 'Bank Transfer' },
    { id: 'INV-2026-002', clientName: 'Tech Flow Inc', project: 'Luminal Neon Brand Identity', amount: 4200, date: '2026-08-20', status: 'Paid', method: 'Credit Card' },
    { id: 'INV-2026-003', clientName: 'Global Media', project: 'Sonic Wave Music Festival', amount: 3500, date: '2026-08-28', status: 'Pending', method: 'PayPal' },
    { id: 'INV-2026-004', clientName: 'Next Gen Hub', project: 'Fintech App UI & Mascot Suite', amount: 2800, date: '2026-08-30', status: 'Draft', method: 'Wire' }
  ]
};

function getSeedSettings(dataPath: string) {
  return {
    baseProjectPath: "Documents/Flowstudio Projects",
    shipFolderName: "ready to ship",
    metadataPath: ".flowstudio/metadata",
    defaultProjectName: "Untitled Project",
    defaultAuthor: "Design Pro",
    displayName: "Design Pro",
    role: "Product Lead",
    email: "alex.designer@studio.com",
    bio: "Lead product designer obsessed with typography and grid systems. Currently building the future of design tools.",
    profileImage: "",
    editorExperience: { darkCanvas: true, pixelSnap: true, autoSave: false },
    defaults: { canvasSize: "hd", initialStatus: "in-review", autoAssignTeam: ["Sarah M.", "Dev Team"], typography: { headingFont: "Inter", bodyFont: "Inter", baseSize: 16 } },
    dataLocation: { currentPath: dataPath, storageUsage: { used: 0, total: 500, projects: 0, cache: 0 }, cloudSync: { enabled: false, frequency: "every-hour", bandwidthLimit: "unlimited" } },
    notifications: { app: { newProject: true, taskCompleted: true, newComments: true, deadlineApproaching: false }, email: { dailyDigest: true, productUpdates: false }, sounds: { soundEffects: true } }
  };
}

const SEED_MAIL = {
  sentEmails: [],
  replies: [],
  followUpSettings: { frequencyDays: 3, maxAttempts: 3 }
};

const SEED_MAIL_TEMPLATES = {
  templates: [
    { id: 't1', name: 'Initial Outreach', subject: 'Collaboration with {{company}}', body: 'Hi {{name}},\n\nWe love what you are doing at {{company}} and would love to collaborate on your upcoming design needs. Let us know if you are open to a quick 15-minute sync.\n\nBest,\nFlow Studio Team' },
    { id: 't2', name: 'Follow-up 1', subject: 'Checking in - Flow Studio', body: 'Hi {{name}},\n\nJust floating this to the top of your inbox. Let me know if you have any questions!\n\nBest,\nFlow Studio Team' }
  ]
};

const SEED_TIME = {
  entries: [
    { id: 'mock-1', projectId: 'rebrand-2024', projectTitle: 'Rebrand 2024', taskTitle: 'Design System Architecture', startTime: 1718000000000, endTime: 1718009000000, durationSeconds: 9000 },
    { id: 'mock-2', projectId: 'lumina-brand', projectTitle: 'Lumina Brand Identity', taskTitle: 'Client Review Call', startTime: 1718015000000, endTime: 1718021300000, durationSeconds: 6300 }
  ],
  activeTimer: null
};

const SEED_NOTIFICATIONS = {
  notifications: [
    { id: 1, title: 'New Comment', message: 'Alex left a comment on Homepage Design.', time: '10m ago', unread: true },
    { id: 2, title: 'Task Completed', message: 'Wireframes have been approved.', time: '1h ago', unread: false },
    { id: 3, title: 'Meeting Reminder', message: 'Client sync in 15 minutes.', time: '2h ago', unread: false }
  ]
};

const SEED_CLIENT_DETAILS = {
  experts: {
    'alexander-hamilton': {
      assigned: [
        { id: 'exp-1', name: 'Leslie Alexander', email: 'l.alexander@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
        { id: 'exp-2', name: 'Bessie Cooper', email: 'b.cooper@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop' }
      ],
      available: [
        { id: 'avail-1', name: 'Theresa Webb', email: 't.webb@example.com', role: 'Senior Designer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop', online: true },
        { id: 'avail-2', name: 'Cody Fisher', email: 'c.fisher@example.com', role: 'Frontend Dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', online: false }
      ]
    }
  },
  pinnedAssets: [
    { id: 'a1', name: 'Brand Guidelines', type: 'pdf', date: 'Updated 2 days ago' },
    { id: 'a2', name: 'Website Assets.zip', type: 'zip', date: 'Uploaded Sep 30, 2023' }
  ],
  activityLogs: [
    { id: 'act-1', user: 'Sarah Connor', action: 'added a note to', target: 'Audit Report', time: '1 hour ago', type: 'note' },
    { id: 'act-2', user: 'Task completed', action: 'Homepage Design Review was marked as complete', target: '', time: '4 hours ago', type: 'task' },
    { id: 'act-3', user: 'Alexander Hamilton', action: 'commented on', target: 'Strategic Plan', time: 'Yesterday at 2:30 PM', type: 'comment' }
  ]
};

const SEED_NOTES = {
  defaultNotes: [
    { id: '1', title: 'Discovery Phase Notes', content: '<h2>1. Key Competitors</h2><p>We\'ve identified three main competitors...UrbanForm, EcoBuild, Structura...</p>', category: 'Research', timestamp: '10:45 AM', time: 'Today' },
    { id: '2', title: 'Client Kickoff Meeting', content: '<p>Attendees: Sarah (Client), Mark, Julia...</p>', category: 'Meeting', timestamp: '2:15 PM', time: 'Yesterday' },
    { id: '3', title: 'Initial Feedback - Oct 12', content: '<p>Feedback notes on typography selection.</p>', category: 'Feedback', timestamp: '4:00 PM', time: 'Oct 12' }
  ]
};

const SEED_LEAD_DUMMIES = {
  dummies: [
    { name: 'Sarah Jenkins', type: 'Enterprise', company: 'Acme Corp', email: 'sarah@acme.com', phone: '+1 555-0198', status: 'Contacted', estimated_value: 45000, source: 'Outbound' },
    { name: 'Michael Chen', type: 'Startup', company: 'NovaTech', email: 'm.chen@novatech.io', phone: '+1 555-0144', status: 'New', estimated_value: 15000, source: 'Inbound Form' },
    { name: 'Elena Rostova', type: 'Agency', company: 'Studio Flow', email: 'elena@studioflow.design', phone: '+1 555-0199', status: 'Qualified', estimated_value: 28000, source: 'Referral' },
    { name: 'David Kim', type: 'Enterprise', company: 'Global Logistics', email: 'dkim@globallogistics.com', phone: '+1 555-0122', status: 'Proposal Sent', estimated_value: 65000, source: 'Event' },
    { name: 'Rachel Greene', type: 'Small Business', company: 'Style Box', email: 'rachel@stylebox.co', phone: '+1 555-0188', status: 'Closed Won', estimated_value: 9500, source: 'Instagram' },
    { name: 'James Wilson', type: 'Startup', company: 'AeroSphere', email: 'j.wilson@aerosphere.io', phone: '+1 555-0177', status: 'New', estimated_value: 32000, source: 'LinkedIn' },
    { name: 'Lisa Patel', type: 'Enterprise', company: 'FinTrust Bank', email: 'lisa.patel@fintrust.com', phone: '+1 555-0166', status: 'Negotiation', estimated_value: 110000, source: 'Referral' }
  ]
};

const SEED_TEAM_MESSAGES = {
  messages: [
    { id: '1', text: 'Hey, are you available for a quick sync on the new dashboard?', sender: 'me', time: '10:00 AM' },
    { id: '2', text: 'Sure! Give me 5 minutes to wrap up this PR.', sender: 'them', time: '10:02 AM' }
  ]
};

const SEED_ACTIVITIES = {
  activities: [
    { id: "act-1", user: "Alex Rivera", action: "uploaded 4 moodboard concepts to", target: "Apex Architecture Rebrand", time: "15m ago", type: "moodboard" },
    { id: "act-2", user: "Sarah Miller", action: "marked task as complete:", target: "Color palette & mascot design", time: "2h ago", type: "task" },
    { id: "act-3", user: "John Doe", action: "generated new invoice INV-2026-003 for", target: "Global Media", time: "5h ago", type: "billing" },
    { id: "act-4", user: "Elena Rostova", action: "exported vector icon package for", target: "Fintech App UI", time: "1d ago", type: "file" }
  ]
};

const SEED_EVENTS = {
  events: [
    { id: "evt-1", title: "Apex Brand Architecture Review", description: "Final presentation of high-fidelity brand assets to Alexander Hamilton.", date: "2026-09-02", time: "10:30", type: "Design", participants: "Sarah M., Alex R., Alexander H." },
    { id: "evt-2", title: "Sprint Planning & Backlog Grooming", description: "Bi-weekly studio sprint sync to assign upcoming packaging milestones.", date: "2026-09-04", time: "14:00", type: "Team Sync", participants: "All Studio Team" },
    { id: "evt-3", title: "Global Media Discovery Call", description: "Initial brief sync on Sonic Wave merchandise expansion.", date: "2026-09-08", time: "11:00", type: "Call", participants: "John Doe, Sarah M." },
    { id: "evt-4", title: "Fintech Design System Sign-off", description: "Design token export review with engineering architects.", date: "2026-09-12", time: "16:00", type: "Design", participants: "Elena R., Alex R." }
  ]
};

function bootstrap(): void {
  const config = getConfig();
  const dataPath = config.dataPath;
  saveConfig(config);

  

  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  const stores: Record<string, any> = {
    clients: SEED_CLIENTS,
    leads: SEED_LEADS,
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS,
    team: SEED_TEAM,
    moodboard: SEED_MOODBOARD,
    settings: getSeedSettings(dataPath),
    billing: SEED_BILLING,
    trash: { trashItems: [] },
    activities: SEED_ACTIVITIES,
    events: SEED_EVENTS,
    mail: SEED_MAIL,
    mailTemplates: SEED_MAIL_TEMPLATES,
    time: SEED_TIME,
    notifications: SEED_NOTIFICATIONS,
    clientDetails: SEED_CLIENT_DETAILS,
    notes: SEED_NOTES,
    leadDummies: SEED_LEAD_DUMMIES,
    teamMessages: SEED_TEAM_MESSAGES,
    scraper: {
      scrapedLeads: [],
      selectedIds: [],
      apiKey: '',
      activeTab: 'google-maps',
      logs: [],
      mustHaveFilters: { email: false, phone: false, instagram: false, facebook: false, website: false },
      gmapsConfig: { searchTerms: 'Design Agency', location: 'New York, NY', category: 'Marketing', maxResults: 15 },
      igConfig: { searchTarget: 'creativeagency', searchType: 'hashtag', minFollowers: 1000, maxProfiles: 15 },
      liConfig: { jobTitle: 'Founder', industry: 'Design & Marketing', location: 'San Francisco, CA', maxProfiles: 15 },
      gsConfig: { query: 'Top branding agencies', targetDomain: '', extractEmails: true, extractPhones: true, maxResults: 15 }
    }
  };

  for (const [name, state] of Object.entries(stores)) {
    const filePath = path.join(dataPath, `${name}.json`);
    let needsWrite = false;

    if (!fs.existsSync(filePath)) {
      needsWrite = true;
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        const st = parsed.state || parsed;

        if (name === 'clients' && (!Array.isArray(st.clients) || st.clients.length === 0)) needsWrite = true;
        if (name === 'leads' && (!Array.isArray(st.leads) || st.leads.length === 0)) needsWrite = true;
        if (name === 'projects' && (!Array.isArray(st.projects) || st.projects.length === 0)) needsWrite = true;
        if (name === 'team' && (!Array.isArray(st.members) || st.members.length === 0)) needsWrite = true;
      } catch {
        needsWrite = true;
      }
    }

    if (needsWrite) {
      const payload = JSON.stringify({ state, version: 0 }, null, 2);
      fs.writeFileSync(filePath, payload, 'utf-8');
      console.log(`[FlowStudio Server] Seeded data for ${name}.json in ${dataPath}`);
    }
  }

  setupDataWatcher(dataPath);
}

// Real-Time Event Sync via Server-Sent Events (SSE)
const sseClients: express.Response[] = [];
const lastApiWriteTimestamps = new Map<string, number>();

function broadcastStoreChange(storeName: string, source: 'api' | 'fs' = 'api', workspaceId: string = 'default') {
  const payload = JSON.stringify({ type: 'store_updated', store: storeName, workspaceId, source, timestamp: Date.now() });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(`data: ${payload}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Watch data folder for external file edits (e.g. from agent, scripts, tools)
const fsWatchDebounceTimers = new Map<string, NodeJS.Timeout>();

function setupDataWatcher(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) return;
    fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (!filename || typeof filename !== 'string' || !filename.endsWith('.json') || filename.endsWith('.tmp')) return;
      
      const normalized = filename.replace(/\\/g, '/');
      const parts = normalized.split('/');
      let wsId = 'default';
      const storeName = path.basename(normalized, '.json');
      if (parts.length >= 3 && parts[0] === 'workspaces') {
        wsId = parts[1];
      }

      const dedupeKey = `${wsId}:${storeName}`;
      if (fsWatchDebounceTimers.has(dedupeKey)) {
        clearTimeout(fsWatchDebounceTimers.get(dedupeKey)!);
      }

      const timer = setTimeout(() => {
        fsWatchDebounceTimers.delete(dedupeKey);
        const lastApiTime = lastApiWriteTimestamps.get(dedupeKey) || lastApiWriteTimestamps.get(storeName) || 0;
        if (Date.now() - lastApiTime < 2000) {
          // Skip broadcast: this file change was triggered by our own internal API write
          return;
        }
        broadcastStoreChange(storeName, 'fs', wsId);
      }, 120);

      fsWatchDebounceTimers.set(dedupeKey, timer);
    });
    console.log(`[FlowStudio Server] Watching ${dirPath} for real-time live sync.`);
  } catch (err) {
    console.warn('[FlowStudio Server] fs.watch setup warning:', err);
  }
}

// 0. GET /api/events (SSE Stream for Realtime Store Sync)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'connected', clients: sseClients.length })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 1. GET /api/config
app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

// 2. PUT /api/config
app.put('/api/config', (req, res) => {
  try {
    const { dataPath } = req.body;
    if (!dataPath || typeof dataPath !== 'string') {
      return res.status(400).json({ error: 'dataPath is required' });
    }

    const oldConfig = getConfig();
    const oldPath = oldConfig.dataPath;
    const newPath = path.resolve(dataPath);

    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }

    // Copy existing data files if oldPath exists and differs
    if (fs.existsSync(oldPath) && oldPath !== newPath) {
      const files = fs.readdirSync(oldPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const src = path.join(oldPath, file);
          const dest = path.join(newPath, file);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    }

    saveConfig({ dataPath: newPath });
    setupDataWatcher(newPath);
    res.json({ dataPath: newPath });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 3. GET /api/store/:name
app.get('/api/store/:name', (req, res) => {
  try {
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper', 'workspace', 'workspaces'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const wsHeader = (req.headers['x-workspace-id'] as string) || (req.query.workspace as string) || 'default';
    const filePath = getStoreFilePath(name, wsHeader);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Store file not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.header('Content-Type', 'application/json').send(content);
  } catch (e: any) {
    sendError(res, e);
  }
});

// 4. PUT /api/store/:name
app.put('/api/store/:name', (req, res) => {
  try {
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper', 'workspace', 'workspaces'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const wsHeader = (req.headers['x-workspace-id'] as string) || (req.query.workspace as string) || 'default';
    const filePath = getStoreFilePath(name, wsHeader);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = `${filePath}.tmp`;
    const content = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);

    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);

    const dedupeKey = `${wsHeader}:${name}`;
    lastApiWriteTimestamps.set(dedupeKey, Date.now());
    lastApiWriteTimestamps.set(name, Date.now());
    broadcastStoreChange(name, 'api', wsHeader);

    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 5. DELETE /api/store/:name
app.delete('/api/store/:name', (req, res) => {
  try {
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper', 'workspace', 'workspaces'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const wsHeader = (req.headers['x-workspace-id'] as string) || (req.query.workspace as string) || 'default';
    const filePath = getStoreFilePath(name, wsHeader);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    broadcastStoreChange(name, 'api', wsHeader);

    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// Helper to sanitize project names
const sanitizeProjectName = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'Unnamed Project';

// POST /api/projects/get-folder
app.post('/api/projects/get-folder', (req, res) => {
  try {
    const { projectId, projectName } = req.body as { projectId?: string; projectName?: string };
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const { dataPath } = getConfig();
    const projectsRoot = path.join(dataPath, 'Projects');

    if (!fs.existsSync(projectsRoot)) fs.mkdirSync(projectsRoot, { recursive: true });

    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    // 1. Try to find by .flow-id
    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFilePath = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFilePath)) {
        const id = fs.readFileSync(idFilePath, 'utf-8').trim();
        if (id === projectId) {
          return res.json({ path: folderPath, folderName: dirent.name, dataPath });
        }
      }
    }

    // 2. Try to find by exact name (Legacy fallback)
    if (projectName) {
      const safeName = sanitizeProjectName(projectName);
      const legacyPath = path.join(projectsRoot, safeName);
      if (fs.existsSync(legacyPath)) {
        // Claim it by writing .flow-id
        fs.writeFileSync(path.join(legacyPath, '.flow-id'), projectId, 'utf-8');
        return res.json({ path: legacyPath, folderName: safeName, dataPath });
      }
    }

    res.json({ path: null, dataPath });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/projects/open-explorer
app.post('/api/projects/open-explorer', (req, res) => {
  try {
    const { projectId, projectName } = req.body as { projectId?: string; projectName?: string };
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const { dataPath } = getConfig();
    const projectsRoot = path.join(dataPath, 'Projects');
    if (!fs.existsSync(projectsRoot)) fs.mkdirSync(projectsRoot, { recursive: true });

    let targetPath: string | null = null;
    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true }).filter(d => d.isDirectory());

    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFilePath = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFilePath)) {
        const id = fs.readFileSync(idFilePath, 'utf-8').trim();
        if (id === projectId) {
          targetPath = folderPath;
          break;
        }
      }
    }

    if (!targetPath && projectName) {
      const safeName = sanitizeProjectName(projectName);
      targetPath = path.join(projectsRoot, safeName);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
        fs.writeFileSync(path.join(targetPath, '.flow-id'), projectId, 'utf-8');
      }
    }

    if (targetPath && fs.existsSync(targetPath)) {
      const winPath = targetPath.replace(/\//g, '\\');

      // Respond immediately — explorer.exe always exits with code 1 even on success,
      // so we must NOT wait for the exec callback before sending the response.
      res.json({ success: true, path: targetPath });

      if (process.platform === 'win32') {
        // exec with shell:true properly launches File Explorer in a foreground window
        exec(`start "" "${winPath}"`, { shell: 'cmd.exe' }, (err) => {
          if (err) console.error('[open-explorer] exec error (ignored):', err.message);
        });
      } else if (process.platform === 'darwin') {
        exec(`open "${targetPath}"`);
      } else {
        exec(`xdg-open "${targetPath}"`);
      }
    } else {
      res.status(404).json({ error: 'Project folder not found' });
    }
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/projects/create-folder
app.post('/api/projects/create-folder', (req, res) => {
  try {
    const { projectId, projectName } = req.body as { projectId?: string; projectName?: string };
    if (!projectId || !projectName) return res.status(400).json({ error: 'projectId and projectName are required' });

    const { dataPath } = getConfig();
    const projectsRoot = path.join(dataPath, 'Projects');
    if (!fs.existsSync(projectsRoot)) fs.mkdirSync(projectsRoot, { recursive: true });

    const safeName = sanitizeProjectName(projectName);
    let folderName = safeName;
    let newFolder = path.join(projectsRoot, folderName);
    let counter = 2;

    while (fs.existsSync(newFolder)) {
      folderName = `${safeName} ${counter}`;
      newFolder = path.join(projectsRoot, folderName);
      counter++;
    }

    fs.mkdirSync(newFolder, { recursive: true });
    fs.writeFileSync(path.join(newFolder, '.flow-id'), projectId, 'utf-8');

    res.json({ path: newFolder, folderName, dataPath });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/projects/rename-folder
app.post('/api/projects/rename-folder', (req, res) => {
  try {
    const { projectId, newProjectName } = req.body as { projectId?: string; newProjectName?: string };
    if (!projectId || !newProjectName) return res.status(400).json({ error: 'projectId and newProjectName are required' });

    const { dataPath } = getConfig();
    const projectsRoot = path.join(dataPath, 'Projects');
    
    if (!fs.existsSync(projectsRoot)) fs.mkdirSync(projectsRoot, { recursive: true });

    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    let targetFolder = null;
    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFilePath = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFilePath)) {
        const id = fs.readFileSync(idFilePath, 'utf-8').trim();
        if (id === projectId) {
          targetFolder = dirent.name;
          break;
        }
      }
    }

    if (targetFolder) {
      const safeName = sanitizeProjectName(newProjectName);
      
      if (targetFolder !== safeName) {
        let folderName = safeName;
        let newPath = path.join(projectsRoot, folderName);
        let counter = 2;

        while (fs.existsSync(newPath)) {
          folderName = `${safeName} ${counter}`;
          newPath = path.join(projectsRoot, folderName);
          counter++;
        }

        const oldPath = path.join(projectsRoot, targetFolder);
        fs.renameSync(oldPath, newPath);
      }
    }

    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 6. POST /api/browse
app.post('/api/browse', (req, res) => {
  try {
    const targetPath = req.body?.path && fs.existsSync(req.body.path)
      ? path.resolve(req.body.path)
      : os.homedir();

    const parent = path.dirname(targetPath) === targetPath ? null : path.dirname(targetPath);
    let directories: Array<{ name: string; path: string }> = [];

    try {
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });
      directories = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => ({ name: e.name, path: path.join(targetPath, e.name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.warn(`[FlowStudio Server] Cannot read directory ${targetPath}:`, err);
    }

    res.json({
      current: targetPath,
      parent,
      directories
    });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 7. POST /api/reveal
app.post('/api/reveal', (req, res) => {
  try {
    const targetPath = req.body?.path ? path.resolve(req.body.path) : getConfig().dataPath;
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    spawn('explorer', [targetPath], { detached: true, stdio: 'ignore' }).unref();

    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 7.5. POST /api/select-folder (Native OS folder selection dialog)
app.post('/api/select-folder', (req, res) => {
  try {
    const initialPath = req.body?.currentPath && fs.existsSync(req.body.currentPath)
      ? path.resolve(req.body.currentPath)
      : getConfig().dataPath;

    if (process.platform === 'win32') {
      const sanitizedPath = initialPath.replace(/'/g, "''");
      const psCommand = `
        Add-Type -AssemblyName System.Windows.Forms;
        $f = New-Object System.Windows.Forms.FolderBrowserDialog;
        $f.Description = 'Select Data Storage Directory';
        $f.ShowNewFolderButton = $true;
        if (Test-Path '${sanitizedPath}') { $f.SelectedPath = '${sanitizedPath}' }
        [void]$f.ShowDialog();
        if ($f.SelectedPath) { Write-Output $f.SelectedPath }
      `.replace(/\n/g, ' ');

      exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { maxBuffer: 1024 * 1024 }, (err, stdout) => {
        if (err) {
          console.error('[select-folder] PowerShell error:', err);
          return res.status(500).json({ error: 'Failed to open native folder dialog' });
        }
        const selectedPath = stdout.trim();
        if (selectedPath) {
          res.json({ path: selectedPath });
        } else {
          res.json({ canceled: true });
        }
      });
    } else if (process.platform === 'darwin') {
      const osaScript = `osascript -e 'POSIX path of (choose folder with prompt "Select Data Storage Directory")'`;
      exec(osaScript, (err, stdout) => {
        if (err) return res.json({ canceled: true });
        const selectedPath = stdout.trim();
        if (selectedPath) res.json({ path: selectedPath });
        else res.json({ canceled: true });
      });
    } else {
      exec(`zenity --file-selection --directory --title="Select Data Storage Directory"`, (err, stdout) => {
        if (err) return res.json({ canceled: true });
        const selectedPath = stdout.trim();
        if (selectedPath) res.json({ path: selectedPath });
        else res.json({ canceled: true });
      });
    }
  } catch (e: any) {
    sendError(res, e);
  }
});


// 8. GET /api/storage-info
app.get('/api/storage-info', (req, res) => {
  try {
    const { dataPath } = getConfig();
    const files: Array<{ name: string; bytes: number }> = [];
    let totalBytes = 0;

    if (fs.existsSync(dataPath)) {
      const entries = fs.readdirSync(dataPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const filePath = path.join(dataPath, entry.name);
          const stat = fs.statSync(filePath);
          files.push({ name: entry.name, bytes: stat.size });
          totalBytes += stat.size;
        }
      }
    }

    res.json({ totalBytes, files });
  } catch (e: any) {
    sendError(res, e);
  }
});

// ==========================================
// AI DESIGN CO-PILOT ENDPOINTS (/api/ai/*)
// ==========================================

/**
 * Which provider a key string belongs to.
 *
 * Google issues two key families now: legacy standard keys ("AIza...") and the
 * newer auth keys AI Studio returns ("AQ.Ab..."). Matching only "AIzaSy" sent
 * every AQ. key down the Groq branch, where it was refused and the user was told
 * their Google key was an invalid Groq key.
 */
function detectProvider(apiKey: string): 'groq' | 'gemini' {
  const k = (apiKey || '').trim();
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('AIza') || k.startsWith('AQ.')) return 'gemini';
  return 'groq';
}

/**
 * Provider for a key-pool entry, preferring a stored value only when it is
 * actually usable.
 *
 * `k.provider || detectProvider(k.key)` was wrong because 'unknown' is truthy:
 * it survived the check and then matched no provider at all, so a valid key was
 * excluded from every pool.
 */
function keyProvider(entry: { key?: string; provider?: string }): 'groq' | 'gemini' {
  const stored = entry?.provider;
  if (stored === 'groq' || stored === 'gemini') return stored;
  return detectProvider(entry?.key || '');
}

const groqModelsCache = new Map<string, { models: string[]; timestamp: number }>();

async function getAvailableGroqModels(apiKey: string): Promise<string[]> {
  const trimmed = apiKey.trim();
  const cached = groqModelsCache.get(trimmed);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.models;
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${trimmed}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        const chatModels = data.data
          .filter((m: any) =>
            m.active !== false &&
            !m.id.includes('whisper') &&
            !m.id.includes('guard') &&
            !m.id.includes('safeguard') &&
            !m.id.includes('orpheus') &&
            !m.id.includes('allam')
          )
          .map((m: any) => m.id);
        if (chatModels.length > 0) {
          groqModelsCache.set(trimmed, { models: chatModels, timestamp: Date.now() });
          return chatModels;
        }
      }
    }
  } catch (e) {
    console.warn('[AI Groq] Could not query models list:', e);
  }
  return [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.1-8b-instant'
  ];
}

const geminiModelsCache = new Map<string, { models: string[]; timestamp: number }>();

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const trimmed = apiKey.trim();
  const cached = geminiModelsCache.get(trimmed);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 15) {
    return cached.models;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const models = data.models
          .map((m: any) => m.name ? m.name.replace(/^models\//, '') : '')
          .filter((id: string) =>
            id &&
            (id.includes('flash') || id.includes('pro')) &&
            !id.includes('embedding') &&
            !id.includes('aqa') &&
            !id.includes('2.0') &&
            !id.includes('1.5') &&
            !id.includes('2.5') &&
            !id.includes('tts') &&
            !id.includes('image') &&
            !id.includes('audio') &&
            !id.includes('live')
          );
        if (models.length > 0) {
          geminiModelsCache.set(trimmed, { models, timestamp: Date.now() });
          return models;
        }
      }
    }
  } catch (e) {
    console.warn('[AI Gemini] Could not query models list:', e);
  }

  return ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.6-flash'];
}

async function resolveModelAsync(apiKey: string, requestedModel?: string, provider: 'groq' | 'gemini' = 'groq'): Promise<string> {
  if (provider === 'gemini') {
    const available = await getAvailableGeminiModels(apiKey);

    // If user requested a specific valid model (e.g. gemini-3.5-flash, gemini-3.7-flash)
    if (requestedModel) {
      const cleanReq = requestedModel.replace(/^models\//, '');
      const deprecated = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash',
        'claude-opus-4.6-thinking',
        'canopylabs/orpheus-v1-english',
        'canopylabs/orpheus-arabic-saudi',
        'allam-2-7b',
        'llama-3.3-70b-versatile'
      ];
      if (!deprecated.includes(cleanReq)) {
        if (available.includes(cleanReq) || cleanReq.startsWith('gemini-')) {
          return cleanReq;
        }
      }
    }

    // Default priority for Gemini:
    const geminiPreferred = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.6-flash'];
    for (const p of geminiPreferred) {
      if (available.includes(p)) return p;
    }

    return available[0] || 'gemini-3.5-flash';
  }

  // Provider is Groq: query available models
  const available = await getAvailableGroqModels(apiKey);

  if (requestedModel && available.includes(requestedModel)) {
    return requestedModel;
  }

  // Preferred priority list of best models for tools & reasoning:
  const preferred = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.1-8b-instant'
  ];

  for (const p of preferred) {
    if (available.includes(p)) {
      return p;
    }
  }

  return available[0] || 'qwen/qwen3.8-27b';
}

function resolveModel(requestedModel?: string, provider: 'groq' | 'gemini' = 'groq'): string {
  if (provider === 'gemini') {
    if (requestedModel && !requestedModel.includes('2.0') && !requestedModel.includes('1.5') && !requestedModel.includes('claude') && requestedModel.startsWith('gemini-')) {
      return requestedModel.replace(/^models\//, '');
    }
    return 'gemini-3.5-flash';
  }
  return requestedModel && (requestedModel.includes('qwen') || requestedModel.includes('gpt-oss')) ? requestedModel : 'qwen/qwen3.8-27b';
}

/**
 * Hard ceiling on a single Groq call.
 *
 * Without this, a stalled connection leaves the client's `await` pending
 * forever: the spinner never resolves, no error is ever shown, and because the
 * UI treats "thinking" as a lock, every later message queues behind a request
 * that will never finish. Failing loudly beats hanging invisibly — 90s is far
 * longer than a healthy call, so hitting it always means something is wrong.
 */
const GROQ_REQUEST_TIMEOUT_MS = Number(process.env.FLOWSTUDIO_GROQ_TIMEOUT_MS) || 90_000;

async function callGroqChat(apiKey: string, payload: any): Promise<any> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload),
    // Actually cancels the socket, so a stalled request cannot hold the event
    // loop's work open indefinitely.
    signal: AbortSignal.timeout(GROQ_REQUEST_TIMEOUT_MS)
  }).catch((err: any) => {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(
        `[Groq timeout] No response within ${Math.round(GROQ_REQUEST_TIMEOUT_MS / 1000)}s. ` +
        `The request was abandoned instead of left hanging. Try again, or switch to a Gemini model.`
      );
    }
    throw err;
  });

  // Record the provider's own budget numbers before anything else, so even a
  // failed request tells the ledger how much headroom this key actually has.
  // These headers are set on every response; only `retry-after` is 429-only.
  groqRateLedger.record(apiKey, res);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = errorBody?.error?.message || res.statusText || 'Groq API request failed';

    // Auto-heal 404 model not found: pick an available alternative and retry immediately!
    if (res.status === 404 && (msg.includes('model') || msg.includes('does not exist') || msg.includes('access'))) {
      const available = await getAvailableGroqModels(apiKey);
      const fallback = available.find(m => m !== payload.model) || 'llama-3.1-8b-instant';
      console.warn(`[AI Groq] Model '${payload.model}' not accessible on this key. Auto-falling back to available model '${fallback}'...`);
      const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({ ...payload, model: fallback })
      });
      if (retryRes.ok) {
        const json = await retryRes.json();
        return {
          ...json,
          _switchedModel: fallback,
          _switchReason: 'model_not_found',
          _switchNotice: `Switched to ${fallback} (previous model was unavailable).`
        };
      }
    }

    // Auto-heal 400 tool calling not supported or unsupported model
    if (res.status === 400 && (msg.includes('tool calling') || msg.includes('not supported') || msg.includes('unsupported'))) {
      const available = await getAvailableGroqModels(apiKey);
      const fallback = available.find(m => m !== payload.model && (m.includes('qwen') || m.includes('120b') || m.includes('8b'))) || 'qwen/qwen3.8-27b';
      console.warn(`[AI Groq] Model '${payload.model}' does not support tools (${msg}). Auto-switching to '${fallback}'...`);
      const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({ ...payload, model: fallback })
      });
      if (retryRes.ok) {
        const json = await retryRes.json();
        return {
          ...json,
          _switchedModel: fallback,
          _switchReason: 'tool_unsupported',
          _switchNotice: `Switched to ${fallback} (previous model did not support tool calling).`
        };
      }
    }

    // Auto-heal 413 TPM limit exceeded on Groq.
    //
    // The previous version trimmed message *text*, which was never the problem:
    // the tool schemas are ~13,700 of the ~16,400 tokens in a request that
    // fails this way, so the retry still exceeded the limit. It also fell
    // through and rethrew the *first* attempt's error, which is why the
    // surfaced message named a model and a token count the retry never used.
    if (res.status === 413 || msg.includes('tokens per minute') || msg.includes('TPM') || msg.includes('Request too large')) {
      const observedLimit = Number((msg.match(/Limit\s+(\d+)/i) || [])[1]) || 0;
      const messageTokens = estimateTokens(payload.messages);

      // Learn the actual ceiling instead of guessing the tier, and keep the
      // reduced budget for the rest of the session.
      groqToolTokenBudget = observedLimit > 0
        ? Math.max(600, observedLimit - messageTokens - 1200)
        : Math.max(600, Math.floor(groqToolTokenBudget / 2));

      const retryTools = selectGroqTools(
        lastUserMessageText(payload.messages),
        groqToolTokenBudget
      );
      console.warn(
        `[AI Groq] 413 on '${payload.model}' (limit ${observedLimit || 'unknown'}, ` +
        `${messageTokens} message tokens). Retrying with ${retryTools.length}/${groqTools.length} ` +
        `tools and a ${groqToolTokenBudget}-token tool budget.`
      );

      const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({ ...payload, tools: retryTools, model: 'qwen/qwen3.8-27b' }),
        signal: AbortSignal.timeout(GROQ_REQUEST_TIMEOUT_MS)
      });
      // Learn from the retry as well, so a 413 still updates the ledger.
      groqRateLedger.record(apiKey, retryRes);
      if (retryRes.ok) {
        const json = await retryRes.json();
        return {
          ...json,
          _switchedModel: 'qwen/qwen3.8-27b',
          _switchReason: 'tpm_limit',
          _switchNotice: `Trimmed the tool set to fit this key's token limit (${retryTools.length} tools).`
        };
      }

      // Report the retry's own failure. Falling through here would surface the
      // original 413 as though nothing had been attempted.
      const retryBody = await retryRes.json().catch(() => ({}));
      const retryMsg = retryBody?.error?.message || retryRes.statusText || 'retry failed';
      throw new Error(
        `[Groq ${retryRes.status}] ${retryMsg} — after retrying with ` +
        `${retryTools.length} of ${groqTools.length} tools.`
      );
    }

    // Auto-heal temporary peak traffic & high demand (e.g. 70B spike in traffic) -> auto-fallback to high-capacity 8B
    const isHighDemand =
      res.status === 503 ||
      res.status === 429 ||
      msg.includes('high demand') ||
      msg.includes('Spikes in demand') ||
      msg.includes('Temporary peak traffic') ||
      msg.includes('model_overloaded') ||
      msg.includes('rate_limit_exceeded') ||
      msg.includes('overloaded');

    if (isHighDemand) {
      const available = await getAvailableGroqModels(apiKey);
      const fallback = payload.model === 'llama-3.1-8b-instant'
        ? (available.find(m => m !== payload.model && !m.includes('70b')) || available.find(m => m !== payload.model) || 'llama-3.3-70b-versatile')
        : 'llama-3.1-8b-instant';

      console.warn(`[AI Groq] Model '${payload.model}' experiencing high demand/peak traffic (${msg}). Auto-switching to '${fallback}'...`);
      const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({ ...payload, model: fallback })
      });
      if (retryRes.ok) {
        const json = await retryRes.json();
        return {
          ...json,
          _switchedModel: fallback,
          _switchReason: 'high_demand',
          _switchNotice: `Switched to ${fallback === 'llama-3.1-8b-instant' ? 'Llama 3.1 8B Instant' : fallback} due to temporary peak traffic.`
        };
      }
    }

    throw new Error(`[Groq ${res.status}] ${msg}`);
  }

  return await res.json();
}

function parseGenAIError(error: any, provider?: 'groq' | 'gemini'): string {
  if (!error) return 'An unknown error occurred';
  const rawMsg = error.message || String(error);

  if (
    rawMsg.includes('high demand') ||
    rawMsg.includes('Spikes in demand') ||
    rawMsg.includes('Temporary peak traffic') ||
    rawMsg.includes('model_overloaded')
  ) {
    return 'This model is currently experiencing high demand. The system attempted to failover. Please retry in a few seconds or select Llama 3.1 8B Instant.';
  }

  // Name whichever provider actually refused the key. This previously said
  // "Groq" regardless, so a user whose Google key was rejected was sent to
  // console.groq.com for advice about a key Google had turned down.
  const authFailed =
    rawMsg.includes('invalid_api_key') ||
    rawMsg.includes('Invalid API Key') ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.includes('API key not valid') ||
    /(^|\D)401(\D|$)/.test(rawMsg);
  if (authFailed) {
    if (provider === 'gemini') {
      return 'The Gemini key was rejected by Google. Check it at aistudio.google.com/apikey \u2014 Google keys start with "AIza" or "AQ."';
    }
    if (provider === 'groq') {
      return 'Invalid Groq API key. Please check your key at console.groq.com/keys (starts with "gsk_").';
    }
    return 'The API key was rejected. Check the key you entered in Settings.';
  }
  if (rawMsg.includes('rate_limit_exceeded') || /(^|\D)429(\D|$)/.test(rawMsg)) {
    if (provider === 'gemini') {
      return 'Gemini rate limit reached. Please wait a few moments and try again.';
    }
    return 'Groq rate limit reached (30 requests/min). Please wait a few moments and try again.';
  }

  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed.error && parsed.error.message) {
      const em = parsed.error.message;
      if (parsed.error.reason === 'API_KEY_INVALID' || em.includes('API key not valid')) {
        return 'The API key is invalid. Please make sure you copied your key correctly (Google "AIzaSy..." or Groq "gsk_...").';
      }
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED' || em.includes('Resource has been exhausted') || em.includes('quota') || em.includes('overloaded')) {
        return 'Google Gemini free-tier rate limits reached (15 req/min). Switch to Groq in Settings for 14,400 free requests/day!';
      }
      return em;
    }
  } catch {
    // rawMsg is not JSON
  }

  if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid')) {
    return 'The API key is invalid. Please make sure you copied your key correctly (Google "AIzaSy..." or Groq "gsk_...").';
  }
  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('overloaded') || rawMsg.includes('503')) {
    return 'Google Gemini free-tier rate limits reached (15 req/min). Switch to Groq in Settings for 14,400 free requests/day!';
  }
  return rawMsg;
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const msg = error?.message || String(error);
      const isHighDemandOrQuota = 
        msg.includes('429') || 
        msg.includes('RESOURCE_EXHAUSTED') || 
        msg.includes('overloaded') || 
        msg.includes('503') ||
        msg.includes('quota') ||
        msg.includes('rate_limit_exceeded') ||
        msg.includes('high demand');

      if (attempt <= maxRetries && isHighDemandOrQuota) {
        console.warn(`[AI Retry] API rate limit/high demand detected. Auto-retrying in ${initialDelay * attempt}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, initialDelay * attempt));
        continue;
      }
      throw error;
    }
  }
}

// Groq & Gemini Tool Definitions are imported from serverAiTools.js

/**
 * Token budget for Groq tool definitions, per request.
 *
 * Groq's on-demand tier caps small models at 8,000 tokens/minute, and the full
 * 128-tool schema serialises to ~13,700 — so the whole surface cannot be sent
 * there at all. This is the slice of that limit reserved for tools: the system
 * prompt (~2,700) and the output have to fit alongside it.
 *
 * Starts at a value that fits the smallest published limit, because exceeding
 * the limit fails the request outright while sending fewer tools only narrows
 * what one turn can do. `callGroqChat` lowers it further if a 413 reports an
 * even smaller ceiling, and reuses that learned value for the session.
 *
 * Override with FLOWSTUDIO_GROQ_TOOL_BUDGET on a higher Groq tier.
 */
let groqToolTokenBudget = Number(process.env.FLOWSTUDIO_GROQ_TOOL_BUDGET) || 3600;

/** The most recent user turn, used to pick a relevant tool subset. */
const lastUserMessageText = (messages: any[]): string => {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && (m.role === 'user' || !m.role)) {
      return typeof m.content === 'string' ? m.content : '';
    }
  }
  return '';
};

// Provider routing and Groq rate limiting live in serverAiRateLimit.ts, so the
// duration parser and the budgeting maths can be exercised without starting a
// server or pulling in the tool schemas. This ledger is process-wide.
const groqRateLedger = createGroqRateLedger();

// Constants (GROQ_DEFAULT_TPM, GROQ_OUTPUT_RESERVE, MIN_TOOL_BUDGET) come from
// serverAiRateLimit.ts.

// 0. POST /api/ai/chat - Conversational Personal Agent with Tools (Groq & Gemini)
app.post('/api/ai/chat', async (req, res) => {
  // Declared outside the try so the catch can name the provider that actually
  // failed; it is assigned inside once the requested model is known.
  let requestedProvider: 'groq' | 'gemini' = 'groq';

  try {
    // Build candidate key pool from enabledKeys or apiKey + fallbackKeys
    const rawKeyPool: Array<{ id?: string; name?: string; key: string; provider?: string }> = [];

    if (Array.isArray(req.body.enabledKeys) && req.body.enabledKeys.length > 0) {
      for (const item of req.body.enabledKeys) {
        if (typeof item === 'string' && item.trim()) {
          rawKeyPool.push({ key: item.trim() });
        } else if (item && typeof item === 'object' && typeof item.key === 'string' && item.key.trim()) {
          if (item.isEnabled !== false) {
            rawKeyPool.push({
              id: item.id,
              name: item.name,
              key: item.key.trim(),
              provider: item.provider
            });
          }
        }
      }
    }

    // If active apiKey was provided, ensure it is the first candidate in the pool
    const activeKeyStr = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';
    if (activeKeyStr) {
      const existingIdx = rawKeyPool.findIndex((k) => k.key === activeKeyStr);
      if (existingIdx > 0) {
        const [matched] = rawKeyPool.splice(existingIdx, 1);
        rawKeyPool.unshift(matched);
      } else if (existingIdx === -1) {
        rawKeyPool.unshift({ key: activeKeyStr });
      }
    }

    // Add any legacy fallbackKeys if not already present
    if (Array.isArray(req.body.fallbackKeys)) {
      for (const fb of req.body.fallbackKeys) {
        const fbKey = typeof fb === 'string' ? fb.trim() : (fb && typeof fb === 'object' && typeof fb.key === 'string' ? fb.key.trim() : '');
        if (fbKey && !rawKeyPool.some((k) => k.key === fbKey)) {
          rawKeyPool.push(typeof fb === 'object' ? { ...fb, key: fbKey } : { key: fbKey });
        }
      }
    }

    // Deduplicate by secret key string
    const allKeys: Array<{ id?: string; name?: string; key: string; provider?: string }> = [];
    const seenSecrets = new Set<string>();
    for (const kObj of rawKeyPool) {
      if (kObj.key && !seenSecrets.has(kObj.key)) {
        seenSecrets.add(kObj.key);
        allKeys.push(kObj);
      }
    }

    if (allKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }

    const { messages, projectContext, model, customRules, timeZone } = req.body;

    // Route by the model the user actually selected.
    //
    // Every enabled key is a candidate, but the chosen model decides which
    // provider serves the turn. The loop used to try all keys against whichever
    // model and let `resolveModelAsync` coerce it — so picking a Gemini model
    // while a Groq key happened to sit first would quietly answer with a Groq
    // model, and vice versa.
    const requestedModel = typeof model === 'string' ? model : '';
    // With no model named, keep the previous behaviour and let the first key
    // decide, rather than defaulting every such request to Groq.
    requestedProvider = requestedModel
      ? providerForModel(requestedModel)
      : keyProvider(allKeys[0]);
    const providerKeys = allKeys.filter((k) => keyProvider(k) === requestedProvider);

    if (providerKeys.length === 0) {
      const label = requestedProvider === 'gemini' ? 'Gemini' : 'Groq';
      return res.status(400).json({
        success: false,
        error:
          `No enabled ${label} API key for "${model || 'the selected model'}". ` +
          `Add one in Settings, or choose a model from your other provider.`
      });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages are required' });
    }

    // Calculate real-world calendar and time context in user's device timezone
    const userTimeZone = typeof timeZone === 'string' && timeZone.trim() ? timeZone.trim() : 'UTC';
    const now = new Date();

    let curDateStr = '';
    let weekdayStr = '';
    let curTimeStr = '';
    let curYear = now.getFullYear();

    try {
      // 1. Get YYYY-MM-DD in user's device timezone
      const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      curDateStr = dateParts;
      curYear = parseInt(dateParts.split('-')[0], 10);

      // 2. Get Weekday in user's device timezone
      weekdayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        weekday: 'long'
      }).format(now);

      // 3. Get Current Time in user's device timezone
      curTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(now);
    } catch {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      curDateStr = `${year}-${month}-${day}`;
      weekdayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
      curTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const rulesSection = Array.isArray(customRules) && customRules.length > 0
      ? `\nUSER-TRAINED CUSTOM KNOWLEDGE & TRUTHS (Strictly obey without deviation):\n` +
        customRules.map((r: any) => `- When user asks about "${r.trigger}": ${r.response}`).join('\n')
      : '';

    const isUniversal = !projectContext?.id || projectContext?.id === 'universal' || projectContext?.id === 'none' || projectContext?.isUniversal;

    const projectStats = projectContext?.projectStats;
    const projectRoster = Array.isArray(projectContext?.projectRoster) ? projectContext.projectRoster : [];
    const taskStats = projectContext?.taskStats;

    const studioMetricsSection = projectStats
      ? `\nLIVE FLOW STUDIO METRICS & TRUTHS (Ground truth for counts and statuses):
- Total Studio Projects: ${projectStats.total}
  * Active / Planning: ${projectStats.active}
  * In Progress: ${projectStats.inProgress}
  * Completed: ${projectStats.completed}
- All Studio Projects:
${projectRoster.map((p: any) => `  • "${p.name}" — Status: ${p.status}, Progress: ${p.progress}%, Client: ${p.client}`).join('\n')}
- Current Tasks Metrics (${isUniversal ? 'Studio-wide' : `Project "${projectContext?.title}"`}): Total: ${taskStats?.total || 0}, Todo: ${taskStats?.todo || 0}, In Progress: ${taskStats?.inProgress || 0}, In Review: ${taskStats?.review || 0}, Done: ${taskStats?.done || 0}

CRITICAL INSTRUCTION FOR QUERIES LIKE "how many in total, all active, in progress and completed" OR "how many projects":
Always answer directly using the exact numbers above. Present a clean bulleted breakdown of Total, Active, In Progress, and Completed projects. Never say you only track 1 project or tell the user to navigate to the Projects view to see the list.`
      : '';

    const workspaceSection = isUniversal
      ? `ACTIVE WORKSPACE SCOPE: UNIVERSAL / ENTIRE APP MODE
- The user has selected "None" (Universal mode).
- You are thinking across the ENTIRE Flow Studio application, rather than being scoped to one single project.
- You have universal oversight of all studio tasks, team members, all clients, all projects, and calendar events.
- When creating tasks, team members, or scheduling meetings, understand they apply studio-wide.`
      : `ACTIVE WORKSPACE CONTEXT:
- Project ID: "${projectContext?.id || 'default'}"
- Project Title: "${projectContext?.title || 'Active Project'}"
- Client: "${projectContext?.clientName || 'General Studio'}"
- Total Attached Project Notes: ${projectContext?.notesCount || 0}`;

    const ws = projectContext?.workspace;
    const workspaceBrandingSection = ws
      ? `\nACTIVE STUDIO & COMPANY PROFILE:
- Studio / Company Name: "${ws.name || 'Flow Studio'}"
- Tagline / Specialization: "${ws.tagline || 'Design & Digital Product Studio'}"
- Legal Entity: "${ws.legalName || ws.name || 'Flow Studio'}"
- Default Invoicing Currency: ${ws.currency || 'USD ($)'}
- Tax ID / VAT: ${ws.taxId || 'N/A'}
- Studio Operating Hours: ${ws.workingHours || 'Mon - Fri, 9:00 AM - 6:00 PM'}`
      : '';

    const mb = projectContext?.moodboardContext;
    const moodboardSection = mb
      ? `\nLIVE MOODBOARD CANVAS & ACTIVE VIEWPORT CONTEXT:
- Canvas Active Viewport Center: x=${mb.activeView?.center?.x}, y=${mb.activeView?.center?.y}
- Canvas Visible Viewport Bounds: X from ${mb.activeView?.visibleBounds?.minX} to ${mb.activeView?.visibleBounds?.maxX}, Y from ${mb.activeView?.visibleBounds?.minY} to ${mb.activeView?.visibleBounds?.maxY} (Current Zoom: ${mb.activeView?.zoom}x)
- Existing Items on Canvas: ${mb.itemsCount} item(s)
${mb.itemsSummary && mb.itemsSummary.length > 0 ? `Existing items on canvas:\n${mb.itemsSummary.map((item: any) => `  • [${item.type}] "${item.title}" at (x: ${item.x}, y: ${item.y}, w: ${item.width}, h: ${item.height})`).join('\n')}` : '  • Canvas is currently empty.'}

CRITICAL RULES FOR "add_moodboard_items":
- When adding cards (notes, colors, images, bookmarks) to the Moodboard, ALWAYS place them INSIDE the user's active visible viewport bounds around the center (x: ${mb.activeView?.center?.x}, y: ${mb.activeView?.center?.y}).
- Pass explicit "x" and "y" coordinates for each item inside the visible bounds so they appear directly in the user's current view without overlapping existing items.
- For design notes, ideas, or key takeaways, use type "note" with pleasant soft pastel colors like "#fffbeb", "#fef3c7", "#dcfce7", "#fee2e2", or "#f1f5f9".`
      : '';

    const systemInstruction = `You are Nova, the elite autonomous AI Personal Design & Project Agent inside Flow Studio, collaborating with ${ws?.name || 'the studio'}.
You have the warmth, intelligence, and speed of ChatGPT and Gemini. You specialize in branding, graphic design, design systems, and creative studio management.

CRITICAL REAL-WORLD TEMPORAL CONTEXT (STRICTLY OBEY):
- Current Real-World Date: ${curDateStr} (${weekdayStr})
- Current Time: ${curTimeStr}
- User Timezone: ${userTimeZone}
- Current Year: ${curYear}

${workspaceBrandingSection}
${workspaceSection}
${studioMetricsSection}
${moodboardSection}
${rulesSection}

CRITICAL ANTI-HALLUCINATION & STRICT TOOL ROUTING (ABSOLUTE RULES):
1. TEAM MEMBERS: When asked to add, hire, or create a TEAM MEMBER (staff, employee, colleague) — whether with custom details or dummy data — you MUST call "create_team_member". Use "update_team_member" or "delete_team_member" accordingly.
   * NEVER substitute a project note, task, or document when asked for a team member!
2. CLIENTS CRM & CLIENT DETAILS:
   * When asked to add or register a CLIENT: call "create_client". Use "update_client" or "delete_client" for client edits.
   * When asked to book/schedule an appointment or meeting with a CLIENT: call "book_client_appointment".
   * When asked to tag, categorize, or add/remove brand tags on a client: call "manage_client_tags".
   * When asked to log or add a note/minutes/feedback for a specific client: call "create_client_note".
   * When asked to log/create an invoice for a specific client: call "log_client_invoice".
   * When asked to create/schedule a task for a client: call "create_client_task".
   * When asked to attach/add a regulatory document or template (NDA, MSA, Onboarding Workbook, SOW) to a client: call "attach_client_document".
   * When asked to rate a client (communication, velocity): call "rate_client".
   * When asked to assign/remove an expert or team member for a client: call "assign_client_expert".
   * When asked to view, check, or open a client's profile or sub-tab (overview, tasks, files, notes, financials, projects): call "open_client_details".
3. SALES LEADS CRM & SCRAPING:
   * When asked to find, scrape, or search sales leads: call "scrape_leads".
   * When asked to add or log a SALES LEAD: call "create_lead". Use "update_lead", "delete_lead", or "promote_lead_to_client".
4. BILLING & INVOICES: When asked to create or bill an INVOICE: call "create_invoice". Use "update_invoice_status" or "delete_invoice".
5. PROJECT DETAILS — 5 KEY PAGES & CAPABILITIES:
   A. OVERVIEW PAGE:
      * When asked to add or remove project tags or taxonomy labels: call "manage_project_tags" (action: "add" | "remove", tag: string).
      * When asked to link or attach a Figma Master canvas or Client Brief document (Google Docs, Notion): call "link_project_resource" (type: "figma" | "brief", url: string).
      * When asked to set, update, or change the project hero cover banner: call "update_project_banner" (url: string).
      * When asked to edit project title, client, status, deadline, category, or description: call "update_project".
      * When asked to create a new project: call "create_new_project". Use "delete_project" to delete/archive.
   B. TASKS PAGE:
      * When asked to create deliverables or tasks: call "create_tasks" with phases ('todo', 'inprogress', 'review', 'done'), priorities ('urgent', 'high', 'medium', 'low'), and due dates.
      * When asked to update a task (status, phase, priority, due date): call "update_task".
      * When asked to delete or clear tasks: call "delete_tasks".
      * When asked to add comments or progress updates to a task: call "add_task_comment".
   C. FILES PAGE:
      * When asked to create the dedicated filesystem workspace folder for a project: call "create_project_folder".
      * When asked to open, browse, or explore project files: call "navigate_to" with view: "project-files".
   D. NOTES PAGE:
      * When asked to record or write design briefs, meeting transcripts, or creative requirements: call "create_project_note".
      * When asked to update note content: call "update_project_note".
      * When asked to delete or clear notes: call "delete_project_notes".
   E. MOODBOARD PAGE:
      * When asked to curate visual inspiration, color palettes, sticky directives, or bookmarks: call "add_moodboard_items".
      * When asked to delete or remove a specific moodboard card, swatch, or note: call "delete_moodboard_item" (itemTitle: string).
      * When asked to clear or reset the entire moodboard canvas: call "clear_moodboard".
6. NAVIGATION & SUB-PAGES:
   * When asked to go to, open, view, or switch to ANY page or project sub-tab: call "navigate_to".
   * Supported views (exactly these, no others): "dashboard", "projects", "new-project", "project-overview", "project-tasks", "project-files", "project-notes", "project-moodboard", "leads", "lead-generator", "email-drafts", "sent-emails", "clients", "team", "member-details", "files", "calendar", "time", "billing", "new-invoice", "reports".
   * Settings, Developer tools, and the recycle bin are NOT navigable destinations. If asked for one, say so plainly and offer the closest supported page instead.
   * Pass "projectTitle" in "navigate_to" if user specifies which project to navigate into.
7. CALENDAR & MEETINGS: When asked to schedule a studio meeting, call, or event: call "schedule_event". Use "update_event" or "delete_event".
8. TIME TRACKING: When asked to start tracking time: call "start_timer". When asked to stop: call "stop_timer". When asked to log past hours: call "add_time_entry".

9. TASK BOARD OPERATIONS (beyond create/update/delete):
   * Call "list_task_board_schema" FIRST whenever you need a field, column, or status id you cannot see. Never guess a column name.
   * "set_task_assignees" REPLACES the assignee list; it does not append. Pass the complete intended list.
   * Bulk change across several tasks: "bulk_update_tasks" (phase, priority, completion status).
   * Start and due dates: "set_task_dates" (YYYY-MM-DD). Task type: "set_task_type".
   * Custom field values: "write_task_field_value". Add a field: "create_task_field". Rename/hide/move/delete a field: "update_task_field".
   * Status label and colour: "update_task_status_config". Sorting: "sort_task_board".

10. MOODBOARD CANVAS OPERATIONS (beyond adding cards):
   * Cards are addressed by title or id. Aligning, distributing, locking, duplicating and stacking act on a SELECTION, so call "select_moodboard_items" first when the user names specific cards.
   * Alignment needs 2+ selected cards and distribution needs 3+; the tool reports the shortfall rather than silently doing nothing.
   * Stacking: "arrange_moodboard_items" (front / forward / backward / back). Viewport: "control_moodboard_view". Grid: "configure_moodboard_grid".
   * Palette extraction: "extract_moodboard_palette". Cropping: "crop_moodboard_item". Section frames: "create_moodboard_section". Canvas history: "undo_moodboard" and "redo_moodboard".

11. EMAIL CAMPAIGNS:
   * Templates: "list_email_templates", "create_email_template", "update_email_template", "delete_email_template".
   * Campaigns: "create_email_batch" (multi-step follow-ups), "manage_email_batch" (pause/resume/delete), "list_email_campaigns".
   * Queue: "manage_queue_item" (cancel / sendNow / edit), "process_email_queue". Replies: "sync_email_replies", "list_email_replies".
   * Scheduling: "update_followup_settings". Mailbox credentials are never yours to read or write.

12. LEADS PIPELINE AND SCRAPING:
   * Bulk work: "bulk_update_leads", "bulk_delete_leads", "bulk_promote_leads". Call "select_leads" first when the user is looking at the table.
   * Table structure: "list_lead_columns", "create_lead_column", "update_lead_column", "delete_lead_column", "reorder_lead_columns". Row order: "reorder_lead".
   * Importing: "import_leads_csv" takes the CSV text including its header row. Timeline entries: "log_lead_activity".
   * Scraper: "list_scraper_config", "update_scraper_config", "set_scraper_filters", "set_scraper_tab", "list_scraped_leads", "select_scraped_leads", "remove_scraped_lead", "clear_scraped_leads", "add_scraped_leads", "clear_scraper_logs".
   * You CANNOT run a scrape, and you CANNOT read or set the scraper API key. Both are deliberate: say so once, and point the user to the scraper page.

13. TEAM AND BILLING:
   * Invitations: "invite_team_member", "resend_team_invite", "revoke_team_invite". Roles: "manage_team_role" (add / remove). Roster: "list_team".
   * Billing: "list_billing_summary", "update_billing_address", "update_saved_card".
   * You CANNOT read or write a card number. Only the holder name, brand, and expiry are settable. If asked for the number, explain once and point to Billing settings.

14. READING COMES BEFORE WRITING:
   * For ANY question about the current state of the studio — "how are we doing", "what is overdue", "where does this project stand", "any unpaid invoices", "how much time did we log" — call a read tool FIRST instead of inferring from earlier conversation.
   * "get_studio_overview" is the single best call for studio-wide questions. Then "get_task_board_digest", "get_project_digest", "get_client_digest", "get_lead_pipeline_digest", "get_time_summary", "get_calendar_agenda", "list_activities", "list_notifications".
   * Never state a number you did not read from a tool. If a read tool returns nothing, say the data is not there.

15. CONFIRMATION POLICY FOR DESTRUCTIVE AND OUTBOUND ACTIONS:
   * Deleting records, deleting a board field, clearing a moodboard, emptying the scraper staging area, sending email, and inviting people are irreversible or leave the app.
   * The app shows the user its own confirmation prompt before these run. That prompt is a safety net, NOT permission to skip explaining yourself.
   * Before calling one, say plainly what you are about to do and to what. Never bury a destructive action inside a sentence that also asks something else.
   * If the user declines, the tool result states it was cancelled. Report it as cancelled — never claim the action happened.
   * Sending email must ALWAYS be preceded by showing the exact recipients, subject, and body.
   * Some deletions cannot be undone at all (clients, invoices, projects). Treat those as final.

16. OUT OF SCOPE — say so plainly and do not attempt a workaround:
   * App settings, Developer tools, appearance, and API-key management.
   * Sign-in, registration, and account flows.
   * The recycle bin / data page, including restoring and permanently deleting items.
   * Reading or writing ANY secret: mailbox passwords, SMTP/IMAP credentials, the scraper API key, or card numbers.
   * When asked for one of these, explain it is not something you can do and name the screen that can.

Always be concise, aesthetic, inspiring, and decisive. Avoid corporate boilerplate.`;

    // Failover stays inside the requested provider, so the model the user chose
    // is the model that answers. Only `providerKeys` are eligible.
    let lastError: any = null;
    for (let kIdx = 0; kIdx < providerKeys.length; kIdx++) {
      const currentKeyObj = providerKeys[kIdx];
      const currentKey = currentKeyObj.key;
      // Every key in providerKeys already matches the requested provider, so the
      // model is never re-routed to the other API. Typed explicitly because the
      // key pool carries `provider` as a loose string.
      const provider: 'groq' | 'gemini' = requestedProvider;
      const selectedModel = await resolveModelAsync(currentKey, model, provider);

      try {
        if (provider === 'groq') {
          const groqMessages = [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: any) => ({
              role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
              content: m.content || m.text || ''
            }))
          ];

          // Fit this turn inside whatever per-minute budget the key has left,
          // using the provider's own reported figures. The plan narrows the tool
          // list first, then drops older conversation turns.
          const rateState = groqRateLedger.get(currentKey);
          const plan = planGroqRequest({
            messages: groqMessages,
            query: lastUserMessageText(groqMessages),
            availableTokens: groqRateLedger.availableTokens(currentKey),
            ceilingTokens: rateState?.limitTokens ?? GROQ_DEFAULT_TPM,
            hasHeaderData: rateState?.remainingTokens != null,
            staticToolBudget: groqToolTokenBudget,
            estimate: estimateTokens,
            selectTools: (query: string, budget: number) => selectGroqTools(query, budget),
          });

          if (!plan.fits) {
            const wait = groqRateLedger.retryAfterSeconds(currentKey) || 30;
            throw new Error(
              `[Groq limit] This key has ${plan.availableTokens} of ${plan.ceilingTokens} tokens left ` +
              `this minute, and the request still needs ${plan.totalTokens} even after trimming. ` +
              `Retry in about ${wait}s, switch to a Gemini model, or use a key from another Groq org.`
            );
          }

          if (plan.tools.length < groqTools.length) {
            console.log(
              `[AI Groq] Sending ${plan.tools.length}/${groqTools.length} tools ` +
              `(~${estimateTokens(plan.tools)} tool tokens; ${plan.availableTokens}/${plan.ceilingTokens} TPM ` +
              `left${plan.droppedMessages ? `; dropped ${plan.droppedMessages} older turns` : ''}).`
            );
          }

          const groqRes = await callWithRetry(() =>
            callGroqChat(currentKey, {
              model: selectedModel,
              messages: plan.messages,
              tools: plan.tools,
              tool_choice: 'auto',
              temperature: 0.7,
              // Bound the completion, so the output's share of the TPM window is
              // a known number instead of however much the model might emit.
              max_completion_tokens: GROQ_OUTPUT_RESERVE
            })
          );

          const choice = groqRes.choices?.[0];
          const msg = choice?.message || {};
          const responseText = msg.content || '';
          const toolCalls: any[] = [];

          if (Array.isArray(msg.tool_calls)) {
            for (const tc of msg.tool_calls) {
              let args = {};
              try {
                args = typeof tc.function?.arguments === 'string'
                  ? JSON.parse(tc.function.arguments)
                  : (tc.function?.arguments || {});
              } catch (e) {
                console.warn('[AI Groq] Failed to parse tool arguments:', e);
              }
              toolCalls.push({
                name: tc.function?.name,
                args
              });
            }
          }

          return res.json({
            success: true,
            text: responseText,
            toolCalls,
            rotated: kIdx > 0,
            switchedModel: groqRes._switchedModel,
            modelSwitchNotice: groqRes._switchNotice,
            usedKey: {
              id: currentKeyObj.id,
              name: currentKeyObj.name,
              key: currentKey,
              provider
            }
          });
        }

        // Provider: Google Gemini
        const ai = new GoogleGenAI({ apiKey: currentKey });
        const contents = messages.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content || m.text || '' }]
        }));

        let response: any;
        let switchedGeminiModel: string | undefined;
        let geminiSwitchNotice: string | undefined;

        const geminiRing = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.6-flash'];
        const modelsToTry = [selectedModel, ...geminiRing.filter(m => m !== selectedModel)];

        for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
          const attemptModel = modelsToTry[mIdx];
          try {
            response = await callWithRetry(() =>
              ai.models.generateContent({
                model: attemptModel,
                contents,
                config: {
                  systemInstruction,
                  tools: geminiTools
                }
              })
            );
            if (attemptModel !== selectedModel) {
              switchedGeminiModel = attemptModel;
              geminiSwitchNotice = `Switched to ${attemptModel} (seamless high-availability failover).`;
            }
            break;
          } catch (geminiErr: any) {
            const errMsg = geminiErr?.message || String(geminiErr);
            const isModelUnavailable = errMsg.includes('no longer available') || errMsg.includes('404') || errMsg.includes('not found');
            const isHighDemand = errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('503') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429');

            if ((isModelUnavailable || isHighDemand) && mIdx < modelsToTry.length - 1) {
              console.warn(`[AI Gemini] Model '${attemptModel}' unavailable/busy (${errMsg}). Auto-trying '${modelsToTry[mIdx + 1]}'...`);
              continue;
            }
            throw geminiErr;
          }
        }

        const responseText = response.text || '';
        const toolCalls = response.functionCalls || [];

        return res.json({
          success: true,
          text: responseText,
          toolCalls: toolCalls.map((fc: any) => ({
            name: fc.name,
            args: fc.args || {}
          })),
          rotated: kIdx > 0,
          switchedModel: switchedGeminiModel,
          modelSwitchNotice: geminiSwitchNotice,
          usedKey: {
            id: currentKeyObj.id,
            name: currentKeyObj.name,
            key: currentKey,
            provider: 'gemini'
          }
        });
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[AI Failover] Key #${kIdx + 1} (${currentKeyObj.name || provider}) error: ${msg}`);

        // Rotate to the next key of THIS provider on any error.
        //
        // This must measure `providerKeys`, not `allKeys`. Measuring the wider
        // pool made the check true whenever another provider also had a key, so
        // on the last eligible key it `continue`d, the loop exited, and the
        // `throw` below was never reached — leaving the handler with no response
        // to send and the client waiting on a request that would never settle.
        if (kIdx < providerKeys.length - 1) {
          const nextKeyObj = providerKeys[kIdx + 1];
          console.warn(`[AI Failover] Auto-switching to backup key #${kIdx + 2}: "${nextKeyObj.name || nextKeyObj.provider || 'Next Key'}"...`);
          continue;
        }
        throw err;
      }
    }

    // Safety net: this handler must always produce a response. Dropping out of
    // the key loop without one is precisely what left the client spinning
    // forever with no error, so make that outcome impossible rather than merely
    // unlikely.
    throw lastError || new Error('[AI] No provider returned a response.');
  } catch (error: any) {
    console.error('[AI] chat error:', error?.message || error);
    res.status(400).json({ success: false, error: parseGenAIError(error, requestedProvider) });
  }
});

// 1. POST /api/ai/test-key
app.post('/api/ai/test-key', async (req, res) => {
  try {
    const rawKey = req.body.apiKey;
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    const model = req.body.model;
    if (!apiKey) return res.status(400).json({ success: false, error: 'API key is required' });

    const provider = detectProvider(apiKey);
    const selectedModel = await resolveModelAsync(apiKey, model, provider);

    if (provider === 'groq') {
      const response = await callGroqChat(apiKey, {
        model: selectedModel,
        messages: [{ role: 'user', content: 'Respond with JSON: {"status":"ok"}' }],
        max_tokens: 25,
        response_format: { type: 'json_object' }
      });

      if (response.choices?.[0]?.message?.content) {
        return res.json({
          success: true,
          message: `Groq AI connected! (${selectedModel} • 14,400 free req/day)`
        });
      } else {
        return res.status(400).json({ success: false, error: 'No response received from Groq' });
      }
    }

    // Google Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: 'Respond with: {"status":"ok"}',
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      return res.json({ success: true, message: `Gemini API key is valid and connected (${selectedModel})` });
    } else {
      return res.status(400).json({ success: false, error: 'No response received from model' });
    }
  } catch (error: any) {
    console.error('[AI] test-key failed:', error?.message || error);
    // Recompute the provider here: the one used for the attempt is scoped to
    // the try block. This is the endpoint the Settings "Test" button hits, so
    // the message must name the provider the key was actually tried against.
    const failingKey = req.body?.apiKey;
    return res.status(400).json({
      success: false,
      error: parseGenAIError(error, detectProvider(typeof failingKey === 'string' ? failingKey : '')),
    });
  }
});

// 2. POST /api/ai/generate-tasks
app.post('/api/ai/generate-tasks', async (req, res) => {
  try {
    const rawKey = req.body.apiKey;
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    const { notes, projectId, projectTitle, model } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: 'API key is required' });
    if (!notes) return res.status(400).json({ success: false, error: 'Notes or requirements are required' });

    const provider = detectProvider(apiKey);
    const selectedModel = await resolveModelAsync(apiKey, model, provider);

    const systemInstruction = `You are the Flow Studio AI Design Co-Pilot.
Your role is to analyze project notes, client feedback, or briefs and convert them into structured, actionable, high-density project tasks.
Rules:
- Be specific, concise, and focused on design, branding, and deliverables.
- Valid priorities: 'urgent', 'high', 'medium', 'low'.
- Valid phases: 'todo', 'inprogress', 'review', 'done'.
- Due dates should be formatted as YYYY-MM-DD.`;

    const prompt = `Project Title: ${projectTitle || 'Design Project'}
Project Notes & Requirements:
${notes}

Generate 4 to 8 distinct, professional tasks for this design project.`;

    let rawTasks: any[] = [];

    if (provider === 'groq') {
      const groqRes = await callWithRetry(() =>
        callGroqChat(apiKey, {
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: systemInstruction + '\nYou must output a valid JSON object with the shape: {"tasks": [{"title": "...", "details": "...", "phase": "todo", "priority": "high", "dueDate": "YYYY-MM-DD"}]}'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      );
      const parsed = JSON.parse(groqRes.choices?.[0]?.message?.content || '{"tasks":[]}');
      rawTasks = parsed.tasks || [];
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      details: { type: Type.STRING },
                      phase: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      dueDate: { type: Type.STRING }
                    },
                    required: ['title', 'phase', 'priority']
                  }
                }
              },
              required: ['tasks']
            }
          }
        })
      );
      const parsed = JSON.parse(response.text || '{"tasks":[]}');
      rawTasks = parsed.tasks || [];
    }

    const formattedTasks = rawTasks.map((t: any, index: number) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${index}`,
      projectId: projectId || 'default',
      title: t.title || 'Untitled Task',
      details: t.details || '',
      phase: ['todo', 'inprogress', 'review', 'done'].includes(t.phase) ? t.phase : 'todo',
      status: 'Incomplete',
      priority: ['urgent', 'high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      dueDate: t.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      taskType: 'task',
      assignees: []
    }));

    res.json({ success: true, tasks: formattedTasks });
  } catch (error: any) {
    console.error('[AI] generate-tasks error:', error?.message || error);
    res.status(400).json({ success: false, error: parseGenAIError(error) });
  }
});

// 3. POST /api/ai/extract-brief
app.post('/api/ai/extract-brief', async (req, res) => {
  try {
    const rawKey = req.body.apiKey;
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    const { notes, model } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: 'API key is required' });
    if (!notes) return res.status(400).json({ success: false, error: 'Notes are required' });

    const provider = detectProvider(apiKey);
    const selectedModel = await resolveModelAsync(apiKey, model, provider);

    const systemInstruction = `You are the Flow Studio AI Design Co-Pilot.
Read and synthesize the provided client notes, meeting transcripts, or creative requirements into a polished Executive Design Brief.
Identify the core project goals, visual design directives, proposed brand color accents (hex codes), typography suggestions, and key deliverables.`;

    let brief = {};

    if (provider === 'groq') {
      const groqRes = await callWithRetry(() =>
        callGroqChat(apiKey, {
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: systemInstruction + '\nYou must output a JSON object with: { projectTitle: string, summary: string, objectives: string[], visualDirectives: string[], brandColors: string[], typographySuggestions: string[], keyDeliverables: string[], constraints: string[] }'
            },
            { role: 'user', content: notes }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      );
      brief = JSON.parse(groqRes.choices?.[0]?.message?.content || '{}');
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: selectedModel,
          contents: notes,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                projectTitle: { type: Type.STRING },
                summary: { type: Type.STRING },
                objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                typographySuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyDeliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
                constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['projectTitle', 'summary', 'objectives', 'visualDirectives', 'keyDeliverables']
            }
          }
        })
      );
      brief = JSON.parse(response.text || '{}');
    }

    res.json({ success: true, brief });
  } catch (error: any) {
    console.error('[AI] extract-brief error:', error?.message || error);
    res.status(400).json({ success: false, error: parseGenAIError(error) });
  }
});

// 4. POST /api/ai/generate-moodboard
app.post('/api/ai/generate-moodboard', async (req, res) => {
  try {
    const rawKey = req.body.apiKey;
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    const { vibeOrPrompt, projectId, model } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: 'API key is required' });
    if (!vibeOrPrompt) return res.status(400).json({ success: false, error: 'Prompt or vibe is required' });

    const provider = detectProvider(apiKey);
    const selectedModel = await resolveModelAsync(apiKey, model, provider);

    const systemInstruction = `You are the Flow Studio AI Design Co-Pilot.
Generate high-fidelity, aesthetic creative directives for a 2D infinite Moodboard canvas based on the user's design style or project vibe.
Include:
1. A 4 to 6 color harmonious brand palette with creative color names and exact 6-digit hex codes.
2. 2 to 3 sticky notes with actionable design guidelines, layout principles, or typography rules.
3. 2 typography cards with font pairings and aesthetic descriptions.`;

    let parsed: any = {};

    if (provider === 'groq') {
      const groqRes = await callWithRetry(() =>
        callGroqChat(apiKey, {
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: systemInstruction + '\nYou must output a JSON object with: { colorPalette: [{"title": "...", "color": "#HEX"}], stickyNotes: [{"title": "...", "content": "...", "color": "#HEX"}], typographyCards: [{"title": "...", "content": "..."}] }'
            },
            { role: 'user', content: vibeOrPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4
        })
      );
      parsed = JSON.parse(groqRes.choices?.[0]?.message?.content || '{}');
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: selectedModel,
          contents: vibeOrPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                colorPalette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      color: { type: Type.STRING }
                    },
                    required: ['title', 'color']
                  }
                },
                stickyNotes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                      color: { type: Type.STRING }
                    },
                    required: ['title', 'content']
                  }
                },
                typographyCards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING }
                    },
                    required: ['title', 'content']
                  }
                }
              },
              required: ['colorPalette', 'stickyNotes']
            }
          }
        })
      );
      parsed = JSON.parse(response.text || '{}');
    }

    const items: any[] = [];
    const timestamp = Date.now();

    // Position Swatches in Row 1 (y: 100)
    (parsed.colorPalette || []).forEach((c: any, i: number) => {
      const hex = c.color.startsWith('#') ? c.color : `#${c.color}`;
      items.push({
        id: `col-${timestamp}-${i}`,
        projectId: projectId || 'default',
        type: 'color',
        x: 100 + i * 200,
        y: 100,
        width: 180,
        height: 180,
        title: c.title || 'Brand Accent',
        color: hex,
        content: hex,
        category: 'Brand Colors'
      });
    });

    // Position Sticky Notes in Row 2 (y: 320)
    const stickyColors = ['#fef3c7', '#e0f2fe', '#fce7f3', '#d1fae5'];
    (parsed.stickyNotes || []).forEach((s: any, i: number) => {
      items.push({
        id: `stk-${timestamp}-${i}`,
        projectId: projectId || 'default',
        type: 'sticky',
        x: 100 + i * 250,
        y: 320,
        width: 230,
        height: 200,
        title: s.title || 'Design Directive',
        content: s.content,
        color: s.color || stickyColors[i % stickyColors.length],
        category: 'Design Directives'
      });
    });

    // Position Typography Cards in Row 3 (y: 560)
    (parsed.typographyCards || []).forEach((t: any, i: number) => {
      items.push({
        id: `typ-${timestamp}-${i}`,
        projectId: projectId || 'default',
        type: 'sticky',
        x: 100 + i * 300,
        y: 560,
        width: 280,
        height: 170,
        title: t.title || 'Typography Guideline',
        content: t.content,
        color: '#f8f9fa',
        category: 'Typography'
      });
    });

    res.json({ success: true, items });
  } catch (error: any) {
    console.error('[AI] generate-moodboard error:', error?.message || error);
    res.status(400).json({ success: false, error: parseGenAIError(error) });
  }
});

// 5. POST /api/ai/models - Query available models for active keys
app.post('/api/ai/models', async (req, res) => {
  try {
    const rawKeys: string[] = [];
    if (Array.isArray(req.body.apiKeys)) {
      for (const item of req.body.apiKeys) {
        const kStr = typeof item === 'string' ? item.trim() : (item && typeof item.key === 'string' ? item.key.trim() : '');
        if (kStr && !rawKeys.includes(kStr)) rawKeys.push(kStr);
      }
    }
    if (typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
      const kStr = req.body.apiKey.trim();
      if (!rawKeys.includes(kStr)) rawKeys.push(kStr);
    }

    if (rawKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }

    const seenModelIds = new Set<string>();
    const modelsList: Array<{
      id: string;
      name: string;
      provider: 'groq' | 'gemini';
      badge: string;
      description: string;
    }> = [];

    const formatModelOption = (id: string, provider: 'groq' | 'gemini') => {
      if (id === 'gemini-3.5-flash') {
        return { id, name: 'Gemini 3.5 Flash', provider, badge: 'High Stability', description: 'High-throughput multimodal model with 1M context' };
      }
      if (id === 'gemini-3.7-flash') {
        return { id, name: 'Gemini 3.7 Flash', provider, badge: 'Ultra Fast', description: 'Fast multimodal intelligence with 1M context' };
      }
      if (id === 'gemini-3.8-flash') {
        return { id, name: 'Gemini 3.8 Flash', provider, badge: 'Flagship', description: 'Deep reasoning & advanced project intelligence' };
      }
      if (id === 'gemini-3.6-flash') {
        return { id, name: 'Gemini 3.6 Flash', provider, badge: 'Recommended', description: 'Google AI Studio recommended model' };
      }
      if (id === 'qwen/qwen3.8-27b') {
        return { id, name: 'Qwen 3.8 27B', provider, badge: 'Groq LPU', description: 'Sub-second inference with tool calling support' };
      }
      if (id === 'openai/gpt-oss-120b') {
        return { id, name: 'GPT OSS 120B', provider, badge: 'Groq Deep', description: 'Deep reasoning architecture on Groq hardware' };
      }
      if (id === 'llama-3.1-8b-instant') {
        return { id, name: 'Llama 3.1 8B Instant', provider, badge: 'Ultra Fast', description: 'Sub-second speed, 14.4k req/day free' };
      }
      return {
        id,
        name: id.split('/').pop()?.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || id,
        provider,
        badge: provider === 'groq' ? 'Groq LPU' : 'Gemini AI',
        description: `Available via your ${provider === 'groq' ? 'Groq' : 'Gemini'} API key`
      };
    };

    const deprecated = [
      'gemini-2.0',
      'gemini-1.5',
      'gemini-2.5',
      'claude-opus-4.6-thinking',
      'canopylabs',
      'orpheus',
      'allam',
      'whisper',
      'guard',
      'safeguard',
      'llama-3.3-70b-versatile'
    ];

    for (const key of rawKeys) {
      const provider = detectProvider(key);
      try {
        if (provider === 'groq') {
          const groqModels = await getAvailableGroqModels(key);
          for (const mId of groqModels) {
            const isDep = deprecated.some(d => mId.includes(d));
            if (!isDep && !seenModelIds.has(mId)) {
              seenModelIds.add(mId);
              modelsList.push(formatModelOption(mId, 'groq'));
            }
          }
        } else {
          const geminiModels = await getAvailableGeminiModels(key);
          for (const mId of geminiModels) {
            const isDep = deprecated.some(d => mId.includes(d));
            if (!isDep && !seenModelIds.has(mId)) {
              seenModelIds.add(mId);
              modelsList.push(formatModelOption(mId, 'gemini'));
            }
          }
        }
      } catch (err) {
        console.warn(`[AI Models] Could not fetch models for ${provider} key:`, err);
      }
    }

    // Always guarantee at least standard fallback models if lists were empty
    if (modelsList.length === 0) {
      modelsList.push(
        formatModelOption('gemini-3.5-flash', 'gemini'),
        formatModelOption('gemini-3.7-flash', 'gemini'),
        formatModelOption('gemini-3.8-flash', 'gemini'),
        formatModelOption('gemini-3.6-flash', 'gemini'),
        formatModelOption('qwen/qwen3.8-27b', 'groq'),
        formatModelOption('openai/gpt-oss-120b', 'groq')
      );
    }

    return res.json({
      success: true,
      models: modelsList
    });
  } catch (error: any) {
    console.error('[AI] models query error:', error?.message || error);
    res.status(400).json({ success: false, error: parseGenAIError(error) });
  }
});

const preferredPort = getConfig().backendPort || 3010;
const ports = [preferredPort, 3010, 3009, 3011, 3012].filter((v, i, a) => a.indexOf(v) === i);

// ==========================================
// FILE SYSTEM ENDPOINTS (/api/fs/*)
// ==========================================
const getFsRoot = () => {
  const root = path.join(getConfig().dataPath, 'ProjectFiles');
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
  return root;
};

const resolveFsPath = (reqPath: string, mode?: string) => {
  if (mode === 'global') {
    if (reqPath && /^[a-zA-Z]:$/.test(reqPath)) {
      return reqPath + path.sep;
    }
    return reqPath ? path.normalize(reqPath) : '';
  }
  const root = getFsRoot();
  // Resolve the full path and normalize it
  const safePath = path.resolve(root, reqPath || '.');
  
  // CRITICAL: Ensure the resolved path starts with the root directory
  if (!safePath.startsWith(root)) {
    throw new Error('Path traversal detected');
  }
  return safePath;
};

// GET /api/fs/drives
app.get('/api/fs/drives', (req, res) => {
  exec('wmic logicaldisk get name,freespace,size', (error, stdout) => {
    if (error) return sendError(res, error);
    
    // Output:
    // FreeSpace    Name  Size
    // 49780379648  C:    511168425984
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    const drives = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 2) {
        // Sometimes freespace is empty if drive is not ready (like CD-ROM)
        let name = '', freeSpace = 0, totalSize = 0;
        
        if (parts.length === 3) {
          freeSpace = parseInt(parts[0], 10) || 0;
          name = parts[1];
          totalSize = parseInt(parts[2], 10) || 0;
        } else if (parts.length === 2) {
          // Could be missing size
          name = parts[0];
          if (name.length > 2) {
             // If Name was shifted
             name = parts[1];
          }
        } else {
          name = parts[0];
        }

        if (name && name.endsWith(':') && totalSize > 0) {
          drives.push({
            name,
            isDir: true,
            size: totalSize,
            freeSpace,
            modifiedAt: ''
          });
        }
      }
    }
    res.json({ files: drives });
  });
});

// GET /api/fs/quick-access
app.get('/api/fs/quick-access', (req, res) => {
  try {
    const home = os.homedir();
    res.json({
      home,
      desktop: path.join(home, 'Desktop'),
      downloads: path.join(home, 'Downloads'),
      documents: path.join(home, 'Documents'),
      pictures: path.join(home, 'Pictures'),
      videos: path.join(home, 'Videos'),
    });
  } catch (e: any) {
    sendError(res, e);
  }
});

// GET /api/fs/list
app.get('/api/fs/list', (req, res) => {
  try {
    const mode = req.query.mode as string;
    const targetPath = resolveFsPath(req.query.path as string, mode);
    
    // If empty targetPath in global mode, return drives
    if (mode === 'global' && !targetPath) {
      return res.redirect('/api/fs/drives');
    }

    if (!fs.existsSync(targetPath)) {
      // Auto-create the directory for project-scoped paths (not global)
      if (mode !== 'global') {
        fs.mkdirSync(targetPath, { recursive: true });
      } else {
        return res.json({ files: [] });
      }
    }
    
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const files = entries.map(e => {
      const ePath = path.join(targetPath, e.name);
      let size = 0, modifiedAt = '';
      try {
        const stat = fs.statSync(ePath);
        size = stat.size;
        modifiedAt = stat.mtime.toISOString();
      } catch (err) {}
      return {
        name: e.name,
        isDir: e.isDirectory(),
        size,
        modifiedAt
      };
    }).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ files });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/fs/mkdir
app.post('/api/fs/mkdir', (req, res) => {
  try {
    const { path: dirPath, name, mode } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    
    const targetPath = resolveFsPath(path.join(dirPath || '/', name), mode);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/fs/rename
app.post('/api/fs/rename', (req, res) => {
  try {
    const { oldPath, newPath, mode } = req.body;
    const oldT = resolveFsPath(oldPath, mode);
    const newT = resolveFsPath(newPath, mode);
    if (fs.existsSync(oldT)) {
      fs.renameSync(oldT, newT);
    }
    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/fs/copy
app.post('/api/fs/copy', (req, res) => {
  try {
    const { sourcePath, targetPath, mode } = req.body;
    const src = resolveFsPath(sourcePath, mode);
    const dest = resolveFsPath(targetPath, mode);
    
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'Source not found' });
    
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/fs/create-file
app.post('/api/fs/create-file', (req, res) => {
  try {
    const { path: reqPath, name, mode } = req.body;
    const targetDir = resolveFsPath(reqPath, mode);
    const targetFile = path.join(targetDir, name);
    
    // Ensure parent dir exists
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    // Create empty file
    fs.writeFileSync(targetFile, '');
    res.json({ success: true, path: targetFile });
  } catch (e: any) {
    sendError(res, e);
  }
});

// POST /api/fs/delete
app.post('/api/fs/delete', (req, res) => {
  try {
    const { path: delPath, mode } = req.body;
    const targetPath = resolveFsPath(delPath, mode);
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    }
    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// PUT /api/fs/upload
app.put('/api/fs/upload', (req, res) => {
  try {
    const mode = req.query.mode as string;
    const targetPath = resolveFsPath(req.query.path as string, mode);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    
    // If parsed by express.raw, req.body is a Buffer
    if (Buffer.isBuffer(req.body)) {
      fs.writeFileSync(targetPath, req.body);
    } else if (typeof req.body === 'string') {
      fs.writeFileSync(targetPath, req.body, 'utf-8');
    } else {
      // In case body parser skipped it, stream it
      const stream = fs.createWriteStream(targetPath);
      req.pipe(stream);
      return req.on('end', () => res.json({ success: true }));
    }
    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// GET /api/fs/file (Serve file contents for image previews)
app.get('/api/fs/file', async (req, res) => {
  try {
    const mode = req.query.mode as string;
    const thumb = req.query.thumb === 'true';
    const targetPath = resolveFsPath(req.query.path as string, mode);
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).send('Not found');
    }
    
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return res.status(400).send('Is a directory');
    }
    
    if (thumb) {
      const ext = path.extname(targetPath).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
         try {
            const sharpModule = await import('sharp');
            const sharp = (sharpModule.default || sharpModule) as any;
            const data = await sharp(targetPath).resize(256, 256, { fit: 'cover' }).toBuffer();
            res.setHeader('Content-Type', `image/${ext.replace('.', '')}`);
            return res.send(data);
         } catch (err) {
            // fallback to original if sharp fails
            return res.sendFile(targetPath);
         }
      }
    }

    // Send file directly, forcing download if unsafe
    const ext = path.extname(targetPath).toLowerCase();
    const safeTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    if (!safeTypes.includes(ext)) {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(targetPath)}"`);
    }

    res.sendFile(targetPath);
  } catch (e: any) {
    sendError(res, e);
  }
});

// Serve static frontend files in production if dist folder exists
let serverDir = path.dirname(__server_filename);
if (serverDir.includes('app.asar') && !serverDir.includes('app.asar.unpacked')) {
  serverDir = serverDir.replace('app.asar', 'app.asar.unpacked');
}

let cwdDir = process.cwd();
if (cwdDir.includes('app.asar') && !cwdDir.includes('app.asar.unpacked')) {
  cwdDir = cwdDir.replace('app.asar', 'app.asar.unpacked');
}

const candidateDistPaths = [
  path.resolve(serverDir, 'dist'),
  path.resolve(serverDir, '../dist'),
  path.resolve(cwdDir, 'dist'),
  path.resolve(cwdDir, '../dist')
];

const distPath = candidateDistPaths.find(p => fs.existsSync(p)) || candidateDistPaths[0];
console.log('[FlowStudio Server] Resolved distPath:', distPath, 'exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Serve React index.html for all non-API requests (client-side routing fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.get('/debug-dist', (req, res) => {
  res.json({
    __server_filename,
    serverDir,
    cwdDir,
    candidateDistPaths,
    distPath,
    exists: fs.existsSync(distPath),
    cwd: process.cwd(),
    resourcesPath: process.env.RESOURCES_PATH || 'unknown'
  });
});

function startServer(portIndex: number = 0) {
  if (portIndex >= ports.length) {
    console.error('[FlowStudio Server] No available ports in the specified range.');
    process.exit(1);
  }

  const port = ports[portIndex];
  // SECURITY: Bind strictly to localhost to prevent local network access
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`[FlowStudio Server] Server running on http://127.0.0.1:${port}`);
    try {
      const config = getConfig();
      saveConfig({ ...config, backendPort: port });
    } catch (e) {
      console.error('[FlowStudio Server] Failed to save port to config:', e);
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[FlowStudio Server] Port ${port} is in use, trying next port...`);
      startServer(portIndex + 1);
    } else {
      console.error(err);
    }
  });
}

bootstrap();
startServer();
