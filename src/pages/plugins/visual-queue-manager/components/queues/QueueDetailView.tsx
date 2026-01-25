/**
 * Queue Detail View
 * Comprehensive queue details with tabs for different aspects
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Layers,
  Activity,
  MessageSquare,
  Users,
  Link,
  Settings,
  BarChart3,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Copy,
  ExternalLink,
  Clock,
  Database,
  Zap,
} from 'lucide-react';
import { SlideOver } from '../shared/Modal';
import { Tabs, TabPanel, VerticalTabs } from '../shared/Tabs';
import { useQueueManagerStore } from '../../stores/queueManagerStore';
import { StatsCard, StatsGrid } from '../shared/StatsCard';
import { SparklineChart, MiniBarChart } from '../shared/SparklineChart';
import { GaugeChart, HealthGauge } from '../shared/GaugeChart';
import { QueueStateBadge, HealthScoreBadge } from '../shared/StatusBadge';
import { DataTable, Column } from '../shared/DataTable';
import { formatCompactNumber, formatBytes, formatRate, formatDuration } from '../shared/AnimatedCounter';
import { cn } from '../../../../../design-system/utils';
import type { Consumer, Message } from '../../types';

interface QueueDetailViewProps {
  queueId: string;
  onClose: () => void;
}

export function QueueDetailView({ queueId, onClose }: QueueDetailViewProps) {
  const { queues, consumers, bindings, deleteQueue, purgeQueue } = useQueueManagerStore();
  const [activeTab, setActiveTab] = useState('overview');

  const queue = queues.find(q => q.id === queueId);
  const queueConsumers = consumers.filter(c => c.queueName === queue?.name);
  const queueBindings = bindings.filter(b => b.destination === queue?.name && b.destinationType === 'queue');

  // Generate sample messages for the message browser
  const sampleMessages: Message[] = useMemo(() => {
    if (!queue) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i + 1}`,
      queueName: queue.name,
      exchangeName: 'orders',
      routingKey: 'order.created',
      payload: JSON.stringify({ orderId: `ORD-${1000 + i}`, amount: Math.random() * 1000, status: 'pending' }),
      payloadBytes: 150 + Math.floor(Math.random() * 100),
      payloadEncoding: 'string' as const,
      properties: {
        contentType: 'application/json',
        deliveryMode: 2,
        priority: Math.floor(Math.random() * 5),
        timestamp: Date.now() - Math.random() * 3600000,
      },
      redelivered: Math.random() > 0.8,
      deliveryTag: i + 1,
      receivedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
  }, [queue]);

  if (!queue) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, badge: queue.messagesReady },
    { id: 'consumers', label: 'Consumers', icon: <Users className="w-4 h-4" />, badge: queueConsumers.length },
    { id: 'bindings', label: 'Bindings', icon: <Link className="w-4 h-4" />, badge: queueBindings.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Message table columns
  const messageColumns: Column<Message>[] = [
    {
      key: 'id',
      header: '#',
      width: '60px',
      render: (msg) => <span className="text-neutral-500">{msg.deliveryTag}</span>,
    },
    {
      key: 'payload',
      header: 'Payload',
      render: (msg) => (
        <div className="max-w-xs">
          <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded truncate">
            {msg.payload.substring(0, 100)}...
          </pre>
        </div>
      ),
    },
    {
      key: 'payloadBytes',
      header: 'Size',
      width: '80px',
      render: (msg) => <span className="text-sm">{formatBytes(msg.payloadBytes)}</span>,
    },
    {
      key: 'redelivered',
      header: 'Redelivered',
      width: '100px',
      render: (msg) => (
        <span className={cn('text-xs', msg.redelivered ? 'text-yellow-600' : 'text-neutral-400')}>
          {msg.redelivered ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Received',
      width: '150px',
      render: (msg) => (
        <span className="text-sm text-neutral-500">
          {new Date(msg.receivedAt).toLocaleTimeString()}
        </span>
      ),
    },
  ];

  // Consumer table columns
  const consumerColumns: Column<Consumer>[] = [
    {
      key: 'tag',
      header: 'Consumer Tag',
      render: (c) => <span className="font-mono text-sm">{c.tag}</span>,
    },
    {
      key: 'prefetchCount',
      header: 'Prefetch',
      width: '80px',
      align: 'center',
      render: (c) => <span>{c.prefetchCount}</span>,
    },
    {
      key: 'deliverRate',
      header: 'Deliver Rate',
      width: '120px',
      render: (c) => <span className="text-green-600">{formatRate(c.deliverRate)}</span>,
    },
    {
      key: 'ackRate',
      header: 'Ack Rate',
      width: '120px',
      render: (c) => <span className="text-blue-600">{formatRate(c.ackRate)}</span>,
    },
    {
      key: 'avgProcessingTime',
      header: 'Avg Time',
      width: '100px',
      render: (c) => <span>{c.avgProcessingTime.toFixed(0)}ms</span>,
    },
    {
      key: 'isSlowConsumer',
      header: 'Status',
      width: '100px',
      render: (c) => (
        <span className={cn('text-xs px-2 py-1 rounded-full', c.isSlowConsumer ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}>
          {c.isSlowConsumer ? 'Slow' : 'Healthy'}
        </span>
      ),
    },
  ];

  return (
    <SlideOver
      isOpen={true}
      onClose={onClose}
      title={queue.name}
      description={`${queue.type} queue in ${queue.vhost}`}
      size="half"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => purgeQueue(queue.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              <RefreshCw className="w-4 h-4" />
              Purge
            </button>
            <button
              onClick={() => {
                deleteQueue(queue.id);
                onClose();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="flex gap-4">
        {/* Sidebar tabs */}
        <VerticalTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-48 flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <HealthGauge score={queue.healthScore} size={80} />
                  <div>
                    <QueueStateBadge state={queue.state} size="lg" />
                    <p className="text-sm text-neutral-500 mt-1">
                      Created {new Date(queue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCompactNumber(queue.messagesTotal)}
                    </p>
                    <p className="text-xs text-neutral-500">Total Messages</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCompactNumber(queue.messagesReady)}
                    </p>
                    <p className="text-xs text-neutral-500">Ready</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCompactNumber(queue.messagesUnacked)}
                    </p>
                    <p className="text-xs text-neutral-500">Unacked</p>
                  </div>
                </div>
              </div>

              {/* Rates Chart */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Message Rates</h4>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-lg font-semibold text-green-600">{formatRate(queue.publishRate)}</p>
                    <p className="text-xs text-neutral-500">Publish</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-blue-600">{formatRate(queue.deliverRate)}</p>
                    <p className="text-xs text-neutral-500">Deliver</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-purple-600">{formatRate(queue.ackRate)}</p>
                    <p className="text-xs text-neutral-500">Ack</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-yellow-600">{formatRate(queue.redeliverRate)}</p>
                    <p className="text-xs text-neutral-500">Redeliver</p>
                  </div>
                </div>
                <SparklineChart
                  data={Array.from({ length: 30 }, () => Math.random() * queue.publishRate)}
                  width={400}
                  height={100}
                  color="#22c55e"
                  showArea
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Configuration</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Type</dt>
                      <dd className="font-medium capitalize">{queue.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Durable</dt>
                      <dd className="font-medium">{queue.durable ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Auto Delete</dt>
                      <dd className="font-medium">{queue.autoDelete ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Exclusive</dt>
                      <dd className="font-medium">{queue.exclusive ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Resources</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Memory</dt>
                      <dd className="font-medium">{formatBytes(queue.memory)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Consumers</dt>
                      <dd className="font-medium">{queue.consumers}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Virtual Host</dt>
                      <dd className="font-medium">{queue.vhost}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Showing {Math.min(sampleMessages.length, 20)} of {queue.messagesReady} ready messages
                </p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200">
                    Get Message
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                    Publish Message
                  </button>
                </div>
              </div>
              <DataTable
                data={sampleMessages}
                columns={messageColumns}
                keyField="id"
                pageSize={10}
              />
            </div>
          )}

          {activeTab === 'consumers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {queueConsumers.length} consumer(s) connected
                </p>
              </div>
              <DataTable
                data={queueConsumers}
                columns={consumerColumns}
                keyField="id"
                emptyMessage="No consumers connected to this queue"
              />
            </div>
          )}

          {activeTab === 'bindings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {queueBindings.length} binding(s)
                </p>
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200">
                  Add Binding
                </button>
              </div>
              <div className="space-y-2">
                {queueBindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Link className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{binding.source}</p>
                        <p className="text-xs text-neutral-500">
                          {binding.routingKey || '(empty routing key)'}
                        </p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Queue Arguments</h4>
                <dl className="space-y-3 text-sm">
                  {Object.entries(queue.arguments).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <dt className="text-neutral-500 font-mono">{key}</dt>
                      <dd className="font-medium">{String(value)}</dd>
                    </div>
                  ))}
                  {Object.keys(queue.arguments).length === 0 && (
                    <p className="text-neutral-400">No custom arguments configured</p>
                  )}
                </dl>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-600 dark:text-red-500 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => purgeQueue(queue.id)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Purge All Messages
                  </button>
                  <button
                    onClick={() => {
                      deleteQueue(queue.id);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Queue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

export default QueueDetailView;
