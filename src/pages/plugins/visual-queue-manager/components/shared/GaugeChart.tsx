/**
 * Gauge Chart Component
 * Circular progress indicators for metrics
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../design-system/utils';

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  formatValue?: (value: number) => string;
  thresholds?: { value: number; color: string }[];
  animated?: boolean;
  className?: string;
}

export function GaugeChart({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = '#3b82f6',
  bgColor = '#e5e7eb',
  showValue = true,
  showLabel = true,
  label,
  formatValue = (v) => `${Math.round(v)}%`,
  thresholds,
  animated = true,
  className,
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on thresholds
  let activeColor = color;
  if (thresholds) {
    for (const threshold of thresholds.sort((a, b) => b.value - a.value)) {
      if (percentage >= threshold.value) {
        activeColor = threshold.color;
        break;
      }
    }
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          className="dark:stroke-neutral-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            className="text-lg font-bold text-neutral-900 dark:text-white"
            initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {formatValue(value)}
          </motion.span>
        )}
        {showLabel && label && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// Semi-circle gauge variant
interface SemiGaugeProps {
  value: number;
  max?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function SemiGauge({
  value,
  max = 100,
  width = 160,
  height = 80,
  color = '#3b82f6',
  label,
  formatValue = (v) => `${Math.round(v)}`,
  className,
}: SemiGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = width / 2 - 10;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width, height: height + 20 }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M 10 ${height} A ${radius} ${radius} 0 0 1 ${width - 10} ${height}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          className="dark:stroke-neutral-700"
        />

        {/* Progress arc */}
        <motion.path
          d={`M 10 ${height} A ${radius} ${radius} 0 0 1 ${width - 10} ${height}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Min/Max labels */}
        <text x="10" y={height + 15} className="text-xs fill-neutral-400">0</text>
        <text x={width - 20} y={height + 15} className="text-xs fill-neutral-400">{max}</text>
      </svg>

      {/* Center value */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 10 }}>
        <div className="text-2xl font-bold text-neutral-900 dark:text-white text-center">
          {formatValue(value)}
        </div>
        {label && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// Health score gauge with color gradients
interface HealthGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export function HealthGauge({ score, size = 100, className }: HealthGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 90) return '#22c55e'; // green
    if (s >= 70) return '#84cc16'; // lime
    if (s >= 50) return '#eab308'; // yellow
    if (s >= 30) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 70) return 'Good';
    if (s >= 50) return 'Fair';
    if (s >= 30) return 'Poor';
    return 'Critical';
  };

  return (
    <GaugeChart
      value={score}
      max={100}
      size={size}
      color={getColor(score)}
      label={getLabel(score)}
      className={className}
    />
  );
}

export default GaugeChart;
