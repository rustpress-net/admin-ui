/**
 * Sparkline Chart Component
 * Minimal line charts for inline metrics display
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../design-system/utils';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  animated?: boolean;
  className?: string;
}

export function SparklineChart({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  fillColor,
  strokeWidth = 2,
  showDots = false,
  showArea = true,
  animated = true,
  className,
}: SparklineChartProps) {
  const pathData = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - min) / range) * (height - 4) - 2,
    }));

    // Create smooth curve using quadratic bezier
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      line += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`;
    }
    const lastPoint = points[points.length - 1];
    line += ` L ${lastPoint.x} ${lastPoint.y}`;

    // Area path
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;

    return { line, area, points };
  }, [data, width, height]);

  if (data.length < 2) {
    return <div className={cn('text-neutral-400 text-xs', className)}>No data</div>;
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <motion.path
          d={pathData.area}
          fill={fillColor || `url(#sparkline-gradient-${color.replace('#', '')})`}
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      <motion.path
        d={pathData.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Dots */}
      {showDots && pathData.points && pathData.points.map((point, i) => (
        <motion.circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={color}
          initial={animated ? { scale: 0 } : undefined}
          animate={animated ? { scale: 1 } : undefined}
          transition={{ delay: i * 0.05 }}
        />
      ))}

      {/* Last point indicator */}
      {pathData.points && (
        <motion.circle
          cx={pathData.points[pathData.points.length - 1].x}
          cy={pathData.points[pathData.points.length - 1].y}
          r={4}
          fill={color}
          initial={animated ? { scale: 0 } : undefined}
          animate={animated ? { scale: 1 } : undefined}
          transition={{ delay: 0.5 }}
        />
      )}
    </svg>
  );
}

// Mini bar chart variant
interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gap?: number;
  className?: string;
}

export function MiniBarChart({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  gap = 2,
  className,
}: MiniBarChartProps) {
  const max = Math.max(...data, 1);
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {data.map((value, i) => {
        const barHeight = (value / max) * height;
        return (
          <motion.rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={1}
            initial={{ height: 0, y: height }}
            animate={{ height: barHeight, y: height - barHeight }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          />
        );
      })}
    </svg>
  );
}

export default SparklineChart;
