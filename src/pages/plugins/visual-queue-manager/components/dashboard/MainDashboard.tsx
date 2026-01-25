/**
 * Main Dashboard Component
 * System overview with key metrics and quick actions
 */

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  ArrowRightLeft,
  Users,
  Activity,
  MemoryStick,
  HardDrive,
  Cpu,
  Wifi,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '../../../../../design-system/utils';
import { useQueueManagerStore } from '../../stores/queueManagerStore';
import { StatsCard, HeroStat, StatsGrid } from '../shared/StatsCard';
import { GaugeChart, HealthGauge } from '../shared/GaugeChart';
import { SparklineChart } from '../shared/SparklineChart';
import { QuickTimeRange } from '../shared/TimeRangeSelector';
import { AlertSeverityBadge, StatusDot } from '../shared/StatusBadge';
import { formatBytes, formatCompactNumber, formatDuration, formatRate } from '../shared/AnimatedCounter';

export function MainDashboard() {
  const {
    queues,
    exchanges,
    connections,
    consumers,
    alerts,
    events,
    systemMetrics,
    clusterNodes,
    timeRange,
    setTimeRange,
    autoRefresh,
    setAutoRefresh,
    refreshData,
    initializeSampleData,
  } = useQueueManagerStore();

  // Initialize sample data on mount
  useEffect(() => {
    if (queues.length === 0) {
      initializeSampleData();
    }
  }, [queues.length, initializeSampleData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  // Calculate totals
  const stats = useMemo(() => {
    const totalMessages = queues.reduce((sum, q) => sum + q.messagesTotal, 0);
    const readyMessages = queues.reduce((sum, q) => sum + q.messagesReady, 0);
    const unackedMessages = queues.reduce((sum, q) => sum + q.messagesUnacked, 0);
    const publishRate = queues.reduce((sum, q) => sum + q.publishRate, 0);
    const deliverRate = queues.reduce((sum, q) => sum + q.deliverRate, 0);
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const avgHealthScore = queues.length > 0
      ? Math.round(queues.reduce((sum, q) => sum + q.healthScore, 0) / queues.length)
      : 100;

    return {
      totalMessages,
      readyMessages,
      unackedMessages,
      publishRate,
      deliverRate,
      activeAlerts,
      avgHealthScore,
    };
  }, [queues, alerts]);

  // Generate sample sparkline data
  const generateSparkline = () => Array.from({ length: 20 }, () => Math.random() * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            System overview and real-time monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickTimeRange value={timeRange} onChange={setTimeRange} />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              autoRefresh
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          title="Total Messages"
          value={stats.totalMessages}
          subtitle={`${formatCompactNumber(stats.readyMessages)} ready, ${formatCompactNumber(stats.unackedMessages)} unacked`}
          icon={Layers}
          color="#3b82f6"
        />
        <StatsCard
          title="Queues"
          value={queues.length}
          icon={Layers}
          iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          sparklineData={generateSparkline()}
          sparklineColor="#3b82f6"
        />
        <StatsCard
          title="Exchanges"
          value={exchanges.length}
          icon={ArrowRightLeft}
          iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          sparklineData={generateSparkline()}
          sparklineColor="#8b5cf6"
        />
        <StatsCard
          title="Connections"
          value={connections.length}
          icon={Wifi}
          iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          sparklineData={generateSparkline()}
          sparklineColor="#22c55e"
        />
      </div>

      {/* Message Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Message Throughput</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Publish and deliver rates</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Publish: {formatRate(stats.publishRate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Deliver: {formatRate(stats.deliverRate)}</span>
              </div>
            </div>
          </div>
          <div className="h-48">
            <SparklineChart
              data={Array.from({ length: 50 }, () => Math.random() * 500 + 200)}
              width={700}
              height={180}
              color="#3b82f6"
              showArea
            />
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">System Health</h3>
          <div className="flex flex-col items-center">
            <HealthGauge score={stats.avgHealthScore} size={140} />
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{consumers.length}</p>
                <p className="text-xs text-neutral-500">Consumers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.activeAlerts}</p>
                <p className="text-xs text-neutral-500">Active Alerts</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MemoryStick className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Memory</span>
          </div>
          <GaugeChart
            value={(systemMetrics.memoryUsed / systemMetrics.memoryLimit) * 100}
            size={80}
            strokeWidth={8}
            color="#3b82f6"
            thresholds={[
              { value: 90, color: '#ef4444' },
              { value: 70, color: '#f59e0b' },
            ]}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            {formatBytes(systemMetrics.memoryUsed)} / {formatBytes(systemMetrics.memoryLimit)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Disk</span>
          </div>
          <GaugeChart
            value={100 - (systemMetrics.diskFree / (systemMetrics.diskFree + systemMetrics.diskLimit)) * 100}
            size={80}
            strokeWidth={8}
            color="#22c55e"
            thresholds={[
              { value: 90, color: '#ef4444' },
              { value: 70, color: '#f59e0b' },
            ]}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            {formatBytes(systemMetrics.diskFree)} free
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">File Descriptors</span>
          </div>
          <GaugeChart
            value={(systemMetrics.fdUsed / systemMetrics.fdLimit) * 100}
            size={80}
            strokeWidth={8}
            color="#8b5cf6"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            {systemMetrics.fdUsed.toLocaleString()} / {formatCompactNumber(systemMetrics.fdLimit)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Erlang Processes</span>
          </div>
          <GaugeChart
            value={(systemMetrics.processesUsed / systemMetrics.processesLimit) * 100}
            size={80}
            strokeWidth={8}
            color="#f97316"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            {systemMetrics.processesUsed.toLocaleString()} / {formatCompactNumber(systemMetrics.processesLimit)}
          </p>
        </motion.div>
      </div>

      {/* Bottom Section: Top Queues and Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Queues by Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Top Queues</h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">by message count</span>
          </div>
          <div className="space-y-4">
            {queues
              .sort((a, b) => b.messagesTotal - a.messagesTotal)
              .slice(0, 5)
              .map((queue, index) => {
                const maxMessages = queues[0]?.messagesTotal || 1;
                const percentage = Math.min((queue.messagesTotal / maxMessages) * 100, 100);
                const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];
                const barColor = colors[index % colors.length];

                return (
                  <div key={queue.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: barColor }}
                        />
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                          {queue.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                          {formatCompactNumber(queue.messagesTotal)}
                        </span>
                        <HealthGauge score={queue.healthScore} size={32} />
                      </div>
                    </div>
                    <div className="relative h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full opacity-30"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, transparent, ${barColor})`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{queue.vhost}</span>
                      <span>{percentage.toFixed(0)}% of max</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Events</h3>
            <button className="text-xs text-primary-600 hover:text-primary-700">View all</button>
          </div>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <AlertSeverityBadge severity={event.severity} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 dark:text-white">{event.message}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cluster Nodes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
      >
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Cluster Nodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusterNodes.map((node) => (
            <div
              key={node.id}
              className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
            >
              <StatusDot status={node.running} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{node.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {node.type} node • v{node.version} • up {formatDuration(node.uptime)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {formatBytes(node.memoryUsed)}
                </p>
                <p className="text-xs text-neutral-500">memory</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default MainDashboard;
