/**
 * Animated Counter Component
 * Smooth number animations with easing
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../../../../design-system/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatFn?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatFn,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => {
    if (formatFn) return formatFn(current);
    return current.toFixed(decimals);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Compact number formatter (1K, 1M, etc.)
export function formatCompactNumber(value: number): string {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(0);
}

// Bytes formatter
export function formatBytes(bytes: number): string {
  if (bytes >= 1099511627776) {
    return (bytes / 1099511627776).toFixed(2) + ' TB';
  }
  if (bytes >= 1073741824) {
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
  if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  }
  return bytes + ' B';
}

// Rate formatter (msg/s)
export function formatRate(rate: number): string {
  if (rate >= 1000) {
    return (rate / 1000).toFixed(1) + 'K/s';
  }
  return rate.toFixed(1) + '/s';
}

// Duration formatter
export function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Animated rate display with trend indicator
interface AnimatedRateProps {
  value: number;
  previousValue?: number;
  className?: string;
  showTrend?: boolean;
}

export function AnimatedRate({
  value,
  previousValue,
  className,
  showTrend = true,
}: AnimatedRateProps) {
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercent = previousValue && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <AnimatedCounter
        value={value}
        formatFn={formatRate}
        className="font-mono"
      />
      {showTrend && trend !== 0 && (
        <motion.span
          initial={{ opacity: 0, y: trend > 0 ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-xs font-medium',
            trend > 0 ? 'text-green-500' : 'text-red-500'
          )}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trendPercent).toFixed(1)}%
        </motion.span>
      )}
    </div>
  );
}

export default AnimatedCounter;
