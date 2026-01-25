/**
 * Time Range Selector Component
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Clock } from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import type { TimeRange } from '../../types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentRange = timeRanges.find(r => r.value === value);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <Clock className="w-4 h-4 text-neutral-500" />
        <span className="text-neutral-700 dark:text-neutral-300">{currentRange?.label}</span>
        <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden"
            >
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    onChange(range.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                    value === range.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick time range buttons (inline variant)
interface QuickTimeRangeProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
}

export function QuickTimeRange({
  value,
  onChange,
  options = ['1h', '6h', '24h', '7d'],
  className,
}: QuickTimeRangeProps) {
  return (
    <div className={cn('inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1', className)}>
      {options.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-all',
            value === range
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export default TimeRangeSelector;
