import React, { useRef } from 'react';
import { useClientStore } from '../../../stores/clientStore';
import { useTeamStore } from '../../../stores/teamStore';
import { DatePickerInput } from '../../ui/DatePickerInput';

interface ProjectFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  project?: any;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onCancel, onSubmit, project }) => {
  const isEditing = !!project && !!project.id;
  const { clients } = useClientStore();
  const { members } = useTeamStore();
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (project && project.id) {
      const assignedIds = members
        .filter(m => (m.assignedProjects || []).includes(project.id))
        .map(m => m.id);
      setSelectedMembers(assignedIds);
    } else {
      setSelectedMembers([]);
    }
  }, [project, members]);

  const handleSubmit = () => {
    if (!formRef.current) return;
    const inputs = formRef.current.querySelectorAll('input, textarea, select');
    const data: any = {};
    inputs.forEach((input: any) => {
      if (input.name) data[input.name] = input.value;
    });
    data.assignedMembers = selectedMembers;
    onSubmit(data);
  };
  
  return (
    <div className="flex flex-col gap-4 h-full" ref={formRef}>
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
        Project Details <span className="text-slate-400 font-normal text-xs">(REQUIRED)</span>
      </h3>
      
      <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm flex-1 flex flex-col">
        <div className="space-y-6 flex-1">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input 
              name="title"
              type="text" 
              defaultValue={project ? project.title : ''}
              placeholder="Enter project title" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea 
              name="description"
              defaultValue={project ? project.description : ''}
              placeholder="Brief overview of the project goals..." 
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 resize-none"
            ></textarea>
          </div>

          {/* Status & Client Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Status
              </label>
              <div className="relative">
                <select name="status" defaultValue={project ? project.status : 'Planning'} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-slate-800 appearance-none bg-white cursor-pointer">
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Client
              </label>
              <div className="relative">
                <select name="client" defaultValue={project ? project.client : ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-slate-800 appearance-none bg-white cursor-pointer">
                  <option value="">No Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Start Date
              </label>
              <DatePickerInput 
                name="startDate"
                placeholder="Select start date..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Due Date
              </label>
              <DatePickerInput 
                name="deadline"
                defaultValue={isEditing ? project?.deadline : ''}
                placeholder="Select due date..."
              />
            </div>
          </div>

          {/* Assign Team Members */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700">
              Assign Team Members
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members.map(member => {
                const isChecked = selectedMembers.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedMembers(prev =>
                        isChecked ? prev.filter(id => id !== member.id) : [...prev, member.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:bg-slate-50 cursor-pointer ${
                      isChecked 
                        ? 'border-blue-500 bg-blue-50/10 shadow-sm' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {member.profilePic ? (
                      <img 
                        src={member.profilePic} 
                        alt={member.name} 
                        className="size-8 rounded-full object-cover shadow-sm border border-slate-100" 
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-sm">
                        {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">{member.role}</p>
                    </div>
                    <div className={`size-4 rounded-full border flex items-center justify-center transition-all ${
                      isChecked 
                        ? 'border-blue-500 bg-blue-500 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <span className="material-symbols-outlined text-[10px] font-black">check</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/30 transition-all transform active:scale-95"
          >
            {isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
