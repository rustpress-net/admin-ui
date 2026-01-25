/**
 * Exchange Detail View
 * Slide-over panel showing exchange details and bindings
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ArrowRightLeft,
  Link,
  Unlink,
  Plus,
  Trash2,
  Activity,
  Clock,
  Database,
  Settings,
  Radio,
  Share2,
  Hash,
  GitBranch,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import { useQueueManagerStore } from '../../stores/queueManagerStore';
import { SlideOver } from '../shared/Modal';
import { Tabs, TabPanel } from '../shared/Tabs';
import { SparklineChart } from '../shared/SparklineChart';
import { formatCompactNumber, formatRate } from '../shared/AnimatedCounter';
import type { Exchange, ExchangeType, Binding } from '../../types';

interface ExchangeDetailViewProps {
  exchangeId: string;
  onClose: () => void;
}

const exchangeTypeIcons: Record<ExchangeType, React.ReactNode> = {
  direct: <ArrowRightLeft className="w-5 h-5" />,
  fanout: <Radio className="w-5 h-5" />,
  topic: <Share2 className="w-5 h-5" />,
  headers: <Hash className="w-5 h-5" />,
  'x-delayed-message': <GitBranch className="w-5 h-5" />,
  'x-consistent-hash': <GitBranch className="w-5 h-5" />,
};

const exchangeTypeColors: Record<ExchangeType, string> = {
  direct: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  fanout: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  topic: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  headers: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'x-delayed-message': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  'x-consistent-hash': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
};

export function ExchangeDetailView({ exchangeId, onClose }: ExchangeDetailViewProps) {
  const { exchanges, bindings, queues, deleteBinding, addBinding } = useQueueManagerStore();
  const exchange = exchanges.find(e => e.id === exchangeId);

  const [isAddBindingOpen, setIsAddBindingOpen] = useState(false);
  const [newBindingQueue, setNewBindingQueue] = useState('');
  const [newBindingRoutingKey, setNewBindingRoutingKey] = useState('');

  // Get bindings for this exchange
  const exchangeBindings = useMemo(() => {
    return bindings.filter(b => b.source === exchangeId);
  }, [bindings, exchangeId]);

  // Generate mock chart data
  const mockChartData = Array.from({ length: 20 }, () => Math.random() * 100);

  if (!exchange) return null;

  const handleAddBinding = () => {
    if (!newBindingQueue) return;

    const targetQueue = queues.find(q => q.id === newBindingQueue);
    if (!targetQueue) return;

    const newBinding: Binding = {
      id: `binding-${Date.now()}`,
      source: exchangeId,
      vhost: exchange.vhost,
      destination: targetQueue.id,
      destinationType: 'queue',
      routingKey: newBindingRoutingKey || '#',
      arguments: {},
    };

    addBinding(newBinding);
    setNewBindingQueue('');
    setNewBindingRoutingKey('');
    setIsAddBindingOpen(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'bindings', label: 'Bindings', icon: <Link className="w-4 h-4" />, badge: exchangeBindings.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <SlideOver isOpen={true} onClose={onClose} position="right" size="half">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', exchangeTypeColors[exchange.type])}>
            {exchangeTypeIcons[exchange.type]}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {exchange.name}
            </h2>
            <p className="text-sm text-neutral-500 capitalize">{exchange.type} • {exchange.vhost}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs tabs={tabs} defaultTab="overview" variant="underline">
          <TabPanel tabId="overview">
            <div className="space-y-6 pt-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-500">Messages In</span>
                    <span className="text-xs text-green-600">{formatRate(exchange.publishRate)}</span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {formatCompactNumber(exchange.messagesIn)}
                  </p>
                  <SparklineChart
                    data={mockChartData}
                    width={140}
                    height={40}
                    color="#22c55e"
                    className="mt-2"
                  />
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-500">Messages Out</span>
                    <span className="text-xs text-blue-600">{formatRate(exchange.routeRate)}</span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {formatCompactNumber(exchange.messagesOut)}
                  </p>
                  <SparklineChart
                    data={mockChartData.map(v => v * 0.9)}
                    width={140}
                    height={40}
                    color="#3b82f6"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Unroutable Messages */}
              {exchange.unroutableRate > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Unlink className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      Unroutable Messages
                    </span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {formatRate(exchange.unroutableRate)}
                  </p>
                </div>
              )}

              {/* Properties */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Properties</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <span className="text-sm text-neutral-500">Type</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                      {exchange.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <span className="text-sm text-neutral-500">Durable</span>
                    <span className={cn(
                      'text-sm font-medium',
                      exchange.durable ? 'text-green-600' : 'text-neutral-500'
                    )}>
                      {exchange.durable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <span className="text-sm text-neutral-500">Auto-delete</span>
                    <span className={cn(
                      'text-sm font-medium',
                      exchange.autoDelete ? 'text-orange-600' : 'text-neutral-500'
                    )}>
                      {exchange.autoDelete ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <span className="text-sm text-neutral-500">Internal</span>
                    <span className={cn(
                      'text-sm font-medium',
                      exchange.internal ? 'text-purple-600' : 'text-neutral-500'
                    )}>
                      {exchange.internal ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bindings Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                    Bindings ({exchangeBindings.length})
                  </h3>
                  <button
                    onClick={() => setIsAddBindingOpen(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Binding
                  </button>
                </div>
                <div className="space-y-2">
                  {exchangeBindings.slice(0, 3).map((binding) => {
                    const targetQueue = queues.find(q => q.id === binding.destination);
                    return (
                      <div
                        key={binding.id}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
                      >
                        <div className={cn('p-2 rounded-lg', exchangeTypeColors[exchange.type])}>
                          {exchangeTypeIcons[exchange.type]}
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {targetQueue?.name || binding.destination}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Routing key: {binding.routingKey || '#'}
                          </p>
                        </div>
                        <Layers className="w-4 h-4 text-primary-500" />
                      </div>
                    );
                  })}
                  {exchangeBindings.length > 3 && (
                    <p className="text-xs text-neutral-500 text-center py-2">
                      +{exchangeBindings.length - 3} more bindings
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel tabId="bindings">
            <div className="space-y-4 pt-4">
              {/* Add Binding */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Bindings
                </h3>
                <button
                  onClick={() => setIsAddBindingOpen(!isAddBindingOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Binding
                </button>
              </div>

              {/* Add Binding Form */}
              {isAddBindingOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg space-y-3"
                >
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Target Queue
                    </label>
                    <select
                      value={newBindingQueue}
                      onChange={(e) => setNewBindingQueue(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                    >
                      <option value="">Select a queue...</option>
                      {queues.map((queue) => (
                        <option key={queue.id} value={queue.id}>
                          {queue.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Routing Key
                    </label>
                    <input
                      type="text"
                      value={newBindingRoutingKey}
                      onChange={(e) => setNewBindingRoutingKey(e.target.value)}
                      placeholder="e.g., user.created or #"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddBinding}
                      disabled={!newBindingQueue}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Create Binding
                    </button>
                    <button
                      onClick={() => setIsAddBindingOpen(false)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Bindings List */}
              <div className="space-y-2">
                {exchangeBindings.map((binding) => {
                  const targetQueue = queues.find(q => q.id === binding.destination);
                  return (
                    <div
                      key={binding.id}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                    >
                      <div className={cn('p-2 rounded-lg', exchangeTypeColors[exchange.type])}>
                        {exchangeTypeIcons[exchange.type]}
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {targetQueue?.name || binding.destination}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-neutral-500">
                            Routing key:
                          </span>
                          <code className="px-1.5 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 rounded">
                            {binding.routingKey || '#'}
                          </code>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteBinding(binding.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        title="Remove binding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {exchangeBindings.length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No bindings yet</p>
                    <p className="text-xs mt-1">Create a binding to route messages to queues</p>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          <TabPanel tabId="settings">
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                  Exchange Arguments
                </h4>
                <div className="space-y-2">
                  {Object.entries(exchange.arguments || {}).length > 0 ? (
                    Object.entries(exchange.arguments).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-0">
                        <code className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                          {key}
                        </code>
                        <span className="text-sm text-neutral-900 dark:text-white">
                          {String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No custom arguments</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-600 dark:text-red-500 mb-3">
                  Deleting this exchange will remove all associated bindings and any unrouted messages will be lost.
                </p>
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700">
                  Delete Exchange
                </button>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </SlideOver>
  );
}

export default ExchangeDetailView;
