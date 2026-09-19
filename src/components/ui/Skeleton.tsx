import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rounded' | 'card' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    card: 'rounded-2xl',
    rectangular: 'rounded-none',
  }[variant];

  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 select-none ${variantStyles} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
    </div>
  );
};
