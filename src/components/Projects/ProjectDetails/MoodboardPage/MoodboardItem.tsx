import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, X, Lock } from 'lucide-react';
import { getReadableTextColor } from '../../../../utils/colorUtils';
import { getSmoothPath, getArrowHeadPath, getArrowTailPath, getShortenedLineEnd, getShortenedLineStart } from '../../../../utils/drawingUtils';
import { useMoodboardStore } from '../../../../stores/moodboardStore';

export type MoodboardItemType = 
  | 'note' 
  | 'text' 
  | 'image' 
  | 'color' 
  | 'shape' 
  | 'arrow' 
  | 'pencil'
  | 'bookmark'
  | 'frame';

export interface UrlMeta {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
}

export interface CropMaskConfig {
  mode: 'crop' | 'mask';
  maskShape: 'none' | 'circle' | 'rounded' | 'hexagon' | 'star';
  zoom: number;
  panX: number;
  panY: number;
}

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommentPin {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
  resolved: boolean;
  replies?: CommentReply[];
}

export type GridType = 'dot' | 'square' | 'isometric' | 'blank';

export interface GridConfig {
  type: GridType;
  size: number;
  opacity: number;
  snapToGrid: boolean;
}

export interface MoodboardItemData {
  id: string;
  type: MoodboardItemType;
  x: number;
  y: number;
  content?: string;
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
  title?: string;
  shapeType?: 'rectangle' | 'circle';
  borderWidth?: number;
  borderColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  isItalic?: boolean;
  points?: { x: number; y: number }[]; // For pencil paths
  smoothing?: number; // For pencil paths
  start?: { x: number; y: number }; // For arrows
  end?: { x: number; y: number }; // For arrows
  controlPoint?: { x: number; y: number }; // For curved arrows
  arrowHeadStyle?: 'triangle' | 'line' | 'filled' | 'none';
  arrowTailStyle?: 'none' | 'dot' | 'flat' | 'arrow';

  // Milestone 2 Extended Fields
  isLocked?: boolean;
  paletteColors?: string[];
  urlMeta?: UrlMeta;
  frameId?: string;
  isFrame?: boolean;
  frameColor?: string;
  cropMask?: CropMaskConfig;
  categories?: string[];
  comments?: CommentPin[];
}


interface MoodboardItemProps {
  item: MoodboardItemData;
  isSelected: boolean;
  activeTool: 'select' | 'hand' | 'arrow' | 'pencil' | 'comment';
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MoodboardItemData>) => void;
  onUpdateTransient?: (id: string, updates: Partial<MoodboardItemData>) => void;
  onDelete: (id: string) => void;
  onEditImage?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onCopy?: (text: string, label: string) => void;
  zoom: number;
  snapPoints?: { x: number, y: number }[];
  isDimmed?: boolean;
}

export const MoodboardItem: React.FC<MoodboardItemProps> = ({ item, isSelected, activeTool, onSelect, onUpdate, onUpdateTransient, onDelete, onEditImage, onContextMenu, onCopy, zoom, snapPoints = [], isDimmed = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (item.type === 'note' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [item.content, item.type]);

  useEffect(() => {
    if (item.type === 'image' && isSelected && (!item.paletteColors || item.paletteColors.length === 0)) {
      useMoodboardStore.getState().extractImagePalette(item.id);
    }
  }, [item.id, item.type, isSelected, item.paletteColors]);

  const isHandTool = activeTool === 'hand';

  const renderContent = () => {
    switch (item.type) {
      case 'note':
        return (
          <div
            className="rounded-xl shadow-md border p-4 flex flex-col w-full h-full transition-colors"
            style={{ backgroundColor: item.color || '#fffbeb', borderColor: item.color ? 'transparent' : '#fef3c7' }}
          >
            <input
              className={`w-full bg-transparent border-none focus:ring-0 outline-none text-base font-bold font-handwriting mb-1 p-0 ${isHandTool ? 'pointer-events-none' : ''}`}
              style={{
                color: getReadableTextColor(item.color || '#fffbeb').color,
                textShadow: getReadableTextColor(item.color || '#fffbeb').textShadow
              }}
              value={item.title || ''}
              onChange={(e) => {
                if (onUpdateTransient) {
                  onUpdateTransient(item.id, { title: e.target.value });
                } else {
                  onUpdate(item.id, { title: e.target.value });
                }
              }}
              onBlur={(e) => onUpdate(item.id, { title: e.target.value })}
              onPointerDown={(e) => {
                if (isHandTool) return;
                e.stopPropagation();
                (e.target as HTMLInputElement).focus();
              }}
              placeholder="Title"
              readOnly={isHandTool}
            />
            <textarea
              ref={textareaRef}
              className={`w-full flex-1 bg-transparent border-none resize-none focus:ring-0 outline-none text-sm font-handwriting leading-snug p-0 overflow-hidden ${isHandTool ? 'pointer-events-none' : ''}`}
              style={{
                color: getReadableTextColor(item.color || '#fffbeb').color,
                textShadow: getReadableTextColor(item.color || '#fffbeb').textShadow
              }}
              value={item.content}
              onChange={(e) => {
                if (onUpdateTransient) {
                  onUpdateTransient(item.id, { content: e.target.value });
                } else {
                  onUpdate(item.id, { content: e.target.value });
                }
              }}
              onBlur={(e) => onUpdate(item.id, { content: e.target.value })}
              onPointerDown={(e) => {
                if (isHandTool) return;
                e.stopPropagation();
                textareaRef.current?.focus();
              }}
              placeholder="Type your note here..."
              readOnly={isHandTool}
            />
          </div>
        );
      case 'text':
        return (
          <div className="p-2 w-full h-full flex flex-col">
            <input
              className={`w-full bg-transparent border-none focus:ring-0 text-2xl font-bold text-slate-800 placeholder-slate-300 ${isHandTool ? 'pointer-events-none' : ''}`}
              style={{ fontFamily: item.fontFamily }}
              value={item.title}
              onClick={(e) => {
                if (e.altKey && onCopy && item.fontFamily) {
                  onCopy(item.fontFamily, 'Font Family');
                }
              }}
              onChange={(e) => {
                if (onUpdateTransient) {
                  onUpdateTransient(item.id, { title: e.target.value });
                } else {
                  onUpdate(item.id, { title: e.target.value });
                }
              }}
              onBlur={(e) => onUpdate(item.id, { title: e.target.value })}
              onPointerDown={(e) => {
                if (isHandTool) return;
                e.stopPropagation();
                (e.target as HTMLInputElement).focus();
              }}
              placeholder="Heading"
              readOnly={isHandTool}
            />
            <textarea
              className={`w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-slate-600 p-0 mt-1 flex-1 ${isHandTool ? 'pointer-events-none' : ''}`}
              style={{
                fontFamily: item.fontFamily,
                fontWeight: item.fontWeight === 'Bold' ? 'bold' : 'normal',
                fontStyle: item.isItalic ? 'italic' : 'normal'
              }}
              value={item.content}
              onChange={(e) => {
                if (onUpdateTransient) {
                  onUpdateTransient(item.id, { content: e.target.value });
                } else {
                  onUpdate(item.id, { content: e.target.value });
                }
              }}
              onBlur={(e) => onUpdate(item.id, { content: e.target.value })}
              onPointerDown={(e) => {
                if (isHandTool) return;
                e.stopPropagation();
                (e.target as HTMLTextAreaElement).focus();
              }}
              placeholder="Type text here..."
              readOnly={isHandTool}
            />
          </div>
        );
      case 'color':
        const color = item.color || '#3b82f6';
        const { color: textColor, textShadow } = getReadableTextColor(color);
        return (
          <div className="w-full h-full rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ backgroundColor: color }}>
            <div
              className="flex-1 w-full"
              style={{ backgroundColor: color }}
            ></div>
            <div className="p-3 shrink-0"
              style={{ color: textColor }}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(color);
                if (onCopy) onCopy(color, item.title || 'Color');
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase truncate pr-2" style={{ color: textColor, textShadow }}>{item.title || 'Color'}</span>
                <button
                  className={`shrink-0 ${isHandTool ? 'pointer-events-none opacity-50' : ''}`}
                  style={{ color: textColor, textShadow }}
                  onClick={(e) => {
                    if (isHandTool) return;
                    e.stopPropagation();
                    navigator.clipboard.writeText(color);
                    if (onCopy) onCopy(color, item.title || 'Color');
                  }}
                  title="Copy Hex"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p
                className="text-[10px] font-mono mt-0.5 cursor-pointer hover:underline"
                style={{ color: textColor, textShadow, opacity: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(color);
                  if (onCopy) onCopy(color, item.title || 'Color');
                }}
              >
                {color}
              </p>
            </div>
          </div>
        );
      case 'image': {
        const cropMask = item.cropMask;
        const maskShape = cropMask?.maskShape || 'none';
        const cropZoom = cropMask?.zoom ?? 1;
        const panX = cropMask?.panX ?? 0;
        const panY = cropMask?.panY ?? 0;

        let clipPathStyle: string | undefined = undefined;
        let borderRadiusStyle: string | undefined = undefined;
        if (maskShape === 'circle') {
          clipPathStyle = 'circle(50% at 50% 50%)';
        } else if (maskShape === 'rounded') {
          borderRadiusStyle = '24px';
          clipPathStyle = 'inset(0 round 24px)';
        } else if (maskShape === 'hexagon') {
          clipPathStyle = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        } else if (maskShape === 'star') {
          clipPathStyle = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        }

        return (
          <div
            className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group"
            style={{
              clipPath: clipPathStyle,
              WebkitClipPath: clipPathStyle,
              borderRadius: borderRadiusStyle,
            }}
          >
            <div className="relative flex-1 overflow-hidden">
              <img
                alt={item.title}
                className="w-full h-full object-cover absolute inset-0 transition-transform duration-75"
                src={item.content || 'https://picsum.photos/300/200'}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${cropZoom}) translate(${panX}px, ${panY}px)`,
                  transformOrigin: 'center center',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs truncate z-10">
                {item.title || 'Image'}
              </div>
              <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 ${isHandTool ? 'hidden' : ''}`}>
                <button
                  className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-slate-100"
                  onClick={(e) => {
                    if (isHandTool) return;
                    e.stopPropagation();
                    if (onEditImage) {
                      onEditImage(item.id);
                    }
                  }}
                >
                  Change Image
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'arrow':
        const start = item.start || { x: 0, y: 0 };
        const end = item.end || { x: 0, y: 0 };
        const controlPoint = item.controlPoint;
        const arrowSize = 14 + (item.borderWidth || 2) * 1.5;
        const headStyle = item.arrowHeadStyle || 'filled';
        const tailStyle = item.arrowTailStyle || 'none';

        const shortenedEnd = headStyle !== 'none' ? getShortenedLineEnd(start, end, arrowSize * 0.7, controlPoint) : end;
        const shortenedStart = tailStyle !== 'none' ? getShortenedLineStart(start, end, arrowSize * 0.7, controlPoint) : start;

        const handleDragStart = (e: React.PointerEvent, type: 'start' | 'end' | 'control') => {
          if (isHandTool) return;
          e.stopPropagation();
          const target = e.currentTarget as SVGElement;
          target.setPointerCapture(e.pointerId);

          const initialPointerX = e.clientX;
          const initialPointerY = e.clientY;

          const initialStart = { ...start };
          const initialEnd = { ...end };
          const initialCp = controlPoint ? { ...controlPoint } : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
          const initialItemX = item.x;
          const initialItemY = item.y;

          let animationFrameId: number;
          let latestMoveEvent: PointerEvent | null = null;

          const updatePosition = (isFinal = false) => {
            if (!latestMoveEvent) return;

            const dx = (latestMoveEvent.clientX - initialPointerX) / zoom;
            const dy = (latestMoveEvent.clientY - initialPointerY) / zoom;

            let newStart = initialStart;
            let newEnd = initialEnd;
            let newCp = controlPoint ? initialCp : undefined;

            if (type === 'start') {
              newStart = { x: initialStart.x + dx, y: initialStart.y + dy };
            } else if (type === 'end') {
              newEnd = { x: initialEnd.x + dx, y: initialEnd.y + dy };
            } else if (type === 'control') {
              newCp = { x: initialCp.x + dx, y: initialCp.y + dy };
            }

            // Snapping logic
            const snapThreshold = 10 / zoom;
            if (type === 'start' || type === 'end') {
              const pointToSnap = type === 'start' ? newStart : newEnd;
              const absPoint = { x: initialItemX + pointToSnap.x, y: initialItemY + pointToSnap.y };

              let closestSnapPoint = null;
              let minDistance = snapThreshold;

              for (const sp of snapPoints) {
                const dist = Math.sqrt(Math.pow(absPoint.x - sp.x, 2) + Math.pow(absPoint.y - sp.y, 2));
                if (dist < minDistance) {
                  minDistance = dist;
                  closestSnapPoint = sp;
                }
              }

              if (closestSnapPoint) {
                const snappedRelPoint = { x: closestSnapPoint.x - initialItemX, y: closestSnapPoint.y - initialItemY };
                if (type === 'start') newStart = snappedRelPoint;
                if (type === 'end') newEnd = snappedRelPoint;
              }
            }

            // Calculate new bounding box
            const points = [newStart, newEnd];
            if (newCp) points.push(newCp);

            const minX = Math.min(...points.map(p => p.x));
            const minY = Math.min(...points.map(p => p.y));
            const maxX = Math.max(...points.map(p => p.x));
            const maxY = Math.max(...points.map(p => p.y));

            // The new absolute position of the top-left corner
            const newAbsoluteX = initialItemX + minX;
            const newAbsoluteY = initialItemY + minY;

            // The new width and height
            const newWidth = Math.max(1, maxX - minX);
            const newHeight = Math.max(1, maxY - minY);

            // Shift points to be relative to the new top-left corner
            const shiftedStart = { x: newStart.x - minX, y: newStart.y - minY };
            const shiftedEnd = { x: newEnd.x - minX, y: newEnd.y - minY };
            const shiftedCp = newCp ? { x: newCp.x - minX, y: newCp.y - minY } : undefined;

            const updates = {
              x: newAbsoluteX,
              y: newAbsoluteY,
              width: newWidth,
              height: newHeight,
              start: shiftedStart,
              end: shiftedEnd,
              controlPoint: shiftedCp
            };

            if (isFinal) {
              onUpdate(item.id, updates);
            } else if (onUpdateTransient) {
              onUpdateTransient(item.id, updates);
            } else {
              onUpdate(item.id, updates);
            }

            latestMoveEvent = null;
          };

          const onMove = (moveEvent: PointerEvent) => {
            latestMoveEvent = moveEvent;
            if (!animationFrameId) {
              animationFrameId = requestAnimationFrame(() => {
                updatePosition();
                animationFrameId = 0;
              });
            }
          };

          const onUp = (upEvent: PointerEvent) => {
            target.releasePointerCapture(upEvent.pointerId);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
            }

            // Ensure we update with the final position on release
            latestMoveEvent = upEvent;
            updatePosition(true);
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        };

        return (
          <>
            <svg className="w-full h-full overflow-visible" style={{ minWidth: '20px', minHeight: '20px' }}>
              <g>
                {controlPoint ? (
                  <path
                    d={`M ${shortenedStart.x} ${shortenedStart.y} Q ${controlPoint.x} ${controlPoint.y} ${shortenedEnd.x} ${shortenedEnd.y}`}
                    fill="none"
                    stroke={item.color || '#000'}
                    strokeWidth={item.borderWidth || 2}
                    strokeLinecap="round"
                  />
                ) : (
                  <line
                    x1={shortenedStart.x}
                    y1={shortenedStart.y}
                    x2={shortenedEnd.x}
                    y2={shortenedEnd.y}
                    stroke={item.color || '#000'}
                    strokeWidth={item.borderWidth || 2}
                    strokeLinecap="round"
                  />
                )}

                {headStyle !== 'none' && (
                  <path
                    d={getArrowHeadPath(start, end, arrowSize, headStyle, controlPoint)}
                    fill={headStyle === 'line' ? 'none' : (item.color || '#000')}
                    stroke={item.color || '#000'}
                    strokeWidth={headStyle === 'line' ? (item.borderWidth || 2) : 0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {tailStyle !== 'none' && (
                  <path
                    d={getArrowTailPath(start, end, arrowSize, tailStyle, controlPoint)}
                    fill={tailStyle === 'dot' ? (item.color || '#000') : 'none'}
                    stroke={item.color || '#000'}
                    strokeWidth={tailStyle === 'dot' ? 0 : (item.borderWidth || 2)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            </svg>
            {isSelected && document.getElementById('arrow-controls-layer') && createPortal(
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <g className={isHandTool ? 'pointer-events-none' : 'pointer-events-auto'}>
                  {/* Start Handle */}
                  <circle
                    cx={item.x + start.x}
                    cy={item.y + start.y}
                    r={6 / zoom}
                    fill="#fff"
                    stroke="#3b82f6"
                    strokeWidth={2 / zoom}
                    className="cursor-move no-pan"
                    onPointerDown={(e) => handleDragStart(e, 'start')}
                  />
                  {/* End Handle */}
                  <circle
                    cx={item.x + end.x}
                    cy={item.y + end.y}
                    r={6 / zoom}
                    fill="#fff"
                    stroke="#3b82f6"
                    strokeWidth={2 / zoom}
                    className="cursor-move no-pan"
                    onPointerDown={(e) => handleDragStart(e, 'end')}
                  />
                  {/* Control Point Handle */}
                  <circle
                    cx={item.x + (controlPoint ? controlPoint.x : (start.x + end.x) / 2)}
                    cy={item.y + (controlPoint ? controlPoint.y : (start.y + end.y) / 2)}
                    r={6 / zoom}
                    fill="#fff"
                    stroke="#10b981"
                    strokeWidth={2 / zoom}
                    className="cursor-move no-pan"
                    onPointerDown={(e) => handleDragStart(e, 'control')}
                  />
                </g>
              </svg>,
              document.getElementById('arrow-controls-layer')!
            )}
          </>
        );
      case 'pencil':
        return (
          <svg className="w-full h-full overflow-visible" style={{ stroke: item.color || '#000', strokeWidth: item.borderWidth || 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <path d={getSmoothPath(item.points || [], item.smoothing ?? 20)} />
          </svg>
        );
      case 'shape':
        return (
          <div className="w-full h-full relative">
            {/* Shape Element with dynamic border and fill */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: item.color || '#3b82f6',
                borderRadius: item.shapeType === 'circle' ? '50%' : '0',
                borderWidth: item.borderWidth ? `${item.borderWidth}px` : '0',
                borderColor: item.borderColor || '#000000',
                borderStyle: 'solid',
                boxSizing: 'border-box'
              }}
            ></div>
          </div>
        );
      case 'bookmark':
        const meta = item.urlMeta;
        return (
          <div className="w-full h-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col p-3">
            <div className="flex items-center space-x-2 mb-2">
              {meta?.favicon ? (
                <img src={meta.favicon} alt="" className="w-4 h-4 rounded shrink-0" />
              ) : (
                <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-500 truncate">{meta?.domain || 'bookmark'}</span>
            </div>
            {meta?.thumbnail && (
              <div className="w-full h-24 mb-2 rounded overflow-hidden bg-slate-100 shrink-0">
                <img src={meta.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{meta?.title || item.title || 'Bookmark Link'}</h4>
            {meta?.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{meta.description}</p>
            )}
          </div>
        );
      case 'frame':
        return (
          <div
            className="w-full h-full rounded-2xl border-2 border-dashed flex flex-col p-3 transition-colors pointer-events-none"
            style={{
              borderColor: item.frameColor || '#cbd5e1',
              backgroundColor: item.color || `${item.frameColor || '#cbd5e1'}15`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-white/80 px-2 py-1 rounded shadow-xs">
                {item.title || 'Section Frame'}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`item-${item.id}`}
      className={`moodboard-item item-${item.id} absolute ${isHandTool ? 'pointer-events-none select-none' : (item.isLocked ? 'cursor-default' : 'cursor-move')}`}
      style={{
        top: 0,
        left: 0,
        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation || 0}deg)`,
        width: item.width ? `${item.width}px` : 'auto',
        height: item.height ? `${item.height}px` : 'auto',
        zIndex: isSelected ? 50 : (item.type === 'frame' ? 1 : 10),
        transformOrigin: 'center center',
        opacity: isDimmed ? 0.25 : 1,
        pointerEvents: isDimmed ? 'none' : undefined,
      }}
      onPointerDown={(e) => {
        if (isHandTool) return;
        if (e.altKey && !item.isLocked) {
          e.stopPropagation();
          useMoodboardStore.getState().duplicateItems([item.id], { x: 0, y: 0 });
          return;
        }
        e.stopPropagation();
        onSelect(item.id);
      }}
      onContextMenu={(e) => {
        if (isHandTool) return;
        if (onContextMenu) {
          onContextMenu(e, item.id);
        }
      }}
      onMouseEnter={() => {
        if (item.type === 'image' && (!item.paletteColors || item.paletteColors.length === 0)) {
          useMoodboardStore.getState().extractImagePalette(item.id);
        }
      }}
    >
      {item.isLocked && (
        <div
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-amber-500 text-white shadow-md flex items-center justify-center z-50 cursor-pointer hover:bg-amber-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(item.id, { isLocked: false });
          }}
          title="Locked item (Click to unlock)"
        >
          <Lock size={12} className="stroke-[2.5]" />
        </div>
      )}
      {isSelected && !isHandTool && item.type !== 'arrow' && !item.isLocked && (
        <button
          className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 z-50"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <X size={16} />
        </button>
      )}
      {renderContent()}

      {item.categories && item.categories.length > 0 && item.type !== 'arrow' && item.type !== 'pencil' && (
        <div className="absolute bottom-1.5 left-2 right-2 flex flex-wrap gap-1 z-20 pointer-events-none">
          {item.categories.map((cat, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs truncate max-w-[100px]"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


