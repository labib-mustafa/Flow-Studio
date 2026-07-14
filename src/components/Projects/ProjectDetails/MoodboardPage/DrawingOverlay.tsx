import React, { useRef, useState } from 'react';
import { getSmoothPath, getArrowHeadPath, getArrowTailPath, getShortenedLineEnd, getShortenedLineStart } from '../../../../utils/drawingUtils';
import { MoodboardItemData } from './MoodboardItem';

interface DrawingOverlayProps {
  activeTool: 'arrow' | 'pencil' | 'select' | 'hand' | 'shape';
  onAddArrow: (start: { x: number, y: number }, end: { x: number, y: number }) => void;
  onAddPath: (path: { x: number, y: number }[]) => void;
  onAddShape: (shape: { x: number, y: number, width: number, height: number, shapeType: 'rectangle' | 'circle' }) => void;
  zoom: number;
  pan: { x: number, y: number };
  isShiftPressed: boolean;
  items: MoodboardItemData[];
  pencilSmoothing: number;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ activeTool, onAddArrow, onAddPath, onAddShape, zoom, pan, isShiftPressed, items, pencilSmoothing, defaultStrokeColor, defaultStrokeWidth }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const svgRectRef = useRef<DOMRect | null>(null);

  const snap = (point: { x: number, y: number }) => {
    if (activeTool !== 'arrow') return point;
    
    let closestPoint = point;
    let minDistance = 20 / zoom; // Snap threshold scaled by zoom

    items.forEach(item => {
      if (item.type === 'arrow' || item.type === 'pencil') return;
      
      const centerX = item.x + (item.width || 0) / 2;
      const centerY = item.y + (item.height || 0) / 2;
      const points = [
        { x: item.x, y: centerY }, // Left
        { x: item.x + (item.width || 0), y: centerY }, // Right
        { x: centerX, y: item.y }, // Top
        { x: centerX, y: item.y + (item.height || 0) }, // Bottom
        { x: centerX, y: centerY } // Center
      ];

      points.forEach(p => {
        const distance = Math.sqrt((point.x - p.x)**2 + (point.y - p.y)**2);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = p;
        }
      });
    });
    return closestPoint;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'select' || activeTool === 'hand') return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    svgRectRef.current = rect;
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    const snappedPoint = snap({ x, y });
    setStartPoint(snappedPoint);
    setCurrentPath([snappedPoint]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !svgRectRef.current) return;
    const rect = svgRectRef.current;
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    if (activeTool === 'pencil') {
      setCurrentPath(prev => [...prev, { x, y }]);
    } else {
      const snappedPoint = snap({ x, y });
      setCurrentPath([{ x: startPoint.x, y: startPoint.y }, snappedPoint]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing || !svgRectRef.current) return;
    setIsDrawing(false);
    const rect = svgRectRef.current;
    svgRectRef.current = null;
    const end = { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom };
    
    if (activeTool === 'arrow') {
      onAddArrow(startPoint, snap(end));
    } else if (activeTool === 'pencil') {
      onAddPath(currentPath);
    } else if (activeTool === 'shape') {
      let width = Math.abs(end.x - startPoint.x);
      let height = Math.abs(end.y - startPoint.y);
      
      if (isShiftPressed) {
        const size = Math.max(width, height);
        width = size;
        height = size;
      }
      
      onAddShape({
        x: Math.min(startPoint.x, end.x),
        y: Math.min(startPoint.y, end.y),
        width,
        height,
        shapeType: 'rectangle'
      });
    }
    setCurrentPath([]);
  };

  if (activeTool === 'select' || activeTool === 'hand') return null;

  return (
    <svg
      className="absolute inset-0 z-40 touch-none w-full h-full"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {activeTool === 'pencil' && currentPath.length > 1 && (
          <path
            d={getSmoothPath(currentPath, pencilSmoothing)}
            fill="none"
            stroke={defaultStrokeColor}
            strokeWidth={defaultStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {activeTool === 'arrow' && isDrawing && currentPath.length > 1 && (
          <g>
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={getShortenedLineEnd(startPoint, currentPath[currentPath.length - 1], (14 + defaultStrokeWidth * 1.5) * 0.7).x}
              y2={getShortenedLineEnd(startPoint, currentPath[currentPath.length - 1], (14 + defaultStrokeWidth * 1.5) * 0.7).y}
              stroke={defaultStrokeColor}
              strokeWidth={defaultStrokeWidth}
              strokeLinecap="round"
            />
            <path
              d={getArrowHeadPath(startPoint, currentPath[currentPath.length - 1], 14 + defaultStrokeWidth * 1.5, 'filled')}
              fill={defaultStrokeColor}
              stroke={defaultStrokeColor}
              strokeWidth={0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
        {activeTool === 'shape' && isDrawing && currentPath.length > 1 && (
          <rect
            x={Math.min(startPoint.x, currentPath[currentPath.length - 1].x)}
            y={Math.min(startPoint.y, currentPath[currentPath.length - 1].y)}
            width={Math.abs(currentPath[currentPath.length - 1].x - startPoint.x)}
            height={Math.abs(currentPath[currentPath.length - 1].y - startPoint.y)}
            fill="none"
            stroke="#000"
            strokeWidth={2}
          />
        )}
      </g>
    </svg>
  );
};
