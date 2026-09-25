import { Type } from '@google/genai';

// ==========================================
// 1. Groq Native OpenAI Tool Definitions
// ==========================================
export const groqTools = [
  // --- TASKS ---
  {
    type: 'function',
    function: {
      name: 'create_tasks',
      description: 'Create one or more actionable project tasks in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            description: 'List of tasks to create',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Clear, concise task title' },
                details: { type: 'string', description: 'Task description or requirements' },
                priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
                phase: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'] },
                dueDate: { type: 'string', description: 'Target date in YYYY-MM-DD format' }
              },
              required: ['title']
            }
          }
        },
        required: ['tasks']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update status, phase, priority, due date, or details of an existing task.',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Title or partial title of the task to update' },
          taskId: { type: 'string', description: 'ID of the task (if known)' },
          phase: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'] },
          priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
          status: { type: 'string', description: 'Status: Incomplete or Completed' },
          dueDate: { type: 'string', description: 'Date in YYYY-MM-DD' },
          details: { type: 'string', description: 'Updated task description' }
        },
        required: ['taskTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_tasks',
      description: 'Delete or clear tasks in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          deleteAll: { type: 'boolean', description: 'True to clear all tasks in project' },
          taskTitle: { type: 'string', description: 'Title of specific task to delete' }
        },
        required: ['deleteAll']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_task_comment',
      description: 'Add a comment or progress update note to an existing task.',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Title of the task' },
          comment: { type: 'string', description: 'Comment text to append' }
        },
        required: ['taskTitle', 'comment']
      }
    }
  },

  // --- PROJECTS ---
  {
    type: 'function',
    function: {
      name: 'create_new_project',
      description: 'Create a new project workspace record in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project title' },
          clientName: { type: 'string', description: 'Client or organization name' },
          description: { type: 'string', description: 'Project overview and scope' },
          deadline: { type: 'string', description: 'Target delivery date (YYYY-MM-DD)' },
          status: { type: 'string', enum: ['Planning', 'active', 'In Progress', 'Completed'] }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: 'Update active or targeted project metadata (status, deadline, title, client, description, category, tags, links, or banner).',
      parameters: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string', description: 'Title of the project to update' },
          status: { type: 'string', description: 'New status (Planning, active, In Progress, Completed, On Hold)' },
          deadline: { type: 'string', description: 'New deadline (YYYY-MM-DD)' },
          clientName: { type: 'string', description: 'Updated client name' },
          description: { type: 'string', description: 'Updated project scope or description' },
          category: { type: 'string', description: 'Project category (e.g. Branding, Fintech, Mobile App)' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Full taxonomy labels list' },
          figmaUrl: { type: 'string', description: 'Figma master file canvas URL' },
          briefUrl: { type: 'string', description: 'Client brief document URL' },
          thumbnail: { type: 'string', description: 'Cover hero image or thumbnail URL' }
        },
        required: ['projectTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_project',
      description: 'Delete or archive a project in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string', description: 'Title of the project to delete' }
        },
        required: ['projectTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_project_tags',
      description: 'Add or remove taxonomy labels/tags on the active or targeted project in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'remove'], description: 'Whether to add or remove the tag' },
          tag: { type: 'string', description: 'Tag or taxonomy label text (e.g. Fintech, Rebrand, Web App)' },
          projectTitle: { type: 'string', description: 'Optional project title' }
        },
        required: ['action', 'tag']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'link_project_resource',
      description: 'Link external master deliverables to a project: Figma Master URL or Client Brief Document URL.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['figma', 'brief'], description: 'Resource type: figma or brief' },
          url: { type: 'string', description: 'Full URL to Figma canvas or Brief doc (Notion, Google Docs)' },
          projectTitle: { type: 'string', description: 'Optional project title' }
        },
        required: ['type', 'url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_project_banner',
      description: 'Update the hero cover banner or thumbnail image URL of a project.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Image URL or data URI for the project showcase banner' },
          projectTitle: { type: 'string', description: 'Optional project title' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_project_folder',
      description: 'Create the dedicated filesystem workspace folder for the active or targeted project.',
      parameters: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string', description: 'Optional title of project to create folder for' }
        }
      }
    }
  },

  // --- CLIENTS CRM ---
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Create a new client account in Flow Studio Clients CRM.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Client or primary contact name' },
          company: { type: 'string', description: 'Client company or business name' },
          email: { type: 'string', description: 'Contact email' },
          phone: { type: 'string', description: 'Contact phone' },
          location: { type: 'string', description: 'City/Country location' },
          status: { type: 'string', enum: ['Active', 'Prospect', 'Inactive'] },
          totalVolume: { type: 'number', description: 'Estimated contract value or budget' }
        },
        required: ['name', 'company']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_client',
      description: 'Update client CRM profile (status, contact info, company).',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client to update' },
          status: { type: 'string', enum: ['Active', 'Prospect', 'Inactive'] },
          email: { type: 'string', description: 'Updated email' },
          phone: { type: 'string', description: 'Updated phone' },
          location: { type: 'string', description: 'Updated location' }
        },
        required: ['clientName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_client',
      description: 'Remove or archive a client record from Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of client to remove' }
        },
        required: ['clientName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_client_appointment',
      description: 'Schedule an appointment or consultation meeting with a client, logging to activity and calendar.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          topic: { type: 'string', description: 'Topic or agenda of the meeting' },
          expertName: { type: 'string', description: 'Assigned expert (e.g. Leslie Alexander, Bessie Cooper)' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD' },
          time: { type: 'string', description: 'Time (e.g. 11:00 or 2:00 PM)' }
        },
        required: ['clientName', 'topic', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_client_tags',
      description: 'Add, remove, or set branding/categorization tags on a client.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          action: { type: 'string', enum: ['add', 'remove', 'set'], description: 'Action to perform' },
          tags: { type: 'array', items: { type: 'string' }, description: 'List of tags (e.g. STRATEGIC, FINTECH, GOVERNMENT)' }
        },
        required: ['clientName', 'tags']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_client_note',
      description: 'Record an operational or meeting log note on a client profile.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          type: { type: 'string', enum: ['Meeting', 'Idea', 'Feedback', 'Urgent'], description: 'Note category' },
          content: { type: 'string', description: 'Note narrative content' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags list' }
        },
        required: ['clientName', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_client_invoice',
      description: 'Issue and log a billing invoice for a specific client with a maturity duration.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          amount: { type: 'number', description: 'Dollar invoice amount' },
          dueDays: { type: 'number', description: 'Days until maturity (e.g. 7, 14, 30, 60)' },
          note: { type: 'string', description: 'Optional invoice description' }
        },
        required: ['clientName', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_client_task',
      description: 'Schedule a task or assignment directly for a client in their client profile.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          title: { type: 'string', description: 'Assignment title' },
          phase: { type: 'string', description: 'Phase or category (e.g. Development, Audit, Review)' },
          dueText: { type: 'string', description: 'Due date text label (e.g. Due in 7 days)' }
        },
        required: ['clientName', 'title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'attach_client_document',
      description: 'Attach a regulatory document or template (e.g. Mutual NDA, Master Services Agreement MSA v4, Onboarding Workbook, SOW) to a client asset vault.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          documentName: { type: 'string', description: 'Document name (e.g. Mutual Non-Disclosure Agreement (NDA).pdf)' },
          documentType: { type: 'string', enum: ['pdf', 'doc', 'zip'] }
        },
        required: ['clientName', 'documentName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rate_client',
      description: 'Set communication or velocity speed rating (1-5 stars) for a client.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          communicationRating: { type: 'number', description: 'Rating from 1 to 5' },
          speedRating: { type: 'number', description: 'Rating from 1 to 5' }
        },
        required: ['clientName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_client_expert',
      description: 'Assign or unassign a team expert / consultant to a client.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client' },
          expertName: { type: 'string', description: 'Name of the expert' },
          action: { type: 'string', enum: ['assign', 'unassign'], description: 'Whether to assign or remove' }
        },
        required: ['clientName', 'expertName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_client_details',
      description: 'Open a client profile in Flow Studio and optionally switch to a specific tab.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Name of the client to open' },
          tab: { type: 'string', enum: ['overview', 'tasks', 'files', 'notes', 'financials', 'projects'], description: 'Tab to view' }
        },
        required: ['clientName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scrape_leads',
      description: 'Scrape or search prospective sales leads by business keyword and location.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Business keyword or niche (e.g. Fintech, Coffee Roasters)' },
          location: { type: 'string', description: 'City or geographic location (e.g. Austin, TX)' },
          count: { type: 'number', description: 'Number of leads to generate/find' }
        },
        required: ['query']
      }
    }
  },

  // --- SALES LEADS CRM ---
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description: 'Add a new sales lead or prospect to the Flow Studio pipeline.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Lead contact or deal name' },
          company: { type: 'string', description: 'Company name' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Proposal Sent', 'Archived'] },
          estimated_value: { type: 'number', description: 'Estimated deal value in dollars' },
          notes_summary: { type: 'string', description: 'Key requirements or background notes' },
          location: { type: 'string', description: 'Lead location' }
        },
        required: ['name', 'company']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_lead',
      description: 'Update sales lead pipeline status, value, or notes in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          leadName: { type: 'string', description: 'Name of lead to update' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Proposal Sent', 'Archived'] },
          estimated_value: { type: 'number', description: 'Updated deal value' },
          notes_summary: { type: 'string', description: 'Updated notes' }
        },
        required: ['leadName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_lead',
      description: 'Remove a sales lead from the pipeline.',
      parameters: {
        type: 'object',
        properties: {
          leadName: { type: 'string', description: 'Name of lead to delete' }
        },
        required: ['leadName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'promote_lead_to_client',
      description: 'Convert a won sales lead into an active Flow Studio client.',
      parameters: {
        type: 'object',
        properties: {
          leadName: { type: 'string', description: 'Name of the lead to promote' }
        },
        required: ['leadName']
      }
    }
  },

  // --- TEAM ---
  {
    type: 'function',
    function: {
      name: 'create_team_member',
      description: 'Add or create a new team member or employee record in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the team member' },
          role: { type: 'string', description: 'Job title or role (e.g. Senior Product Designer)' },
          email: { type: 'string', description: 'Work email address' },
          department: { type: 'string', description: 'Department (e.g. Design, Engineering, Marketing)' },
          phone: { type: 'string', description: 'Contact phone number' },
          bio: { type: 'string', description: 'Short professional biography' },
          skills: { type: 'array', items: { type: 'string' }, description: 'Core skills list' },
          status: { type: 'string', enum: ['active', 'inactive'] }
        },
        required: ['name', 'role', 'email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_team_member',
      description: 'Update role, department, status, contact details, skills, certificates, focus, or project assignments of an existing team member.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of team member to update' },
          role: { type: 'string', description: 'New role or job title' },
          department: { type: 'string', description: 'New department' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          bio: { type: 'string', description: 'Updated biography' },
          email: { type: 'string', description: 'Work email address' },
          phone: { type: 'string', description: 'Contact phone number' },
          skills: { type: 'array', items: { type: 'string' }, description: 'Full replacement list of core skills' },
          certificates: { type: 'array', items: { type: 'string' }, description: 'Full replacement list of certifications' },
          activeFocus: { type: 'string', description: 'Current focus line shown on their profile' },
          assignedProjects: { type: 'array', items: { type: 'string' }, description: 'Full replacement list of project names or ids' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_team_member',
      description: 'Remove a team member from the studio roster.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of team member to remove' }
        },
        required: ['name']
      }
    }
  },

  // --- INVOICING & BILLING ---
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Generate an invoice for a client in Flow Studio Billing.',
      parameters: {
        type: 'object',
        properties: {
          recipientName: { type: 'string', description: 'Client or company name' },
          amount: { type: 'number', description: 'Total invoice amount in dollars' },
          invoiceNumber: { type: 'string', description: 'Invoice number (e.g. INV-2024-001)' },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          status: { type: 'string', enum: ['Pending', 'Completed', 'Draft', 'Overdue'] },
          notes: { type: 'string', description: 'Invoice description or payment terms' }
        },
        required: ['recipientName', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_invoice_status',
      description: 'Update the payment status of an invoice (e.g., mark as Completed/Paid).',
      parameters: {
        type: 'object',
        properties: {
          invoiceIdentifier: { type: 'string', description: 'Invoice number or recipient name' },
          status: { type: 'string', enum: ['Pending', 'Completed', 'Draft', 'Overdue'] }
        },
        required: ['invoiceIdentifier', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_invoice',
      description: 'Delete or void an invoice record.',
      parameters: {
        type: 'object',
        properties: {
          invoiceIdentifier: { type: 'string', description: 'Invoice number or recipient name' }
        },
        required: ['invoiceIdentifier']
      }
    }
  },

  // --- CALENDAR & EVENTS ---
  {
    type: 'function',
    function: {
      name: 'schedule_event',
      description: 'Schedule a calendar meeting, call, design sync, or milestone in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Meeting or event title' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Time (e.g. 14:00 or 2:00 PM)' },
          type: { type: 'string', enum: ['Call', 'Design', 'Team Sync', 'Other'] },
          description: { type: 'string', description: 'Event agenda or meeting link' }
        },
        required: ['title', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: 'Reschedule or update details of an existing calendar event.',
      parameters: {
        type: 'object',
        properties: {
          eventTitle: { type: 'string', description: 'Title of the event to update' },
          date: { type: 'string', description: 'New date (YYYY-MM-DD)' },
          time: { type: 'string', description: 'New time (e.g. 3:00 PM)' },
          description: { type: 'string', description: 'Updated agenda' }
        },
        required: ['eventTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Cancel or delete a scheduled event from the calendar.',
      parameters: {
        type: 'object',
        properties: {
          eventTitle: { type: 'string', description: 'Title of event to delete' }
        },
        required: ['eventTitle']
      }
    }
  },

  // --- TIME TRACKING ---
  {
    type: 'function',
    function: {
      name: 'start_timer',
      description: 'Start live billable stopwatch for a specific task.',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Name of the task to track time for' }
        },
        required: ['taskTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stop_timer',
      description: 'Stop the active project stopwatch/timer and record the logged duration.',
      parameters: {
        type: 'object',
        properties: {
          confirm: { type: 'boolean', description: 'Confirm stopping active timer' }
        },
        required: ['confirm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_time_entry',
      description: 'Log manual billable hours or past work duration for a task.',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Name of the completed task' },
          durationMinutes: { type: 'number', description: 'Duration worked in minutes' },
          date: { type: 'string', description: 'Date worked (YYYY-MM-DD)' }
        },
        required: ['taskTitle', 'durationMinutes']
      }
    }
  },

  // --- NOTES & BRIEFS ---
  {
    type: 'function',
    function: {
      name: 'create_project_note',
      description: 'Create a new design brief or markdown note for the active project.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the note' },
          content: { type: 'string', description: 'Full markdown content of the note' }
        },
        required: ['title', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_project_note',
      description: 'Update the content or title of an existing project note.',
      parameters: {
        type: 'object',
        properties: {
          noteTitle: { type: 'string', description: 'Title of the note to update' },
          content: { type: 'string', description: 'Updated markdown content' }
        },
        required: ['noteTitle', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_project_notes',
      description: 'Delete or clear notes from the active project.',
      parameters: {
        type: 'object',
        properties: {
          deleteAll: { type: 'boolean', description: 'True to clear all notes' },
          noteTitle: { type: 'string', description: 'Specific title of note to delete' }
        },
        required: ['deleteAll']
      }
    }
  },

  // --- MOODBOARD ---
  {
    type: 'function',
    function: {
      name: 'add_moodboard_items',
      description: 'Add aesthetic color swatch cards, customizable sticky notes, images, or bookmarks within the user active moodboard canvas viewport.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['note', 'sticky', 'color', 'image', 'bookmark', 'text'] },
                title: { type: 'string', description: 'Title or label' },
                content: { type: 'string', description: 'Body text, hex code, or description' },
                color: { type: 'string', description: 'Hex code (e.g. #fffbeb for warm note, #fef3c7 for yellow note, #3b82f6 for blue color card)' },
                url: { type: 'string', description: 'Optional image or bookmark URL' },
                x: { type: 'number', description: 'Canvas X coordinate inside the user visible viewport bounds' },
                y: { type: 'number', description: 'Canvas Y coordinate inside the user visible viewport bounds' },
                width: { type: 'number', description: 'Card width in pixels (e.g. 240 for notes, 180 for colors, 300 for images)' },
                height: { type: 'number', description: 'Card height in pixels (e.g. 180 for notes, 180 for colors, 200 for images)' }
              },
              required: ['type', 'title']
            }
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_moodboard',
      description: 'Clear or remove all items from the moodboard canvas.',
      parameters: {
        type: 'object',
        properties: {
          confirm: { type: 'boolean', description: 'Confirm clearing moodboard' }
        },
        required: ['confirm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_moodboard_item',
      description: 'Delete a specific item (color swatch, sticky note, image card, or bookmark) from the moodboard canvas.',
      parameters: {
        type: 'object',
        properties: {
          itemTitle: { type: 'string', description: 'Title or label of the moodboard card to remove' },
          itemId: { type: 'string', description: 'Optional specific ID of the item to delete' }
        },
        required: ['itemTitle']
      }
    }
  },

  // --- NAVIGATION ---
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the user to a specific page or workspace view in Flow Studio.',
      parameters: {
        type: 'object',
        properties: {
          view: {
            type: 'string',
            enum: [
              'dashboard', 'projects', 'new-project', 'project-overview', 'project-tasks',
              'project-files', 'project-notes', 'project-moodboard', 'leads', 'lead-generator',
              'email-drafts', 'sent-emails', 'clients', 'team', 'member-details', 'files',
              'calendar', 'time', 'billing', 'new-invoice', 'reports'
            ],
            description: 'Target page. Must be exactly one of the enum values. Settings, Developer tools and the recycle bin are not navigable.'
          },
          projectTitle: {
            type: 'string',
            description: 'Optional project name or title to switch to before navigating'
          }
        },
        required: ['view']
      }
    }
  },

  // --- TASK BOARD OPERATIONS ---
  // Tasks are addressed by title or id; columns by visible name or id. Call
  // list_task_board_schema first when field or status ids are unknown.
  {
    type: 'function',
    function: {
      name: 'list_task_board_schema',
      description: 'Read the current task board structure: every column with its visible label and visibility, the status name/colour map, and the active sort. Call this before addressing a field or status you cannot see.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_task_assignees',
      description: 'Set exactly who is assigned to a task. People not in the list are unassigned, so this is a full replacement rather than a toggle.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task title or id' },
          assignees: { type: 'array', items: { type: 'string' }, description: 'Team member names or ids. Empty array unassigns everyone.' }
        },
        required: ['task', 'assignees']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_tasks',
      description: 'Apply the same change to several tasks at once (phase, priority, completion status).',
      parameters: {
        type: 'object',
        properties: {
          tasks: { type: 'array', items: { type: 'string' }, description: 'Task titles or ids to update' },
          phase: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'] },
          // 'none' rather than '' for clearing: an empty string in an enum is
          // legal JSON Schema and Groq accepts it, but Gemini rejects the entire
          // request ("enum[4]: cannot be empty"). One canonical schema has to
          // satisfy both providers, so the sentinel is named and the handler maps
          // it back to ''.
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low', 'none'],
            description: "'none' clears the priority. Omit the field to leave it unchanged."
          },
          status: { type: 'string', enum: ['Complete', 'Incomplete'] }
        },
        required: ['tasks']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_task_dates',
      description: 'Set a task start date and/or due date. Omitted dates keep their current value.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task title or id' },
          startDate: { type: 'string', description: 'YYYY-MM-DD' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' }
        },
        required: ['task']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_task_type',
      description: 'Change a task type between task, milestone, form and meeting.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task title or id' },
          taskType: { type: 'string', enum: ['task', 'milestone', 'form', 'meeting'] }
        },
        required: ['task', 'taskType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_task_field_value',
      description: 'Write a value into one board field (column) of a task, including custom fields.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task title or id' },
          field: { type: 'string', description: 'Column name or id' },
          value: { description: 'New value; coerced to the column type (number, checkbox, text)' }
        },
        required: ['task', 'field']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task_field',
      description: 'Add a custom field (column) to the task board.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Field label' },
          type: { type: 'string', enum: ['text', 'number', 'date', 'dropdown', 'checkbox'] },
          options: { type: 'array', items: { type: 'string' }, description: 'Allowed values, for dropdown fields only' }
        },
        required: ['name', 'type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_field',
      description: 'Rename, hide, show, move or delete a board field. Deleting also strips that field value from every task, so confirm with the user first.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'Column name or id' },
          action: { type: 'string', enum: ['rename', 'hide', 'show', 'moveLeft', 'moveRight', 'delete'] },
          newName: { type: 'string', description: 'Required for the rename action' }
        },
        required: ['field', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status_config',
      description: 'Rename or recolour a board status column.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Status id, e.g. todo, inprogress, review, done' },
          name: { type: 'string', description: 'New display label' },
          color: { type: 'string', description: 'Hex colour, e.g. #984df3' }
        },
        required: ['status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sort_task_board',
      description: 'Sort the task board by a column, or clear sorting.',
      parameters: {
        type: 'object',
        properties: {
          column: { type: 'string', description: 'Column name or id. Use "none" to clear sorting.' },
          direction: { type: 'string', enum: ['asc', 'desc'], description: 'Omit to cycle the sort direction' }
        },
        required: ['column']
      }
    }
  },

  // --- READ-ONLY INTELLIGENCE ---
  // These report state instead of changing it. Prefer calling one of these
  // first when the user asks a question about their studio, rather than
  // guessing from earlier messages.
  {
    type: 'function',
    function: {
      name: 'get_studio_overview',
      description: 'Read a full studio snapshot: project counts by status, task load and overdue count, clients, lead pipeline value, invoicing totals, hours logged, and recent activity volume. The best single call for "how is the studio doing".',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_task_board_digest',
      description: 'Read the task board: what is overdue, due today and due this week, plus counts by phase, priority and assignee, and how many open tasks are unassigned.',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Optional project name to narrow the digest to' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_project_digest',
      description: 'Read one project in depth: completion, deadline and days remaining, task breakdown, hours logged, note and moodboard counts. Defaults to the currently open project.',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Project name or id; omit for the current project' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_client_digest',
      description: 'Read client health: project counts, unpaid invoices, lifetime volume, ratings, last recorded activity, and an overdue-balance flag. Omit the client to get all clients plus those at risk.',
      parameters: {
        type: 'object',
        properties: {
          client: { type: 'string', description: 'Client name or id; omit for all clients' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_lead_pipeline_digest',
      description: 'Read the lead pipeline: counts and value by status, the highest-value leads, and leads untouched for a number of days.',
      parameters: {
        type: 'object',
        properties: {
          staleDays: { type: 'number', description: 'Days without an update before a lead counts as stale (default 14)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_time_summary',
      description: 'Read tracked time: total hours, breakdown by project and by day, and the currently running timer with elapsed time.',
      parameters: {
        type: 'object',
        properties: {
          sinceDays: { type: 'number', description: 'Only include entries from the last N days' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_calendar_agenda',
      description: 'Read upcoming calendar events in chronological order with the number of days until each.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'How many days ahead to look (default 7)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_activities',
      description: 'Read the studio activity feed, newest first. Set includeCounts to get per-day and per-type totals instead of individual events.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'How many events to return (default 25, max 100)' },
          type: { type: 'string', enum: ['task', 'project', 'invoice', 'client', 'lead', 'file', 'email'] },
          includeCounts: { type: 'boolean', description: 'Return aggregate counts rather than a list' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_notifications',
      description: 'Read in-app notifications with their read/unread state.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_notifications_read',
      description: 'Mark one notification, or all of them, as read.',
      parameters: {
        type: 'object',
        properties: {
          id: { description: 'Notification id to mark read' },
          all: { type: 'boolean', description: 'Mark every notification read' }
        }
      }
    }
  },

  // --- LEAD SCRAPER ---
  // Configuration and staging-area management only. The Apify API key is NOT
  // settable through any tool — it is a billable credential and would otherwise
  // be written into the model's context and the conversation history.
  {
    type: 'function',
    function: {
      name: 'list_scraper_config',
      description: 'Read the scraper setup: whether an API key is configured (never the key itself), each platform config, must-have filters, and how many leads are staged.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_scraped_leads',
      description: 'List leads in the scraper staging area, optionally filtered by a text query.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Match against name, company or email' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_scraper_config',
      description: 'Update one platform\'s scraper settings. google-maps: searchTerms, location, category, maxResults, includeEmail, includePhone, includeWebsite. instagram: searchTarget, searchType, maxProfiles, extractEmailBio, minFollowers. linkedin: jobTitle, industry, location, companySize, maxProfiles. google-search: query, targetDomain, maxResults, extractEmails, extractPhones.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['google-maps', 'instagram', 'linkedin', 'google-search'] },
          config: { type: 'object', description: 'Fields to change; unsupported keys are reported back and ignored' }
        },
        required: ['platform', 'config']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_scraper_filters',
      description: 'Set the must-have filters that scraped leads are required to satisfy.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'boolean' },
          phone: { type: 'boolean' },
          instagram: { type: 'boolean' },
          facebook: { type: 'boolean' },
          website: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_scraper_tab',
      description: 'Switch the scraper to a platform tab.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['google-maps', 'instagram', 'linkedin', 'google-search'] }
        },
        required: ['platform']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'select_scraped_leads',
      description: 'Change the staging-area selection so a following action targets it.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['all', 'specific', 'clear'] },
          leads: { type: 'array', items: { type: 'string' }, description: 'For action=specific: names, emails or ids' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_scraped_lead',
      description: 'Remove one or more leads from the scraper staging area.',
      parameters: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'string' }, description: 'Names, emails or ids' }
        },
        required: ['leads']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_scraped_leads',
      description: 'Empty the entire scraper staging area. Irreversible from the user\'s point of view — confirm first.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_scraped_leads',
      description: 'Add leads into the scraper staging area manually, without running a scrape.',
      parameters: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                company: { type: 'string' },
                contactPerson: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                socials: { type: 'string' },
                location: { type: 'string' },
                estimated_value: { type: 'number' },
                notes_summary: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              },
              required: ['name']
            }
          }
        },
        required: ['leads']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_scraper_logs',
      description: 'Clear the scraper run log.',
      parameters: { type: 'object', properties: {} }
    }
  },

  // --- LEADS PIPELINE ---
  {
    type: 'function',
    function: {
      name: 'list_lead_columns',
      description: 'Read the lead table structure: custom columns, base field labels, and the list of base field names.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description: 'List and filter leads, optionally by status or a text query, with the combined pipeline value.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['New', 'Contacted', 'Proposal Sent', 'Archived'] },
          query: { type: 'string', description: 'Match against name, company or email' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'select_leads',
      description: 'Change the lead table selection so a following bulk action targets it. Replaces the previous selection.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['all', 'specific', 'clear'] },
          leads: { type: 'array', items: { type: 'string' }, description: 'For action=specific: lead names, emails or ids' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Proposal Sent', 'Archived'], description: 'For action=all: restrict to one status' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_leads',
      description: 'Apply the same change to several leads at once: status, source, location, or add tags (tags are merged, not replaced).',
      parameters: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'string' }, description: 'Lead names, emails or ids' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Proposal Sent', 'Archived'] },
          source: { type: 'string' },
          location: { type: 'string' },
          addTags: { type: 'array', items: { type: 'string' }, description: 'Tags to add, preserving existing ones' }
        },
        required: ['leads']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_delete_leads',
      description: 'Permanently delete several leads at once. Irreversible — ALWAYS confirm the exact list with the user first.',
      parameters: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'string' }, description: 'Lead names, emails or ids' }
        },
        required: ['leads']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_promote_leads',
      description: 'Convert several leads into clients at once.',
      parameters: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'string' }, description: 'Lead names, emails or ids' }
        },
        required: ['leads']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reorder_lead',
      description: 'Move a lead to a new position in the table, placing it immediately before another lead.',
      parameters: {
        type: 'object',
        properties: {
          lead: { type: 'string', description: 'Lead to move' },
          before: { type: 'string', description: 'Lead it should sit before' }
        },
        required: ['lead', 'before']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'import_leads_csv',
      description: 'Import leads from CSV text. The first row must be a header row. Confirm the row count with the user before importing a large file.',
      parameters: {
        type: 'object',
        properties: {
          csv: { type: 'string', description: 'Raw CSV content including the header row' }
        },
        required: ['csv']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_lead_column',
      description: 'Add a column to the lead table.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Column header' },
          width: { type: 'number', description: 'Width in px (default 150)' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_column',
      description: 'Rename or resize a custom column, or rename the label of a built-in base field.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['rename', 'resize', 'renameLabel'] },
          column: { type: 'string', description: 'Custom column title or id (for rename/resize)' },
          newTitle: { type: 'string', description: 'New header for action=rename' },
          width: { type: 'number', description: 'New width for action=resize' },
          field: { type: 'string', description: 'Base field name for action=renameLabel, e.g. estimated_value' },
          newLabel: { type: 'string', description: 'New label for action=renameLabel' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_lead_column',
      description: 'Delete a custom column from the lead table. Confirm with the user first.',
      parameters: {
        type: 'object',
        properties: {
          column: { type: 'string', description: 'Column title or id' }
        },
        required: ['column']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reorder_lead_columns',
      description: 'Move a lead table column so it sits immediately before another column.',
      parameters: {
        type: 'object',
        properties: {
          column: { type: 'string', description: 'Column to move' },
          before: { type: 'string', description: 'Column it should sit before' }
        },
        required: ['column', 'before']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_lead_activity',
      description: 'Append a dated activity entry to a lead timeline.',
      parameters: {
        type: 'object',
        properties: {
          lead: { type: 'string', description: 'Lead name, email or id' },
          event: { type: 'string', description: 'Activity description to record' }
        },
        required: ['lead', 'event']
      }
    }
  },

  // --- TEAM ADMIN & BILLING PROFILE ---
  {
    type: 'function',
    function: {
      name: 'list_team',
      description: 'List team members with role, department, status and skills, plus pending invitations and custom roles.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'invite_team_member',
      description: 'Invite someone to the team by email. This sends a real invitation email — confirm the address and role with the user first.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Invitee email address' },
          role: { type: 'string', description: 'Role to invite them as' }
        },
        required: ['email', 'role']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resend_team_invite',
      description: 'Re-send a pending team invitation. Sends real email — confirm first.',
      parameters: {
        type: 'object',
        properties: {
          invite: { type: 'string', description: 'Invite email or id' }
        },
        required: ['invite']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'revoke_team_invite',
      description: 'Cancel a pending team invitation.',
      parameters: {
        type: 'object',
        properties: {
          invite: { type: 'string', description: 'Invite email or id' }
        },
        required: ['invite']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_team_role',
      description: 'Add or remove a custom team role. Removing a role does not reassign members who still hold it.',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Role name' },
          action: { type: 'string', enum: ['add', 'remove'] }
        },
        required: ['role', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_billing_summary',
      description: 'Read billing state: balance, next payment, invoices with outstanding totals, the billing address, and the saved card with its number masked.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_billing_address',
      description: 'Update the billing address on file.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Billing contact name' },
          addressLine1: { type: 'string' },
          addressLine2: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_saved_card',
      description: 'Update the saved card holder name, brand or expiry. Card numbers CANNOT be set through the agent for security reasons — that must be done in Billing settings.',
      parameters: {
        type: 'object',
        properties: {
          cardHolder: { type: 'string', description: 'Name on the card' },
          brand: { type: 'string', description: 'Card brand (e.g. Visa)' },
          validThru: { type: 'string', description: 'Expiry as MM/YY' }
        }
      }
    }
  },

  // --- EMAIL CAMPAIGNS & TEMPLATES ---
  // Outbound mail cannot be undone, so every tool that sends requires an
  // explicit confirmation from the user before being called. SMTP/IMAP
  // credentials are intentionally not writable through any tool.
  {
    type: 'function',
    function: {
      name: 'list_email_templates',
      description: 'List saved outreach email templates.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_email_template',
      description: 'Save a new outreach email template. The body supports {{name}} and {{company}} placeholders.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Template name' },
          subject: { type: 'string', description: 'Subject line' },
          body: { type: 'string', description: 'Body text; supports {{name}} and {{company}}' }
        },
        required: ['name', 'subject', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_email_template',
      description: 'Edit an existing email template.',
      parameters: {
        type: 'object',
        properties: {
          template: { type: 'string', description: 'Template name or id' },
          name: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' }
        },
        required: ['template']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_email_template',
      description: 'Delete an email template. Confirm with the user first.',
      parameters: {
        type: 'object',
        properties: {
          template: { type: 'string', description: 'Template name or id' }
        },
        required: ['template']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_email_campaigns',
      description: 'List outreach campaigns with status and queue counts, plus the current follow-up schedule.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_email_batch',
      description: 'Schedule a multi-step follow-up campaign for a set of leads. ALWAYS confirm the recipient list, subject and body with the user before calling — this queues real outbound email.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name' },
          leads: { type: 'array', items: { type: 'string' }, description: 'Lead names, emails or ids' },
          subject: { type: 'string', description: 'First-step subject' },
          body: { type: 'string', description: 'First-step body' },
          steps: {
            type: 'array',
            description: 'Follow-up steps. Omit for a single-step campaign.',
            items: {
              type: 'object',
              properties: {
                delayDays: { type: 'number', description: 'Days after the previous step' },
                subject: { type: 'string' },
                body: { type: 'string' }
              }
            }
          },
          senderType: { type: 'string', enum: ['personal', 'team'] }
        },
        required: ['leads', 'subject', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_email_batch',
      description: 'Pause, resume or delete a campaign. Deleting stops all pending sends and cannot be undone — confirm first.',
      parameters: {
        type: 'object',
        properties: {
          batch: { type: 'string', description: 'Campaign name or id' },
          action: { type: 'string', enum: ['pause', 'resume', 'delete'] }
        },
        required: ['batch', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_queue_item',
      description: 'Cancel, send immediately, or edit one queued email. sendNow dispatches real mail — confirm first.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Queue item id, or the recipient lead name' },
          action: { type: 'string', enum: ['cancel', 'sendNow', 'edit'] },
          subject: { type: 'string', description: 'For edit' },
          body: { type: 'string', description: 'For edit' },
          scheduledAt: { type: 'string', description: 'For edit: ISO timestamp' }
        },
        required: ['item', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'process_email_queue',
      description: 'Run the send queue now, dispatching every email that is due. Confirm with the user first.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sync_email_replies',
      description: 'Fetch new replies from the configured mailbox and attach them to leads.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_email_replies',
      description: 'List received email replies, most recent first, with a short preview of each.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_followup_settings',
      description: 'Change the follow-up schedule: retry count, delay between steps, sender identity and sync behaviour. Mailbox credentials are NOT settable here and must be changed in Settings.',
      parameters: {
        type: 'object',
        properties: {
          maxAttempts: { type: 'number', description: 'Maximum follow-up attempts (0-10)' },
          followUpDelays: { type: 'array', items: { type: 'number' }, description: 'Delay in days before each follow-up step' },
          useTeamEmail: { type: 'boolean', description: 'Send from the shared team mailbox' },
          syncAllEmails: { type: 'boolean', description: 'Sync the whole mailbox rather than replies only' },
          displayName: { type: 'string', description: 'Display name on outgoing mail' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_bulk_email',
      description: 'Send one email immediately to several leads, bypassing the campaign queue. ALWAYS confirm the recipients, subject and body with the user first — this is irreversible.',
      parameters: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'string' }, description: 'Lead names, emails or ids' },
          subject: { type: 'string' },
          body: { type: 'string', description: 'Supports {{name}} and {{company}}' },
          senderType: { type: 'string', enum: ['personal', 'team'] }
        },
        required: ['leads', 'subject', 'body']
      }
    }
  },

  // --- MOODBOARD CANVAS OPERATIONS ---
  // Cards are addressed by title (what the model can see in canvas context) or
  // by id. Selection-based operations require select_moodboard_items first.
  {
    type: 'function',
    function: {
      name: 'select_moodboard_items',
      description: 'Select specific moodboard cards so a following align, distribute, lock, duplicate or arrange call can act on them. Clears any previous selection.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'string' }, description: 'Card titles or ids to select' }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'align_moodboard_items',
      description: 'Align two or more moodboard cards. Requires at least 2 cards selected (use select_moodboard_items first).',
      parameters: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'] },
          items: { type: 'array', items: { type: 'string' }, description: 'Optional titles/ids to align instead of the current selection' }
        },
        required: ['direction']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'distribute_moodboard_items',
      description: 'Evenly space three or more moodboard cards along an axis. Requires at least 3 cards selected.',
      parameters: {
        type: 'object',
        properties: {
          axis: { type: 'string', enum: ['horizontal', 'vertical'] },
          items: { type: 'array', items: { type: 'string' }, description: 'Optional titles/ids to distribute instead of the current selection' }
        },
        required: ['axis']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'duplicate_moodboard_items',
      description: 'Duplicate moodboard cards with an offset.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'string' }, description: 'Optional titles/ids; defaults to the current selection' },
          offsetX: { type: 'number', description: 'Horizontal offset in px (default 20)' },
          offsetY: { type: 'number', description: 'Vertical offset in px (default 20)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'arrange_moodboard_items',
      description: 'Change a card stack level (z-order) on the moodboard.',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', enum: ['front', 'forward', 'backward', 'back'], description: 'front/back move all the way; forward/backward move one step' },
          items: { type: 'array', items: { type: 'string' }, description: 'Optional titles/ids; defaults to the current selection' }
        },
        required: ['position']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_lock_moodboard_items',
      description: 'Lock or unlock moodboard cards so they cannot be dragged or resized. Locked cards are also skipped by align and distribute.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'string' }, description: 'Optional titles/ids; defaults to the current selection' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_moodboard_item',
      description: 'Change position, size, colour, title or body text of one existing moodboard card.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Title or id of the card to update' },
          x: { type: 'number', description: 'New canvas X position' },
          y: { type: 'number', description: 'New canvas Y position' },
          width: { type: 'number' },
          height: { type: 'number' },
          color: { type: 'string', description: 'Hex colour (e.g. #fef3c7)' },
          title: { type: 'string' },
          content: { type: 'string', description: 'Body text' }
        },
        required: ['item']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_moodboard_item_categories',
      description: 'Set the category pills shown on a moodboard card.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Title or id of the card' },
          categories: { type: 'array', items: { type: 'string' }, description: 'Full replacement list of category labels' }
        },
        required: ['item', 'categories']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'filter_moodboard_by_category',
      description: 'Filter the moodboard canvas to cards carrying a category label, or clear the filter.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category label to filter by. Omit to clear the filter.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_moodboard_comments',
      description: 'Add, resolve, reply to, or delete a comment pin on the moodboard.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'resolve', 'reply', 'delete'] },
          item: { type: 'string', description: 'For add: title or id of the card to pin the comment to' },
          text: { type: 'string', description: 'For add/reply: comment or reply text' },
          commentId: { type: 'string', description: 'For resolve/reply/delete: the comment id' },
          x: { type: 'number', description: 'For add: optional canvas X for the pin' },
          y: { type: 'number', description: 'For add: optional canvas Y for the pin' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'configure_moodboard_grid',
      description: 'Change the moodboard canvas grid pattern, size, opacity, or snapping.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['dot', 'line', 'none'] },
          size: { type: 'number', description: 'Grid spacing in px' },
          opacity: { type: 'number', description: 'Grid opacity 0-1' },
          snapToGrid: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'control_moodboard_view',
      description: 'Control the moodboard viewport: zoom in, zoom out, reset to 100%, or centre on all cards.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['zoomIn', 'zoomOut', 'reset', 'center'] }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'extract_moodboard_palette',
      description: 'Extract a colour palette from an image card on the moodboard and attach it to that card.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Title or id of the image card' }
        },
        required: ['item']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'crop_moodboard_item',
      description: 'Apply crop or mask settings to an image card on the moodboard.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Title or id of the image card' },
          mode: { type: 'string', enum: ['crop', 'mask'] },
          maskShape: { type: 'string', description: 'Mask shape, e.g. none, circle, rounded, arch' },
          zoom: { type: 'number', description: 'Crop zoom factor' }
        },
        required: ['item']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_moodboard_section',
      description: 'Create a section frame on the moodboard and adopt any cards whose centre falls inside it.',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          title: { type: 'string' },
          color: { type: 'string', description: 'Hex frame colour' }
        },
        required: ['x', 'y', 'width', 'height']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'undo_moodboard',
      description: 'Undo the last change on the moodboard canvas.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'redo_moodboard',
      description: 'Redo the last undone change on the moodboard canvas.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// ==========================================
// 3. Gemini Adapter
// ==========================================
// The Gemini declarations are derived from `groqTools` rather than maintained
// by hand. Previously the same 47 tool declarations existed twice, and the two
// copies were kept in sync manually — any divergence would show up only as a
// provider-specific behavioural difference at runtime. One canonical array plus
// an adapter removes that class of bug entirely.

const JSON_SCHEMA_TYPE_TO_GEMINI: Record<string, Type> = {
  string: Type.STRING,
  number: Type.NUMBER,
  // Integer is mapped to NUMBER: no current schema uses `integer`, and this
  // avoids depending on an enum member we do not otherwise exercise.
  integer: Type.NUMBER,
  boolean: Type.BOOLEAN,
  array: Type.ARRAY,
  object: Type.OBJECT,
};

/**
 * Enums Gemini will refuse, each reported once.
 *
 * An empty string inside an enum is legal JSON Schema and Groq accepts it, so
 * nothing complains here — the failure only appears once someone selects a
 * Gemini model, as an opaque 400 naming a declaration index that cannot be
 * traced back to a tool. Naming it in the log makes that diagnosable instead.
 */
const reportedBadEnums = new Set<string>();
const warnInvalidGeminiEnum = (values: any[]): void => {
  const signature = JSON.stringify(values);
  if (reportedBadEnums.has(signature)) return;
  reportedBadEnums.add(signature);
  console.warn(
    `[AI Schema] enum contains an empty string, which Gemini rejects: ${signature}. ` +
    `Use a named sentinel instead - see bulk_update_tasks.priority.`
  );
};

const toGeminiSchema = (schema: any): any => {
  if (!schema || typeof schema !== 'object') return schema;

  const converted: any = {};

  if (schema.type) {
    converted.type = JSON_SCHEMA_TYPE_TO_GEMINI[schema.type] ?? Type.STRING;
  }
  if (schema.description) converted.description = schema.description;
  if (Array.isArray(schema.enum)) {
    if (schema.enum.some((v: any) => v === '')) warnInvalidGeminiEnum(schema.enum);
    converted.enum = schema.enum;
  }
  if (Array.isArray(schema.required)) converted.required = schema.required;

  if (schema.properties && typeof schema.properties === 'object') {
    converted.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, any>).map(([key, value]) => [
        key,
        toGeminiSchema(value),
      ])
    );
  }
  if (schema.items) converted.items = toGeminiSchema(schema.items);

  return converted;
};

/**
 * Adapter: canonical tool definitions -> Gemini function declarations.
 *
 * Exported as a function rather than only as a prebuilt array because the
 * request path may send a *subset* of the tools (see `selectGroqTools`), and a
 * subset needs the same conversion applied to it.
 */
export const toGeminiDeclarations = (tools: any[]): any[] => [
  {
    functionDeclarations: tools.map((tool: any) => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: toGeminiSchema(tool.function.parameters),
    })),
  },
];

export const geminiTools = toGeminiDeclarations(groqTools);

/**
 * Every tool name the model can call, in one place. Kept alongside the schema
 * so coverage checks (declared tool vs implemented handler) have a single
 * source to compare against.
 */
export const toolNames: string[] = groqTools.map((tool: any) => tool.function.name);

// ==========================================
// 4. Budget-aware tool selection
// ==========================================
//
// Why this exists: the full surface serialises to roughly 13,700 tokens. Groq's
// on-demand tier allows 8,000 tokens per minute for small models, so sending
// every schema makes *every* request a 413 before any model sees it — the app
// was not slow, it was over capacity on arrival.
//
// Gemini's limits are far higher, so it keeps receiving the full surface and
// loses no capability. Only providers that cannot fit the whole set get a
// relevant subset, which is chosen by lexical match against the user's message
// rather than a hand-maintained keyword table — that would be 128 entries to
// keep in sync, and it would silently rot as tools are added.

/** Rough token estimate for anything JSON-serialisable (~4 chars per token). */
export const estimateTokens = (value: unknown): number => {
  try {
    return Math.ceil(JSON.stringify(value).length / 4);
  } catch {
    return 0;
  }
};

/**
 * Sent on every request regardless of the query.
 *
 * Deliberately small: these are the flows that either run constantly or are
 * required by the system prompt's own rules (`list_task_board_schema` must be
 * called before touching an unknown board field). Everything else is worth
 * more as budget for tools the current message actually mentions.
 */
export const CORE_TOOL_NAMES: string[] = [
  'navigate_to',
  'get_studio_overview',
  'list_task_board_schema',
  'create_tasks',
  'update_task',
  'delete_tasks',
  'create_new_project',
  'update_project',
  'create_client',
  'create_lead',
  'get_task_board_digest',
  'update_project_note',
];

const QUERY_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'please', 'can',
  'you', 'our', 'all', 'any', 'new', 'get', 'set', 'make', 'add', 'let', 'about',
  'them', 'they', 'then', 'than', 'there', 'their', 'what', 'when', 'who', 'how',
  'was', 'were', 'are', 'has', 'have', 'had', 'not', 'but', 'its', 'it', 'me',
  'my', 'on', 'in', 'to', 'of', 'a', 'an', 'is', 'do', 'at', 'by', 'up',
]);

/**
 * Query terms, with a crude singular form added.
 *
 * Tool names are mostly singular (`update_task`) while people write plurals
 * ("update the tasks"), so "tasks" alone would miss `update_task` on the name
 * match and fall back to a weaker description match.
 */
const extractQueryTerms = (query: string): string[] => {
  const terms = new Set<string>();
  for (const raw of (query || '').toLowerCase().split(/[^a-z0-9_]+/)) {
    if (raw.length < 3 || QUERY_STOP_WORDS.has(raw)) continue;
    terms.add(raw);
    if (raw.endsWith('s') && raw.length > 4) terms.add(raw.slice(0, -1));
  }
  return Array.from(terms);
};

/**
 * Lexical relevance of one tool to the query.
 *
 * A name hit is worth three description hits: the name is the tool's identity,
 * the description is prose and matches incidental words.
 */
const scoreToolForQuery = (tool: any, terms: string[]): number => {
  if (terms.length === 0) return 0;
  const name = String(tool?.function?.name || '').toLowerCase();
  const description = String(tool?.function?.description || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (name.includes(term)) score += 3;
    else if (description.includes(term)) score += 1;
  }
  return score;
};

/**
 * Pick the tools to send, given how many tokens the provider can spare.
 *
 * Returns the full array when it fits, so no capability is ever withheld from a
 * provider that can carry it. Otherwise returns the core set plus the
 * highest-scoring tools that fit the budget, in the original declaration order
 * so the prompt's grouping stays legible.
 */
export const selectGroqTools = (
  query: string,
  tokenBudget: number,
  tools: any[] = groqTools
): any[] => {
  if (estimateTokens(tools) <= tokenBudget) return tools;

  const terms = extractQueryTerms(query);

  const core = tools.filter((t: any) => CORE_TOOL_NAMES.includes(t.function?.name));
  const rest = tools
    .filter((t: any) => !CORE_TOOL_NAMES.includes(t.function?.name))
    .map((t: any) => ({ tool: t, score: scoreToolForQuery(t, terms) }))
    .sort((a: any, b: any) => b.score - a.score);

  const chosen = new Set<any>(core);
  let used = estimateTokens(core);

  for (const { tool, score } of rest) {
    // An unmatched tool is only worth sending if there is room left over.
    const cost = estimateTokens(tool);
    if (used + cost > tokenBudget) continue;
    if (score === 0 && used > tokenBudget * 0.6) continue;
    chosen.add(tool);
    used += cost;
  }

  return tools.filter((t: any) => chosen.has(t));
};
