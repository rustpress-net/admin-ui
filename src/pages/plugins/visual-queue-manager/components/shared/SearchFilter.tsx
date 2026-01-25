/**
 * Search and Filter Components
 */

import React, { useState, useCallback } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../design-system/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 pl-10 pr-10 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      )}
    </div>
  );
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  icon,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
          value
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
        )}
      >
        {icon || <Filter className="w-4 h-4" />}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden"
            >
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                  !value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                All
              </button>
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between',
                    value === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-neutral-400">{option.count}</span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Combined search and filters bar
interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: {
    key: string;
    label: string;
    value: string | null;
    options: FilterOption[];
    onChange: (value: string | null) => void;
  }[];
  actions?: React.ReactNode;
  className?: string;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  filters = [],
  actions,
  className,
}: SearchFilterBarProps) {
  const activeFilters = filters.filter(f => f.value !== null);

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search..."
        className="flex-1 min-w-[200px]"
      />

      {filters.map((filter) => (
        <FilterDropdown
          key={filter.key}
          label={filter.label}
          value={filter.value}
          options={filter.options}
          onChange={filter.onChange}
        />
      ))}

      {activeFilters.length > 0 && (
        <button
          onClick={() => filters.forEach(f => f.onChange(null))}
          className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}

      {actions && (
        <div className="flex items-center gap-2 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

// Active filter chips
interface FilterChipsProps {
  filters: { key: string; label: string; value: string }[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <motion.span
          key={filter.key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs"
        >
          <span className="text-primary-500">{filter.label}:</span>
          <span className="font-medium">{filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        Clear all
      </button>
    </div>
  );
}

export default SearchInput;
