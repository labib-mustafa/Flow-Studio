import { AgentToolCall, AgentToolResult } from '../types';
import { handleProjectTaskTools } from './toolHandlers/projectTaskHandlers';
import { handleProjectDetailsTools } from './toolHandlers/projectDetailsHandlers';
import { handleTasksTools } from './toolHandlers/tasksHandlers';
import { handleCrmTools } from './toolHandlers/crmHandlers';
import { handleClientDetailsTools } from './toolHandlers/clientDetailsHandlers';
import { handleOpsTools } from './toolHandlers/opsHandlers';
import { handleCalendarTimeTools } from './toolHandlers/calendarTimeHandlers';
import { handleContentNavTools } from './toolHandlers/contentNavHandlers';
import { handleMoodboardTools } from './toolHandlers/moodboardHandlers';
import { handleEmailTools } from './toolHandlers/emailHandlers';
import { handleTeamBillingTools } from './toolHandlers/teamBillingHandlers';
import { handleLeadsTools } from './toolHandlers/leadsHandlers';
import { handleScraperTools } from './toolHandlers/scraperHandlers';
import { handleInsightsTools } from './toolHandlers/insightsHandlers';
import { isToolHandled } from './toolHandlers/registry';

interface AgentToolDependencies {
  currentProject: any;
  addTask: (task: any) => void;
  setItems: (fn: (prev: any[]) => any[]) => void;
  addEvent: (event: any) => void;
  startTimer: (projectId: string, projectTitle: string, taskTitle: string) => void;
  addProject: (proj: any) => void;
  setCurrentProject: (proj: any) => void;
  setAvailableNotesCount: (count: number) => void;
}

export const dispatchAgentTools = (
  toolCalls: AgentToolCall[],
  deps: AgentToolDependencies
): AgentToolResult[] => {
  const results: AgentToolResult[] = [];
  const {
    currentProject,
    addTask,
    setItems,
    addEvent,
    startTimer,
    addProject,
    setCurrentProject,
    setAvailableNotesCount
  } = deps;

  const activeProjId = currentProject?.id || 'default';
  const activeProjTitle = currentProject?.title || currentProject?.name || 'Project';

  for (const call of toolCalls) {
    try {
      // 1. Projects & Tasks
      const ptRes = handleProjectTaskTools(call, {
        activeProjId,
        activeProjTitle,
        addTask,
        addProject,
        setCurrentProject
      });
      if (ptRes) {
        results.push(ptRes);
        continue;
      }

      // 1a. Task board operations (assignees, bulk edits, dates, fields,
      // status config, sorting). Kept separate from the create/update/delete
      // handler above so board-schema tools stay readable.
      const taskRes = handleTasksTools(call, { activeProjId });
      if (taskRes) {
        results.push(taskRes);
        continue;
      }

      // 1b. Project Details (Tags, Links, Banner, Folder, Moodboard Deletions)
      const pdRes = handleProjectDetailsTools(call, {
        activeProjId,
        activeProjTitle,
        currentProject,
        setCurrentProject,
        setItems
      });
      if (pdRes) {
        results.push(pdRes);
        continue;
      }

      // 2. CRM (Clients & Leads)
      const crmRes = handleCrmTools(call);
      if (crmRes) {
        results.push(crmRes);
        continue;
      }

      // 1c. Read-only intelligence. Placed early because these are pure reads
      // with unique names, and they are the cheapest path to a useful answer.
      const insightsRes = handleInsightsTools(call);
      if (insightsRes) {
        results.push(insightsRes);
        continue;
      }

      // 2a-0. Lead scraper configuration and staging area.
      const scraperRes = handleScraperTools(call);
      if (scraperRes) {
        results.push(scraperRes);
        continue;
      }

      // 2a. Lead pipeline: bulk actions, ordering, CSV import, columns, selection.
      // Distinct tool names from the basic CRUD above, so ordering is not load-bearing.
      const leadsRes = handleLeadsTools(call);
      if (leadsRes) {
        results.push(leadsRes);
        continue;
      }

      // 2b. Client Details (Appointments, Tags, Notes, Invoices, Tasks, Assets, Ratings, Experts)
      const cdRes = handleClientDetailsTools(call);
      if (cdRes) {
        results.push(cdRes);
        continue;
      }

      // 3. Ops (Team & Invoicing/Billing)
      const opsRes = handleOpsTools(call, { activeProjId });
      if (opsRes) {
        results.push(opsRes);
        continue;
      }

      // 4. Calendar & Time Tracking
      const calRes = handleCalendarTimeTools(call, {
        activeProjId,
        activeProjTitle,
        addEvent,
        startTimer
      });
      if (calRes) {
        results.push(calRes);
        continue;
      }

      // 4a. Team administration and billing profile. Ordered ahead of the ops
      // handler so the specific team tools claim their names first.
      const tbRes = handleTeamBillingTools(call);
      if (tbRes) {
        results.push(tbRes);
        continue;
      }

      // 4b. Email campaigns, templates and the send queue. Outbound mail is
      // irreversible, so the tool descriptions require confirmation first.
      const mailRes = handleEmailTools(call);
      if (mailRes) {
        results.push(mailRes);
        continue;
      }

      // 5. Moodboard canvas operations (layout, stacking, comments, viewport).
      // Runs before the generic moodboard create/destroy handler so the more
      // specific tool names are claimed first.
      const mbRes = handleMoodboardTools(call);
      if (mbRes) {
        results.push(mbRes);
        continue;
      }

      // 6. Notes, Moodboard create/destroy, & App Navigation
      const navRes = handleContentNavTools(call, {
        activeProjId,
        setItems,
        setAvailableNotesCount
      });
      if (navRes) {
        results.push(navRes);
        continue;
      }

      // Reached only when no handler claimed the call. Two distinct causes,
      // reported separately so a wiring bug cannot hide behind a lookup miss:
      //   - the tool name has no handler at all (declared-but-unimplemented), or
      //   - a handler matched but could not resolve its target (data miss).
      if (!isToolHandled(call.name)) {
        console.error(
          `[AgentToolDispatcher] No handler registered for tool "${call.name}". ` +
            `Add a branch in the relevant toolHandlers module and register the ` +
            `name in toolHandlers/registry.ts.`
        );
        results.push({
          toolName: call.name,
          description: `Action "${call.name}" is not implemented in this build.`,
          data: call.args
        });
      } else {
        results.push({
          toolName: call.name,
          description: `Failed to execute action "${call.name}". Target item not found.`,
          data: call.args
        });
      }
    } catch (e: any) {
      console.error('[AgentToolDispatcher] Execution error on tool:', call.name, e);
      results.push({
        toolName: call.name,
        description: `Action "${call.name}" failed: ${e?.message || 'unknown error'}.`,
        data: call.args
      });
    }
  }

  return results;
};
