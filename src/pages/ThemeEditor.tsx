import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Type, Layout, Layers, Code, Eye, EyeOff, Settings, Save, Download, Upload,
  Undo2, Redo2, Copy, Trash2, Plus, Minus, ChevronDown, ChevronRight, Monitor, Tablet,
  Smartphone, Maximize2, Minimize2, RefreshCw, Sliders, Grid, Image, FileText, Folder,
  FolderOpen, File, Search, X, Check, AlertCircle, Info, Wand2, Paintbrush, Droplet,
  Sun, Moon, Square, Lock, Unlock, Link, ZoomIn, ZoomOut, Pipette, Ruler, History,
  GitBranch, GitCommit, GitMerge, GitPullRequest, Package, Terminal, Play, Loader,
  MoreHorizontal, List, CheckCircle, AlertTriangle, ExternalLink, Send, Edit, Star,
  Heart, Tag, Globe, Server, Database, Shield, Clock, Calendar, Bookmark, FileCode,
  FilePlus, Hash, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Columns, LayoutTemplate,
  Component, Blocks, Activity, Split, PanelLeft, PanelRight, RotateCcw, Sparkles,
  CheckSquare, Circle, Github, Gitlab, Cloud,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ============================================
// TYPES & INTERFACES
// ============================================

interface GitRepository {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  url: string;
  owner: string;
  repo: string;
  connected: boolean;
}

interface GitReference {
  type: 'branch' | 'tag' | 'commit';
  name: string;
  sha?: string;
  date?: string;
  author?: string;
  message?: string;
}

interface CurrentTheme {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  screenshot: string;
  repository?: GitRepository;
  currentRef?: GitReference;
  isLocal: boolean;
  lastModified: string;
}

interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  author: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  borders: BorderConfig;
  shadows: ShadowConfig;
  animations: AnimationConfig;
  components: ComponentStyles;
  layout: LayoutConfig;
  templates: TemplateConfig[];
  pages: PageConfig[];
  customCSS: string;
  customJS: string;
}

interface PageConfig {
  id: string;
  name: string;
  slug: string;
  type: 'homepage' | 'page' | 'post' | 'archive' | 'category' | 'search' | '404' | 'single' | 'custom';
  template: string;
  html: string;
  css: string;
  js: string;
  isModified: boolean;
}

interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  background: { primary: string; secondary: string; tertiary: string };
  text: { primary: string; secondary: string; muted: string; inverse: string };
  border: { default: string; muted: string; strong: string };
}

interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

interface TypographyConfig {
  fontFamilies: { heading: string; body: string; mono: string };
  fontSizes: { xs: string; sm: string; base: string; lg: string; xl: string; '2xl': string; '3xl': string; '4xl': string; '5xl': string; '6xl': string };
  fontWeights: { thin: number; light: number; normal: number; medium: number; semibold: number; bold: number; extrabold: number };
  lineHeights: { tight: string; snug: string; normal: string; relaxed: string; loose: string };
  letterSpacing: { tighter: string; tight: string; normal: string; wide: string; wider: string };
}

interface SpacingConfig {
  baseUnit: number;
  scale: Record<string, string>;
}

interface BorderConfig {
  radii: { none: string; sm: string; md: string; lg: string; xl: string; '2xl': string; full: string };
  widths: { none: string; thin: string; medium: string; thick: string };
}

interface ShadowConfig {
  none: string; sm: string; md: string; lg: string; xl: string; '2xl': string; inner: string;
}

interface AnimationConfig {
  durations: { fast: string; normal: string; slow: string };
  easings: { linear: string; easeIn: string; easeOut: string; easeInOut: string; bounce: string };
}

interface ComponentStyles {
  button: Record<string, any>;
  input: Record<string, any>;
  card: Record<string, any>;
  modal: Record<string, any>;
  dropdown: Record<string, any>;
  table: Record<string, any>;
  tabs: Record<string, any>;
  badge: Record<string, any>;
  alert: Record<string, any>;
  tooltip: Record<string, any>;
}

interface LayoutConfig {
  container: { maxWidth: string; padding: string };
  header: { height: string; sticky: boolean };
  sidebar: { width: string; collapsedWidth: string };
  footer: { height: string };
  breakpoints: { sm: string; md: string; lg: string; xl: string; '2xl': string };
}

interface TemplateConfig {
  id: string;
  name: string;
  type: 'homepage' | 'page' | 'post' | 'archive' | 'category' | 'search' | '404' | 'custom';
  html: string;
  css: string;
  sections: TemplateSection[];
}

interface TemplateSection {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: TemplateSection[];
}

interface StagingChange {
  id: string;
  type: 'css' | 'html' | 'js' | 'config';
  page?: string;
  description: string;
  timestamp: string;
  diff?: string;
  committed: boolean;
}

type EditorTab = 'design' | 'pages' | 'components' | 'templates' | 'code' | 'assets' | 'git' | 'settings';
type DevicePreview = 'desktop' | 'tablet' | 'mobile';
type EditorMode = 'production' | 'staging';

// ============================================
// DEFAULT VALUES
// ============================================

const defaultColorScale = (baseHue: number): ColorScale => ({
  50: `hsl(${baseHue}, 100%, 97%)`,
  100: `hsl(${baseHue}, 96%, 93%)`,
  200: `hsl(${baseHue}, 94%, 86%)`,
  300: `hsl(${baseHue}, 92%, 76%)`,
  400: `hsl(${baseHue}, 90%, 64%)`,
  500: `hsl(${baseHue}, 88%, 50%)`,
  600: `hsl(${baseHue}, 86%, 42%)`,
  700: `hsl(${baseHue}, 84%, 35%)`,
  800: `hsl(${baseHue}, 82%, 28%)`,
  900: `hsl(${baseHue}, 80%, 22%)`,
  950: `hsl(${baseHue}, 78%, 12%)`,
});

const defaultCurrentTheme: CurrentTheme = {
  id: 'rustpress-developer',
  name: 'RustPress Developer',
  version: '2.0.0',
  author: 'RustPress Team',
  description: 'The default professional theme for RustPress CMS',
  screenshot: '/themes/developer/screenshot.png',
  repository: {
    provider: 'github',
    url: 'https://github.com/rustpress-net/themes',
    owner: 'rustpress-net',
    repo: 'themes',
    connected: true,
  },
  currentRef: {
    type: 'branch',
    name: 'main',
    sha: 'a1b2c3d4e5f6',
    date: '2025-01-10',
    author: 'RustPress Team',
    message: 'feat: update color scheme',
  },
  isLocal: false,
  lastModified: '2025-01-10T14:30:00Z',
};

const defaultPages: PageConfig[] = [
  { id: 'home', name: 'Homepage', slug: '/', type: 'homepage', template: 'homepage', html: '', css: '', js: '', isModified: false },
  { id: 'about', name: 'About', slug: '/about', type: 'page', template: 'default', html: '', css: '', js: '', isModified: false },
  { id: 'contact', name: 'Contact', slug: '/contact', type: 'page', template: 'contact', html: '', css: '', js: '', isModified: false },
  { id: 'blog', name: 'Blog', slug: '/blog', type: 'archive', template: 'archive', html: '', css: '', js: '', isModified: false },
  { id: 'single-post', name: 'Single Post', slug: '/blog/:slug', type: 'single', template: 'single', html: '', css: '', js: '', isModified: false },
  { id: 'category', name: 'Category', slug: '/category/:slug', type: 'category', template: 'category', html: '', css: '', js: '', isModified: false },
  { id: 'search', name: 'Search Results', slug: '/search', type: 'search', template: 'search', html: '', css: '', js: '', isModified: false },
  { id: '404', name: '404 Not Found', slug: '/404', type: '404', template: '404', html: '', css: '', js: '', isModified: false },
];

const defaultTheme: ThemeConfig = {
  id: 'default',
  name: 'Default Theme',
  version: '1.0.0',
  author: 'RustPress',
  colors: {
    primary: defaultColorScale(220),
    secondary: defaultColorScale(260),
    accent: defaultColorScale(330),
    neutral: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
    success: defaultColorScale(142),
    warning: defaultColorScale(38),
    error: defaultColorScale(0),
    info: defaultColorScale(200),
    background: { primary: '#ffffff', secondary: '#f8fafc', tertiary: '#f1f5f9' },
    text: { primary: '#0f172a', secondary: '#475569', muted: '#94a3b8', inverse: '#ffffff' },
    border: { default: '#e2e8f0', muted: '#f1f5f9', strong: '#cbd5e1' },
  },
  typography: {
    fontFamilies: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
    fontSizes: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem' },
    fontWeights: { thin: 100, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    lineHeights: { tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2' },
    letterSpacing: { tighter: '-0.05em', tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' },
  },
  spacing: {
    baseUnit: 4,
    scale: { '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem', '8': '2rem', '10': '2.5rem', '12': '3rem', '16': '4rem', '20': '5rem', '24': '6rem', '32': '8rem' },
  },
  borders: {
    radii: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
    widths: { none: '0', thin: '1px', medium: '2px', thick: '4px' },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  animations: {
    durations: { fast: '150ms', normal: '300ms', slow: '500ms' },
    easings: { linear: 'linear', easeIn: 'cubic-bezier(0.4, 0, 1, 1)', easeOut: 'cubic-bezier(0, 0, 0.2, 1)', easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  },
  components: {
    button: { borderRadius: 'md', padding: '0.5rem 1rem', fontWeight: 500 },
    input: { borderRadius: 'md', borderWidth: '1px', padding: '0.5rem 0.75rem' },
    card: { borderRadius: 'lg', padding: '1.5rem', shadow: 'md' },
    modal: { borderRadius: 'xl', padding: '1.5rem', shadow: '2xl' },
    dropdown: { borderRadius: 'lg', shadow: 'lg' },
    table: { borderRadius: 'lg', headerBg: 'neutral.100' },
    tabs: { borderRadius: 'md' },
    badge: { borderRadius: 'full', padding: '0.25rem 0.75rem' },
    alert: { borderRadius: 'lg', padding: '1rem' },
    tooltip: { borderRadius: 'md', padding: '0.5rem 0.75rem' },
  },
  layout: {
    container: { maxWidth: '1280px', padding: '1rem' },
    header: { height: '64px', sticky: true },
    sidebar: { width: '280px', collapsedWidth: '64px' },
    footer: { height: '80px' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
  },
  templates: [],
  pages: defaultPages,
  customCSS: '',
  customJS: '',
};

// ============================================
// UTILITY COMPONENTS
// ============================================

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const presetColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db',
    '#e5e7eb', '#f3f4f6', '#f9fafb', '#ffffff',
  ];

  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: color }}
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="flex-1 px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <input
              type="color"
              value={color.startsWith('#') ? color : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-32 rounded-lg cursor-pointer"
            />
            <div className="grid grid-cols-5 gap-1 mt-3">
              {presetColors.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { onChange(preset); setIsOpen(false); }}
                  className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SliderInputProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ value, min, max, step = 1, onChange, label, unit = '' }) => (
  <div>
    {label && (
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{value}{unit}</span>
      </div>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

// ============================================
// GIT INTEGRATION PANEL
// ============================================

interface GitPanelProps {
  currentTheme: CurrentTheme;
  stagingChanges: StagingChange[];
  onConnect: (provider: string) => void;
  onSwitchRef: (ref: GitReference) => void;
  onCommit: (message: string) => void;
  onPush: () => void;
  onPull: () => void;
  onDiscard: (changeId: string) => void;
}

const GitPanel: React.FC<GitPanelProps> = ({
  currentTheme,
  stagingChanges,
  onConnect,
  onSwitchRef,
  onCommit,
  onPush,
  onPull,
  onDiscard,
}) => {
  const [activeTab, setActiveTab] = useState<'repository' | 'changes' | 'history'>('repository');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedRef, setSelectedRef] = useState<GitReference | null>(currentTheme.currentRef || null);

  const branches: GitReference[] = [
    { type: 'branch', name: 'main', sha: 'a1b2c3d', date: '2025-01-10', author: 'Team', message: 'feat: update colors' },
    { type: 'branch', name: 'develop', sha: 'e5f6g7h', date: '2025-01-09', author: 'Dev', message: 'wip: new features' },
    { type: 'branch', name: 'feature/dark-mode', sha: 'i8j9k0l', date: '2025-01-08', author: 'Dev', message: 'feat: dark mode' },
  ];

  const tags: GitReference[] = [
    { type: 'tag', name: 'v2.0.0', sha: 'a1b2c3d', date: '2025-01-01' },
    { type: 'tag', name: 'v1.5.0', sha: 'm1n2o3p', date: '2024-12-15' },
    { type: 'tag', name: 'v1.0.0', sha: 'q4r5s6t', date: '2024-11-01' },
  ];

  const commits: GitReference[] = [
    { type: 'commit', name: 'a1b2c3d', sha: 'a1b2c3d', date: '2025-01-10', author: 'RustPress Team', message: 'feat: update color scheme' },
    { type: 'commit', name: 'e5f6g7h', sha: 'e5f6g7h', date: '2025-01-09', author: 'Developer', message: 'fix: typography issues' },
    { type: 'commit', name: 'i8j9k0l', sha: 'i8j9k0l', date: '2025-01-08', author: 'Designer', message: 'style: improve spacing' },
  ];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'gitlab': return <Gitlab className="w-5 h-5" />;
      case 'bitbucket': return <Cloud className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Active Theme Notice */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Editing Active Theme
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You are editing <strong>{currentTheme.name}</strong> which is currently active on your site.
              Changes in staging mode won't affect your live site until you publish them.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'repository', label: 'Repository', icon: GitBranch },
          { id: 'changes', label: 'Staging', icon: FileCode, badge: stagingChanges.filter(c => !c.committed).length },
          { id: 'history', label: 'History', icon: History },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Repository Tab */}
      {activeTab === 'repository' && (
        <div className="flex-1 overflow-auto space-y-6">
          {/* Connection Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentTheme.repository && getProviderIcon(currentTheme.repository.provider)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {currentTheme.repository?.connected ? `${currentTheme.repository.owner}/${currentTheme.repository.repo}` : 'Not Connected'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentTheme.repository?.connected ? currentTheme.repository.url : 'Connect a git repository to sync your theme'}
                  </p>
                </div>
              </div>
              {currentTheme.repository?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Connected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {['github', 'gitlab', 'bitbucket'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => onConnect(provider)}
                      className="p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors"
                    >
                      {getProviderIcon(provider)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {currentTheme.repository?.connected && (
              <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onPull}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ArrowDown className="w-4 h-4" /> Pull
                </button>
                <button
                  onClick={onPush}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <ArrowUp className="w-4 h-4" /> Push
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <RefreshCw className="w-4 h-4" /> Sync
                </button>
              </div>
            )}
          </div>

          {/* Current Reference */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Reference</h3>
            {currentTheme.currentRef && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {currentTheme.currentRef.type === 'branch' && <GitBranch className="w-4 h-4 text-blue-600" />}
                  {currentTheme.currentRef.type === 'tag' && <Tag className="w-4 h-4 text-blue-600" />}
                  {currentTheme.currentRef.type === 'commit' && <GitCommit className="w-4 h-4 text-blue-600" />}
                  <span className="font-medium text-blue-800 dark:text-blue-300">{currentTheme.currentRef.name}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">{currentTheme.currentRef.sha?.slice(0, 7)}</span>
                </div>
                {currentTheme.currentRef.message && (
                  <p className="text-sm text-blue-700 dark:text-blue-300">{currentTheme.currentRef.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Branches */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Branches</h3>
            <div className="space-y-2">
              {branches.map((branch) => (
                <button
                  key={branch.name}
                  onClick={() => { setSelectedRef(branch); onSwitchRef(branch); }}
                  className={clsx(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left',
                    selectedRef?.name === branch.name && selectedRef?.type === 'branch'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{branch.name}</span>
                      <p className="text-xs text-gray-500">{branch.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{branch.sha?.slice(0, 7)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="space-y-2">
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => { setSelectedRef(tag); onSwitchRef(tag); }}
                  className={clsx(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left',
                    selectedRef?.name === tag.name && selectedRef?.type === 'tag'
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{tag.date}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staging Changes Tab */}
      {activeTab === 'changes' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Uncommitted Changes */}
          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Uncommitted Changes ({stagingChanges.filter(c => !c.committed).length})
            </h3>
            {stagingChanges.filter(c => !c.committed).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No uncommitted changes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stagingChanges.filter(c => !c.committed).map((change) => (
                  <div
                    key={change.id}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {change.type === 'css' && <Palette className="w-4 h-4 text-blue-500" />}
                        {change.type === 'html' && <Code className="w-4 h-4 text-orange-500" />}
                        {change.type === 'js' && <FileCode className="w-4 h-4 text-yellow-500" />}
                        {change.type === 'config' && <Settings className="w-4 h-4 text-gray-500" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{change.description}</span>
                      </div>
                      <button
                        onClick={() => onDiscard(change.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {change.page && (
                      <p className="text-xs text-gray-500">Page: {change.page}</p>
                    )}
                    <p className="text-xs text-gray-400">{change.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commit Form */}
          {stagingChanges.filter(c => !c.committed).length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commit Message</h4>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none h-20"
              />
              <button
                onClick={() => { onCommit(commitMessage); setCommitMessage(''); }}
                disabled={!commitMessage.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitCommit className="w-4 h-4" />
                Commit Changes
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-auto space-y-2">
          {commits.map((commit, i) => (
            <div
              key={commit.sha}
              className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <GitCommit className="w-4 h-4 text-blue-600" />
                  </div>
                  {i < commits.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{commit.author}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-400 font-mono">{commit.sha?.slice(0, 7)}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-400">{commit.date}</span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// PAGE CODE EDITOR
// ============================================

interface PageCodeEditorProps {
  pages: PageConfig[];
  onPageChange: (pageId: string, updates: Partial<PageConfig>) => void;
  onAddPage: (page: PageConfig) => void;
  onDeletePage: (pageId: string) => void;
  theme: ThemeConfig;
}

const PageCodeEditor: React.FC<PageCodeEditorProps> = ({
  pages,
  onPageChange,
  onAddPage,
  onDeletePage,
  theme,
}) => {
  const [selectedPage, setSelectedPage] = useState<string>(pages[0]?.id || '');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageType, setNewPageType] = useState<PageConfig['type']>('page');

  const currentPage = pages.find(p => p.id === selectedPage);

  const pageTypeIcons: Record<PageConfig['type'], React.ReactNode> = {
    homepage: <Home className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />,
    post: <Edit className="w-4 h-4" />,
    archive: <List className="w-4 h-4" />,
    category: <Folder className="w-4 h-4" />,
    search: <Search className="w-4 h-4" />,
    '404': <AlertTriangle className="w-4 h-4" />,
    single: <File className="w-4 h-4" />,
    custom: <Sparkles className="w-4 h-4" />,
  };

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const newPage: PageConfig = {
      id: `page-${Date.now()}`,
      name: newPageName,
      slug: `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`,
      type: newPageType,
      template: 'default',
      html: getDefaultHTML(newPageType),
      css: getDefaultCSS(),
      js: '',
      isModified: false,
    };
    onAddPage(newPage);
    setNewPageName('');
    setShowAddPage(false);
    setSelectedPage(newPage.id);
  };

  const getDefaultHTML = (type: PageConfig['type']) => {
    return `<!-- ${type.charAt(0).toUpperCase() + type.slice(1)} Template -->
<div class="page-container">
  <header class="page-header">
    <h1>{{title}}</h1>
  </header>

  <main class="page-content">
    {{content}}
  </main>

  <footer class="page-footer">
    <!-- Footer content -->
  </footer>
</div>`;
  };

  const getDefaultCSS = () => {
    return `.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-text-primary);
}

.page-content {
  min-height: 60vh;
}

.page-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}`;
  };

  return (
    <div className="h-full flex">
      {/* Pages Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Pages</h3>
            <button
              onClick={() => setShowAddPage(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-1',
                selectedPage === page.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className="text-gray-400">{pageTypeIcons[page.type]}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{page.name}</span>
                <span className="text-xs text-gray-500 truncate block">{page.slug}</span>
              </div>
              {page.isModified && (
                <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentPage ? (
          <>
            {/* Page Info Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{pageTypeIcons[currentPage.type]}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{currentPage.name}</h3>
                  <p className="text-sm text-gray-500">{currentPage.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeletePage(currentPage.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'html', label: 'HTML', icon: Code },
                { id: 'css', label: 'CSS', icon: Palette },
                { id: 'js', label: 'JavaScript', icon: FileCode },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveCodeTab(id as any)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeCodeTab === id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 min-h-0">
              <textarea
                value={
                  activeCodeTab === 'html' ? currentPage.html :
                  activeCodeTab === 'css' ? currentPage.css :
                  currentPage.js
                }
                onChange={(e) => {
                  onPageChange(currentPage.id, {
                    [activeCodeTab]: e.target.value,
                    isModified: true,
                  });
                }}
                placeholder={`Enter ${activeCodeTab.toUpperCase()} code for this page...`}
                className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a page to edit</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Page Modal */}
      <AnimatePresence>
        {showAddPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowAddPage(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Page</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Page Name
                  </label>
                  <input
                    type="text"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="My New Page"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Page Type
                  </label>
                  <select
                    value={newPageType}
                    onChange={(e) => setNewPageType(e.target.value as PageConfig['type'])}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <option value="page">Standard Page</option>
                    <option value="post">Blog Post</option>
                    <option value="archive">Archive</option>
                    <option value="category">Category</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddPage(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPage}
                    disabled={!newPageName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Page
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Placeholder icon components
const Home: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

// ============================================
// COLOR PALETTE EDITOR
// ============================================

interface ColorPaletteEditorProps {
  colors: ColorPalette;
  onChange: (colors: ColorPalette) => void;
}

const ColorPaletteEditor: React.FC<ColorPaletteEditorProps> = ({ colors, onChange }) => {
  const [activeScale, setActiveScale] = useState<keyof ColorPalette>('primary');

  const colorScales: (keyof ColorPalette)[] = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error', 'info'];
  const scaleKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

  const updateScaleColor = (scale: keyof ColorPalette, shade: string, color: string) => {
    const scaleColors = colors[scale];
    if (typeof scaleColors === 'object' && shade in scaleColors) {
      onChange({ ...colors, [scale]: { ...scaleColors, [shade]: color } });
    }
  };

  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const generateScale = (baseColor: string): ColorScale => {
    const hsl = hexToHSL(baseColor);
    return {
      50: `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, 97%)`,
      100: `hsl(${hsl.h}, ${Math.min(hsl.s + 8, 100)}%, 93%)`,
      200: `hsl(${hsl.h}, ${Math.min(hsl.s + 6, 100)}%, 86%)`,
      300: `hsl(${hsl.h}, ${Math.min(hsl.s + 4, 100)}%, 76%)`,
      400: `hsl(${hsl.h}, ${Math.min(hsl.s + 2, 100)}%, 64%)`,
      500: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      600: `hsl(${hsl.h}, ${Math.max(hsl.s - 2, 0)}%, ${Math.max(hsl.l - 8, 0)}%)`,
      700: `hsl(${hsl.h}, ${Math.max(hsl.s - 4, 0)}%, ${Math.max(hsl.l - 15, 0)}%)`,
      800: `hsl(${hsl.h}, ${Math.max(hsl.s - 6, 0)}%, ${Math.max(hsl.l - 22, 0)}%)`,
      900: `hsl(${hsl.h}, ${Math.max(hsl.s - 8, 0)}%, ${Math.max(hsl.l - 28, 0)}%)`,
      950: `hsl(${hsl.h}, ${Math.max(hsl.s - 10, 0)}%, ${Math.max(hsl.l - 38, 0)}%)`,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Color Scales</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {colorScales.map((scale) => (
            <button
              key={scale}
              onClick={() => setActiveScale(scale)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize',
                activeScale === scale
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {scale}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{activeScale} Scale</h4>
            <button
              onClick={() => {
                const base = (colors[activeScale] as ColorScale)?.['500'] || '#3b82f6';
                if (typeof colors[activeScale] === 'object' && '500' in (colors[activeScale] as any)) {
                  onChange({ ...colors, [activeScale]: generateScale(base) });
                }
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Wand2 className="w-3 h-3" />
              Auto Generate
            </button>
          </div>

          <div className="grid grid-cols-11 gap-1">
            {scaleKeys.map((shade) => {
              const scaleColors = colors[activeScale];
              if (typeof scaleColors !== 'object' || !(shade in scaleColors)) return null;
              const color = (scaleColors as ColorScale)[shade];
              return (
                <div key={shade} className="text-center">
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = color.startsWith('#') ? color : '#000000';
                      input.onchange = (e) => updateScaleColor(activeScale, shade, (e.target as HTMLInputElement).value);
                      input.click();
                    }}
                    className="w-full aspect-square rounded-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform mb-1"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  <span className="text-[10px] text-gray-500">{shade}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Semantic Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500">Backgrounds</h4>
            <ColorPicker color={colors.background.primary} onChange={(c) => onChange({ ...colors, background: { ...colors.background, primary: c } })} label="Primary" />
            <ColorPicker color={colors.background.secondary} onChange={(c) => onChange({ ...colors, background: { ...colors.background, secondary: c } })} label="Secondary" />
            <ColorPicker color={colors.background.tertiary} onChange={(c) => onChange({ ...colors, background: { ...colors.background, tertiary: c } })} label="Tertiary" />
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500">Text</h4>
            <ColorPicker color={colors.text.primary} onChange={(c) => onChange({ ...colors, text: { ...colors.text, primary: c } })} label="Primary" />
            <ColorPicker color={colors.text.secondary} onChange={(c) => onChange({ ...colors, text: { ...colors.text, secondary: c } })} label="Secondary" />
            <ColorPicker color={colors.text.muted} onChange={(c) => onChange({ ...colors, text: { ...colors.text, muted: c } })} label="Muted" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TYPOGRAPHY EDITOR
// ============================================

interface TypographyEditorProps {
  typography: TypographyConfig;
  onChange: (typography: TypographyConfig) => void;
}

const TypographyEditor: React.FC<TypographyEditorProps> = ({ typography, onChange }) => {
  const fontOptions = [
    { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
    { value: 'Roboto, system-ui, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, system-ui, sans-serif', label: 'Open Sans' },
    { value: 'Lato, system-ui, sans-serif', label: 'Lato' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
    { value: 'Fira Code, monospace', label: 'Fira Code' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Font Families</h3>
        <div className="space-y-4">
          {(['heading', 'body', 'mono'] as const).map((type) => (
            <div key={type}>
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{type}</label>
              <select
                value={typography.fontFamilies[type]}
                onChange={(e) => onChange({ ...typography, fontFamilies: { ...typography.fontFamilies, [type]: e.target.value } })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {fontOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-2 text-2xl" style={{ fontFamily: typography.fontFamilies[type] }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Font Sizes</h3>
        <div className="space-y-2">
          {Object.entries(typography.fontSizes).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-12 text-xs font-medium text-gray-500">{key}</span>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange({ ...typography, fontSizes: { ...typography.fontSizes, [key]: e.target.value } })}
                className="w-24 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
              />
              <span style={{ fontSize: value }} className="text-gray-700 dark:text-gray-300">Sample Text</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// LIVE PREVIEW WITH FULL WEBSITE
// ============================================

interface LivePreviewProps {
  theme: ThemeConfig;
  device: DevicePreview;
  onDeviceChange: (device: DevicePreview) => void;
  mode: EditorMode;
  selectedPage?: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ theme, device, onDeviceChange, mode, selectedPage }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState('/');

  const generatePreviewCSS = () => {
    return `
      :root {
        --color-primary: ${theme.colors.primary[500]};
        --color-secondary: ${theme.colors.secondary[500]};
        --color-background: ${theme.colors.background.primary};
        --color-text: ${theme.colors.text.primary};
        --color-text-secondary: ${theme.colors.text.secondary};
        --color-border: ${theme.colors.border.default};
        --font-heading: ${theme.typography.fontFamilies.heading};
        --font-body: ${theme.typography.fontFamilies.body};
        --radius-lg: ${theme.borders.radii.lg};
        --radius-xl: ${theme.borders.radii.xl};
      }

      body {
        font-family: var(--font-body);
        color: var(--color-text);
        background: var(--color-background);
        margin: 0;
        padding: 0;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-lg);
        border: none;
        cursor: pointer;
        font-weight: 500;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      ${theme.customCSS}
    `;
  };

  const currentPageConfig = theme.pages.find(p => p.slug === previewUrl) || theme.pages[0];

  const previewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${generatePreviewCSS()}</style>
        ${currentPageConfig?.css ? `<style>${currentPageConfig.css}</style>` : ''}
      </head>
      <body>
        <header style="padding: 1rem 2rem; border-bottom: 1px solid var(--color-border); background: var(--color-background);">
          <nav style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 1.5rem; font-weight: bold; font-family: var(--font-heading); color: var(--color-primary);">
              ${theme.name}
            </div>
            <div style="display: flex; gap: 2rem;">
              ${theme.pages.slice(0, 5).map(p => `
                <a href="${p.slug}"
                   onclick="event.preventDefault(); parent.postMessage({type: 'navigate', url: '${p.slug}'}, '*');"
                   style="text-decoration: none; color: var(--color-text); font-weight: 500; ${previewUrl === p.slug ? 'color: var(--color-primary);' : ''}">${p.name}</a>
              `).join('')}
            </div>
          </nav>
        </header>

        <main style="max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; min-height: 60vh;">
          ${currentPageConfig?.html || `
            <section style="text-align: center; margin-bottom: 4rem;">
              <h1 style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-text);">Welcome to ${theme.name}</h1>
              <p style="font-size: 1.25rem; color: var(--color-text-secondary); max-width: 600px; margin: 0 auto 2rem;">
                Build beautiful websites with RustPress theme customization tools.
              </p>
              <button class="btn-primary">Get Started</button>
            </section>

            <section style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
              ${[1, 2, 3].map(i => `
                <div style="padding: 2rem; background: ${theme.colors.background.secondary}; border-radius: var(--radius-xl); border: 1px solid var(--color-border);">
                  <h3 style="margin-bottom: 0.5rem; color: var(--color-text);">Feature ${i}</h3>
                  <p style="color: var(--color-text-secondary); margin: 0;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
              `).join('')}
            </section>
          `}
        </main>

        <footer style="background: ${theme.colors.neutral[900]}; color: white; padding: 2rem; text-align: center; margin-top: 4rem;">
          <p style="margin: 0;">&copy; 2025 ${theme.name}. All rights reserved.</p>
        </footer>

        ${currentPageConfig?.js ? `<script>${currentPageConfig.js}</script>` : ''}
        ${theme.customJS ? `<script>${theme.customJS}</script>` : ''}
      </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'navigate') {
        setPreviewUrl(e.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={clsx('flex flex-col', isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 dark:bg-gray-950' : 'h-full')}>
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Mode Indicator */}
          <div className={clsx(
            'px-3 py-1 rounded-full text-xs font-medium',
            mode === 'staging' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          )}>
            {mode === 'staging' ? 'Staging' : 'Production'}
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { device: 'desktop' as const, icon: Monitor },
              { device: 'tablet' as const, icon: Tablet },
              { device: 'mobile' as const, icon: Smartphone },
            ].map(({ device: d, icon: Icon }) => (
              <button
                key={d}
                onClick={() => onDeviceChange(d)}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  device === d ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* URL Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 border-none focus:outline-none"
            >
              {theme.pages.map((page) => (
                <option key={page.id} value={page.slug}>{page.name} ({page.slug})</option>
              ))}
            </select>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1 text-gray-500 hover:text-gray-700 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="p-1 text-gray-500 hover:text-gray-700 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-800 p-4 flex items-start justify-center">
        <div
          className="bg-white shadow-2xl transition-all duration-300 rounded-lg overflow-hidden"
          style={{
            width: device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px',
            maxWidth: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <iframe
            srcDoc={previewHTML}
            className="w-full border-0"
            style={{ height: '800px' }}
            title="Theme Preview"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN THEME EDITOR COMPONENT
// ============================================

const ThemeEditor: React.FC = () => {
  const [currentTheme] = useState<CurrentTheme>(defaultCurrentTheme);
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [activeTab, setActiveTab] = useState<EditorTab>('design');
  const [designPanel, setDesignPanel] = useState<'colors' | 'typography' | 'spacing' | 'borders' | 'shadows'>('colors');
  const [previewDevice, setPreviewDevice] = useState<DevicePreview>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('staging');
  const [stagingChanges, setStagingChanges] = useState<StagingChange[]>([]);

  // History for undo/redo
  const [history, setHistory] = useState<ThemeConfig[]>([defaultTheme]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addStagingChange = (change: Omit<StagingChange, 'id' | 'timestamp' | 'committed'>) => {
    setStagingChanges(prev => [...prev, {
      ...change,
      id: `change-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      committed: false,
    }]);
  };

  const updateTheme = useCallback((updates: Partial<ThemeConfig>, description?: string) => {
    setTheme(prev => {
      const newTheme = { ...prev, ...updates };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newTheme);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      if (description) {
        addStagingChange({ type: 'config', description });
      }
      return newTheme;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTheme(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTheme(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const saveTheme = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Theme saved successfully!');
  };

  const exportTheme = () => {
    const json = JSON.stringify(theme, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Theme exported!');
  };

  const handlePageChange = (pageId: string, updates: Partial<PageConfig>) => {
    setTheme(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, ...updates } : p),
    }));
    if (updates.html || updates.css || updates.js) {
      const page = theme.pages.find(p => p.id === pageId);
      addStagingChange({
        type: updates.html ? 'html' : updates.css ? 'css' : 'js',
        page: page?.name,
        description: `Updated ${updates.html ? 'HTML' : updates.css ? 'CSS' : 'JavaScript'} for ${page?.name}`,
      });
    }
  };

  const handleAddPage = (page: PageConfig) => {
    setTheme(prev => ({ ...prev, pages: [...prev.pages, page] }));
    addStagingChange({ type: 'html', page: page.name, description: `Added new page: ${page.name}` });
  };

  const handleDeletePage = (pageId: string) => {
    const page = theme.pages.find(p => p.id === pageId);
    setTheme(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== pageId) }));
    if (page) {
      addStagingChange({ type: 'config', description: `Deleted page: ${page.name}` });
    }
  };

  const tabs: { id: EditorTab; label: string; icon: React.FC<any> }[] = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'components', label: 'Components', icon: Blocks },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'assets', label: 'Assets', icon: Image },
    { id: 'git', label: 'Git', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const designPanels: { id: typeof designPanel; label: string; icon: React.FC<any> }[] = [
    { id: 'colors', label: 'Colors', icon: Droplet },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'spacing', label: 'Spacing', icon: Ruler },
    { id: 'borders', label: 'Borders', icon: Square },
    { id: 'shadows', label: 'Shadows', icon: Layers },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Theme Editor</h1>
          </div>
          <span className="text-sm text-gray-500">|</span>
          {/* Active Theme Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Active Theme</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTheme.name}</span>
              <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">v{currentTheme.version}</span>
            </div>
            {currentTheme.repository?.connected && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <GitBranch className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{currentTheme.currentRef?.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setEditorMode('staging')}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                editorMode === 'staging' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Staging
            </button>
            <button
              onClick={() => setEditorMode('production')}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                editorMode === 'production' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Production
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* Undo/Redo */}
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Redo2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* Toggle Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              showPreview ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">Preview</span>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* Export */}
          <button onClick={exportTheme} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>

          {/* Save */}
          <button
            onClick={saveTheme}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="text-sm">Save Theme</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tabs */}
        <div className="w-16 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-colors relative',
                activeTab === id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              title={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{label}</span>
              {id === 'git' && stagingChanges.filter(c => !c.committed).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Editor Panel */}
        <div className={clsx('flex-1 flex overflow-hidden', showPreview ? 'w-1/2' : 'w-full')}>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Design Sub-tabs */}
            {activeTab === 'design' && (
              <div className="flex items-center gap-1 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                {designPanels.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setDesignPanel(id)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                      designPanel === id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'design' && (
                <>
                  {designPanel === 'colors' && (
                    <ColorPaletteEditor colors={theme.colors} onChange={(colors) => updateTheme({ colors }, 'Updated color palette')} />
                  )}
                  {designPanel === 'typography' && (
                    <TypographyEditor typography={theme.typography} onChange={(typography) => updateTheme({ typography }, 'Updated typography')} />
                  )}
                  {designPanel === 'spacing' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Spacing Scale</h3>
                      <SliderInput value={theme.spacing.baseUnit} min={1} max={8} onChange={(v) => updateTheme({ spacing: { ...theme.spacing, baseUnit: v } }, 'Updated base spacing unit')} label="Base Unit" unit="px" />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'pages' && (
                <PageCodeEditor
                  pages={theme.pages}
                  onPageChange={handlePageChange}
                  onAddPage={handleAddPage}
                  onDeletePage={handleDeletePage}
                  theme={theme}
                />
              )}

              {activeTab === 'code' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded-lg">
                      <Palette className="w-4 h-4" />
                      Global CSS
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      <FileCode className="w-4 h-4" />
                      Global JS
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      <Hash className="w-4 h-4" />
                      CSS Variables
                    </button>
                  </div>
                  <textarea
                    value={theme.customCSS}
                    onChange={(e) => updateTheme({ customCSS: e.target.value }, 'Updated global CSS')}
                    placeholder="/* Write global CSS styles here */"
                    className="flex-1 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    spellCheck={false}
                  />
                </div>
              )}

              {activeTab === 'git' && (
                <GitPanel
                  currentTheme={currentTheme}
                  stagingChanges={stagingChanges}
                  onConnect={(provider) => toast.success(`Connecting to ${provider}...`)}
                  onSwitchRef={(ref) => toast.success(`Switched to ${ref.type} ${ref.name}`)}
                  onCommit={(msg) => {
                    setStagingChanges(prev => prev.map(c => ({ ...c, committed: true })));
                    toast.success(`Committed: ${msg}`);
                  }}
                  onPush={() => toast.success('Pushed to remote')}
                  onPull={() => toast.success('Pulled from remote')}
                  onDiscard={(id) => setStagingChanges(prev => prev.filter(c => c.id !== id))}
                />
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Theme Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme Name</label>
                        <input
                          type="text"
                          value={theme.name}
                          onChange={(e) => updateTheme({ name: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                          <input
                            type="text"
                            value={theme.version}
                            onChange={(e) => updateTheme({ version: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author</label>
                          <input
                            type="text"
                            value={theme.author}
                            onChange={(e) => updateTheme({ author: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Danger Zone</h3>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-800 dark:text-red-300">Reset Theme</h4>
                          <p className="text-sm text-red-600 dark:text-red-400">This will reset all theme settings to default values.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to reset all theme settings?')) {
                              setTheme(defaultTheme);
                              setHistory([defaultTheme]);
                              setHistoryIndex(0);
                              toast.success('Theme reset to defaults');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >
                          Reset Theme
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700">
            <LivePreview theme={theme} device={previewDevice} onDeviceChange={setPreviewDevice} mode={editorMode} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeEditor;
