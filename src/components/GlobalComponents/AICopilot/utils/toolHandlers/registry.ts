/**
 * Authoritative list of tool names the client-side handlers actually branch on.
 *
 * Why this exists as its own module: the dispatcher previously reported one
 * generic message for two very different failures —
 *
 *   - the model called a name no handler implements (a wiring bug), and
 *   - a handler ran but could not resolve its target (a data/lookup miss).
 *
 * Collapsing them is what let seven dead tools go unnoticed: a schema argument
 * was renamed (`clientName` -> the handler read `clientId`/`name`), the lookup
 * resolved to undefined, and the failure looked identical to "item not found".
 * Separating the two keeps wiring bugs loud.
 *
 * Keep in sync when adding tools. The server-side counterpart is `toolNames`
 * exported from `serverAiTools.ts`; that module cannot be imported here because
 * it pulls in `@google/genai`, which should not enter the client bundle.
 */
export const HANDLED_TOOL_NAMES: ReadonlySet<string> = new Set<string>([
  // Tasks
  'create_tasks',
  'update_task',
  'delete_tasks',
  'add_task_comment',
  'list_task_board_schema',
  'set_task_assignees',
  'bulk_update_tasks',
  'set_task_dates',
  'set_task_type',
  'write_task_field_value',
  'create_task_field',
  'update_task_field',
  'update_task_status_config',
  'sort_task_board',

  // Projects
  'create_new_project',
  'update_project',
  'delete_project',
  'manage_project_tags',
  'link_project_resource',
  'update_project_banner',
  'create_project_folder',

  // Clients CRM
  'create_client',
  'update_client',
  'delete_client',

  // Client details
  'book_client_appointment',
  'manage_client_tags',
  'create_client_note',
  'log_client_invoice',
  'create_client_task',

  // Client assets, ratings, discovery
  'attach_client_document',
  'rate_client',
  'assign_client_expert',
  'open_client_details',
  'scrape_leads',

  // Leads
  'create_lead',
  'update_lead',
  'delete_lead',
  'promote_lead_to_client',

  // Team
  'create_team_member',
  'update_team_member',
  'delete_team_member',

  // Billing / invoicing
  'create_invoice',
  'update_invoice_status',
  'delete_invoice',

  // Calendar
  'schedule_event',
  'update_event',
  'delete_event',

  // Time tracking
  'start_timer',
  'stop_timer',
  'add_time_entry',

  // Notes
  'create_project_note',
  'update_project_note',
  'delete_project_notes',

  // Moodboard
  'add_moodboard_items',
  'clear_moodboard',
  'delete_moodboard_item',
  'select_moodboard_items',
  'align_moodboard_items',
  'distribute_moodboard_items',
  'duplicate_moodboard_items',
  'arrange_moodboard_items',
  'toggle_lock_moodboard_items',
  'update_moodboard_item',
  'set_moodboard_item_categories',
  'filter_moodboard_by_category',
  'manage_moodboard_comments',
  'configure_moodboard_grid',
  'control_moodboard_view',
  'extract_moodboard_palette',
  'crop_moodboard_item',
  'create_moodboard_section',
  'undo_moodboard',
  'redo_moodboard',

  // Read-only intelligence
  'get_studio_overview',
  'get_task_board_digest',
  'get_project_digest',
  'get_client_digest',
  'get_lead_pipeline_digest',
  'get_time_summary',
  'get_calendar_agenda',
  'list_activities',
  'list_notifications',
  'mark_notifications_read',

  // Lead scraper
  'list_scraper_config',
  'list_scraped_leads',
  'update_scraper_config',
  'set_scraper_filters',
  'set_scraper_tab',
  'select_scraped_leads',
  'remove_scraped_lead',
  'clear_scraped_leads',
  'add_scraped_leads',
  'clear_scraper_logs',

  // Leads pipeline
  'list_lead_columns',
  'list_leads',
  'select_leads',
  'bulk_update_leads',
  'bulk_delete_leads',
  'bulk_promote_leads',
  'reorder_lead',
  'import_leads_csv',
  'create_lead_column',
  'update_lead_column',
  'delete_lead_column',
  'reorder_lead_columns',
  'log_lead_activity',

  // Team administration
  'list_team',
  'invite_team_member',
  'resend_team_invite',
  'revoke_team_invite',
  'manage_team_role',

  // Billing profile
  'list_billing_summary',
  'update_billing_address',
  'update_saved_card',

  // Email campaigns & templates
  'list_email_templates',
  'create_email_template',
  'update_email_template',
  'delete_email_template',
  'list_email_campaigns',
  'create_email_batch',
  'manage_email_batch',
  'manage_queue_item',
  'process_email_queue',
  'sync_email_replies',
  'list_email_replies',
  'update_followup_settings',
  'send_bulk_email',

  // Navigation
  'navigate_to',
]);

export const isToolHandled = (name: string): boolean => HANDLED_TOOL_NAMES.has(name);
