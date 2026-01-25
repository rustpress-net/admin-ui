/**
 * Tabs Component
 * Reusable tab navigation
 */

import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../design-system/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'boxed';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  children,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const paddingClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5',
  };

  const variantClasses = {
    default: 'bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1',
    pills: 'gap-2',
    underline: 'border-b border-neutral-200 dark:border-neutral-800',
    boxed: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1',
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        <div
          className={cn(
            'flex',
            fullWidth && 'w-full',
            variantClasses[variant]
          )}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && handleTabChange(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 font-medium transition-all',
                  sizeClasses[size],
                  paddingClasses[size],
                  fullWidth && 'flex-1 justify-center',
                  tab.disabled && 'opacity-50 cursor-not-allowed',

                  // Default variant
                  variant === 'default' && [
                    'rounded-md',
                    isActive
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                  ],

                  // Pills variant
                  variant === 'pills' && [
                    'rounded-full',
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  ],

                  // Underline variant
                  variant === 'underline' && [
                    '-mb-px',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-b-2 border-transparent',
                  ],

                  // Boxed variant
                  variant === 'boxed' && [
                    'rounded-md',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  ]
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-xs rounded-full',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Animated underline for default variant */}
                {variant === 'default' && isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-md shadow-sm -z-10"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </TabsContext.Provider>
  );
}

// Tab panel component
interface TabPanelProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ tabId, children, className }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  if (context.activeTab !== tabId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      role="tabpanel"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Vertical tabs
interface VerticalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function VerticalTabs({ tabs, activeTab, onChange, className }: VerticalTabsProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            {tab.icon && (
              <span className={cn(isActive ? 'text-primary-600' : 'text-neutral-400')}>
                {tab.icon}
              </span>
            )}
            <span className="flex-1">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
