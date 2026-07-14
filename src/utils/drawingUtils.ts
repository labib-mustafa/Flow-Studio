export const getSmoothPath = (points: {x: number, y: number}[], smoothing: number = 50) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

  // Filter points based on smoothing (0-100)
  // Higher smoothing = skip more points
  const threshold = smoothing / 10; // 0 to 10 pixels distance threshold
  
  const filteredPoints = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const lastPoint = filteredPoints[filteredPoints.length - 1];
    const dist = Math.sqrt(Math.pow(points[i].x - lastPoint.x, 2) + Math.pow(points[i].y - lastPoint.y, 2));
    if (dist > threshold) {
      filteredPoints.push(points[i]);
    }
  }
  filteredPoints.push(points[points.length - 1]);

  let d = `M ${filteredPoints[0].x} ${filteredPoints[0].y}`;
  for (let i = 1; i < filteredPoints.length - 1; i++) {
    const xc = (filteredPoints[i].x + filteredPoints[i + 1].x) / 2;
    const yc = (filteredPoints[i].y + filteredPoints[i + 1].y) / 2;
    d += ` Q ${filteredPoints[i].x} ${filteredPoints[i].y}, ${xc} ${yc}`;
  }
  
  if (filteredPoints.length > 1) {
    d += ` L ${filteredPoints[filteredPoints.length - 1].x} ${filteredPoints[filteredPoints.length - 1].y}`;
  }
  
  return d;
};

export const getArrowHeadPath = (start: {x: number, y: number}, end: {x: number, y: number}, arrowSize: number = 14, style: 'triangle' | 'line' | 'filled' | 'none' | 'dot' = 'filled', controlPoint?: {x: number, y: number}) => {
  if (style === 'none') return '';
  
  const dx = controlPoint ? end.x - controlPoint.x : end.x - start.x;
  const dy = controlPoint ? end.y - controlPoint.y : end.y - start.y;
  const angle = Math.atan2(dy, dx);
  
  if (style === 'dot') {
    const r = arrowSize * 0.4;
    return `M ${end.x - r}, ${end.y} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }

  const arrowAngle = Math.PI / 7;
  
  const x1 = end.x - arrowSize * Math.cos(angle - arrowAngle);
  const y1 = end.y - arrowSize * Math.sin(angle - arrowAngle);
  
  const x2 = end.x - arrowSize * Math.cos(angle + arrowAngle);
  const y2 = end.y - arrowSize * Math.sin(angle + arrowAngle);
  
  if (style === 'line') {
    return `M ${x1} ${y1} L ${end.x} ${end.y} L ${x2} ${y2}`;
  } else if (style === 'triangle') {
    return `M ${end.x} ${end.y} L ${x1} ${y1} L ${x2} ${y2} Z`;
  } else {
    // filled
    const baseX = end.x - (arrowSize * 0.8) * Math.cos(angle);
    const baseY = end.y - (arrowSize * 0.8) * Math.sin(angle);
    return `M ${end.x} ${end.y} L ${x1} ${y1} L ${baseX} ${baseY} L ${x2} ${y2} Z`;
  }
};

export const getArrowTailPath = (start: {x: number, y: number}, end: {x: number, y: number}, arrowSize: number = 14, style: 'none' | 'dot' | 'flat' | 'arrow' = 'none', controlPoint?: {x: number, y: number}) => {
  if (style === 'none') return '';
  
  const dx = controlPoint ? controlPoint.x - start.x : end.x - start.x;
  const dy = controlPoint ? controlPoint.y - start.y : end.y - start.y;
  const angle = Math.atan2(dy, dx);
  
  if (style === 'dot') {
    // We'll draw a circle in the component, so we return empty path here, or we can draw a circle using path
    const r = arrowSize * 0.4;
    return `M ${start.x - r}, ${start.y} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  } else if (style === 'flat') {
    const w = arrowSize * 0.6;
    const x1 = start.x - w * Math.cos(angle + Math.PI / 2);
    const y1 = start.y - w * Math.sin(angle + Math.PI / 2);
    const x2 = start.x + w * Math.cos(angle + Math.PI / 2);
    const y2 = start.y + w * Math.sin(angle + Math.PI / 2);
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  } else if (style === 'arrow') {
    const arrowAngle = Math.PI / 7;
    const x1 = start.x + arrowSize * Math.cos(angle - arrowAngle);
    const y1 = start.y + arrowSize * Math.sin(angle - arrowAngle);
    const x2 = start.x + arrowSize * Math.cos(angle + arrowAngle);
    const y2 = start.y + arrowSize * Math.sin(angle + arrowAngle);
    const baseX = start.x + (arrowSize * 0.8) * Math.cos(angle);
    const baseY = start.y + (arrowSize * 0.8) * Math.sin(angle);
    return `M ${start.x} ${start.y} L ${x1} ${y1} L ${baseX} ${baseY} L ${x2} ${y2} Z`;
  }
  return '';
};

export const getShortenedLineStart = (start: {x: number, y: number}, end: {x: number, y: number}, shortenBy: number = 10, controlPoint?: {x: number, y: number}) => {
  if (controlPoint) {
    const dx = controlPoint.x - start.x;
    const dy = controlPoint.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length <= shortenBy) return start;
    
    const ratio = shortenBy / length;
    return {
      x: start.x + dx * ratio,
      y: start.y + dy * ratio
    };
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length <= shortenBy) return start;
  
  const ratio = shortenBy / length;
  return {
    x: start.x + dx * ratio,
    y: start.y + dy * ratio
  };
};

export const getShortenedLineEnd = (start: {x: number, y: number}, end: {x: number, y: number}, shortenBy: number = 10, controlPoint?: {x: number, y: number}) => {
  if (controlPoint) {
    // For a quadratic bezier, we can approximate the shortened end by moving back along the tangent
    const dx = end.x - controlPoint.x;
    const dy = end.y - controlPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length <= shortenBy) return end; // Too short to shorten properly
    
    const ratio = shortenBy / length;
    return {
      x: end.x - dx * ratio,
      y: end.y - dy * ratio
    };
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length <= shortenBy) return start;
  
  const ratio = (length - shortenBy) / length;
  return {
    x: start.x + dx * ratio,
    y: start.y + dy * ratio
  };
};
