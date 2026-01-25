/**
 * Visual Queue Manager Plugin
 * A comprehensive RabbitMQ-style message queue management interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  ArrowRightLeft,
  MessageSquare,
  GitBranch,
  Activity,
  Wifi,
  Users,
  Bell,
  Shield,
  Globe,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  RefreshCw,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { cn } from '../../../design-system/utils';
import { useQueueManagerStore } from './stores/queueManagerStore';

// Import all dashboard components
import { MainDashboard } from './components/dashboard/MainDashboard';
import { QueueDashboard } from './components/queues/QueueDashboard';
import { ExchangeDashboard } from './components/exchanges/ExchangeDashboard';
import { MessageBrowser, PublishMessage } from './components/messages';
import { TopologyGraph } from './components/topology/TopologyGraph';
import { LiveMetricsDashboard, ConnectionMonitor, ConsumerDashboard } from './components/monitoring';
import { AlertsDashboard } from './components/alerts/AlertsDashboard';
import { SecurityDashboard } from './components/security/SecurityDashboard';
import { ApiEndpointsDashboard } from './components/api-endpoints/ApiEndpointsDashboard';

type NavigationSection =
  | 'overview'
  | 'queues'
  | 'exchanges'
  | 'messages'
  | 'topology'
  | 'metrics'
  | 'connections'
  | 'consumers'
  | 'alerts'
  | 'security'
  | 'api-endpoints'
  | 'settings';

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function VisualQueueManager() {
  const navigate = useNavigate();
  const { initializeSampleData, alerts } = useQueueManagerStore();

  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Initialize sample data on mount
  useEffect(() => {
    initializeSampleData();
  }, [initializeSampleData]);

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  const mainNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'queues', label: 'Queues', icon: <Layers className="w-5 h-5" /> },
    { id: 'exchanges', label: 'Exchanges', icon: <ArrowRightLeft className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'topology', label: 'Topology', icon: <GitBranch className="w-5 h-5" /> },
  ];

  const monitoringNavItems: NavItem[] = [
    { id: 'metrics', label: 'Live Metrics', icon: <Activity className="w-5 h-5" /> },
    { id: 'connections', label: 'Connections', icon: <Wifi className="w-5 h-5" /> },
    { id: 'consumers', label: 'Consumers', icon: <Users className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" />, badge: unacknowledgedAlerts || undefined },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'api-endpoints', label: 'API Endpoints', icon: <Globe className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const renderNavItem = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => setActiveSection(item.id)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors relative',
        activeSection === item.id
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
      )}
    >
      <span className={cn(
        activeSection === item.id ? 'text-primary-600' : 'text-neutral-400'
      )}>
        {item.icon}
      </span>
      {!sidebarCollapsed && (
        <>
          <span className="text-sm font-medium flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
              {item.badge}
            </span>
          )}
        </>
      )}
      {sidebarCollapsed && item.badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </button>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <MainDashboard />;
      case 'queues':
        return <QueueDashboard />;
      case 'exchanges':
        return <ExchangeDashboard />;
      case 'messages':
        return <MessageBrowser />;
      case 'topology':
        return <TopologyGraph className="h-[calc(100vh-12rem)]" />;
      case 'metrics':
        return <LiveMetricsDashboard />;
      case 'connections':
        return <ConnectionMonitor />;
      case 'consumers':
        return <ConsumerDashboard />;
      case 'alerts':
        return <AlertsDashboard />;
      case 'security':
        return <SecurityDashboard />;
      case 'api-endpoints':
        return <ApiEndpointsDashboard />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className={cn(
      'flex h-screen bg-neutral-50 dark:bg-neutral-950 -mx-6 -mt-4 -mb-6',
      isDarkMode && 'dark'
    )}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        className="flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
      >
        {/* Header with Back Button */}
        <div className="flex items-center gap-2 px-3 h-16 border-b border-neutral-200 dark:border-neutral-800">
          {/* Back to RustPress Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className={cn(
              'flex items-center justify-center rounded-lg transition-all',
              'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              sidebarCollapsed ? 'w-10 h-10' : 'w-9 h-9'
            )}
            title="Back to RustPress"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">Queue Manager</h1>
              <p className="text-xs text-neutral-500 truncate">RabbitMQ Admin</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Main */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Main
              </p>
            )}
            <div className="space-y-1">
              {mainNavItems.map(renderNavItem)}
            </div>
          </div>

          {/* Monitoring */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Monitoring
              </p>
            )}
            <div className="space-y-1">
              {monitoringNavItems.map(renderNavItem)}
            </div>
          </div>

          {/* Admin */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Admin
              </p>
            )}
            <div className="space-y-1">
              {adminNavItems.map(renderNavItem)}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white capitalize">
              {activeSection.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPublishOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Publish Message
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
              <HelpCircle className="w-5 h-5" />
            </button>

            <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
              <Bell className="w-5 h-5" />
              {unacknowledgedAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Publish Message Modal */}
      <PublishMessage
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
      />
    </div>
  );
}

// Settings Panel
function SettingsPanel() {
  const { refreshInterval, setRefreshInterval } = useQueueManagerStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          General Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Auto-refresh Interval
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
            >
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={0}>Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Connection Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Broker URL
            </label>
            <input
              type="text"
              defaultValue="amqp://localhost:5672"
              className="w-full h-10 px-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Management API URL
            </label>
            <input
              type="text"
              defaultValue="http://localhost:15672/api"
              className="w-full h-10 px-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          About
        </h3>

        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <p><strong>Visual Queue Manager</strong> v1.0.0</p>
          <p>A RabbitMQ-style message queue management interface</p>
          <p className="text-xs text-neutral-500 mt-4">
            Built with React, TypeScript, Zustand, and Framer Motion
          </p>
        </div>
      </div>
    </div>
  );
}

export default VisualQueueManager;
