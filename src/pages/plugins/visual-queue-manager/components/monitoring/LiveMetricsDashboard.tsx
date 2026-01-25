/**
 * Live Metrics Dashboard
 * Real-time monitoring of queue system metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Settings,
} from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import { useQueueManagerStore } from '../../stores/queueManagerStore';
import { SparklineChart, MiniBarChart } from '../shared/SparklineChart';
import { GaugeChart, HealthGauge } from '../shared/GaugeChart';
import { AnimatedCounter, formatCompactNumber, formatBytes, formatRate, formatDuration } from '../shared/AnimatedCounter';
import { StatsCard } from '../shared/StatsCard';
import { TimeRangeSelector } from '../shared/TimeRangeSelector';
import type { TimeRange } from '../../types';

export function LiveMetricsDashboard() {
  const { queues, exchanges, connections, consumers, systemMetrics } = useQueueManagerStore();

  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [refreshRate, setRefreshRate] = useState(5000);
  const [metricsHistory, setMetricsHistory] = useState<number[][]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetricsHistory(prev => {
        const newData = prev.map(series => {
          const newPoint = series[series.length - 1] * (0.9 + Math.random() * 0.2);
          return [...series.slice(-59), newPoint];
        });
        return newData.length === 0
          ? [
              Array.from({ length: 60 }, () => Math.random() * 1000),
              Array.from({ length: 60 }, () => Math.random() * 800),
              Array.from({ length: 60 }, () => Math.random() * 500),
              Array.from({ length: 60 }, () => Math.random() * 100),
            ]
          : newData;
      });
    }, refreshRate);

    return () => clearInterval(interval);
  }, [isLive, refreshRate]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalMessages = queues.reduce((sum, q) => sum + q.messagesTotal, 0);
    const totalReady = queues.reduce((sum, q) => sum + q.messagesReady, 0);
    const totalUnacked = queues.reduce((sum, q) => sum + q.messagesUnacked, 0);
    const totalPublishRate = queues.reduce((sum, q) => sum + q.publishRate, 0);
    const totalDeliverRate = queues.reduce((sum, q) => sum + q.deliverRate, 0);
    const totalMemory = queues.reduce((sum, q) => sum + q.memory, 0);
    const avgHealthScore = queues.length > 0
      ? queues.reduce((sum, q) => sum + q.healthScore, 0) / queues.length
      : 100;

    return {
      totalMessages,
      totalReady,
      totalUnacked,
      totalPublishRate,
      totalDeliverRate,
      totalMemory,
      avgHealthScore,
      activeQueues: queues.filter(q => q.state === 'running').length,
      totalConsumers: consumers.length,
      totalConnections: connections.length,
    };
  }, [queues, consumers, connections]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Live Metrics
          </h2>
          <p className="text-sm text-neutral-500">Real-time system monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <span className="text-xs text-neutral-500">Refresh:</span>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium border-0 focus:outline-none"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isLive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
            )}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
                Live
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Paused
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Message Rate"
          value={aggregateMetrics.totalPublishRate}
          format="rate"
          icon={<Zap className="w-5 h-5" />}
          trend={{ value: 12, direction: 'up' }}
          sparklineData={metricsHistory[0]}
          sparklineColor="#22c55e"
        />
        <StatsCard
          title="Total Messages"
          value={aggregateMetrics.totalMessages}
          format="compact"
          icon={<Activity className="w-5 h-5" />}
          subtitle={`${formatCompactNumber(aggregateMetrics.totalReady)} ready`}
          sparklineData={metricsHistory[1]}
          sparklineColor="#3b82f6"
        />
        <StatsCard
          title="Active Connections"
          value={aggregateMetrics.totalConnections}
          format="number"
          icon={<Wifi className="w-5 h-5" />}
          trend={{ value: 3, direction: 'up' }}
          sparklineData={metricsHistory[2]}
          sparklineColor="#8b5cf6"
        />
        <StatsCard
          title="Memory Usage"
          value={aggregateMetrics.totalMemory}
          format="bytes"
          icon={<HardDrive className="w-5 h-5" />}
          trend={{ value: 5, direction: 'down' }}
          sparklineData={metricsHistory[3]}
          sparklineColor="#f59e0b"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Throughput */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              Message Throughput
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-neutral-500">Published</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-neutral-500">Delivered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-neutral-500">Acknowledged</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {/* Placeholder for full chart - would use Recharts in production */}
            <div className="w-full space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-500 w-16">Publish</span>
                <div className="flex-1">
                  <SparklineChart
                    data={metricsHistory[0] || Array.from({ length: 60 }, () => Math.random() * 1000)}
                    width={600}
                    height={60}
                    color="#22c55e"
                    showArea
                  />
                </div>
                <span className="text-sm font-medium text-green-600 w-20 text-right">
                  {formatRate(aggregateMetrics.totalPublishRate)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-500 w-16">Deliver</span>
                <div className="flex-1">
                  <SparklineChart
                    data={metricsHistory[1] || Array.from({ length: 60 }, () => Math.random() * 800)}
                    width={600}
                    height={60}
                    color="#3b82f6"
                    showArea
                  />
                </div>
                <span className="text-sm font-medium text-blue-600 w-20 text-right">
                  {formatRate(aggregateMetrics.totalDeliverRate)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-500 w-16">Ack</span>
                <div className="flex-1">
                  <SparklineChart
                    data={metricsHistory[2] || Array.from({ length: 60 }, () => Math.random() * 500)}
                    width={600}
                    height={60}
                    color="#8b5cf6"
                    showArea
                  />
                </div>
                <span className="text-sm font-medium text-purple-600 w-20 text-right">
                  {formatRate(aggregateMetrics.totalDeliverRate * 0.95)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">
            System Health
          </h3>
          <div className="flex flex-col items-center justify-center h-48">
            <HealthGauge score={aggregateMetrics.avgHealthScore} size="lg" />
            <p className="mt-4 text-sm text-neutral-500">
              {aggregateMetrics.avgHealthScore >= 90
                ? 'All systems operational'
                : aggregateMetrics.avgHealthScore >= 70
                  ? 'Minor issues detected'
                  : 'Attention required'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {aggregateMetrics.activeQueues}
              </p>
              <p className="text-xs text-neutral-500">Active Queues</p>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {aggregateMetrics.totalConsumers}
              </p>
              <p className="text-xs text-neutral-500">Consumers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">CPU</span>
          </div>
          <GaugeChart
            value={35}
            max={100}
            size={100}
            thresholds={[
              { value: 50, color: '#22c55e' },
              { value: 75, color: '#f59e0b' },
              { value: 100, color: '#ef4444' },
            ]}
          />
          <p className="text-center mt-2 text-sm text-neutral-600 dark:text-neutral-400">35% utilization</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <HardDrive className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">Memory</span>
          </div>
          <GaugeChart
            value={62}
            max={100}
            size={100}
            thresholds={[
              { value: 50, color: '#22c55e' },
              { value: 75, color: '#f59e0b' },
              { value: 100, color: '#ef4444' },
            ]}
          />
          <p className="text-center mt-2 text-sm text-neutral-600 dark:text-neutral-400">62% used</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Server className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">Disk</span>
          </div>
          <GaugeChart
            value={28}
            max={100}
            size={100}
            thresholds={[
              { value: 50, color: '#22c55e' },
              { value: 75, color: '#f59e0b' },
              { value: 100, color: '#ef4444' },
            ]}
          />
          <p className="text-center mt-2 text-sm text-neutral-600 dark:text-neutral-400">28% used</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Wifi className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">Network</span>
          </div>
          <GaugeChart
            value={45}
            max={100}
            size={100}
            thresholds={[
              { value: 50, color: '#22c55e' },
              { value: 75, color: '#f59e0b' },
              { value: 100, color: '#ef4444' },
            ]}
          />
          <p className="text-center mt-2 text-sm text-neutral-600 dark:text-neutral-400">45% bandwidth</p>
        </div>
      </div>

      {/* Queue Activity Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
            Queue Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Queue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Messages</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Publish Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Deliver Rate</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Activity</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {queues.slice(0, 5).map((queue) => (
                <tr key={queue.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        queue.state === 'running' ? 'bg-green-500' : 'bg-neutral-400'
                      )} />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {queue.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-600 dark:text-neutral-400">
                    {formatCompactNumber(queue.messagesTotal)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">
                    {formatRate(queue.publishRate)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-blue-600">
                    {formatRate(queue.deliverRate)}
                  </td>
                  <td className="px-4 py-3">
                    <MiniBarChart
                      data={Array.from({ length: 10 }, () => Math.random() * 100)}
                      width={80}
                      height={24}
                      color="#3b82f6"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      queue.healthScore >= 90
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : queue.healthScore >= 70
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    )}>
                      {queue.healthScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LiveMetricsDashboard;
