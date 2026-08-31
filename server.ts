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

const APP_LEVEL_STORES = ['settings', 'notifications', 'dev'];

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

function getStoreFilePath(name: string): string {
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
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  return path.join(dataPath, `${name}.json`);
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
      id: "38n80o124",
      name: "Posters",
      title: "Posters",
      description: "Custom made Poster Designs",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
      category: "Design",
      status: "In Progress",
      statusColor: "bg-blue-600/90",
      progress: 45,
      completion: 45,
      client: "John Doe",
      deadline: "2024-12-31",
      isPortfolio: false,
      tasksCount: 2,
      commentsCount: 1,
      tags: ["Posters", "Design"]
    }
  ],
  currentProject: null
};

const SEED_TASKS = {
  tasks: [
    {"id":"1","projectId":"rebrand-2024","title":"Finalize Brand Guidelines","details":"Complete the final draft of the brand guidelines including color scales and typography pairings.","dueDate":"2026-05-20","priority":"high","phase":"todo","assignees":[{"id":"1","name":"Sarah Jenkins","avatar":"SJ"}],"status":"Incomplete"},
    {"id":"2","projectId":"rebrand-2024","title":"Logo Exporting & Packaging","details":"Export all logo variants in SVG, PNG, and AI formats.","dueDate":"2026-05-21","priority":"medium","phase":"inprogress","assignees":[{"id":"2","name":"Marcus Chen","avatar":"MC"}],"status":"Incomplete"},
    {"id":"3","projectId":"rebrand-2024","title":"Social Media Launch Assets","details":"Create banners and profile pictures for LinkedIn, Twitter, and Instagram.","dueDate":"2026-05-23","priority":"high","phase":"todo","assignees":[{"id":"1","name":"Sarah Jenkins","avatar":"SJ"},{"id":"2","name":"Marcus Chen","avatar":"MC"}],"status":"Incomplete"},
    {"id":"4","projectId":"rebrand-2024","title":"Client Website Wireframes","details":"Draft initial wireframes for the new client portal.","dueDate":"2026-05-25","priority":"low","phase":"done","assignees":[],"status":"Complete"},
    {"id":"n1","projectId":"neon-brand-identity","title":"Moodboard & Color Palette Selection","details":"Research neon aesthetics and define the primary/secondary color scales.","dueDate":"2026-07-15","priority":"high","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"n2","projectId":"neon-brand-identity","title":"Logo Concept Sketches","details":"Develop at least 3 distinct vector routes for the neon logo.","dueDate":"2026-08-01","priority":"medium","phase":"inprogress","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Incomplete"},
    {"id":"n3","projectId":"neon-brand-identity","title":"Typography System Definition","details":"Select neon-compatible display fonts and geometric body text.","dueDate":"2026-08-05","priority":"low","phase":"todo","assignees":[],"status":"Incomplete"},
    {"id":"n4","projectId":"neon-brand-identity","title":"3D Brand Mockups","details":"Render neon signage mockup for Luminal Studio storefront.","dueDate":"2026-08-10","priority":"high","phase":"todo","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Incomplete"},
    {"id":"p1","projectId":"psychedelic-poster-series","title":"Concept ideation and sketch approval","details":"Draft initial layouts for the 3 festival posters.","dueDate":"2026-06-28","priority":"high","phase":"done","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Complete"},
    {"id":"p2","projectId":"psychedelic-poster-series","title":"First poster illustration (Acid Rock)","details":"Finalize vector artwork for the Acid Rock poster.","dueDate":"2026-07-05","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"p3","projectId":"psychedelic-poster-series","title":"Second poster illustration (Dream Pop)","details":"Finalize pastel-gradient vector artwork for Dream Pop.","dueDate":"2026-07-12","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"p4","projectId":"psychedelic-poster-series","title":"Typography layout & printing setup","details":"Set up print-ready PDF files with crop marks and Pantone colors.","dueDate":"2026-07-18","priority":"high","phase":"inprogress","assignees":[{"id":"m2","name":"Sarah Miller","avatar":"SM"}],"status":"Incomplete"},
    {"id":"r1","projectId":"retro-packaging-revival","title":"Historical brand research","details":"Gather reference material of 1970s soda cans and typography.","dueDate":"2026-06-15","priority":"low","phase":"done","assignees":[],"status":"Complete"},
    {"id":"r2","projectId":"retro-packaging-revival","title":"Color palette & mascot design","details":"Create the vector mascot character and retro warm color theme.","dueDate":"2026-06-22","priority":"high","phase":"done","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Complete"},
    {"id":"r3","projectId":"retro-packaging-revival","title":"Die-line layout mapping","details":"Map the designs onto the official can manufacturer die-lines.","dueDate":"2026-06-29","priority":"medium","phase":"done","assignees":[{"id":"m4","name":"Elena Rostova","avatar":"ER"}],"status":"Complete"},
    {"id":"r4","projectId":"retro-packaging-revival","title":"Client feedback round 3 modifications","details":"Make final minor edits to the nutrition facts label layout.","dueDate":"2026-07-04","priority":"low","phase":"inprogress","assignees":[{"id":"m2","name":"Sarah Miller","avatar":"SM"}],"status":"Incomplete"},
    {"id":"c1","projectId":"cyberpunk-zine","title":"Page budget & content outline","details":"Map out the 16-page spread and content blocks.","dueDate":"2026-08-15","priority":"low","phase":"done","assignees":[],"status":"Complete"},
    {"id":"c2","projectId":"cyberpunk-zine","title":"Glitch art assets collection","details":"Generate and edit raw glitch art textures for background overlays.","dueDate":"2026-09-01","priority":"medium","phase":"todo","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Incomplete"},
    {"id":"c3","projectId":"cyberpunk-zine","title":"Grid template setup in InDesign","details":"Create a custom multi-column grid layout with radical margins.","dueDate":"2026-09-05","priority":"high","phase":"todo","assignees":[{"id":"m4","name":"Elena Rostova","avatar":"ER"}],"status":"Incomplete"},
    {"id":"c4","projectId":"cyberpunk-zine","title":"Cover page art direction","details":"Design a high-impact cover featuring custom neon typography.","dueDate":"2026-09-12","priority":"high","phase":"todo","assignees":[{"id":"m1","name":"John Doe","avatar":"JD"}],"status":"Incomplete"},
    {"id":"v1","projectId":"vibrant-vector-illustrations","title":"Character design sheets","details":"Draw 5 flat-design character illustrations with vibrant outfits.","dueDate":"2026-06-10","priority":"high","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"v2","projectId":"vibrant-vector-illustrations","title":"Interface background illustrations","details":"Create 3 detailed isometric backgrounds for the app scenes.","dueDate":"2026-06-18","priority":"medium","phase":"done","assignees":[{"id":"m3","name":"Alex Rivera","avatar":"AR"}],"status":"Complete"},
    {"id":"v3","projectId":"vibrant-vector-illustrations","title":"Icon set exporting","details":"Export 24 vector icons in SVG and PDF formats.","dueDate":"2026-06-24","priority":"low","phase":"done","assignees":[{"id":"m4","name":"Elena Rostova","avatar":"ER"}],"status":"Complete"}
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
    {"id":"m1","name":"John Doe","email":"john.doe@flowstudio.com","role":"Owner","phone":"+1 (555) 234-5678","bio":"Founder & Lead Product Designer driving creative vision across all major accounts.","department":"Leadership","status":"active","joinDate":"Jan 15, 2023","assignedProjects":["E-commerce Redesign","Brand Guide 2.0"],"activeFocus":"🎨 Designing Flow Studio visual guidelines & core architecture","skills":["Creative Direction","Brand Strategy","Product UI","Figma","Design Systems"]},
    {"id":"m2","name":"Sarah Miller","email":"sarah.m@flowstudio.com","role":"Admin","phone":"+1 (555) 987-6543","bio":"Operations Director & Account Manager coordinating client feedback and sprints.","department":"Operations","status":"active","joinDate":"Mar 10, 2023","assignedProjects":["Mobile App MVP","Q3 Marketing Portal"],"activeFocus":"📊 Aligning Q3 sprint deliverables with stakeholder timelines","skills":["Client Relations","Agile Sprints","Account Management","Roadmapping","Notion"]},
    {"id":"m3","name":"Alex Rivera","email":"alex.r@flowstudio.com","role":"Designer","phone":"+1 (555) 456-7890","bio":"Senior UX/UI Designer specializing in micro-interactions and design systems.","department":"Design","status":"active","joinDate":"Jun 22, 2023","assignedProjects":["E-commerce Redesign","Fintech Dashboard"],"activeFocus":"✨ Refining micro-interactions for the Fintech dashboard component library","skills":["UI/UX Design","Micro-interactions","Prototyping","Design Tokens","Figma"]},
    {"id":"m4","name":"Elena Rostova","email":"elena.r@flowstudio.com","role":"Developer","phone":"+1 (555) 345-6789","bio":"Frontend Architect implementing responsive web apps and animations.","department":"Engineering","status":"active","joinDate":"Sep 05, 2023","assignedProjects":["Mobile App MVP","Fintech Dashboard"],"activeFocus":"⚡ Optimizing frontend rendering performance and web animation framerates","skills":["React","TypeScript","Tailwind CSS","Framer Motion","Zustand","Performance"]}
  ],
  invites: [
    {"id":"inv1","email":"david.kim@flowstudio.com","role":"Designer","sentDate":"Yesterday"},
    {"id":"inv2","email":"claire.voyant@flowstudio.com","role":"Guest","sentDate":"3 days ago"}
  ],
  customRoles: []
};

const SEED_MOODBOARD = {
  items: [
    {"id":"1","type":"image","x":5080,"y":5080,"title":"Inspiration","content":"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop","width":300,"height":200,"rotation":-2},
    {"id":"2","type":"color","x":5400,"y":5160,"title":"Navy","color":"#0F172A","width":160,"height":160,"rotation":0},
    {"id":"3","type":"color","x":5580,"y":5160,"title":"Electric","color":"#1978E5","width":160,"height":160,"rotation":0},
    {"id":"4","type":"text","x":5800,"y":5040,"title":"Typography","content":"Inter - Body Copy / UI","width":250,"height":80,"rotation":0},
    {"id":"5","type":"note","x":5200,"y":5400,"content":"Don't forget to check the contrast ratios on the primary button style!","width":240,"height":150,"rotation":2},
    {"id":"6","type":"image","x":5600,"y":5350,"title":"Reference","content":"https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2600&auto=format&fit=crop","width":220,"height":150,"rotation":4},
    {"id":"1774261600220","type":"shape","x":5850,"y":5200,"width":150,"height":150,"shapeType":"rectangle","title":"Primary Box","color":"#f8fafc","rotation":0,"borderWidth":2,"borderColor":"#e2e8f0"},
    {"id":"1774261697046","type":"shape","x":6050,"y":5200,"width":150,"height":150,"shapeType":"circle","title":"Accent Circle","color":"#f1f5f9","rotation":0,"borderWidth":2,"borderColor":"#cbd5e1"},
    {"id":"1774261713437","type":"note","x":5850,"y":5400,"content":"Review the new layout components for the dashboard.","width":240,"height":150,"rotation":-1,"color":"#fffbeb"}
  ],
  view: {"zoom":1,"pan":{"x":-4500,"y":-4500}}
};

const SEED_BILLING = {
  balance: 0,
  nextPaymentAmount: 0,
  nextPaymentDate: '',
  savedCard: {
    cardNumber: '',
    cardHolder: '',
    validThru: '',
    brand: ''
  },
  billingAddress: {
    name: '',
    addressLine1: '',
    addressLine2: ''
  },
  paymentHistory: []
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
    activities: { activities: [] },
    events: { events: [] },
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

function broadcastStoreChange(storeName: string, source: 'api' | 'fs' = 'api') {
  const payload = JSON.stringify({ type: 'store_updated', store: storeName, source, timestamp: Date.now() });
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
    fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
      if (!filename || typeof filename !== 'string' || !filename.endsWith('.json') || filename.endsWith('.tmp')) return;
      const storeName = path.basename(filename, '.json');
      
      if (fsWatchDebounceTimers.has(storeName)) {
        clearTimeout(fsWatchDebounceTimers.get(storeName)!);
      }

      const timer = setTimeout(() => {
        fsWatchDebounceTimers.delete(storeName);
        broadcastStoreChange(storeName, 'fs');
      }, 100);

      fsWatchDebounceTimers.set(storeName, timer);
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
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const filePath = getStoreFilePath(name);

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
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const filePath = getStoreFilePath(name);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = `${filePath}.tmp`;
    const content = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);

    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);

    broadcastStoreChange(name, 'api');

    res.json({ success: true });
  } catch (e: any) {
    sendError(res, e);
  }
});

// 5. DELETE /api/store/:name
app.delete('/api/store/:name', (req, res) => {
  try {
    const validStores = ['clients', 'leads', 'projects', 'tasks', 'team', 'moodboard', 'settings', 'trash', 'billing', 'activities', 'events', 'mail', 'mailTemplates', 'time', 'notifications', 'clientDetails', 'notes', 'leadDummies', 'teamMessages', 'dev', 'scraper'];
    const { name } = req.params;
    if (!validStores.includes(name)) {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const filePath = getStoreFilePath(name);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    broadcastStoreChange(name, 'api');

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

let distPath = candidateDistPaths.find(p => fs.existsSync(p)) || candidateDistPaths[0];
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
