/**
 * Stats Card Component
 * Cards for displaying key metrics
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import { AnimatedCounter, formatCompactNumber, formatBytes, formatRate } from './AnimatedCounter';
import { SparklineChart } from './SparklineChart';

interface StatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon?: LucideIcon;
  iconColor?: string;
  format?: 'number' | 'compact' | 'bytes' | 'rate' | 'percent';
  trend?: number;
  sparklineData?: number[];
  sparklineColor?: string;
  onClick?: () => void;
  className?: string;
}

export function StatsCard({
  title,
  value,
  previousValue,
  icon: Icon,
  iconColor = 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  format = 'number',
  trend,
  sparklineData,
  sparklineColor = '#3b82f6',
  onClick,
  className,
}: StatsCardProps) {
  // Calculate trend if not provided but previousValue is
  const calculatedTrend = trend ?? (previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined);

  const formatValue = (v: number) => {
    switch (format) {
      case 'compact': return formatCompactNumber(v);
      case 'bytes': return formatBytes(v);
      case 'rate': return formatRate(v);
      case 'percent': return `${v.toFixed(1)}%`;
      default: return v.toLocaleString();
    }
  };

  const TrendIcon = calculatedTrend !== undefined
    ? calculatedTrend > 0 ? TrendingUp : calculatedTrend < 0 ? TrendingDown : Minus
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4',
        onClick && 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedCounter value={value} formatFn={formatValue} />
            </span>
            {calculatedTrend !== undefined && TrendIcon && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  calculatedTrend > 0 ? 'text-green-500' : calculatedTrend < 0 ? 'text-red-500' : 'text-neutral-400'
                )}
              >
                <TrendIcon className="w-3 h-3" />
                {Math.abs(calculatedTrend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-lg', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <SparklineChart
            data={sparklineData}
            width={200}
            height={40}
            color={sparklineColor}
          />
        </div>
      )}
    </motion.div>
  );
}

// Compact stats grid
interface StatsGridProps {
  stats: {
    label: string;
    value: number;
    format?: 'number' | 'compact' | 'bytes' | 'rate' | 'percent';
    color?: string;
  }[];
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
        >
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{stat.label}</p>
          <p
            className="text-lg font-semibold"
            style={{ color: stat.color }}
          >
            <AnimatedCounter
              value={stat.value}
              formatFn={(v) => {
                switch (stat.format) {
                  case 'compact': return formatCompactNumber(v);
                  case 'bytes': return formatBytes(v);
                  case 'rate': return formatRate(v);
                  case 'percent': return `${v.toFixed(1)}%`;
                  default: return v.toLocaleString();
                }
              }}
            />
          </p>
        </div>
      ))}
    </div>
  );
}

// Large hero stat card
interface HeroStatProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export function HeroStat({ title, value, subtitle, icon: Icon, color = '#3b82f6', className }: HeroStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white',
        className
      )}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          {Icon && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}30` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          )}
          <p className="text-sm text-neutral-400">{title}</p>
        </div>

        <p className="text-4xl font-bold mb-2">
          <AnimatedCounter value={value} formatFn={formatCompactNumber} />
        </p>

        {subtitle && (
          <p className="text-sm text-neutral-400">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

export default StatsCard;
