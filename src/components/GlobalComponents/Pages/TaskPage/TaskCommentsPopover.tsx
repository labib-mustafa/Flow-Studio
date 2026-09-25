import React, { useState, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Task } from '../../../../stores/taskStore';
import { useTaskStore } from '../../../../stores/taskStore';
import { CellPopover } from '../../../ui/CellPopover';

interface TaskCommentsPopoverProps {
  task: Task;
  children?: React.ReactNode;
}

// Custom SVGs matching Cal.com / clean modern brand aesthetics
const PaperclipIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const DropboxIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[#0061FE]">
    <path d="M5.18 3.5L1.13 6.13l3.66 2.97 4.05-2.63L5.18 3.5zm13.64 0l-4.05 2.97 4.05 2.63 3.66-2.97-3.66-2.63zM1.13 12.07l4.05 2.63 3.66-2.97-4.05-2.63-3.66 2.97zm17.69-2.97l-4.05 2.63 3.66 2.97 4.05-2.63-3.66-2.97zm-9.98 3.79v1.27l4.05 2.39 4.05-2.39v-1.27l-4.05 2.61-4.05-2.61zm4.05-10.23L8.84 5.29l4.05 2.61 4.05-2.61-4.05-2.63z"/>
  </svg>
);

const OneDriveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[#0078d4]">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-[#0061FE]">
    <rect x="2" y="2" width="20" height="20" rx="4" />
    <path d="M7 10h10M7 14h6" strokeLinecap="round" />
  </svg>
);

const GoogleDriveIcon = () => (
  <img src="/assets/google-logos/google-drive.png" className="w-4 h-4 object-contain shrink-0" alt="Google Drive" />
);

const GoogleDocIcon = () => (
  <img src="/assets/google-logos/google-sheets.png" className="w-4 h-4 object-contain shrink-0" alt="Google Sheets" />
);

const FILE_OPTIONS = [
  { id: 'local', label: 'Upload file', customIcon: <PaperclipIcon /> },
  { id: 'drive', label: 'Google Drive', customIcon: <GoogleDriveIcon /> },
  { id: 'googledoc', label: 'New Google Doc', customIcon: <GoogleDocIcon /> },
];

export const TaskCommentsPopover: React.FC<TaskCommentsPopoverProps> = React.memo(({ task, children }) => {
  const [commentText, setCommentText] = useState('');
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Mention Dropdown States
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionActiveTab, setMentionActiveTab] = useState<'members' | 'tasks' | 'docs' | 'channels'>('members');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionTriggerIndicator, setMentionTriggerIndicator] = useState('@');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  React.useEffect(() => {
    if (popoverOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const taskPageContainer = document.getElementById('task-page-container');
      const originalContainerOverflow = taskPageContainer ? taskPageContainer.style.overflow : '';
      if (taskPageContainer) {
        taskPageContainer.style.overflow = 'hidden';
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (taskPageContainer) {
          taskPageContainer.style.overflow = originalContainerOverflow;
        }
      };
    }
  }, [popoverOpen]);

  const numComments = task.comments?.length || 0;
  const isAiMode = commentText.startsWith('@Brain');

  const handleSend = () => {
    if (commentText.trim()) {
      useTaskStore.getState().addTaskComment(task.id, commentText);
      setCommentText('');
    }
  };

  const calculateRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return days === 1 ? 'Yesterday' : `${days} days ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      useTaskStore.getState().addTaskComment(task.id, `📎 Uploaded: ${file.name}`);
      setIsAddFileOpen(false);
    }
  };

  const handleSelectIntegration = (option: typeof FILE_OPTIONS[0]) => {
    if (option.id === 'local') {
      fileInputRef.current?.click();
    } else {
      const filenames: Record<string, string[]> = {
        dropbox: ['Design-Brief-V2.pdf', 'moodboard-assets.zip', 'Contracts-signed.pdf'],
        onedrive: ['Financial-Forecast.xlsx', 'Client-Feedback.docx', 'Presentation-Notes.pptx'],
        box: ['Archive-logs.tgz', 'Marketing-Kit.zip'],
        drive: ['Project-Proposal.gdoc', 'Q3-Strategy-Deck.gslide', 'Budget-Tracker.gsheet'],
        googledoc: ['Untitled Document.gdoc']
      };
      const list = filenames[option.id] || ['Document.pdf'];
      const randomName = list[Math.floor(Math.random() * list.length)];
      useTaskStore.getState().addTaskComment(task.id, `📎 Uploaded: ${randomName}`);
      setIsAddFileOpen(false);
    }
  };

  // Mention Autocomplete Functions
  const getFlatFilteredItems = () => {
    const query = mentionQuery.toLowerCase().trim();
    
    if (mentionActiveTab === 'members') {
      const rawItems = [
        { id: 'me', name: 'Me', avatar: 'ID', subtitle: 'You' },
        { id: 'sarah', name: 'Sarah Jenkins', avatar: 'SJ', subtitle: 'Product' },
        { id: 'marcus', name: 'Marcus Chen', avatar: 'MC', subtitle: 'Design' },
        { id: 'agent', name: 'Onboarding Assistant', avatar: 'https://i.pravatar.cc/150?img=47', tag: 'My Agent' },
        { id: 'create', name: 'Create Agent', icon: 'add', isAction: true },
        { id: 'followers', name: 'Followers', icon: 'visibility', isAction: true },
      ];
      return rawItems.filter(item => item.name.toLowerCase().includes(query));
    }
    
    if (mentionActiveTab === 'tasks') {
      const rawTasks = useTaskStore.getState().tasks.map(t => ({
        id: t.id,
        name: t.title,
        status: t.status,
        phase: t.phase,
      }));
      return rawTasks.filter(item => item.name.toLowerCase().includes(query));
    }
    
    if (mentionActiveTab === 'docs') {
      const rawDocs = [
        { id: 'untitled', name: 'Untitled', icon: 'description' },
        { id: 'page2', name: 'Page 2', icon: 'description' },
        { id: 'briefs', name: 'Client briefs', icon: 'description' },
        { id: 'launch', name: 'Launch Plan', icon: 'description' },
      ];
      return rawDocs.filter(item => item.name.toLowerCase().includes(query));
    }
    
    if (mentionActiveTab === 'channels') {
      const rawChannels = [
        { id: 'general', name: 'general', icon: 'tag' },
        { id: 'marketing', name: 'marketing', icon: 'tag' },
        { id: 'engineering', name: 'engineering', icon: 'tag' },
      ];
      return rawChannels.filter(item => item.name.toLowerCase().includes(query));
    }
    
    return [];
  };

  const handleSelectMentionItem = (item: any) => {
    let replacementText = '';
    if (mentionActiveTab === 'members') {
      replacementText = `@${item.name} `;
    } else if (mentionActiveTab === 'tasks') {
      replacementText = `@Task: ${item.name} `;
    } else if (mentionActiveTab === 'docs') {
      replacementText = `@Doc: ${item.name} `;
    } else if (mentionActiveTab === 'channels') {
      replacementText = `#${item.name} `;
    }

    const val = commentText;
    const caret = textareaRef.current ? textareaRef.current.selectionStart : val.length;
    const textBefore = val.substring(0, caret);
    const textAfter = val.substring(caret);

    const lastIdx = textBefore.lastIndexOf(mentionTriggerIndicator);
    if (lastIdx !== -1) {
      const newVal = textBefore.substring(0, lastIdx) + replacementText + textAfter;
      setCommentText(newVal);
      setMentionOpen(false);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = lastIdx + replacementText.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    } else {
      const newVal = val + replacementText;
      setCommentText(newVal);
      setMentionOpen(false);
    }
  };

  const checkForMention = (text: string, caretIndex: number) => {
    const textBefore = text.substring(0, caretIndex);
    const indicators = ['@@@', '@@', '@', '#'];
    
    let foundIndicator = null;
    let foundIdx = -1;
    
    for (const indicator of indicators) {
      const lastIdx = textBefore.lastIndexOf(indicator);
      if (lastIdx !== -1) {
        const charBefore = lastIdx > 0 ? textBefore[lastIdx - 1] : '';
        const isAtBoundary = charBefore === '' || /\s/.test(charBefore);
        
        if (isAtBoundary) {
          const queryPart = textBefore.substring(lastIdx + indicator.length);
          if (!/[\r\n]/.test(queryPart) && (queryPart.match(/ /g) || []).length <= 1) {
            foundIndicator = indicator;
            foundIdx = lastIdx;
            break;
          }
        }
      }
    }
    
    if (foundIndicator && foundIdx !== -1) {
      const query = textBefore.substring(foundIdx + foundIndicator.length);
      let tab: 'members' | 'tasks' | 'docs' | 'channels' = 'members';
      
      if (foundIndicator === '@@@') tab = 'docs';
      else if (foundIndicator === '@@') tab = 'tasks';
      else if (foundIndicator === '#') tab = 'channels';
      else if (foundIndicator === '@') tab = 'members';
      
      setMentionOpen(true);
      setMentionActiveTab(tab);
      setMentionQuery(query);
      setMentionTriggerIndicator(foundIndicator);
      setMentionSelectedIndex(0);
    } else {
      setMentionOpen(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const caret = e.target.selectionStart;
    setCommentText(val);
    checkForMention(val, caret);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen) {
      const items = getFlatFilteredItems();
      if (items.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionSelectedIndex((prev) => (prev + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelectMentionItem(items[mentionSelectedIndex]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setMentionOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMentionOpen(false);
      }
    }
  };

  const handleToolbarMentionClick = () => {
    const val = commentText;
    const textarea = textareaRef.current;
    if (textarea) {
      const caret = textarea.selectionStart;
      const textBefore = val.substring(0, caret);
      const textAfter = val.substring(caret);
      
      const newVal = textBefore + '@' + textAfter;
      setCommentText(newVal);
      
      const newCaret = caret + 1;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCaret, newCaret);
        checkForMention(newVal, newCaret);
      }, 10);
    } else {
      setCommentText(prev => prev + '@');
      setMentionOpen(true);
      setMentionActiveTab('members');
      setMentionQuery('');
      setMentionTriggerIndicator('@');
      setMentionSelectedIndex(0);
    }
  };

  const renderItemRow = (
    item: any, 
    globalIndex: number, 
    selectedIndex: number, 
    onItemClick: (item: any) => void
  ) => {
    const isSelected = globalIndex === selectedIndex;
    
    const getTaskStatusBullet = (status?: string, phase?: string) => {
      if (status === 'Complete') return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />;
      if (phase === 'inprogress') return <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />;
      if (phase === 'review') return <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />;
      return <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] flex-shrink-0" />;
    };

    return (
      <button
        key={item.id}
        type="button"
        onMouseDown={(e) => {
          // Prevent losing focus of textarea
          e.preventDefault();
          onItemClick(item);
        }}
        onMouseEnter={() => setMentionSelectedIndex(globalIndex)}
        className={`flex items-center justify-between w-full px-3 py-2 text-[13px] rounded-[8px] transition-colors cursor-pointer text-left ${
          isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {mentionActiveTab === 'members' && (
            item.avatar ? (
              item.avatar.length <= 2 ? (
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold flex-shrink-0">
                  {item.avatar}
                </div>
              ) : (
                <img referrerPolicy="no-referrer" src={item.avatar} alt={item.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              )
            ) : item.icon ? (
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0" />
            )
          )}
          
          {mentionActiveTab === 'tasks' && getTaskStatusBullet(item.status, item.phase)}
          
          {item.icon && mentionActiveTab !== 'members' && (
            <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">
              {item.icon}
            </span>
          )}

          <span className="font-medium truncate flex-1">{item.name}</span>
        </div>

        {item.tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 flex-shrink-0">
            {item.tag}
          </span>
        )}
        
        {item.id === 'agent' && (
          <span className="text-[11px] text-[#ef4444] font-medium flex-shrink-0">My Agent</span>
        )}
      </button>
    );
  };

  const renderMentionContent = () => {
    const flatItems = getFlatFilteredItems();
    if (flatItems.length === 0) {
      return (
        <div className="text-center py-6 text-[12.5px] text-slate-400 select-none font-medium">
          No matches found
        </div>
      );
    }

    if (mentionActiveTab === 'members') {
      if (mentionQuery.trim() !== '') {
        return flatItems.map((item, idx) => renderItemRow(item, idx, mentionSelectedIndex, handleSelectMentionItem));
      }
      
      const people = flatItems.filter(i => ['me', 'sarah', 'marcus'].includes(i.id));
      const agents = flatItems.filter(i => ['agent', 'create'].includes(i.id));
      const teams = flatItems.filter(i => ['followers'].includes(i.id));
      
      return (
        <div className="flex flex-col gap-0.5">
          {people.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 select-none uppercase tracking-wider">People</div>
              {people.map(item => {
                const globalIndex = flatItems.findIndex(x => x.id === item.id);
                return renderItemRow(item, globalIndex, mentionSelectedIndex, handleSelectMentionItem);
              })}
            </>
          )}
          
          {agents.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 select-none uppercase tracking-wider mt-1.5">Agents</div>
              {agents.map(item => {
                const globalIndex = flatItems.findIndex(x => x.id === item.id);
                return renderItemRow(item, globalIndex, mentionSelectedIndex, handleSelectMentionItem);
              })}
            </>
          )}
          
          {teams.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 select-none uppercase tracking-wider mt-1.5">Teams</div>
              {teams.map(item => {
                const globalIndex = flatItems.findIndex(x => x.id === item.id);
                return renderItemRow(item, globalIndex, mentionSelectedIndex, handleSelectMentionItem);
              })}
            </>
          )}
        </div>
      );
    }

    if (mentionActiveTab === 'tasks') {
      if (mentionQuery.trim() !== '') {
        return flatItems.map((item, idx) => renderItemRow(item, idx, mentionSelectedIndex, handleSelectMentionItem));
      }
      
      return (
        <div className="flex flex-col gap-0.5">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 select-none uppercase tracking-wider flex justify-between items-center">
            <span>Recent</span>
            <span className="text-[11px] text-[#7b68ee] font-medium cursor-pointer hover:underline normal-case">Browse tasks</span>
          </div>
          {flatItems.map(item => {
            const globalIndex = flatItems.findIndex(x => x.id === item.id);
            return renderItemRow(item, globalIndex, mentionSelectedIndex, handleSelectMentionItem);
          })}
        </div>
      );
    }

    return flatItems.map((item, idx) => renderItemRow(item, idx, mentionSelectedIndex, handleSelectMentionItem));
  };

  const content = popoverOpen ? (
    <div className="w-[420px] overflow-visible relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="text-[13px] font-medium text-slate-700">
          {numComments === 0 ? "Comments" : `${numComments} Comment${numComments !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Comment List Scroller */}
      <div className="max-h-[240px] overflow-y-auto px-4 py-3 space-y-4">
        {task.comments?.map((comment) => {
          const isFileAttachment = comment.text.startsWith('📎 Uploaded:');
          const fileName = isFileAttachment ? comment.text.replace('📎 Uploaded:', '').trim() : '';

          return (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-[12px]">
                {comment.user.avatarUrl && comment.user.avatarUrl.length <= 2 ? comment.user.avatarUrl : (
                  <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-slate-900">{comment.user.name}</span>
                  <span className="text-[11px] text-slate-400">{calculateRelativeTime(comment.createdAt)}</span>
                </div>
                {isFileAttachment ? (
                  <div className="mt-2.5 p-2 border border-slate-200 rounded-[8px] bg-slate-50 flex items-center gap-2.5 max-w-[310px] shadow-sm hover:border-[#7b68ee] transition-colors group">
                    <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">insert_drive_file</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-700 truncate group-hover:text-[#7b68ee] transition-colors">{fileName}</div>
                      <div className="text-[10px] text-slate-400">Click to preview</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-700 mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                    {comment.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {numComments === 0 && (
          <div className="text-center py-6 text-[13px] text-slate-400">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Bottom Editor Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 relative rounded-b-[12px]">
        {mentionOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2.5 z-50 bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-slate-200 flex flex-col max-h-[290px] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Horizontal Category Switcher Tabs */}
            <div className="flex items-center gap-3.5 px-3.5 py-2.5 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50">
              {[
                { id: 'members', label: 'People' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'docs', label: 'Docs' },
                { id: 'channels', label: 'Channels' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Keep focus on textarea
                    setMentionActiveTab(tab.id as any);
                    setMentionSelectedIndex(0);
                  }}
                  className={`text-[12.5px] py-0.5 font-semibold select-none focus:outline-none transition-all border-b-2 whitespace-nowrap cursor-pointer hover:text-slate-900 ${
                    mentionActiveTab === tab.id 
                      ? 'text-[#7b68ee] border-[#7b68ee]' 
                      : 'text-slate-400 border-transparent hover:border-slate-250'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scroller for suggestion list rows */}
            <div className="overflow-y-auto p-1.5 flex flex-col gap-0.5 max-h-[175px] custom-scrollbar bg-white">
              {renderMentionContent()}
            </div>

            {/* Help Shortcut Keyboard Footer */}
            <div className="px-3.5 py-2.5 border-t border-slate-100 bg-slate-50 text-[10.5px] text-slate-400 font-semibold tracking-wide whitespace-nowrap overflow-x-auto no-scrollbar select-none flex items-center gap-3">
              <div>
                <span className="text-[#7b68ee] font-bold bg-[#7b68ee]/10 px-1 py-0.5 rounded mr-1">@</span> People
              </div>
              <div className="w-[1px] h-3 bg-slate-200" />
              <div>
                <span className="text-[#7b68ee] font-bold bg-[#7b68ee]/10 px-1 py-0.5 rounded mr-1">@@</span> Tasks
              </div>
              <div className="w-[1px] h-3 bg-slate-200" />
              <div>
                <span className="text-[#7b68ee] font-bold bg-[#7b68ee]/10 px-1 py-0.5 rounded mr-1">@@@</span> Docs
              </div>
              <div className="w-[1px] h-3 bg-slate-200" />
              <div>
                <span className="text-[#7b68ee] font-bold bg-[#7b68ee]/10 px-1 py-0.5 rounded mr-1">#</span> Channels
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[10px] shadow-sm relative focus-within:ring-1 focus-within:ring-[#7b68ee] focus-within:border-[#7b68ee] transition-all">
          {isAiMode && (
            <div className="px-3 py-1.5 bg-[#7b68ee]/10 text-[#7b68ee] text-[12px] font-medium flex items-center gap-1.5 border-b border-[#7b68ee]/10 rounded-t-[9px]">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
              Ai Generation Mode Active
            </div>
          )}
          <textarea 
            ref={textareaRef}
            value={commentText}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Mention @Brain to create, find, ask anything"
            className={`w-full text-[13px] text-slate-800 placeholder:text-slate-400 border-none outline-none resize-none p-3 min-h-[60px] ${
              isAiMode ? "" : "rounded-t-[9px]"
            }`}
            rows={2}
          />
          
          {/* Action Toolbar Footer */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1 bg-white rounded-b-[9px]">
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              
              {/* File Upload Dropdown Container */}
              <div className="relative">
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={handleFileChange} 
                />
                <button 
                   onClick={() => setIsAddFileOpen(!isAddFileOpen)}
                   className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                     isAddFileOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                   }`}
                   title="Add a file"
                >
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                </button>

                {isAddFileOpen && (
                  <>
                    <div 
                       className="fixed inset-0 z-40 cursor-default" 
                       onClick={() => setIsAddFileOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 z-50 w-56 bg-white rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 p-1.5 flex flex-col gap-0.5">
                      {FILE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectIntegration(option)}
                          className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-[8px] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          {option.customIcon}
                          <span className="font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={handleToolbarMentionClick}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Mention someone"
              >
                <span className="material-symbols-outlined text-[16px]">alternate_email</span>
              </button>

            </div>
            
            <button 
              onClick={handleSend}
              disabled={!commentText.trim()}
              className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${
                commentText.trim() 
                  ? 'bg-[#111111] text-white cursor-pointer hover:bg-[#242424]' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] ml-0.5">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <CellPopover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      content={content}
      align="start"
      side="bottom"
      triggerClassName="w-full h-full"
    >
      {children ? (
        React.cloneElement(children as React.ReactElement<{ className?: string }>, {
          className: `${(children as React.ReactElement<{ className?: string }>).props.className || ''} ${popoverOpen ? '!border-gray-300' : ''}`
        })
      ) : (
        <div className="relative group/comments-trigger flex items-center justify-center">
          <button className="flex items-center text-slate-300 hover:text-slate-500 outline-none p-1 rounded-md hover:bg-slate-100 transition-colors pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {numComments > 0 && (
              <span className="ml-1 text-[11px] font-medium text-slate-400">{numComments}</span>
            )}
          </button>
          {/* Custom Premium Hovering View Tooltip */}
          <div className="absolute bottom-full mb-[6px] opacity-0 group-hover/comments-trigger:opacity-100 transition-opacity delay-200 pointer-events-none z-[100] flex flex-col items-center drop-shadow-md">
            <div className="bg-[#2a2a2a] text-white text-[11px] font-semibold px-2.5 py-1 rounded-[4px] whitespace-nowrap text-center leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              {numComments === 0 ? "Comments" : `${numComments} Comment${numComments !== 1 ? "s" : ""}`}
            </div>
            <div className="w-1.5 h-1.5 bg-[#2a2a2a] rotate-45 -mt-[3px]"></div>
          </div>
        </div>
      )}
    </CellPopover>
  );
});
