import React, { useState } from 'react';
import {
  Settings,
  X,
  Calendar,
  Users,
  Type,
  AlignLeft,
  ChevronDownSquare,
  Hash,
  Tags,
  CheckSquare,
  DollarSign,
  Globe,
  FunctionSquare,
  Link2,
  Paperclip,
  Activity,
  GitCommit,
  Mail,
  Phone,
  LayoutGrid,
  Languages,
  Smile,
  ListTodo,
  MapPin,
  Minus,
  Star,
  BarChart2,
  PenTool,
  ArrowUpRight,
  MousePointerClick,
  Shirt,
  Box,
  Target,
  MessageSquare,
  Flag,
  CalendarDays,
  Lock
} from 'lucide-react';

interface FieldItem {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  isLocked?: boolean;
}

const ALL_FIELDS: FieldItem[] = [
  // Working fields (Unlocked)
  { id: 'al1', label: 'Dropdown', icon: ChevronDownSquare, iconColor: 'text-emerald-600' },
  { id: 'al2', label: 'Text', icon: Type, iconColor: 'text-blue-500' },
  { id: 'al3', label: 'Date', icon: Calendar, iconColor: 'text-orange-700' },
  { id: 'al5', label: 'Number', icon: Hash, iconColor: 'text-teal-600' },
  { id: 'al7', label: 'Checkbox', icon: CheckSquare, iconColor: 'text-pink-600' },

  // Locked fields
  { id: 'al4', label: 'Text area (Long Text)', icon: AlignLeft, iconColor: 'text-blue-500', isLocked: true },
  { id: 'al6', label: 'Labels', icon: Tags, iconColor: 'text-emerald-600', isLocked: true },
  { id: 'al8', label: 'Money', icon: DollarSign, iconColor: 'text-emerald-500', isLocked: true },
  { id: 'al9', label: 'Website', icon: Globe, iconColor: 'text-red-500', isLocked: true },
  { id: 'al14', label: 'Files', icon: Paperclip, iconColor: 'text-purple-600', isLocked: true },
  { id: 'al15', label: 'Relationship', icon: Link2, iconColor: 'text-blue-600', isLocked: true },
  { id: 'al16', label: 'People', icon: Users, iconColor: 'text-red-500', isLocked: true },
  { id: 'al18', label: 'Email', icon: Mail, iconColor: 'text-red-500', isLocked: true },
  { id: 'al19', label: 'Phone', icon: Phone, iconColor: 'text-red-500', isLocked: true },
  { id: 'al25', label: 'Location', icon: MapPin, iconColor: 'text-red-500', isLocked: true },
  { id: 'al27', label: 'Rating', icon: Star, iconColor: 'text-orange-700', isLocked: true },
  { id: 'al28', label: 'Voting', icon: BarChart2, iconColor: 'text-purple-600', isLocked: true },
  { id: 'al31', label: 'Button', icon: MousePointerClick, iconColor: 'text-purple-600', isLocked: true },
];

interface HiddenFieldItem {
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const HIDDEN_FIELDS: HiddenFieldItem[] = [
  { label: 'Created by', icon: Users },
  { label: 'Date closed', icon: Calendar },
  { label: 'Date done', icon: Calendar },
  { label: 'Duration', icon: Activity },
  { label: 'Tags', icon: Tags },
  { label: 'Task ID', icon: Hash },
  { label: 'Time estimate', icon: Activity },
];

import { useTaskStore } from '../../../../stores/taskStore';

export default function FieldsSidebar({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const addColumnSchema = useTaskStore(state => state.addColumnSchema);

  const handleCreateField = (item: FieldItem) => {
    if (item.isLocked) return;
    let type: any = 'text';
    if (item.label === 'Number') type = 'number';
    else if (item.label === 'Date') type = 'date';
    else if (item.label === 'Dropdown') type = 'dropdown';
    else if (item.label === 'Checkbox') type = 'checkbox';

    addColumnSchema(item.label, type);
    onClose?.();
  };

  const renderList = (items: FieldItem[], highlightAI = false) => {
    return items.filter(item => item.label.toLowerCase().includes(search.toLowerCase())).map((item) => (
      <div
        key={item.id}
        className={`group flex items-center justify-between px-3 py-2 rounded-md transition-colors ${item.isLocked ? 'cursor-not-allowed opacity-80 text-gray-400 select-none' : 'cursor-pointer hover:bg-gray-50'}`}
        onMouseEnter={() => !item.isLocked && setHoveredId(item.id)}
        onMouseLeave={() => !item.isLocked && setHoveredId(null)}
        onClick={() => handleCreateField(item)}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`w-4 h-4 ${item.isLocked ? 'text-gray-400' : item.iconColor}`} strokeWidth={2} />
          <span className={`text-sm ${item.isLocked ? 'text-gray-400' : 'text-gray-700'}`}>{item.label}</span>
        </div>
        {item.isLocked ? (
          <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          highlightAI && hoveredId === item.id && (
            <button className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors">
              Create
            </button>
          )
        )}
      </div>
    ));
  };

  const allFiltered = ALL_FIELDS.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div 
      className="w-full h-full bg-white flex flex-col overflow-hidden select-none"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="pl-4 pr-3 py-3 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-[15px] font-semibold text-gray-900">Fields</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search area */}
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Search for new or existing fields"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-200">
        <button
          className={`pb-2 text-sm font-medium mr-4 transition-colors relative cursor-pointer ${activeTab === 'create' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('create')}
        >
          Create new
          {activeTab === 'create' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900" />
          )}
        </button>
        <button
          className={`pb-2 text-sm font-medium transition-colors relative cursor-pointer ${activeTab === 'existing' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('existing')}
        >
          Add existing
          {activeTab === 'existing' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900" />
          )}
        </button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-1 py-2 custom-scrollbar">
        {activeTab === 'create' ? (
          <>
            {/* All Fields list */}
            {allFiltered.length > 0 && (
              <div className="mb-2">
                {renderList(ALL_FIELDS)}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                Shown <ChevronDownSquare className="w-3 h-3 ml-1" />
              </span>
              <button className="text-xs text-gray-500 hover:text-gray-700">Hide all</button>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group">
              <div className="flex items-center gap-3 opacity-50">
                <Type className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-500">Task Name</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative opacity-50 cursor-not-allowed">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-700">Assignee</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative transition-colors">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-700">Due date</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative transition-colors">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-700">Status</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative transition-colors">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-700">Comments</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative transition-colors">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-gray-500" strokeWidth={2} />
                <span className="text-sm text-gray-700">Priority</span>
              </div>
              <div className="w-8 h-4 bg-accent rounded-full relative transition-colors">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  Hidden <ChevronDownSquare className="w-3 h-3 ml-1" />
                </span>
              </div>

              {HIDDEN_FIELDS.map(item => (
                <div key={item.label} className="px-3 py-1.5 flex items-center justify-between group hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    <span className="text-sm text-gray-700">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-purple-600 border border-purple-200 bg-purple-50">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-4 bg-gray-300 rounded-full relative transition-colors opacity-0 group-hover:opacity-100 focus-within:opacity-100 active:opacity-100 sm:opacity-100">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
