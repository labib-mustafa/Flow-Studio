# Consolidate Mock Data Structures Report

## 1. Executive Summary

This report consolidates the findings of three independent explorer scans conducted across the **Flow-Studio** codebase to identify hardcoded mock data structures, static variables, and inline visual fallbacks.

### Goal
The goal of this audit is to provide developers and stakeholders with a complete catalog of simulated backend datasets currently embedded in the frontend codebase. Identifying these structures is the first step toward migrating the application to dynamic backend API endpoints and databases (e.g., Firebase Firestore, REST APIs).

### Scan Boundaries
The audit spanned all critical directories in the project:
1. **Zustand State Stores** (`src/stores/`): Scanned for global initial states, dummy databases, and local data-seeding functions.
2. **Feature Components** (`src/components/Billing/`, `src/components/Clients/`, `src/components/Dashboard/`, `src/components/Data/`): Scanned for component-level local states (`useState`), dropdown options, default values, and fallback dataset constants.
3. **Global UI Components** (`src/components/GlobalComponents/`): Scanned for notification menus, comment autocomplete arrays, and static mockup lists.

---

## 2. Summary Table

The table below lists all 25 mock data structures identified during the codebase audit:

| File Path | Data Structure / Variable | Simulates Backend Entity | Category |
| :--- | :--- | :--- | :--- |
| `src/components/Billing/NewInvoicePage.tsx` | `CLIENT_OPTIONS` | CRM Client Contact & Address Info | Billing / Dropdown |
| `src/components/Billing/NewInvoicePage.tsx` | `lineItems` (initial state) | Invoice Line Item Deliverables | Billing / Local State |
| `src/components/Billing/NewInvoicePage.tsx` | `handleBulkImport` (inline items) | Invoice Line Item Deliverables | Billing / Action Simulation |
| `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | `clientExperts` (initial state) | **[⚠️ Highlighted]** Assigned/Available Internal Experts for client `alexander-hamilton` | Clients / Local State |
| `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | `activeExperts` (fallback data) | Assigned/Available Internal Experts Fallback List | Clients / Local State Fallback |
| `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | `pinnedAssets` (initial state) | Pinned Document & Zip Files list | Clients / Local State |
| `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx` | `activityLogs` (initial state) | Client Audit Log Action History Feed | Clients / Local State |
| `src/components/Clients/Sidebars/ManageTagsSidebar.tsx` | `initialLabels` (default labels) | Contact Tags and Channel Classifications | Clients / Options |
| `src/components/GlobalComponents/NotificationDropdown.tsx` | `notifications` | User Activity and Event Alerts | Notifications / List |
| `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx` | `rawItems` | Team Directory autocomplete suggestions (`@` mentions) | Tasks / Autocomplete |
| `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx` | `rawDocs` | Client briefs and pages autocomplete suggestions (`#` mentions) | Tasks / Autocomplete |
| `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx` | `rawChannels` | Chat channel autocomplete suggestions (`#` mentions) | Tasks / Autocomplete |
| `src/components/Dashboard/Renewals.tsx` | Fallback Mock UI Layout (Adobe, Figma, Slack) | Software Subscription Renewal urgencies | Dashboard / Fallback UI |
| `src/components/GlobalComponents/Pages/TaskPage/FilesTab.tsx` | Fallback Mock UI Layout (Recent Files, Approved Assets) | Project Deliverables & Assets File list | Tasks / Fallback UI |
| `src/stores/billingStore.ts` | `balance`, `nextPaymentAmount`, `nextPaymentDate`, `savedCard`, `billingAddress`, `paymentHistory` | Financial Totals, Credit Card details, Invoices history for "Bruce Wayne" | Zustand Store / State |
| `src/stores/clientStore.ts` | `initialClients` | CRM Client Profiles, Contact Info, Brand Colors, Fonts, Project Histories | Zustand Store / CRM |
| `src/stores/clientStore.ts` | `initialNotes` | Client Interaction Log Notes and meeting minutes | Zustand Store / CRM |
| `src/stores/leadStore.ts` | `DEFAULT_COLUMNS`, `DEFAULT_COLUMN_LABELS` | Leads Kanban Column metadata and table headers schema | Zustand Store / Leads |
| `src/stores/leadStore.ts` | `DUMMY_LEADS` | Sales Pipeline Leads & prospective deal values | Zustand Store / Leads |
| `src/stores/mailStore.ts` | `sentEmails` | Initial Outbound Cold Outreach Email history logs | Zustand Store / Email |
| `src/stores/mailStore.ts` | `seedDummyData` (inline `sentEmails` & `replies`) | Interactive outbound threads and inbound email responses | Zustand Store / Email |
| `src/stores/mailStore.ts` | `seedDummyTemplates` (inline `templates`) | Standard Cold Outreach Template strings | Zustand Store / Email |
| `src/stores/moodboardStore.ts` | `initialItems` | Visual Moodboard elements (images, color hexes, stickies) with coords | Zustand Store / Moodboard |
| `src/stores/projectStore.ts` | `projects` & `currentProject` | Active Client Projects details (deadline, completion % progress) | Zustand Store / Projects |
| `src/stores/taskStore.ts` | `tasks` | Project Board Tasks (standard & custom validation fields) | Zustand Store / Tasks |
| `src/stores/teamStore.ts` | `initialMembers` & `initialInvites` | Workspace Team Directory profiles & pending invitations status | Zustand Store / Team |
| `src/stores/timeStore.ts` | `entries` | Timesheet entries tracking time spent on tasks | Zustand Store / Timesheet |

---

## 3. Detailed Breakdown of Findings

### 1. Client Details Selection Options (`CLIENT_OPTIONS`)
* **File Path**: `src/components/Billing/NewInvoicePage.tsx`
* **Line Numbers**: 18 - 43
* **Code Snippet**:
```typescript
const CLIENT_OPTIONS: ClientOption[] = [
  {
    name: 'Gabriel Banks',
    email: 'gabriel@banks-enterprises.com',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpauPIgwp57U0aFrctKzRbJ-y25760bg6EoGjHcRsOsHtAV_LymRc1fdbg4DHx4Gftdgfh3FSbAj3kEk79uXE4nFLXwP4YaWsAvMQFYFpqKSsc7priG7AnIhKyUv2u66aa7zgsKyItdxbWZxmwZRVg65YnRP6v38abW4m7-SXp7P2CsangrmXbSfifF78gBFMNirG-Z5yF4EfBNMgaFCfXu9DCl1anjQPuMKdUQ7CVCNCGPtBU9PoCKP6RASbCt3fFZlJRh_o6nTI',
    address: '123 Market Street, Suite 400\nSan Francisco, CA 94103'
  },
  {
    name: 'Claudia Welch',
    email: 'claudia@welchstudios.com',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZtayuSSxTFfVXgd9EtBfC30sR6FEcRcaXtV7PRw8T8aDVF9_yemlu2gmywizm_2azx9L4b9RxfEmXKX35IA3LvKpdkI07eT_IITa8YwoxJNZJM9I_Qty7EdwKbvBrlKhQqrnYFNGPkqZnhFlCNki6WaMkV8iR_gPJXdQmlM9NiMTuduU2-8owy1iJ2Br5jmGywanFCsm2MNR_inZTo0wdKBfWg7NGDpGPl48VZWpEO7GSgWTMOosXYJ11g7klgsEg0fpz6e7vvD8',
    address: '884 Broadway Ave, Floor 12\nNew York, NY 10003'
  },
  {
    name: 'Nina Sherman',
    email: 'nina@shermancollective.io',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlJeR3QoQLOWhKL4wyEDqbCA68NI9VBkyg6v006XyMjxiCIo0XbOrK_P6ab2Bp4YR0sCUPJKclfXCGVAlXJ-ZPZgBWddLnQi4u43fEBUC9kuu6JAPzDjGBxx0CAOK0vUN0aLylhMXqxGmOnL_DHYGVfW1y-VYUFMQkWBbg1OEDmGWAlakXHy_TqKOoTDa7gXGtte74wwOpBYAtEf2zh81JTfabd35hS8Fri61T_7G-pEAAgPvTuWKuLLcQ6KR2tHZVNlTBEI0iFLU',
    address: '450 Lincoln Road, Suite 200\nMiami Beach, FL 33139'
  },
  {
    name: 'Elizabeth Robbins',
    email: 'e.robbins@robbinsgroup.com',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxkD9LGw6lySkUzxEE-OPAH03F9w7CuvYwj0SavnEJQyK8ukuuPz0EuY_T2t4ZuGNCWJhj07svS4YgE4LuA7T4jV9fxffv8v028xhNclFAGNMWNLPNkppdsnw8rjly-DFwMdXBXE9kSPjuykeUHmVgTHZY6VIZ4tiTpO-IZWxzy3tvVS3UQ0ugSeMYW9evjVejLATa8AdiGnwazLTb9MJZuqD5tpLltg_jP7j1aB3rexpCHX0HIQha9_cDTsaMAHOuLnm16xz1_nk',
    address: '770 Boylston St\nBoston, MA 02199'
  }
];
```
* **Description**: A static array of client contact options containing name, email, avatar image URLs, and billing addresses. Used to populate the drop-down selector during the creation of a new invoice in the application.

---

### 2. Default Invoice Line Items State
* **File Path**: `src/components/Billing/NewInvoicePage.tsx`
* **Line Numbers**: 103 - 118
* **Code Snippet**:
```typescript
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li-1',
      description: 'Brand Strategy Workshop',
      subDescription: 'Initial discovery phase and stakeholder interviews',
      quantity: 1,
      rate: 2500.00
    },
    {
      id: 'li-2',
      description: 'UI/UX Design Phase 1',
      subDescription: 'Wireframing and high-fidelity mockups for homepage',
      quantity: 40,
      rate: 150.00
    }
  ]);
```
* **Description**: Pre-populated invoice line items, initializing local React state to display example deliverables (Brand Strategy Workshop and UI/UX Design Phase 1) with quantities and hourly rates in the invoice editor.

---

### 3. Bulk Import Mock Line Items
* **File Path**: `src/components/Billing/NewInvoicePage.tsx`
* **Line Numbers**: 172 - 184
* **Code Snippet**:
```typescript
      {
        id: `li-${Date.now()}-1`,
        description: 'Frontend Development Support',
        subDescription: 'Component implementation and QA verification',
        quantity: 25,
        rate: 120.00
      },
      {
        id: `li-${Date.now()}-2`,
        description: 'Responsive Mobile Optimization',
        subDescription: 'Testing and adjusting layouts across breakpoints',
        quantity: 15,
        rate: 120.00
      }
```
* **Description**: Inline data representing standard engineering deliverables appended to the active `lineItems` state when the "Bulk Import" UI action is triggered by the user.

---

### 4. Client Experts Assignment State (`clientExperts`)
* **File Path**: `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
* **Line Numbers**: 99 - 160
* **Code Snippet**:
```typescript
  const [clientExperts, setClientExperts] = useState<Record<string, { assigned: Expert[], available: Expert[] }>>({
    'alexander-hamilton': {
      assigned: [
        {
          id: 'exp-1',
          name: 'Leslie Alexander',
          email: 'l.alexander@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmq6u6i9p0X6vNLuyVvbIFVhhYOXCyOOveMyg8yLzjLR0xqwDD00yKPSuxv-Pn2oSFNFKsonQWw19bizt-aJMbXbwQgnFgmGKRQRAJ1PsPXCCELQj8BL1VqseqPtB5pMHpM18kvLAVoGBpwyZSiNWEAOCFDOBH-96Z5TFu9OMN79D-yhbZ3bGwtylQ3UcVvLjtBytjH6sD_V7dgtgNdwv-ga43ABUQeYRlUYHJMuJz36olQ1Vw67wr1U1qeQjEoe2xGViKbJBw7n0'
        },
        {
          id: 'exp-2',
          name: 'Bessie Cooper',
          email: 'b.cooper@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7calyNNUKegCLHBi-zoIzcTy-UTP2SIiq8irAQT7DmcFGP8da-8ap737RZA0xyW-0coc7OOjmCqPrGd7V8iY3RngKPNjVrl8xF98QY5U9hFOMDPpyGQqNio8XpfEJPhOOfKLgb2cvXaE_K4I_fL7xHs7ueZJqdjMaDrvcvRrdDMyWg1NBecAs-q3wzLNtAnimI8s_li_D6vVjw7U-0wWHFg-kgxm7QSos8QV64ULZWpDyco0ww2B_amdKUeTXPsCR0NAPGeps0c'
        },
        {
          id: 'exp-3',
          name: 'Marvin McKinney',
          email: 'm.mckinney@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSTSQfeo44DFTkLcJM0K_6DtYjXpfV5JVs5uCuRDApUxTFxLIh7uytFacfms3ZhCWwyFPtI42PSaCdHJ9N9sGsJOc0zi5GHH3QQMp65HWO60eEanX1O-qYPowUdHoIXpxTHD0DGReDZ7ig5veez_mep2USiv773RQOnD71wLX7oq9g7zxrcKjUwPyVDuh7Nf15qZzfHty70nzP-dWnUcCLRLn7cGbI8bi4KnSXPrScdRsu_8C7Xm1QrVT9TIw31HVm6cFjAP_NDl4'
        },
        {
          id: 'exp-4',
          name: 'Devon Lane',
          email: 'd.lane@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpiPgTcFTb8ZkbitN5J83TuEytBdQsFMGxomn1mVjsEkd_NYEER_wF6B1Ba1ma5XR17wEamAfNvdpX49BZh6AfNdWAz4LiimcA9cVDu6Hm9SelzErcTnCWrSYTqUOPpneViO7i7GdrDkoen4xjtI92h6ff71iXw6TAuHLVa_eRoooINBkefdjh7k5WY0lT_G5cMHTnvWoHffuA7xrYO3wppPWjxqP0DhWGpUoMosCg83m4koKDjGyWb5u27OebH0lRy58eJD4rMD4'
        },
        {
          id: 'exp-5',
          name: 'j.graham@example.com',
          email: 'j.graham@example.com',
          invited: true,
          inviteDate: 'May 15'
        },
        {
          id: 'exp-6',
          name: 'd.chambers@example.com',
          email: 'd.chambers@example.com',
          invited: true,
          inviteDate: 'May 12'
        }
      ],
      available: [
        {
          id: 'avail-1',
          name: 'Theresa Webb',
          email: 't.webb@example.com',
          role: 'Senior Designer',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw63H5O15pFV4Vms9rsn-JBwX3YmmJrBY15JI0M2jL7sbBz_TImRyowZLdcna02IVw4hd9lwii04bMi2L7tOU9EHfx_RE3NemVQlU_tDv3HltEuBoQNmNAxbfSbB2dxnD10hU3FoMaDg7-e9-G8pUsmiKJoa4sJwBX8_pKn7xncYeHlgYKif4NV3eMb0eGG4sYF3Av6fbSsTRc54Jnd9OFvfY1LhMS1QaFzrAxLOGNhdwCHUW1P9t39AN34Gmm07KHyA6DysB0UtE',
          online: true
        },
        {
          id: 'avail-2',
          name: 'Arlene McCoy',
          email: 'a.mccoy@example.com',
          role: 'Project Lead',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDagd1dFEbR8kgxiMvHauGS9kDNHoe23_G6QyzO1l3iqb9ywyApkyAgl35CoNPp3k0EPU_WC43wAw0ZlqYhaGnASu5QjN6xboagaYIFIznxxZz0hF4wtSMRURs8O44Eka38U8nM-5i673hJyFwfRYYN99w4uo1WSDI78nZ8y4bd2aJqZGw5PkqTBqyDs5cjAxyXPQpU8erNIoi-S0XKQk-8hbJ2RTVDiuTzt6Z9TEpjGBrfMTjdq3dGT6-_BpooBAY6xkA-l0sjFc',
          online: true
        }
      ]
    }
  });
```
* **Description**: **[⚠️ HIGHLIGHTED DUMMY DATA STRUCTURE]** Component-level state tracking assigned and available agency experts specifically for the mock client `'alexander-hamilton'`. It maps specific team profiles (with avatar links and roles) to the client page workspace sidebar.

---

### 5. Assigned Experts Fallback Data
* **File Path**: `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
* **Line Numbers**: 163 - 196
* **Code Snippet**:
```typescript
    return clientExperts[selectedClient.id] || {
      assigned: [
        {
          id: 'exp-1',
          name: 'Leslie Alexander',
          email: 'l.alexander@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmq6u6i9p0X6vNLuyVvbIFVhhYOXCyOOveMyg8yLzjLR0xqwDD00yKPSuxv-Pn2oSFNFKsonQWw19bizt-aJMbXbwQgnFgmGKRQRAJ1PsPXCCELQj8BL1VqseqPtB5pMHpM18kvLAVoGBpwyZSiNWEAOCFDOBH-96Z5TFu9OMN79D-yhbZ3bGwtylQ3UcVvLjtBytjH6sD_V7dgtgNdwv-ga43ABUQeYRlUYHJMuJz36olQ1Vw67wr1U1qeQjEoe2xGViKbJBw7n0'
        },
        {
          id: 'exp-2',
          name: 'Bessie Cooper',
          email: 'b.cooper@example.com',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7calyNNUKegCLHBi-zoIzcTy-UTP2SIiq8irAQT7DmcFGP8da-8ap737RZA0xyW-0coc7OOjmCqPrGd7V8iY3RngKPNjVrl8xF98QY5U9hFOMDPpyGQqNio8XpfEJPhOOfKLgb2cvXaE_K4I_fL7xHs7ueZJqdjMaDrvcvRrdDMyWg1NBecAs-q3wzLNtAnimI8s_li_D6vVjw7U-0wWHFg-kgxm7QSos8QV64ULZWpDyco0ww2B_amdKUeTXPsCR0NAPGeps0c'
        }
      ],
      available: [
        {
          id: 'avail-1',
          name: 'Theresa Webb',
          email: 't.webb@example.com',
          role: 'Senior Designer',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw63H5O15pFV4Vms9rsn-JBwX3YmmJrBY15JI0M2jL7sbBz_TImRyowZLdcna02IVw4hd9lwii04bMi2L7tOU9EHfx_RE3NemVQlU_tDv3HltEuBoQNmNAxbfSbB2dxnD10hU3FoMaDg7-e9-G8pUsmiKJoa4sJwBX8_pKn7xncYeHlgYKif4NV3eMb0eGG4sYF3Av6fbSsTRc54Jnd9OFvfY1LhMS1QaFzrAxLOGNhdwCHUW1P9t39AN34Gmm07KHyA6DysB0UtE',
          online: true
        },
        {
          id: 'avail-2',
          name: 'Arlene McCoy',
          email: 'a.mccoy@example.com',
          role: 'Project Lead',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDagd1dFEbR8kgxiMvHauGS9kDNHoe23_G6QyzO1l3iqb9ywyApkyAgl35CoNPp3k0EPU_WC43wAw0ZlqYhaGnASu5QjN6xboagaYIFIznxxZz0hF4wtSMRURs8O44Eka38U8nM-5i673hJyFwfRYYN99w4uo1WSDI78nZ8y4bd2aJqZGw5PkqTBqyDs5cjAxyXPQpU8erNIoi-S0XKQk-8hbJ2RTVDiuTzt6Z9TEpjGBrfMTjdq3dGT6-_BpooBAY6xkA-l0sjFc',
          online: true
        }
      ]
    };
```
* **Description**: A fallback value inside the `activeExperts` `useMemo` hook, returning default assigned/available team records if the chosen client profile does not have custom mapping initialized in the state.

---

### 6. Pinned Assets State (`pinnedAssets`)
* **File Path**: `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
* **Line Numbers**: 258 - 261
* **Code Snippet**:
```typescript
  const [pinnedAssets, setPinnedAssets] = useState<Array<{ id: string; name: string; type: 'pdf' | 'zip' | 'doc'; date: string }>>([
    { id: 'a1', name: 'Brand Guidelines', type: 'pdf', date: 'Updated 2 days ago' },
    { id: 'a2', name: 'Website Assets.zip', type: 'zip', date: 'Uploaded Sep 30, 2023' }
  ]);
```
* **Description**: Local React state simulating active cloud assets and downloadable documents (Brand Guidelines, Website Assets zip) pinned to a client profile layout.

---

### 7. Client Profile Activity Logs (`activityLogs`)
* **File Path**: `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
* **Line Numbers**: 263 - 267
* **Code Snippet**:
```typescript
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; user: string; action: string; target: string; time: string; type: 'note' | 'task' | 'comment' }>>([
    { id: 'act-1', user: 'Sarah Connor', action: 'added a note to', target: 'Audit Report', time: '1 hour ago', type: 'note' },
    { id: 'act-2', user: 'Task completed', action: 'Homepage Design Review was marked as complete', target: '', time: '4 hours ago', type: 'task' },
    { id: 'act-3', user: 'Alexander Hamilton', action: 'commented on', target: 'Strategic Plan', time: 'Yesterday at 2:30 PM', type: 'comment' }
  ]);
```
* **Description**: A local React state pre-populated with mock event logs (note additions, task completion, client comments) simulating audit histories.

---

### 8. Default Communication Labels (`initialLabels`)
* **File Path**: `src/components/Clients/Sidebars/ManageTagsSidebar.tsx`
* **Line Numbers**: 48 - 60
* **Code Snippet**:
```typescript
    let initialLabels = defaultLabels || [
      'Direct',
      'Office',
      'Billing',
      'Urgent',
      'Slack Handle',
      'Discord Direct',
      'Creative Director',
      'Account Management',
      'General support',
      'Personal Alternate',
      'HQ Reception'
    ];
```
* **Description**: Standard fallback communication channels list used to populate tagging sidebars and contact classification dropdown elements.

---

### 9. Notification Dropdown Mock Data
* **File Path**: `src/components/GlobalComponents/NotificationDropdown.tsx`
* **Line Numbers**: 20 - 24
* **Code Snippet**:
```typescript
  const notifications = [
    { id: 1, title: 'New Comment', message: 'Alex left a comment on Homepage Design.', time: '10m ago', unread: true },
    { id: 2, title: 'Task Completed', message: 'Wireframes have been approved.', time: '1h ago', unread: false },
    { id: 3, title: 'Meeting Reminder', message: 'Client sync in 15 minutes.', time: '2h ago', unread: false },
  ];
```
* **Description**: Hardcoded notifications list mapping titles, contents, and timestamps. Simulates real-time system alerts pushed to users.

---

### 10. Comment Mention Members Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 144 - 151
* **Code Snippet**:
```tsx
      const rawItems = [
        { id: 'me', name: 'Me', avatar: 'ID', subtitle: 'You' },
        { id: 'sarah', name: 'Sarah Jenkins', avatar: 'SJ', subtitle: 'Product' },
        { id: 'marcus', name: 'Marcus Chen', avatar: 'MC', subtitle: 'Design' },
        { id: 'agent', name: 'Onboarding Assistant', avatar: 'https://i.pravatar.cc/150?img=47', tag: 'My Agent' },
        { id: 'create', name: 'Create Agent', icon: 'add', isAction: true },
        { id: 'followers', name: 'Followers', icon: 'visibility', isAction: true },
      ];
```
* **Description**: Static array of team members, avatars, and actions to feed the autocomplete mention suggestions when a user types `@` in comments.

---

### 11. Comment Mention Documents Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 166 - 171
* **Code Snippet**:
```tsx
      const rawDocs = [
        { id: 'untitled', name: 'Untitled', icon: 'description' },
        { id: 'page2', name: 'Page 2', icon: 'description' },
        { id: 'briefs', name: 'Client briefs', icon: 'description' },
        { id: 'launch', name: 'Launch Plan', icon: 'description' },
      ];
```
* **Description**: Static metadata matching document titles, icons, and IDs to serve autocomplete results when typing `#` in comments.

---

### 12. Comment Mention Channels Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 176 - 180
* **Code Snippet**:
```tsx
      const rawChannels = [
        { id: 'general', name: 'general', icon: 'tag' },
        { id: 'marketing', name: 'marketing', icon: 'tag' },
        { id: 'engineering', name: 'engineering', icon: 'tag' },
      ];
```
* **Description**: Static channel tags lists, supplying suggestions when mentioning rooms via comments input fields.

---

### 13. Billing Renewals Fallback Mock UI Data
* **File Path**: `src/components/Dashboard/Renewals.tsx`
* **Line Numbers**: 100 - 130
* **Code Snippet**:
```tsx
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Adobe Creative Cloud</p>
                    <p className="text-[10px] text-slate-500">Software Suite</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wider">2 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$54.99</p>
                  </div>
                </div>
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Figma Professional</p>
                    ...
```
* **Description**: Fallback renewals list UI nodes, hardcoding Adobe, Figma, and Slack subscription lines in JSX markup.

---

### 14. Files Tab Mock UI Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/FilesTab.tsx`
* **Line Numbers**: 68 - 88, 112 - 189, 209 - 250
* **Code Snippet**:
```tsx
            {/* Recent Files Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-rose-500">picture_as_pdf</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">brand_guide.pdf</h4>
              <p className="text-[10px] text-slate-500 mt-1">Updated 2h ago • 4.2 MB</p>
            </div>
```
* **Description**: JSX layout code hardcoding dummy elements inside folders structure tables to showcase designs (recent file, approved Figma pages, zip pack assets).

---

### 15. Billing Store Data (`useBillingStore`)
* **File Path**: `src/stores/billingStore.ts`
* **Line Numbers**: 60 - 105
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
* **Description**: Financial account balances, credit cards details, addresses, and history billing receipts linked under "Bruce Wayne" in the global Zustand workspace.

---

### 16. Client Store CRM Profiles (`initialClients`)
* **File Path**: `src/stores/clientStore.ts`
* **Line Numbers**: 91 - 389
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
      }
    ],
    tags: ['GOVERNMENT', 'STRATEGIC', 'FINTECH']
  }
  // ... other items including john-doe, sarah-miller, tech-flow, global-media, creative-spark, next-gen
];
```
* **Description**: State database representing active clients matching name, brand palettes, historical milestones, and contact numbers.

---

### 17. Client Store Log Notes (`initialNotes`)
* **File Path**: `src/stores/clientStore.ts`
* **Line Numbers**: 391 - 436
* **Code Snippet**:
```typescript
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
  {
    id: 'n2',
    clientId: 'tech-flow',
    clientInitials: 'TF',
    type: 'Idea',
    content: 'Potential feature: Automated invoice reminders. Check feasibility with the dev team next sprint.',
    authorInitials: 'TF',
    timeText: 'Yesterday',
    date: 'Oct 23, 2024',
    tags: ['Billing', 'Automations']
  },
  {
    id: 'n3',
    clientId: 'sarah-miller',
    clientInitials: 'SM',
    type: 'Feedback',
    content: 'Client loved the new color palette! "Fresh and modern" were the exact words.',
    authorInitials: 'SM',
    timeText: 'Oct 24',
    date: 'Oct 24, 2024',
    tags: ['Creative', 'Colors']
  },
  {
    id: 'n4',
    clientId: 'john-doe',
    clientInitials: 'JD',
    type: 'Urgent',
    content: 'Server migration scheduled for Friday night. Inform all active clients about potential downtime.',
    authorInitials: 'JD',
    timeText: 'Oct 22',
    date: 'Oct 22, 2024',
    tags: ['Infrastructure', 'Maintenance']
  }
];
```
* **Description**: Interaction logs tracking meeting notes, ideas, comments, and server maintenance events linked to client profile feeds.

---

### 18. Leads Table Headers Schema (`DEFAULT_COLUMNS` & `DEFAULT_COLUMN_LABELS`)
* **File Path**: `src/stores/leadStore.ts`
* **Line Numbers**: 84 - 107
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
```
* **Description**: Layout structure defining columns, sizes, and localization headings for the leads tables.

---

### 19. Leads Pipeline Candidates (`DUMMY_LEADS`)
* **File Path**: `src/stores/leadStore.ts`
* **Line Numbers**: 109 - 204
* **Code Snippet**:
```typescript
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
  }
  // ... other items including lead_2, lead_3, lead_4, lead_5, lead_6, lead_7
];
```
* **Description**: Sales pipeline leads database containing contact names, origin channels, estimated values, and classifications.

---

### 20. Mail Store outbound logs, replies, and templates
* **File Path**: `src/stores/mailStore.ts`
* **Line Numbers**: 86 - 108 (`sentEmails`), 112 - 164 (`seedDummyData`), 396 - 413 (`seedDummyTemplates`)
* **Code Snippet**:
```typescript
      sentEmails: [
        {
          id: 'mail_dummy_1',
          leadId: 'lead_1', // Alice Freeman
          subject: 'Partnership Opportunity with Flow Studio',
          body: 'Hi Alice,\n\nI was really impressed with your latest project at TechVision. I think our new design system at Flow Studio could drastically cut down your UI development time.\n\nWould you be open to a brief 10-minute chat next week to discuss this?\n\nBest,\nFlow Team',
          sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      // Replies Seed in seedDummyData
      replies: [
        {
          id: 'reply_dummy_1',
          sentEmailId: 'mail_dummy_2',
          leadId: 'lead_1',
          subject: 'Re: Partnership Opportunity with Flow Studio',
          body: 'Hi Flow Team,\n\nThanks for following up! Yes, I did take a look and it seems very interesting. I am available next Tuesday at 2 PM PST.\n\nAlice',
          receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      // Templates Seed in seedDummyTemplates
      templates: [
        {
          id: 'tpl_dummy_1',
          name: 'Cold Outreach (Standard)',
          subject: 'Streamlining UI for {{company}}',
          body: 'Hi {{name}},\n\nI noticed the amazing work you are doing over at {{company}}.\n\nAt Flow Studio, we help product teams move 3x faster by providing premium, plug-and-play UI systems. I thought it might be highly relevant to your current roadmap.\n\nAre you open to a quick 5-minute chat this week to see if there is a mutual fit?\n\nBest regards,\nFlow Team'
        }
      ]
```
* **Description**: Email histories log lists, user thread conversation flows, and outbound cold outreach marketing templates.

---

### 21. Moodboard Canvas Objects (`initialItems`)
* **File Path**: `src/stores/moodboardStore.ts`
* **Line Numbers**: 6 - 111
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
  {
    id: '3',
    type: 'color',
    x: 5580,
    y: 5160,
    title: 'Electric',
    color: '#1978E5',
    width: 160,
    height: 160,
    rotation: 0,
  },
  {
    id: '4',
    type: 'text',
    x: 5800,
    y: 5040,
    title: 'Typography',
    content: 'Inter - Body Copy / UI',
    width: 250,
    height: 80,
    rotation: 0,
  },
  {
    id: '5',
    type: 'note',
    x: 5200,
    y: 5400,
    content: "Don't forget to check the contrast ratios on the primary button style!",
    width: 240,
    height: 150,
    rotation: 2,
  }
  // ... including type shape vectors (rectangles, circles)
];
```
* **Description**: Predefined workspace assets layout on an infinite whiteboard canvas, containing images, text, notes, shapes, and color swatches.

---

### 22. Projects List and Current Project
* **File Path**: `src/stores/projectStore.ts`
* **Line Numbers**: 42 - 79 (`projects` list), 80 - 94 (`currentProject` default state)
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
        {
          id: 'fintech-app',
          name: "Fintech App UI",
          title: "Fintech App UI",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXmo8m29Yj_XDkfgZ4KejySYeWbqBAj51e0AvhN5-Fz20vW1qCtLYfA6dKJacCD2b0l7YY3qsVzBgYrDVEbhCDVpL5RNKRWjGked1_iRxa12qIZ8BVTvV-fPjnML6OYWRZ2BZ6e0QJS_uEjf_W6xYnMnIfrbyE0zpO8PT5Ne6hGSF2bMfj1ColCHGD5JKbbn1OA4pOTzrAEecn7iBerJZer4k4nHsXgPNCmJvYW0opn4xiC-njf-_o0zc2jD7zJbRl0eSaKNgMW4I",
          thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXmo8m29Yj_XDkfgZ4KejySYeWbqBAj51e0AvhN5-Fz20vW1qCtLYfA6dKJacCD2b0l7YY3qsVzBgYrDVEbhCDVpL5RNKRWjGked1_iRxa12qIZ8BVTvV-fPjnML6OYWRZ2BZ6e0QJS_uEjf_W6xYnMnIfrbyE0zpO8PT5Ne6hGSF2bMfj1ColCHGD5JKbbn1OA4pOTzrAEecn7iBerJZer4k4nHsXgPNCmJvYW0opn4xiC-njf-_o0zc2jD7zJbRl0eSaKNgMW4I",
          category: "App Design",
          status: "Review",
          statusColor: "bg-indigo-600/90",
          progress: 65,
          completion: 65,
          client: "Vault Bank",
          deadline: "2024-12-12",
          isPortfolio: false,
          tasksCount: 24,
          commentsCount: 8,
          tags: ['Branding', 'Fintech', 'Design']
        }
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
      }
```
* **Description**: List of workspace active projects with names, deadlines, clients, and completion status.

---

### 23. Task Board Tasks (`tasks`)
* **File Path**: `src/stores/taskStore.ts`
* **Line Numbers**: 83 - 271
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
        {
          id: '2',
          projectId: 'rebrand-2024',
          title: 'Logo Exporting & Packaging',
          details: 'Export all logo variants in SVG, PNG, and AI formats.',
          dueDate: '2026-05-21',
          priority: 'medium',
          phase: 'inprogress',
          assignees: [{ id: '2', name: 'Marcus Chen', avatar: 'MC' }],
          status: 'Incomplete'
        }
        // ... standard sprint tasks and custom validation tasks field-task-1 to field-task-13
      ]
```
* **Description**: Project task cards containing categories, assignees, deadlines, and specific system custom field validation tasks.

---

### 24. Workspace Team Directory (`initialMembers` & `initialInvites`)
* **File Path**: `src/stores/teamStore.ts`
* **Line Numbers**: 49 - 106 (`initialMembers`), 108 - 121 (`initialInvites`)
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
  }
  // ... other members including m2, m3, m4
];

const initialInvites: TeamInvite[] = [
  {
    id: 'inv1',
    email: 'david.kim@flowstudio.com',
    role: 'Designer',
    sentDate: 'Yesterday'
  },
  {
    id: 'inv2',
    email: 'claire.voyant@flowstudio.com',
    role: 'Guest',
    sentDate: '3 days ago'
  }
];
```
* **Description**: Global team members profiles, including contact numbers, assigned projects, focal tasks, and system invitations status.

---

### 25. Timesheet Entries (`entries`)
* **File Path**: `src/stores/timeStore.ts`
* **Line Numbers**: 37 - 56
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
* **Description**: Timesheet entries tracking start time, end time, and durations spent on specific project deliverables.
