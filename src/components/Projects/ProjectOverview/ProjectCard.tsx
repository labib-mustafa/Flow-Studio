import React, { useState } from 'react';
import { Edit2, CheckCircle, MessageSquare, Trash2, Pin, Image } from 'lucide-react';
import { sound } from '../../../stores/soundStore';

interface ProjectCardProps {
  image: string;
  category: string;
  status: string;
  statusColor: string;
  progress: number;
  client: string;
  title: string;
  deadline: string;
  isPortfolio?: boolean;
  onClick?: () => void;
  onEditClick?: (e: React.MouseEvent) => void;
  onDeleteClick?: (e: React.MouseEvent) => void;
  tasksCount?: number;
  commentsCount?: number;
  doneTasks?: number;
  isPinned?: boolean;
  onPinClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ProjectCard = React.memo(({
  image,
  category,
  status,
  statusColor,
  progress,
  client,
  title,
  deadline,
  isPortfolio,
  onClick,
  onEditClick,
  onDeleteClick,
  tasksCount = 0,
  commentsCount = 0,
  doneTasks = 0,
  isPinned = false,
  onPinClick,
  onContextMenu,
}: ProjectCardProps) => {
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [image]);

  const handleClick = (e: React.MouseEvent) => {
    sound.tick();
    if (onClick) onClick();
  };

  const getStatusStyle = (statusStr: string = '') => {
    const s = statusStr.toLowerCase();
    if (s.includes('plan')) {
      return 'bg-slate-800/95 text-slate-100';
    }
    if (s.includes('progress') || s.includes('active')) {
      return 'bg-blue-600 text-white shadow-xs';
    }
    if (s.includes('complete') || s.includes('done')) {
      return 'bg-emerald-600 text-white shadow-xs';
    }
    if (s.includes('review')) {
      return 'bg-amber-600 text-white shadow-xs';
    }
    return 'bg-white/95 backdrop-blur-md text-slate-900 shadow-xs';
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={onContextMenu}
      className="group bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden hover:shadow-lg hover:shadow-slate-900/5 hover:border-slate-300 transition-all duration-200 cursor-pointer font-display select-none"
    >
      <div className="h-48 relative overflow-hidden bg-slate-50 flex items-center justify-center">
        {image && !imageError ? (
          <img
            alt={title}
            src={image}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors duration-300">
            <Image className="size-8 text-slate-400/80 mb-1.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {imageError ? 'Failed to Load Image' : 'No Banner Image'}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center justify-center min-w-[65px] ${getStatusStyle(status)}`}>
            {status}
          </span>
        </div>

        {/* Apple Spring Action Buttons */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          {onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.tick();
                onEditClick(e);
              }}
              className="p-1.5 bg-white/95 backdrop-blur-md rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              title="Edit project"
            >
              <Edit2 className="size-3.5" />
            </button>
          )}
          {onDeleteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.delete();
                onDeleteClick(e);
              }}
              className="p-1.5 bg-white/95 backdrop-blur-md rounded-xl text-slate-600 hover:text-red-600 hover:bg-white shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              title="Delete project"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          {onPinClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.pop();
                onPinClick(e);
              }}
              className={`p-1.5 backdrop-blur-md rounded-xl shadow-sm transition-all duration-150 cursor-pointer ${
                isPinned
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white/95 text-slate-600 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95'
              }`}
              title={isPinned ? 'Unpin project' : 'Pin project'}
            >
              <Pin className={`size-3.5 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 bg-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-blue-600 transition-colors tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">{client} • {category}</p>
          </div>
          <div className="w-7 h-7 rounded-xl border border-slate-200/90 bg-slate-100/70 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
            {title.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Progress Bar with Apple animated transition */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-500 text-[11px]">
              {tasksCount > 0 ? `${doneTasks}/${tasksCount} tasks done` : 'Progress'}
            </span>
            <span className="text-blue-600 font-bold text-[11px]">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div className="flex items-center gap-3.5 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <CheckCircle className="size-3 text-emerald-500" /> {tasksCount} Tasks
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <MessageSquare className="size-3 text-blue-500" /> {commentsCount}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/60">
            {deadline}
          </span>
        </div>
      </div>
    </div>
  );
});
