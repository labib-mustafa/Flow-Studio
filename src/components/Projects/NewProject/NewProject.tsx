import React from 'react';
import { TemplateSelector } from './TemplateSelector';
import { ProjectForm } from './ProjectForm';

interface NewProjectProps {
  onBack: () => void;
  onSave: (data: any) => void;
  project?: any;
}

export const NewProject: React.FC<NewProjectProps> = ({ onBack, onSave, project }) => {
  const isEditing = !!project;

  return (
    <div className="flex flex-col h-full bg-background-light overflow-hidden">
      {/* Header */}
      <header className="p-4 min-h-11 bg-white/85 backdrop-blur-md border-b border-border-light/50 shrink-0 z-20 sticky top-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group cursor-pointer shrink-0"
                aria-label="Back"
              >
                <svg 
                  viewBox="416.66 432.14 158.84 158.84" 
                  className="size-8"
                >
                  <polyline 
                    fill="none"
                    stroke="#fff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="12"
                    points="507.33 540.98 478.51 512.16 507.33 483.34"
                    className="group-hover:-translate-x-[6px] transition-transform duration-200"
                  />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {isEditing ? 'Edit Project' : 'New Project'}
                </h2>
                <p className="text-slate-500 text-xs">
                    {isEditing ? `Editing "${project.title}"` : 'Create a new project from scratch or use a template'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left Column - Templates */}
          {!isEditing && (
            <div className="lg:col-span-5 xl:col-span-5">
                <TemplateSelector />
            </div>
          )}

          {/* Right Column - Form */}
          <div className={`${isEditing ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-7'} h-full`}>
            <ProjectForm onCancel={onBack} onSubmit={onSave} project={project} />
          </div>
        </div>
      </div>
    </div>
  );
};
