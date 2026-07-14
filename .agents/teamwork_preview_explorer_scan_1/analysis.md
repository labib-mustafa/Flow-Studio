# Analysis of Hardcoded Mock Data Structures

This report lists the hardcoded mock data structures identified during the scan of the specified components directories.

---

## Findings

### 1. Client Details Selection Options (`CLIENT_OPTIONS`)
- **File Path:** `src/components/Billing/NewInvoicePage.tsx`
- **Line Numbers:** 18 - 43
- **Code Snippet:**
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
- **Description:** Hardcoded list of mock client objects used to populate selection options when creating a new invoice in the application.

---

### 2. Default Invoice Line Items State
- **File Path:** `src/components/Billing/NewInvoicePage.tsx`
- **Line Numbers:** 103 - 118
- **Code Snippet:**
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
- **Description:** Pre-populated initial React state representing typical service deliverables, serving as placeholder data in the invoice builder.

---

### 3. Bulk Import Mock Line Items
- **File Path:** `src/components/Billing/NewInvoicePage.tsx`
- **Line Numbers:** 172 - 184
- **Code Snippet:**
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
- **Description:** Hardcoded list of mock line items appended to the invoice when the user triggers the "Bulk Import" action.

---

### 4. Client Experts Assignment State (`clientExperts`)
- **File Path:** `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
- **Line Numbers:** 99 - 160
- **Code Snippet:**
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
- **Description:** Hardcoded state map of client IDs to arrays of assigned and available internal experts (specifically for the mock client `alexander-hamilton`).

---

### 5. Assigned Experts Fallback Data
- **File Path:** `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
- **Line Numbers:** 163 - 196
- **Code Snippet:**
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
- **Description:** Hardcoded fallback values for assigned and available experts, used when a client does not have any customized team mapping defined.

---

### 6. Pinned Assets State (`pinnedAssets`)
- **File Path:** `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
- **Line Numbers:** 258 - 261
- **Code Snippet:**
```typescript
  const [pinnedAssets, setPinnedAssets] = useState<Array<{ id: string; name: string; type: 'pdf' | 'zip' | 'doc'; date: string }>>([
    { id: 'a1', name: 'Brand Guidelines', type: 'pdf', date: 'Updated 2 days ago' },
    { id: 'a2', name: 'Website Assets.zip', type: 'zip', date: 'Uploaded Sep 30, 2023' }
  ]);
```
- **Description:** Pre-populated state representing uploaded asset files pinned to the client profile directory.

---

### 7. Client Profile Activity Logs (`activityLogs`)
- **File Path:** `src/components/Clients/ClientsDetails/ClientDetailsPage.tsx`
- **Line Numbers:** 263 - 267
- **Code Snippet:**
```typescript
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; user: string; action: string; target: string; time: string; type: 'note' | 'task' | 'comment' }>>([
    { id: 'act-1', user: 'Sarah Connor', action: 'added a note to', target: 'Audit Report', time: '1 hour ago', type: 'note' },
    { id: 'act-2', user: 'Task completed', action: 'Homepage Design Review was marked as complete', target: '', time: '4 hours ago', type: 'task' },
    { id: 'act-3', user: 'Alexander Hamilton', action: 'commented on', target: 'Strategic Plan', time: 'Yesterday at 2:30 PM', type: 'comment' }
  ]);
```
- **Description:** Pre-populated state of user interactions with a client profile, displayed on the client details activity feed.

---

### 8. Default Communication Labels (`initialLabels`)
- **File Path:** `src/components/Clients/Sidebars/ManageTagsSidebar.tsx`
- **Line Numbers:** 48 - 60
- **Code Snippet:**
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
- **Description:** Hardcoded default set of label options shown to users when tagging communication channels or client contact nodes.
