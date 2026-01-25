/**
 * Visual Queue Manager Plugin Page
 * Enterprise-grade visual queue management system with real-time monitoring
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Download,
  Plus,
  Zap,
  Timer,
  TrendingUp,
  ArrowUpDown,
  ListOrdered,
  X,
} from 'lucide-react';
import { cn } from '../../design-system/utils';

// Types
interface QueueJob {
  id: string;
  name: string;
  type: 'email' | 'notification' | 'webhook' | 'sync' | 'export' | 'import' | 'process';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  queue: string;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  paused: number;
}

// Sample data
const sampleQueues = ['default', 'emails', 'notifications', 'webhooks', 'exports'];

const generateSampleJobs = (): QueueJob[] => {
  const types: QueueJob['type'][] = ['email', 'notification', 'webhook', 'sync', 'export', 'import', 'process'];
  const statuses: QueueJob['status'][] = ['pending', 'processing', 'completed', 'failed', 'paused'];
  const priorities: QueueJob['priority'][] = ['low', 'normal', 'high', 'critical'];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `job-${i + 1}`,
    name: [
      'Send welcome email',
      'Process user upload',
      'Sync inventory data',
      'Generate report',
      'Send notification',
      'Webhook delivery',
      'Export data batch',
      'Import CSV records',
    ][i % 8],
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    progress: statuses[i % statuses.length] === 'completed' ? 100 : statuses[i % statuses.length] === 'processing' ? Math.floor(Math.random() * 80) + 10 : 0,
    priority: priorities[i % priorities.length],
    payload: { userId: `user-${i}`, data: `sample-data-${i}` },
    attempts: Math.floor(Math.random() * 3) + 1,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    startedAt: statuses[i % statuses.length] !== 'pending' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined,
    completedAt: statuses[i % statuses.length] === 'completed' ? new Date().toISOString() : undefined,
    error: statuses[i % statuses.length] === 'failed' ? 'Connection timeout after 30s' : undefined,
    queue: sampleQueues[i % sampleQueues.length],
  }));
};

// Status badge component
function StatusBadge({ status }: { status: QueueJob['status'] }) {
  const config = {
    pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
    processing: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Activity },
    completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    paused: { color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400', icon: Pause },
  };

  const { color, icon: Icon } = config[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', color)}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Priority badge component
function PriorityBadge({ priority }: { priority: QueueJob['priority'] }) {
  const config = {
    low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config[priority])}>
      {priority === 'critical' && <Zap className="w-3 h-3" />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Stats card component
function StatsCard({ label, value, icon: Icon, color, trend }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: number;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
    </div>
  );
}

// Add Job Modal Component
interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Omit<QueueJob, 'id' | 'progress' | 'attempts' | 'createdAt' | 'startedAt' | 'completedAt' | 'error'>) => void;
}

function AddJobModal({ isOpen, onClose, onSubmit }: AddJobModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<QueueJob['type']>('process');
  const [queue, setQueue] = useState('default');
  const [priority, setPriority] = useState<QueueJob['priority']>('normal');
  const [payload, setPayload] = useState('{\n  "data": "example"\n}');
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [payloadError, setPayloadError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON payload
    try {
      const parsedPayload = JSON.parse(payload);
      setPayloadError('');

      onSubmit({
        name,
        type,
        queue,
        priority,
        status: 'pending',
        payload: parsedPayload,
        maxAttempts,
      });

      // Reset form
      setName('');
      setType('process');
      setQueue('default');
      setPriority('normal');
      setPayload('{\n  "data": "example"\n}');
      setMaxAttempts(3);
      onClose();
    } catch {
      setPayloadError('Invalid JSON format');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add New Job</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Job Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Job Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Send welcome email"
                required
                className="w-full h-10 px-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Type and Queue */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as QueueJob['type'])}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="email">Email</option>
                  <option value="notification">Notification</option>
                  <option value="webhook">Webhook</option>
                  <option value="sync">Sync</option>
                  <option value="export">Export</option>
                  <option value="import">Import</option>
                  <option value="process">Process</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Queue *
                </label>
                <select
                  value={queue}
                  onChange={(e) => setQueue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sampleQueues.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority and Max Attempts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as QueueJob['priority'])}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="w-full h-10 px-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Payload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Payload (JSON)
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={4}
                className={cn(
                  'w-full px-4 py-3 rounded-lg bg-neutral-900 text-green-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
                  payloadError && 'ring-2 ring-red-500'
                )}
              />
              {payloadError && (
                <p className="mt-1 text-xs text-red-500">{payloadError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Add Job
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function VisualQueueManager() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<QueueJob['status'] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    setJobs(generateSampleJobs());
  }, []);

  // Auto-refresh simulation
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'processing') {
          const newProgress = Math.min(job.progress + Math.floor(Math.random() * 15), 100);
          return {
            ...job,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'processing',
            completedAt: newProgress >= 100 ? new Date().toISOString() : undefined,
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Stats calculation
  const stats: QueueStats = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    paused: jobs.filter(j => j.status === 'paused').length,
  }), [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (selectedQueue && job.queue !== selectedQueue) return false;
      if (selectedStatus && job.status !== selectedStatus) return false;
      if (searchQuery && !job.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [jobs, selectedQueue, selectedStatus, searchQuery]);

  // Handlers
  const handleRetry = (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, status: 'pending', progress: 0, attempts: job.attempts + 1, error: undefined } : job
    ));
  };

  const handlePause = (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, status: job.status === 'paused' ? 'pending' : 'paused' } : job
    ));
  };

  const handleDelete = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleBulkAction = (action: 'retry' | 'pause' | 'delete') => {
    if (action === 'delete') {
      setJobs(prev => prev.filter(job => !selectedJobs.includes(job.id)));
    } else if (action === 'retry') {
      setJobs(prev => prev.map(job =>
        selectedJobs.includes(job.id) && job.status === 'failed'
          ? { ...job, status: 'pending', progress: 0, attempts: job.attempts + 1, error: undefined }
          : job
      ));
    } else if (action === 'pause') {
      setJobs(prev => prev.map(job =>
        selectedJobs.includes(job.id) && (job.status === 'pending' || job.status === 'paused')
          ? { ...job, status: job.status === 'paused' ? 'pending' : 'paused' }
          : job
      ));
    }
    setSelectedJobs([]);
  };

  const handleAddJob = useCallback((newJob: Omit<QueueJob, 'id' | 'progress' | 'attempts' | 'createdAt' | 'startedAt' | 'completedAt' | 'error'>) => {
    const job: QueueJob = {
      ...newJob,
      id: `job-${Date.now()}`,
      progress: 0,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [job, ...prev]);
  }, []);

  return (
    <div className="-mx-6 -mt-4 -mb-6 px-6 py-6 min-h-[calc(100vh-8rem)] bg-neutral-50 dark:bg-neutral-950 space-y-6">
      {/* Add Job Modal */}
      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        onSubmit={handleAddJob}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Visual Queue Manager</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Monitor and manage background jobs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isAutoRefresh
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isAutoRefresh && 'animate-spin')} />
            {isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => setIsAddJobModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          label="Total Jobs"
          value={stats.total}
          icon={ListOrdered}
          color="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
        />
        <StatsCard
          label="Processing"
          value={stats.processing}
          icon={Activity}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          trend={12}
        />
        <StatsCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          trend={-5}
        />
        <StatsCard
          label="Paused"
          value={stats.paused}
          icon={Pause}
          color="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Queue Filter */}
        <select
          value={selectedQueue || ''}
          onChange={(e) => setSelectedQueue(e.target.value || null)}
          className="h-10 px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Queues</option>
          {sampleQueues.map(queue => (
            <option key={queue} value={queue}>{queue}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(e.target.value as QueueJob['status'] || null)}
          className="h-10 px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="paused">Paused</option>
        </select>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-neutral-500">{selectedJobs.length} selected</span>
            <button
              onClick={() => handleBulkAction('retry')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            >
              Retry
            </button>
            <button
              onClick={() => handleBulkAction('pause')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
            >
              Pause
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs(filteredJobs.map(j => j.id));
                      } else {
                        setSelectedJobs([]);
                      }
                    }}
                    className="rounded border-neutral-300 dark:border-neutral-700"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Queue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Attempts</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredJobs.map((job) => (
                <React.Fragment key={job.id}>
                  <tr
                    className={cn(
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
                      selectedJobs.includes(job.id) && 'bg-primary-50 dark:bg-primary-900/10'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs(prev => [...prev, job.id]);
                          } else {
                            setSelectedJobs(prev => prev.filter(id => id !== job.id));
                          }
                        }}
                        className="rounded border-neutral-300 dark:border-neutral-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <ChevronRight className={cn('w-4 h-4 transition-transform', expandedJob === job.id && 'rotate-90')} />
                        {job.name}
                      </button>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-6">{job.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">{job.queue}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={job.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {job.status === 'processing' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500">{job.progress}%</span>
                        </div>
                      ) : job.status === 'completed' ? (
                        <span className="text-xs text-green-600 dark:text-green-400">100%</span>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        {job.attempts}/{job.maxAttempts}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            title="Retry"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {(job.status === 'pending' || job.status === 'paused') && (
                          <button
                            onClick={() => handlePause(job.id)}
                            className="p-1.5 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                            title={job.status === 'paused' ? 'Resume' : 'Pause'}
                          >
                            {job.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded row for job details */}
                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="py-4 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg my-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Payload</h4>
                                  <pre className="text-xs bg-neutral-900 dark:bg-neutral-950 text-green-400 p-3 rounded-lg overflow-x-auto">
                                    {JSON.stringify(job.payload, null, 2)}
                                  </pre>
                                </div>
                                <div className="space-y-3">
                                  {job.startedAt && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Started At</h4>
                                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{new Date(job.startedAt).toLocaleString()}</p>
                                    </div>
                                  )}
                                  {job.completedAt && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Completed At</h4>
                                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{new Date(job.completedAt).toLocaleString()}</p>
                                    </div>
                                  )}
                                  {job.error && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-red-500 uppercase mb-1">Error</h4>
                                      <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{job.error}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
            <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">No jobs found</h4>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">Try adjusting your filters or add a new job</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualQueueManager;
