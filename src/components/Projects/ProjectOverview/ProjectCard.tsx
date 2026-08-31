import React from 'react';
import { Edit2, CheckCircle, MessageSquare, Trash2, Pin, Image } from 'lucide-react';

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
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [image]);

  const getStatusStyle = (statusStr: string = '') => {
    const s = statusStr.toLowerCase();
    if (s.includes('plan')) {
      return 'bg-slate-800/95 text-slate-100';
    }
    if (s.includes('progress') || s.includes('active')) {
      return 'bg-blue-500 text-white';
    }
    if (s.includes('complete') || s.includes('done')) {
      return 'bg-emerald-600 text-white';
    }
    if (s.includes('review')) {
      return 'bg-orange-500 text-white';
    }
    return 'bg-white/90 backdrop-blur-sm text-slate-900';
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer font-display"
    >
      <div className="h-48 relative overflow-hidden bg-white flex items-center justify-center">
        {image && !imageError ? (
          <img
            alt={title}
            src={image}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-black/15 flex flex-col items-center justify-center text-slate-400 group-hover:from-slate-100 group-hover:to-slate-200 transition-all duration-300">
            <Image className="size-8 text-black/50 mb-1.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">
              {imageError ? 'Failed to Load Image' : 'No Banner Image'}
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center justify-center min-w-[70px] ${getStatusStyle(status)}`}>
            {status}
          </span>
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(e);
              }}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Edit project"
            >
              <Edit2 className="size-4" />
            </button>
          )}
          {onDeleteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(e);
              }}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-red-600 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete project"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          {onPinClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e);
              }}
              className={`p-1.5 backdrop-blur-sm rounded-lg shadow-sm transition-all duration-200 ${isPinned
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white/90 text-slate-600 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100'
                }`}
              title={isPinned ? "Unpin project" : "Pin project"}
            >
              <Pin className={`size-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 bg-[#FAF9F6]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{client} • {category}</p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
              {title.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-600">
              {tasksCount > 0 ? `${doneTasks}/${tasksCount} tasks done` : 'Project Progress'}
            </span>
            <span className="text-blue-600">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5" /> {tasksCount} Tasks</span>
            <span className="flex items-center gap-1.5"><MessageSquare className="size-3.5" /> {commentsCount} Comments</span>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md">{deadline}</span>
        </div>
      </div>
    </div>
  );
});
