/**
 * Status Badge Components
 * Various badge types for queue manager
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  AlertTriangle,
  Activity,
  Zap,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import type { QueueState, ConnectionState, AlertSeverity } from '../../types';

// Queue State Badge
interface QueueStateBadgeProps {
  state: QueueState;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const queueStateConfig: Record<QueueState, { color: string; icon: React.ElementType; label: string }> = {
  running: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Activity, label: 'Running' },
  idle: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Idle' },
  down: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Down' },
  starting: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2, label: 'Starting' },
  stopping: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Pause, label: 'Stopping' },
};

export function QueueStateBadge({ state, size = 'md', animated = true }: QueueStateBadgeProps) {
  const config = queueStateConfig[state];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };

  return (
    <motion.span
      initial={animated ? { scale: 0.9, opacity: 0 } : undefined}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon className={cn(iconSizes[size], state === 'starting' && 'animate-spin')} />
      {config.label}
    </motion.span>
  );
}

// Connection State Badge
interface ConnectionStateBadgeProps {
  state: ConnectionState;
  size?: 'sm' | 'md';
}

const connectionStateConfig: Record<ConnectionState, { color: string; label: string }> = {
  running: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Connected' },
  blocked: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Blocked' },
  blocking: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Blocking' },
  closing: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Closing' },
  closed: { color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', label: 'Closed' },
};

export function ConnectionStateBadge({ state, size = 'md' }: ConnectionStateBadgeProps) {
  const config = connectionStateConfig[state];
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', config.color, sizeClasses[size])}>
      {config.label}
    </span>
  );
}

// Alert Severity Badge
interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const severityConfig: Record<AlertSeverity, { color: string; icon: React.ElementType }> = {
  info: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Activity },
  warning: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
  error: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  critical: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500', icon: Zap },
};

export function AlertSeverityBadge({ severity, size = 'md', pulse = false }: AlertSeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.color,
        pulse && severity === 'critical' && 'animate-pulse'
      )}
    >
      <Icon className="w-3 h-3" />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// Priority Badge
interface PriorityBadgeProps {
  priority: number;
  max?: number;
}

export function PriorityBadge({ priority, max = 10 }: PriorityBadgeProps) {
  const getColor = () => {
    const ratio = priority / max;
    if (ratio >= 0.8) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (ratio >= 0.5) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (ratio >= 0.3) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', getColor())}>
      <Zap className="w-3 h-3" />
      P{priority}
    </span>
  );
}

// Boolean Status Dot
interface StatusDotProps {
  status: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function StatusDot({ status, size = 'md', pulse = true }: StatusDotProps) {
  const sizeClasses = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          status ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      {pulse && status && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            sizeClasses[size],
            'bg-green-400'
          )}
        />
      )}
    </span>
  );
}

// Health Score Badge
interface HealthScoreBadgeProps {
  score: number;
}

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  const getConfig = () => {
    if (score >= 90) return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Healthy' };
    if (score >= 70) return { color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400', label: 'Good' };
    if (score >= 50) return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Fair' };
    if (score >= 30) return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Poor' };
    return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Critical' };
  };

  const config = getConfig();

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
      <CheckCircle className="w-3.5 h-3.5" />
      {score}% {config.label}
    </span>
  );
}

export default QueueStateBadge;
