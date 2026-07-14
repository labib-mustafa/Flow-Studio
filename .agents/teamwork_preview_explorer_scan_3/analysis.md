# Analysis of Mock Data Structures in Flow-Studio

This report documents the hardcoded mock data structures found in the remaining scanned sections of the Flow-Studio React project. These mock structures reside in the global Zustand state stores (`src/stores/`) and are used to simulate backend datasets, including user profiles, active client records, leads pipelines, email logs, project configurations, task assignments, and time logs.

---

## Summary of Findings

| Store File | Data Structure Variable | Represented Object(s) / Purpose | Lines |
| :--- | :--- | :--- | :--- |
| `src/stores/billingStore.ts` | `balance`, `nextPaymentAmount`, `nextPaymentDate`, `savedCard`, `billingAddress`, `paymentHistory` | Financial statistics, credit card info, billing address (Bruce Wayne), and historical invoice receipts. | 60 - 105 |
| `src/stores/clientStore.ts` | `initialClients` | CRM client profiles including contact info, location, billing info, brand assets (fonts/colors), and project histories. | 91 - 389 |
| `src/stores/clientStore.ts` | `initialNotes` | Mock log of communication notes, meeting follow-ups, and urgent maintenance alerts linked to client accounts. | 391 - 436 |
| `src/stores/leadStore.ts` | `DEFAULT_COLUMNS`, `DEFAULT_COLUMN_LABELS` | Predefined structural table layout schemas for leads list views. | 84 - 107 |
| `src/stores/leadStore.ts` | `DUMMY_LEADS` | Mock pipeline leads representing prospective customers in different stages of lead acquisition. | 109 - 204 |
| `src/stores/mailStore.ts` | `sentEmails` | Pre-populated outbound email logs simulated as sent to leads. | 86 - 108 |
| `src/stores/mailStore.ts` | `seedDummyData()` (inline assignment to `sentEmails` & `replies`) | Function seeding mock sent emails and received replies showing conversational threads. | 112 - 164 |
| `src/stores/mailStore.ts` | `seedDummyTemplates()` (inline assignment to `templates`) | Default templates (e.g. Cold Outreach, Gentle Follow-Up) for the email composer. | 396 - 413 |
| `src/stores/moodboardStore.ts` | `initialItems` | Pre-populated objects placed on the infinite-canvas moodboard (images, color swatches, sticky notes, basic shapes). | 6 - 111 |
| `src/stores/projectStore.ts` | `projects` | Core list of active mock agency projects ("Rebrand 2024" and "Fintech App UI"). | 42 - 79 |
| `src/stores/projectStore.ts` | `currentProject` | Default active project state, referencing the mock project "Rebrand 2024". | 80 - 94 |
| `src/stores/taskStore.ts` | `tasks` | Mock tasks (with priority levels, columns, statuses, assignees) under the active project `rebrand-2024`. | 83 - 271 |
| `src/stores/teamStore.ts` | `initialMembers` | Agency team member records representing personnel roles, bios, and active focus tasks. | 49 - 106 |
| `src/stores/teamStore.ts` | `initialInvites` | Pending team invites with recipient email and assigned roles. | 108 - 121 |
| `src/stores/timeStore.ts` | `entries` | Mock timesheet tracking logs simulating hours spent on specific project tasks. | 37 - 56 |

---

## Detailed Findings

### 1. Billing Store (`src/stores/billingStore.ts`)
* **Line Numbers**: 60 - 105
* **Description**: Simulates the billing state of the user. Includes balance totals, payment deadlines, credit card data (under "Bruce Wayne" / Mastercard), billing address (1007 Mountain Drive, Gotham City), and a list of two historical invoices with line items.
* **Code Snippet**:
```typescript
      balance: 12400,
      nextPaymentAmount: 1200,
      nextPaymentDate: 'Oct 24, 2024',
      savedCard: {
        cardNumber: '**** **** **** 1436',
        cardHolder: 'Bruce Wayne',
        validThru: '07/29',
        brand: 'Mastercard'
      },
      billingAddress: {
        name: 'Bruce Wayne',
        addressLine1: '1007 Mountain Drive',
        addressLine2: 'Gotham City, NJ'
      },
      paymentHistory: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          amount: 350,
          status: 'Completed',
          recipientName: 'Apex Architecture',
          recipientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          recipientEmail: 'finance@apexarch.com',
          date: '2024-09-24',
          dueDate: '2024-10-24',
          method: 'Stripe Credit Card',
          lineItems: [
            { id: 'li-1', description: 'Brand Strategy Consulting', quantity: 1, rate: 350 }
          ]
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2024-002',
          amount: 1200,
          status: 'Pending',
          recipientName: 'Vault Bank',
          recipientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
          recipientEmail: 'billing@vaultbank.io',
          date: '2024-10-01',
          dueDate: '2024-10-24',
          method: 'Bank Transfer',
          lineItems: [
            { id: 'li-2', description: 'Fintech App UI Design (Milestone 1)', quantity: 1, rate: 1200 }
          ]
        }
      ]
```

### 2. Client Store (`src/stores/clientStore.ts`)
* **Line Numbers**: 91 - 389 (`initialClients` array), 391 - 436 (`initialNotes` array)
* **Description**: Contains complete CRM profiles for active and prospective clients, along with interactive log notes documenting team communication and feedback history.
* **Code Snippet**:
```typescript
const initialClients: Client[] = [
  {
    id: 'alexander-hamilton',
    initials: 'AH',
    name: 'Alexander Hamilton',
    company: 'Treasury Dept',
    role: 'Secretary of Treasury',
    status: 'Active',
    projectsCount: 8,
    rating: 5.0,
    email: 'a.hamilton@treasury.gov',
    phone: '(212) 555-1789',
    location: '55 Wall Street, New York, NY 10005',
    totalVolume: 852000,
    outstandingAmount: 24500,
    outstandingPending: true,
    outstandingDueDays: 5,
    communicationRating: 5.0,
    speedRating: 4.9,
    avatarBg: 'bg-emerald-600 text-white',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-LEbQMHWg-bgTRP93dJLCMtaMD0QmCGBLu14FCPro90t-rkftnpE44Gkt0SSY5QyzLrw6MGVd6ZLufGI1JglRWNAAq2-dyW_CGak9I2DF6DSlq43_WPH402DjKgTxuoAvYQ6jjzmZvLI_ihP9p8gq7swKEBT3mmP8mnRbK990Wy-E63bzjkWwTVrmfJkAUjOsrgHAawMxT78Qo_2NIFle-GLQrh8L5hv-_FewC0cv9bXM3AoVru6XD-lPthKDfqgneqFWmsmtEKQ',
    brandColors: [
      { name: 'Emerald', hex: '#059669' },
      { name: 'Gold', hex: '#D97706' }
    ],
    brandFonts: [
      { style: 'Aa', fontName: 'Playfair Display' }
    ],
    projectHistory: [
      {
        id: 'ah-p1',
        title: 'Submit Q3 treasury audit report',
        phase: 'Audit Phase',
        statusType: 'ongoing',
        desc: 'Submit Q3 treasury audit report',
        dueText: 'Mon, 18 Oct'
      },
      // ...
    ],
    tags: ['GOVERNMENT', 'STRATEGIC', 'FINTECH']
  },
  // ... john-doe, sarah-miller, tech-flow, global-media, creative-spark, next-gen
];

const initialNotes: ClientNote[] = [
  {
    id: 'n1',
    clientId: 'john-doe',
    clientInitials: 'JD',
    type: 'Meeting',
    content: 'Discussed Q4 roadmap with Sarah. Need to prioritize mobile responsiveness for the new dashboard.',
    authorInitials: 'JD',
    timeText: '2 hours ago',
    date: 'Oct 24, 2024',
    tags: ['Strategy', 'Roadmap']
  },
  // ... n2, n3, n4
];
```

### 3. Lead Store (`src/stores/leadStore.ts`)
* **Line Numbers**: 84 - 107 (Columns schema), 109 - 204 (`DUMMY_LEADS` array)
* **Description**: Default columns list structure, labels config, and mock list of sales pipeline leads representing people and target companies interested in branding or product redesign projects.
* **Code Snippet**:
```typescript
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', title: 'Name', width: 240 },
  { id: 'type', title: 'Type', width: 140 },
  { id: 'email', title: 'Email', width: 180 },
  { id: 'phone', title: 'Phone', width: 150 },
  { id: 'status', title: 'Pipeline Stage', width: 130 },
  { id: 'socials', title: 'Socials', width: 150 },
  { id: 'location', title: 'Location', width: 160 },
  { id: 'actions', title: 'Actions', width: 180 },
];

const DEFAULT_COLUMN_LABELS: ColumnLabels = {
  name: 'Name',
  type: 'Type',
  email: 'Email',
  phone: 'Phone',
  status: 'Status',
  socials: 'Socials',
  location: 'Location',
  company: 'Company',
  estimated_value: 'Forecast Value',
  source: 'Origin Source',
  tags: 'Classification Tags'
};

const DUMMY_LEADS: Lead[] = [
  {
    id: 'lead_1',
    name: 'Sarah Jenkins',
    company: 'Acme Corp',
    email: 'sarah.j@acme.inc',
    phone: '+1 (555) 123-4567',
    status: 'New',
    estimated_value: 12000,
    source: 'Website Form',
    notes_summary: 'Interested in a full brand overhaul.',
    tags: ['branding', 'urgent'],
    last_updated_at: new Date().toISOString(),
    timeline: [{ date: new Date().toISOString(), event: 'Lead Created' }]
  },
  // ... lead_2, lead_3, lead_4, lead_5, lead_6, lead_7
];
```

### 4. Mail Store (`src/stores/mailStore.ts`)
* **Line Numbers**: 86 - 108 (`sentEmails`), 112 - 164 (`seedDummyData()`), 396 - 413 (`seedDummyTemplates()`)
* **Description**: Initial sent emails array, a data-seeding method that sets up sent logs and received replies simulating customer response threads, and generic outreach template variables used to populate dynamic emails.
* **Code Snippet**:
```typescript
      sentEmails: [
        {
          id: 'mail_dummy_1',
          leadId: 'lead_1', // Alice Freeman
          subject: 'Partnership Opportunity with Flow Studio',
          body: 'Hi Alice,\n\nI was really impressed with your latest project at TechVision. I think our new design system at Flow Studio could drastically cut down your UI development time.\n\nWould you be open to a brief 10-minute chat next week to discuss this?\n\nBest,\nFlow Team',
          sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        // ... mail_dummy_2, mail_dummy_3
      ],

      seedDummyData: () => {
        set({
          sentEmails: [
            // ...
          ],
          replies: [
            {
              id: 'reply_dummy_1',
              sentEmailId: 'mail_dummy_2',
              leadId: 'lead_1',
              subject: 'Re: Partnership Opportunity with Flow Studio',
              body: 'Hi Flow Team,\n\nThanks for following up! Yes, I did take a look and it seems very interesting. I am available next Tuesday at 2 PM PST.\n\nAlice',
              receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // ... reply_dummy_2, reply_dummy_3
          ]
        });
      },

      seedDummyTemplates: () => {
        set({
          templates: [
            {
              id: 'tpl_dummy_1',
              name: 'Cold Outreach (Standard)',
              subject: 'Streamlining UI for {{company}}',
              body: 'Hi {{name}},\n\nI noticed the amazing work you are doing over at {{company}}.\n\nAt Flow Studio, we help product teams move 3x faster by providing premium, plug-and-play UI systems. I thought it might be highly relevant to your current roadmap.\n\nAre you open to a quick 5-minute chat this week to see if there is a mutual fit?\n\nBest regards,\nFlow Team'
            },
            // ... tpl_dummy_2
          ]
        });
      },
```

### 5. Moodboard Store (`src/stores/moodboardStore.ts`)
* **Line Numbers**: 6 - 111
* **Description**: Populates the collaborative visual board workspace with coordinates mapping notes, reference pictures, vector shapes (rectangles, circles), and hex color blocks.
* **Code Snippet**:
```typescript
const initialItems: MoodboardItemData[] = [
  {
    id: '1',
    type: 'image',
    x: 5080,
    y: 5080,
    title: 'Inspiration',
    content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    width: 300,
    height: 200,
    rotation: -2,
  },
  {
    id: '2',
    type: 'color',
    x: 5400,
    y: 5160,
    title: 'Navy',
    color: '#0F172A',
    width: 160,
    height: 160,
    rotation: 0,
  },
  // ... type: text, note, shape (rectangle, circle)
];
```

### 6. Project Store (`src/stores/projectStore.ts`)
* **Line Numbers**: 42 - 79 (`projects` list), 80 - 94 (`currentProject` default state)
* **Description**: Default agency projects ("Rebrand 2024" for Apex Architecture, and "Fintech App UI" for Vault Bank) with completion status, tags, milestones, and metadata.
* **Code Snippet**:
```typescript
      projects: [
        {
          id: 'rebrand-2024',
          name: "Rebrand 2024",
          title: "Rebrand 2024",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
          thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
          category: "Portfolio",
          status: "In Progress",
          statusColor: "bg-blue-600/90",
          progress: 90,
          completion: 90,
          client: "Apex Architecture",
          deadline: "2024-10-24",
          isPortfolio: true,
          tasksCount: 12,
          commentsCount: 4,
          tags: ['Branding', 'Architecture', 'Premium']
        },
        // ... fintech-app
      ],
      currentProject: {
        id: 'rebrand-2024',
        name: 'Rebrand 2024',
        title: 'Rebrand 2024',
        client: 'Apex Architecture',
        status: 'In Progress',
        deadline: '2024-10-24',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
        tags: ['Branding', 'Architecture', 'Premium'],
        completion: 90,
        progress: 90,
        category: 'Portfolio',
        statusColor: 'bg-blue-600/90'
      },
```

### 7. Task Store (`src/stores/taskStore.ts`)
* **Line Numbers**: 83 - 271
* **Description**: Lists hardcoded project tasks (e.g. logo packaging, final guidelines, social media assets) for project `rebrand-2024`, including a set of dedicated field-validation tasks (e.g. rating, voting, files, location, emails, button).
* **Code Snippet**:
```typescript
      tasks: [
        {
          id: '1',
          projectId: 'rebrand-2024',
          title: 'Finalize Brand Guidelines',
          details: 'Complete the final draft of the brand guidelines including color scales and typography pairings.',
          dueDate: '2026-05-20',
          priority: 'high',
          phase: 'todo',
          assignees: [{ id: '1', name: 'Sarah Jenkins', avatar: 'SJ' }],
          status: 'Incomplete'
        },
        // ... 2, 3, 4, field-task-1 to field-task-13
      ]
```

### 8. Team Store (`src/stores/teamStore.ts`)
* **Line Numbers**: 49 - 106 (`initialMembers`), 108 - 121 (`initialInvites`)
* **Description**: Populates the company directory with mock members (John Doe, Sarah Miller, Alex Rivera, Elena Rostova) complete with role descriptions, contact details, assigned tasks, and focus bios. Also tracks pending system invitations.
* **Code Snippet**:
```typescript
const initialMembers: TeamMember[] = [
  {
    id: 'm1',
    name: 'John Doe',
    email: 'john.doe@flowstudio.com',
    role: 'Owner',
    phone: '+1 (555) 234-5678',
    bio: 'Founder & Lead Product Designer driving creative vision across all major accounts.',
    department: 'Leadership',
    status: 'active',
    joinDate: 'Jan 15, 2023',
    assignedProjects: ['E-commerce Redesign', 'Brand Guide 2.0'],
    activeFocus: '🎨 Designing Flow Studio visual guidelines & core architecture',
    skills: ['Creative Direction', 'Brand Strategy', 'Product UI', 'Figma', 'Design Systems']
  },
  // ... m2, m3, m4
];

const initialInvites: TeamInvite[] = [
  {
    id: 'inv1',
    email: 'david.kim@flowstudio.com',
    role: 'Designer',
    sentDate: 'Yesterday'
  },
  // ... inv2
];
```

### 9. Time Store (`src/stores/timeStore.ts`)
* **Line Numbers**: 37 - 56
* **Description**: Stores mock time entries tracked by the team on project tasks (e.g. Design System Architecture, Client Review Call).
* **Code Snippet**:
```typescript
      entries: [
        {
          id: 'mock-1',
          projectId: 'rebrand-2024',
          projectTitle: 'Rebrand 2024',
          taskTitle: 'Design System Architecture',
          startTime: new Date().setHours(9, 0, 0, 0),
          endTime: new Date().setHours(11, 30, 0, 0),
          durationSeconds: 2.5 * 3600
        },
        {
          id: 'mock-2',
          projectId: 'lumina-brand',
          projectTitle: 'Lumina Brand Identity',
          taskTitle: 'Client Review Call',
          startTime: new Date().setHours(13, 0, 0, 0),
          endTime: new Date().setHours(14, 45, 0, 0),
          durationSeconds: 1.75 * 3600
        }
      ]
```
