import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  type?: 'syncing' | 'search';
  id?: string;
}

const Avatar = ({ src, className }: { src: string; className?: string }) => (
  <div className={`absolute rounded-lg overflow-hidden bg-white shadow-sm p-0.5 border border-slate-100 ${className}`}>
    <img src={src} alt="avatar" className="w-full h-full object-cover rounded-md" />
  </div>
);

const SkeletonItem = ({ isHighlighted = false }: { isHighlighted?: boolean }) => (
  <div
    className={`w-64 h-14 rounded-xl flex items-center px-4 gap-3 bg-white ${isHighlighted
      ? 'border-2 border-blue-500 shadow-[0_4px_24px_rgba(59,130,246,0.2)] z-10'
      : 'border border-slate-100 shadow-sm opacity-80'
      }`}
  >
    <div className="w-8 h-8 rounded-full bg-slate-100" />
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="w-3/4 h-2.5 rounded-full bg-slate-100" />
      <div className="w-1/2 h-2 rounded-full bg-slate-100" />
    </div>
    <div className="flex flex-col gap-1 items-center ml-auto">
      <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
      <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
      <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
    </div>
  </div>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  id = 'empty-state',
}) => {
  return (
    <div id="lead-empty-state" className="w-full flex flex-col items-center justify-center py-24 select-none">

      {/* Visual Component */}
      <div className="relative w-96 h-96 flex items-center justify-center mb-4">

        {/* Concentric Circles */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-slate-100/60" />
        <div className="absolute w-[320px] h-[320px] rounded-full border border-slate-100/80" />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-slate-100" />
        <div className="absolute w-[160px] h-[160px] rounded-full border border-slate-200" />

        {/* Floating Avatars (Positioned around the circles) */}
        <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-7 h-7 -top-6 left-1/2 -ml-16" />
        <Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-8 h-8 top-12 right-12" />
        <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-9 h-9 bottom-32 right-2" />
        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" className="w-8 h-8 bottom-4 left-1/4" />
        <Avatar src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop" className="w-10 h-10 top-1/3 left-2" />

        {/* Central Skeletons */}
        <div className="relative z-10 flex flex-col gap-3">
          <SkeletonItem />
          <SkeletonItem isHighlighted />
          <SkeletonItem />
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 text-center max-w-sm leading-relaxed mb-8 whitespace-pre-wrap">
        {description}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
      </div>

    </div>
  );
};
