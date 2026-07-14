import React, { useEffect, useId } from 'react';
import { useDevStore } from '../../../stores/devStore';

interface WithDevHoverBoundsProps {
  children: React.ReactElement;
  className?: string;
  devId?: string;
  devName?: string;
  devCategory?: string;
}

export const WithDevHoverBounds: React.FC<WithDevHoverBoundsProps> = ({ 
  children, 
  className = '',
  devId,
  devName = 'Unnamed Component',
  devCategory = 'UI Components' 
}) => {
  const flags = useDevStore(state => state.flags);
  const hiddenItemsRegistry = useDevStore(state => state.hiddenItemsRegistry);
  const registerHiddenItem = useDevStore(state => state.registerHiddenItem);
  const isDeveloperModeEnabled = useDevStore(state => state.isDeveloperModeEnabled);
  
  const generatedId = useId();
  const id = devId || generatedId;

  // Register into the hidden items tree view if experimental/dev modes are active
  useEffect(() => {
    // We only register if dev mode master is on or a flag is open to save memory in prod
    if (isDeveloperModeEnabled || flags.showHiddenButtons || flags.showComponentBorders) {
       registerHiddenItem(devCategory, {
         id,
         name: devName
       });
    }
  }, [devCategory, id, devName, registerHiddenItem, isDeveloperModeEnabled, flags.showHiddenButtons, flags.showComponentBorders]);

  const isForced = hiddenItemsRegistry[devCategory]?.find(item => item.id === id)?.isForced;
  const isActive = flags.showHiddenButtons || flags.showComponentBorders || isForced;

  if (!isActive) {
    return children;
  }

  let devClass = 'cursor-crosshair transition-all duration-75 ';
  
  if (isForced) {
    devClass += 'outline outline-2 outline-dashed outline-red-500 -outline-offset-1 bg-red-500/10 !opacity-100 !visible ';
  } else if (flags.showHiddenButtons) {
     devClass += 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-red-500 hover:-outline-offset-1 hover:bg-red-500/10 ';
  }

  if (flags.showComponentBorders) {
     devClass += 'outline outline-1 outline-blue-400/50 -outline-offset-1 ';
  }

  const childClassName = children.props.className || '';

  return React.cloneElement(children, {
    className: `${childClassName} ${devClass} ${className}`.trim(),
  });
};
