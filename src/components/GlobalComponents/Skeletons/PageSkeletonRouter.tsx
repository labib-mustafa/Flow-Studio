import React from 'react';
import { DashboardSkeleton } from './DashboardSkeleton';
import { ProjectsSkeleton } from './ProjectsSkeleton';
import { TaskPageSkeleton } from './TaskPageSkeleton';
import { ClientsSkeleton } from './ClientsSkeleton';
import { LeadsSkeleton } from './LeadsSkeleton';
import { FilesSkeleton } from './FilesSkeleton';
import { TeamSkeleton } from './TeamSkeleton';
import { CalendarSkeleton } from './CalendarSkeleton';
import { TimeSkeleton } from './TimeSkeleton';
import { BillingSkeleton } from './BillingSkeleton';
import { NotesSkeleton } from './NotesSkeleton';
import { MoodboardSkeleton } from './MoodboardSkeleton';
import { SettingsSkeleton } from './SettingsSkeleton';

interface PageSkeletonRouterProps {
  view: string;
}

export const PageSkeletonRouter: React.FC<PageSkeletonRouterProps> = ({ view }) => {
  switch (view) {
    case 'dashboard':
      return <DashboardSkeleton />;

    case 'projects':
    case 'new-project':
    case 'project-overview':
      return <ProjectsSkeleton />;

    case 'project-tasks':
    case 'tasks':
      return <TaskPageSkeleton />;

    case 'clients':
      return <ClientsSkeleton />;

    case 'leads':
    case 'lead-generator':
    case 'email-drafts':
    case 'sent-emails':
      return <LeadsSkeleton />;

    case 'files':
    case 'project-files':
      return <FilesSkeleton />;

    case 'team':
    case 'member-details':
      return <TeamSkeleton />;

    case 'calendar':
      return <CalendarSkeleton />;

    case 'time':
      return <TimeSkeleton />;

    case 'billing':
    case 'new-invoice':
      return <BillingSkeleton />;

    case 'project-notes':
    case 'notes':
      return <NotesSkeleton />;

    case 'project-moodboard':
    case 'moodboard':
      return <MoodboardSkeleton />;

    case 'settings':
    case 'dev-settings':
    case 'data':
      return <SettingsSkeleton />;

    default:
      return <DashboardSkeleton />;
  }
};
