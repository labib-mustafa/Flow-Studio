import React from 'react';
import * as Popover from '@radix-ui/react-popover';

interface CellPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  triggerClassName?: string;
  children: React.ReactNode;
}

export const CellPopover: React.FC<CellPopoverProps> = ({
  open,
  onOpenChange,
  content,
  align = 'start',
  side = 'bottom',
  triggerClassName = '',
  children,
}) => {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild className={triggerClassName}>
        {children}
      </Popover.Trigger>
      {open && (
        <Popover.Portal>
          <Popover.Content
            align={align}
            side={side}
            sideOffset={5}
            className="z-50 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          >
            {content}
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
};
