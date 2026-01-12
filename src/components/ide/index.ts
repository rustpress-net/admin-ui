/**
 * IDE Components - VS Code-like Code Editor
 * Complete feature set with 60+ enhancements
 */

// ============================================
// CORE COMPONENTS
// ============================================
export { IDE } from './IDE';
export { FileTree } from './FileTree';
export { EditorTabs } from './EditorTabs';
export { MonacoWrapper } from './MonacoWrapper';
export { GitPanel } from './GitPanel';
export { SettingsPanel } from './SettingsPanel';
export { StatusBar } from './StatusBar';

// ============================================
// FILE OPERATIONS
// ============================================
export { ContextMenu, getFileActions, getFolderActions } from './ContextMenu';
export { CreateFileModal } from './CreateFileModal';
export { ConfirmDialog } from './ConfirmDialog';

// ============================================
// SEARCH & NAVIGATION
// ============================================
export { GlobalSearch } from './GlobalSearch';
export { QuickOpen } from './QuickOpen';
export { CommandPalette, getDefaultCommands } from './CommandPalette';
export { GoToLineModal } from './GoToLineModal';
export { FindReplace } from './FindReplace';
export { Breadcrumbs } from './Breadcrumbs';
export { SymbolSearch } from './SymbolSearch';

// ============================================
// EDITOR FEATURES
// ============================================
export { EditorSettings, defaultEditorConfig } from './EditorSettings';
export { KeyboardShortcuts } from './KeyboardShortcuts';
export { SplitEditor } from './SplitEditor';
export { DiffView } from './DiffView';
export { ZenMode } from './ZenMode';
export { ColorPicker } from './ColorPicker';
export { ImagePreview } from './ImagePreview';

// ============================================
// PANELS & UI
// ============================================
export { Terminal } from './Terminal';
export { OutlinePanel } from './OutlinePanel';
export { ProblemsPanel } from './ProblemsPanel';
export { ActivityBar } from './ActivityBar';
export { NotificationsPanel, NotificationsContainer, NotificationToast } from './NotificationsPanel';
export { PanelPresets } from './PanelPresets';

// ============================================
// GIT & VERSION CONTROL
// ============================================
export { GitImport } from './GitImport';
export { FileHistory } from './FileHistory';

// ============================================
// EXTENSIONS & SNIPPETS
// ============================================
export { ExtensionsPanel } from './ExtensionsPanel';
export { SnippetsManager } from './SnippetsManager';

// ============================================
// ONBOARDING & WELCOME
// ============================================
export { WelcomeTab } from './WelcomeTab';
export { OnboardingWizard } from './OnboardingWizard';

// ============================================
// TYPES
// ============================================
export type { IDEProps, OpenFile } from './IDE';
export type { ContextMenuAction } from './ContextMenu';
export type { Command } from './CommandPalette';
export type { EditorConfig } from './EditorSettings';
export type { Snippet } from './SnippetsManager';
export type { Extension } from './ExtensionsPanel';
export type { Problem } from './ProblemsPanel';
export type { Notification } from './NotificationsPanel';
export type { WorkspaceSymbol } from './SymbolSearch';
export type { FileCommit } from './FileHistory';
export type { PanelLayout } from './PanelPresets';
export type { ActivityView } from './ActivityBar';
