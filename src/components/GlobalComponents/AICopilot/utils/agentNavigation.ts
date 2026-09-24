/**
 * The view ids `App.tsx` actually routes, mirrored from the `switch` in
 * `renderContent()`. `navigate_to` used to accept a free string, which meant
 * the model could emit a plausible-but-unroutable page and the navigation would
 * silently no-op — and its schema description advertised a page set that did
 * not match the router (it omitted several real pages and included one that is
 * deliberately out of scope).
 *
 * Keep this list in step with `App.tsx`. Excluded destinations are listed
 * separately so the omission reads as a decision rather than an oversight.
 */
export const NAVIGABLE_VIEWS = [
  'dashboard',
  'projects',
  'new-project',
  'project-overview',
  'project-tasks',
  'project-files',
  'project-notes',
  'project-moodboard',
  'leads',
  'lead-generator',
  'email-drafts',
  'sent-emails',
  'clients',
  'team',
  'member-details',
  'files',
  'calendar',
  'time',
  'billing',
  'new-invoice',
  'reports',
] as const;

export type NavigableView = (typeof NAVIGABLE_VIEWS)[number];

/**
 * Routable in the app, but not agent-navigable: Settings and Developer tools
 * are out of scope, and Data is the recycle bin.
 */
export const EXCLUDED_VIEWS = ['settings', 'dev-settings', 'data'] as const;

export const isNavigableView = (view: unknown): view is NavigableView =>
  typeof view === 'string' && (NAVIGABLE_VIEWS as readonly string[]).includes(view);
