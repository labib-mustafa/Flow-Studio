# Mock Data Structures Scan Analysis

This report documents the hardcoded mock data structures found in the Flow-Studio React project within the following directories:
- `src/components/Dashboard/`
- `src/components/Data/`
- `src/components/GlobalComponents/`

---

## 1. Notification Dropdown Mock Data
* **File Path**: `src/components/GlobalComponents/NotificationDropdown.tsx`
* **Line Numbers**: 20-24
* **Description**: An array of mock notification objects containing identifier (`id`), type/category (`title`), message content (`message`), relative timestamp (`time`), and read status (`unread`). Used to simulate dynamic user alerts.
* **Code Snippet**:
```tsx
  const notifications = [
    { id: 1, title: 'New Comment', message: 'Alex left a comment on Homepage Design.', time: '10m ago', unread: true },
    { id: 2, title: 'Task Completed', message: 'Wireframes have been approved.', time: '1h ago', unread: false },
    { id: 3, title: 'Meeting Reminder', message: 'Client sync in 15 minutes.', time: '2h ago', unread: false },
  ];
```

---

## 2. Comment Mention Members Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 144-151
* **Description**: An array of mock team members and system agents (with `id`, `name`, `avatar`, and `subtitle`/`tag`) used to populate the `@` mention autocomplete suggestions list inside task comments.
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

---

## 3. Comment Mention Documents Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 166-171
* **Description**: An array of mock document metadata objects used to populate the document mention autocomplete suggestions list within task comments.
* **Code Snippet**:
```tsx
      const rawDocs = [
        { id: 'untitled', name: 'Untitled', icon: 'description' },
        { id: 'page2', name: 'Page 2', icon: 'description' },
        { id: 'briefs', name: 'Client briefs', icon: 'description' },
        { id: 'launch', name: 'Launch Plan', icon: 'description' },
      ];
```

---

## 4. Comment Mention Channels Mock Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/TaskCommentsPopover.tsx`
* **Line Numbers**: 176-180
* **Description**: An array of mock chat channel objects used to populate the channel mention autocomplete suggestions list within task comments.
* **Code Snippet**:
```tsx
      const rawChannels = [
        { id: 'general', name: 'general', icon: 'tag' },
        { id: 'marketing', name: 'marketing', icon: 'tag' },
        { id: 'engineering', name: 'engineering', icon: 'tag' },
      ];
```

---

## 5. Billing Renewals Fallback Mock UI Data
* **File Path**: `src/components/Dashboard/Renewals.tsx`
* **Line Numbers**: 100-130
* **Description**: Mock billing/subscription renewal items hardcoded directly into the component's JSX markup as a fallback visual dataset. Represents active services (Adobe Creative Cloud, Figma Professional, Slack Enterprise) and their corresponding pricing, category, and renewal urgency.
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
                    <p className="text-[10px] text-slate-500">Design Tool</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">5 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$45.00</p>
                  </div>
                </div>
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Slack Enterprise</p>
                    <p className="text-[10px] text-slate-500">Communication</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">12 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$120.00</p>
                  </div>
                </div>
```

---

## 6. Files Tab Mock UI Data
* **File Path**: `src/components/GlobalComponents/Pages/TaskPage/FilesTab.tsx`
* **Line Numbers**: 68-88, 112-189, 209-250
* **Description**: HTML/JSX markup that hardcodes individual mock file list items (Recent Files, Ready to Ship table, and All Project Assets). Included as a fallback view to demonstrate component states.
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
            {/* Ready to Ship Section */}
            <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                    <span className="material-symbols-outlined text-[20px]">web_asset</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">Homepage_v4_Final.fig</span>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide">Approved</span>
                  </div>
                </div>
              </td>
              ...
```
