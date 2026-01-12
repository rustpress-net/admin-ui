/**
 * IDE - VS Code-like Code Editor
 * Main container for the project IDE with file tree, editor, git, and settings
 * Browses and edits files from the RustPress project root
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, GitBranch, Settings, ChevronLeft, ChevronRight,
  Loader2, ArrowLeft, Code2, FolderOpen, Palette, Zap, Puzzle, Image,
  Search, Terminal, Pin, PinOff, X, Upload, FilePlus, FolderPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileTree } from './FileTree';
import { EditorTabs } from './EditorTabs';
import { MonacoWrapper } from './MonacoWrapper';
import { GitPanel } from './GitPanel';
import { SettingsPanel } from './SettingsPanel';
import { StatusBar } from './StatusBar';
import { ContextMenu, getFileActions, getFolderActions, type ContextMenuAction } from './ContextMenu';
import { CreateFileModal } from './CreateFileModal';
import { ConfirmDialog } from './ConfirmDialog';
import { GlobalSearch } from './GlobalSearch';
import { QuickOpen } from './QuickOpen';
import { CommandPalette, getDefaultCommands, type Command } from './CommandPalette';
import { GoToLineModal } from './GoToLineModal';
import { FindReplace } from './FindReplace';
import { Breadcrumbs } from './Breadcrumbs';
import { EditorSettings as EditorSettingsPanel, defaultEditorConfig, type EditorConfig } from './EditorSettings';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { readFile, writeFile, listDirectory, createFile, deleteFile, renameFile, getLanguageFromPath, type FileNode } from '../../services/fileSystemService';
import { toast } from 'react-hot-toast';

// ============================================
// TYPES
// ============================================

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  isModified: boolean;
  isPinned: boolean;
  cursorPosition: { line: number; column: number };
}

export interface IDEProps {
  projectName?: string;
  projectVersion?: string;
  initialFolder?: 'themes' | 'functions' | 'plugins' | 'assets';
}

type RightPanel = 'git' | 'settings' | 'search' | 'editor-settings' | null;

// Folder configuration
const FOLDERS = [
  { id: 'themes', label: 'Themes', icon: Palette, path: 'themes' },
  { id: 'functions', label: 'Functions', icon: Zap, path: 'functions' },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, path: 'plugins' },
  { id: 'assets', label: 'Assets', icon: Image, path: 'assets' },
] as const;

type FolderId = typeof FOLDERS[number]['id'];

// ============================================
// MAIN COMPONENT
// ============================================

export const IDE: React.FC<IDEProps> = ({
  projectName = 'RustPress',
  projectVersion = '1.0.0',
  initialFolder = 'themes'
}) => {
  // Active folder state
  const [activeFolder, setActiveFolder] = useState<FolderId>(initialFolder);
  const currentFolder = FOLDERS.find(f => f.id === activeFolder) || FOLDERS[0];

  // File state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // Layout state
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('git');
  const [rightPanelWidth, setRightPanelWidth] = useState(300);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Modal state
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [createFileType, setCreateFileType] = useState<'file' | 'folder'>('file');
  const [createFilePath, setCreateFilePath] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; actions: ContextMenuAction[] } | null>(null);

  // Editor config
  const [editorConfig, setEditorConfig] = useState<EditorConfig>(() => {
    const saved = localStorage.getItem('ide-editor-config');
    return saved ? { ...defaultEditorConfig, ...JSON.parse(saved) } : defaultEditorConfig;
  });

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  const navigate = useNavigate();

  // Get active file
  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Load file tree when folder changes
  useEffect(() => {
    const loadTree = async () => {
      try {
        const tree = await listDirectory(currentFolder.path);
        setFileTree(tree);
      } catch (error) {
        console.error('Error loading file tree:', error);
      }
    };
    loadTree();
  }, [currentFolder.path]);

  // Save editor config
  useEffect(() => {
    localStorage.setItem('ide-editor-config', JSON.stringify(editorConfig));
  }, [editorConfig]);

  // Auto-save functionality
  useEffect(() => {
    if (editorConfig.autoSave) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      const modifiedFiles = openFiles.filter(f => f.isModified);
      if (modifiedFiles.length > 0) {
        autoSaveTimer.current = setTimeout(() => {
          handleSave();
        }, editorConfig.autoSaveDelay);
      }
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [openFiles, editorConfig.autoSave, editorConfig.autoSaveDelay]);

  // Open a file
  const openFileHandler = useCallback(async (path: string, name: string, line?: number, column?: number) => {
    // Check if already open
    const existing = openFiles.find(f => f.path === path);
    if (existing) {
      setActiveFilePath(path);
      if (line) {
        setOpenFiles(prev => prev.map(f =>
          f.path === path ? { ...f, cursorPosition: { line, column: column || 1 } } : f
        ));
      }
      return;
    }

    // Load file content
    setIsLoadingFile(true);
    try {
      const fileData = await readFile(path);
      const newFile: OpenFile = {
        path,
        name,
        content: fileData.content,
        originalContent: fileData.content,
        language: fileData.language,
        isModified: false,
        isPinned: false,
        cursorPosition: { line: line || 1, column: column || 1 }
      };

      setOpenFiles(prev => [...prev, newFile]);
      setActiveFilePath(path);
      setRecentFiles(prev => [path, ...prev.filter(p => p !== path)].slice(0, 20));
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error(`Failed to open ${name}`);
    } finally {
      setIsLoadingFile(false);
    }
  }, [openFiles]);

  // Close a file
  const closeFile = useCallback((path: string) => {
    const fileIndex = openFiles.findIndex(f => f.path === path);
    if (fileIndex === -1) return;

    const file = openFiles[fileIndex];

    // Warn if modified
    if (file.isModified) {
      if (!confirm(`${file.name} has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    const newFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newFiles);

    // Update active file if needed
    if (activeFilePath === path) {
      if (newFiles.length > 0) {
        const newIndex = Math.min(fileIndex, newFiles.length - 1);
        setActiveFilePath(newFiles[newIndex].path);
      } else {
        setActiveFilePath(null);
      }
    }
  }, [openFiles, activeFilePath]);

  // Toggle pin status
  const togglePinFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, isPinned: !f.isPinned } : f
    ));
  }, []);

  // Update file content
  const updateFileContent = useCallback((path: string, content: string) => {
    setOpenFiles(prev => prev.map(f => {
      if (f.path !== path) return f;
      return {
        ...f,
        content,
        isModified: content !== f.originalContent
      };
    }));
  }, []);

  // Update cursor position
  const updateCursorPosition = useCallback((path: string, line: number, column: number) => {
    setOpenFiles(prev => prev.map(f => {
      if (f.path !== path) return f;
      return { ...f, cursorPosition: { line, column } };
    }));
  }, []);

  // Save all modified files
  const handleSave = useCallback(async () => {
    const modifiedFiles = openFiles.filter(f => f.isModified);
    if (modifiedFiles.length === 0) return;

    setIsSaving(true);
    try {
      const savePromises = modifiedFiles.map(file =>
        writeFile(file.path, file.content)
      );

      await Promise.all(savePromises);

      setOpenFiles(prev => prev.map(f => ({
        ...f,
        originalContent: f.content,
        isModified: false
      })));

      toast.success(`Saved ${modifiedFiles.length} file${modifiedFiles.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error saving files:', error);
      toast.error('Failed to save files');
    } finally {
      setIsSaving(false);
    }
  }, [openFiles]);

  // Create new file/folder
  const handleCreateFile = useCallback(async (name: string, type: 'file' | 'folder') => {
    const fullPath = createFilePath ? `${createFilePath}/${name}` : name;
    try {
      await createFile(fullPath, type);
      // Refresh file tree
      const tree = await listDirectory(currentFolder.path);
      setFileTree(tree);
      toast.success(`Created ${type}: ${name}`);
      if (type === 'file') {
        openFileHandler(fullPath, name);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error(`Failed to create ${type}`);
    }
  }, [createFilePath, currentFolder.path, openFileHandler]);

  // Delete file/folder
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.path);
      // Close if open
      closeFile(deleteTarget.path);
      // Refresh file tree
      const tree = await listDirectory(currentFolder.path);
      setFileTree(tree);
      toast.success(`Deleted ${deleteTarget.name}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete');
    }
    setDeleteTarget(null);
  }, [deleteTarget, currentFolder.path, closeFile]);

  // Go to line
  const handleGoToLine = useCallback((line: number, column?: number) => {
    if (activeFile) {
      setOpenFiles(prev => prev.map(f =>
        f.path === activeFile.path
          ? { ...f, cursorPosition: { line, column: column || 1 } }
          : f
      ));
    }
  }, [activeFile]);

  // Search in files (mock implementation)
  const searchInFiles = useCallback(async (query: string, options: any) => {
    // This would be implemented with actual file search
    // For now, return empty results
    return [];
  }, []);

  // Command palette commands
  const commands = useMemo<Command[]>(() => getDefaultCommands({
    onSave: handleSave,
    onOpenFile: () => setShowQuickOpen(true),
    onGlobalSearch: () => setRightPanel('search'),
    onGoToLine: () => setShowGoToLine(true),
    onToggleSidebar: () => setSidebarCollapsed(prev => !prev),
    onToggleMinimap: () => setEditorConfig(prev => ({ ...prev, minimap: !prev.minimap })),
    onToggleWordWrap: () => setEditorConfig(prev => ({ ...prev, wordWrap: !prev.wordWrap })),
    onZoomIn: () => setEditorConfig(prev => ({ ...prev, fontSize: Math.min(24, prev.fontSize + 1) })),
    onZoomOut: () => setEditorConfig(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) })),
    onResetZoom: () => setEditorConfig(prev => ({ ...prev, fontSize: 14 })),
    onSplitEditor: () => toast('Split editor coming soon'),
    onToggleGit: () => setRightPanel(prev => prev === 'git' ? null : 'git'),
    onToggleSettings: () => setRightPanel(prev => prev === 'settings' ? null : 'settings'),
    onFormatDocument: () => toast('Format document coming soon'),
    onToggleTheme: () => setEditorConfig(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    })),
    onShowKeyboardShortcuts: () => setShowKeyboardShortcuts(true),
  }), [handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Ctrl + S - Save
      if (isCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl + W - Close file
      else if (isCtrl && e.key === 'w') {
        e.preventDefault();
        if (activeFilePath) closeFile(activeFilePath);
      }
      // Ctrl + P - Quick open
      else if (isCtrl && e.key === 'p' && !isShift) {
        e.preventDefault();
        setShowQuickOpen(true);
      }
      // Ctrl + Shift + P - Command palette
      else if (isCtrl && isShift && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl + Shift + F - Global search
      else if (isCtrl && isShift && e.key === 'F') {
        e.preventDefault();
        setRightPanel('search');
      }
      // Ctrl + G - Go to line
      else if (isCtrl && e.key === 'g') {
        e.preventDefault();
        setShowGoToLine(true);
      }
      // Ctrl + F - Find in file
      else if (isCtrl && e.key === 'f' && !isShift) {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Ctrl + H - Find and replace
      else if (isCtrl && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Ctrl + B - Toggle sidebar
      else if (isCtrl && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Ctrl + + - Zoom in
      else if (isCtrl && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setEditorConfig(prev => ({ ...prev, fontSize: Math.min(24, prev.fontSize + 1) }));
      }
      // Ctrl + - - Zoom out
      else if (isCtrl && e.key === '-') {
        e.preventDefault();
        setEditorConfig(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) }));
      }
      // Ctrl + 0 - Reset zoom
      else if (isCtrl && e.key === '0') {
        e.preventDefault();
        setEditorConfig(prev => ({ ...prev, fontSize: 14 }));
      }
      // Ctrl + N - New file
      else if (isCtrl && e.key === 'n') {
        e.preventDefault();
        setCreateFileType('file');
        setCreateFilePath(currentFolder.path);
        setShowCreateFileModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, closeFile, activeFilePath, currentFolder.path]);

  // Count modified files
  const modifiedCount = openFiles.filter(f => f.isModified).length;

  // Sort files: pinned first, then by order
  const sortedFiles = useMemo(() => {
    return [...openFiles].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [openFiles]);

  // File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = reader.result as string;
        const path = `${currentFolder.path}/${file.name}`;
        try {
          await writeFile(path, content);
          const tree = await listDirectory(currentFolder.path);
          setFileTree(tree);
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  }, [currentFolder.path]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Back to Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-semibold">IDE</h1>
          </div>

          {/* Folder Tabs */}
          <div className="flex items-center gap-1 ml-2">
            {FOLDERS.map(folder => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {folder.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Button */}
          <button
            onClick={() => setShowQuickOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Quick Open (Ctrl+P)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-gray-700 rounded">⌘P</kbd>
          </button>

          {/* Git Branch */}
          <button
            onClick={() => setRightPanel('git')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>main</span>
          </button>

          {/* Loading indicator */}
          {isLoadingFile && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}

          {/* Modified indicator */}
          {modifiedCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              {modifiedCount} unsaved
            </span>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || modifiedCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              modifiedCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 48 : sidebarWidth }}
          className="bg-gray-850 border-r border-gray-700 flex flex-col"
          style={{ backgroundColor: '#1e1e2e' }}
        >
          {!sidebarCollapsed && (
            <>
              <div className="p-3 border-b border-gray-700">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setCreateFileType('file');
                      setCreateFilePath(currentFolder.path);
                      setShowCreateFileModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="New File"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCreateFileType('folder');
                      setCreateFilePath(currentFolder.path);
                      setShowCreateFileModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="New Folder"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <FileTree
                  onFileSelect={openFileHandler}
                  activeFilePath={activeFilePath}
                  openFiles={openFiles}
                  searchQuery={searchQuery}
                  rootPath={currentFolder.path}
                  rootLabel={currentFolder.label}
                />
              </div>
            </>
          )}

          {/* Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-700 border-t border-gray-700"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <ChevronLeft className="w-4 h-4 mx-auto" />
            )}
          </button>
        </motion.div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Breadcrumbs */}
          {activeFile && <Breadcrumbs path={activeFile.path} />}

          {/* Editor Tabs */}
          <EditorTabs
            files={sortedFiles}
            activeFilePath={activeFilePath}
            onSelectFile={setActiveFilePath}
            onCloseFile={closeFile}
            onPinFile={togglePinFile}
          />

          {/* Find/Replace Bar */}
          <FindReplace
            isOpen={showFindReplace}
            onClose={() => setShowFindReplace(false)}
            onFind={() => {}}
            onFindNext={() => {}}
            onFindPrevious={() => {}}
            onReplace={() => {}}
            onReplaceAll={() => {}}
          />

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <MonacoWrapper
                path={activeFile.path}
                content={activeFile.content}
                language={activeFile.language}
                onChange={(content) => updateFileContent(activeFile.path, content)}
                onCursorChange={(line, column) => updateCursorPosition(activeFile.path, line, column)}
                options={{
                  fontSize: editorConfig.fontSize,
                  fontFamily: editorConfig.fontFamily,
                  tabSize: editorConfig.tabSize,
                  wordWrap: editorConfig.wordWrap ? 'on' : 'off',
                  minimap: { enabled: editorConfig.minimap },
                  lineNumbers: editorConfig.lineNumbers ? 'on' : 'off',
                  matchBrackets: editorConfig.bracketMatching ? 'always' : 'never',
                  renderIndentGuides: editorConfig.indentGuides,
                }}
                cursorPosition={activeFile.cursorPosition}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg mb-2">No file open</p>
                  <p className="text-sm mb-4">Select a file from the sidebar to start editing</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+P</kbd>
                    <span>Quick Open</span>
                    <span className="mx-2">|</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+N</kbd>
                    <span>New File</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {rightPanel && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: rightPanelWidth }}
              exit={{ width: 0 }}
              className="bg-gray-850 border-l border-gray-700 flex flex-col overflow-hidden"
              style={{ backgroundColor: '#1e1e2e' }}
            >
              {/* Panel Tabs */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setRightPanel('git')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                    rightPanel === 'git'
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Git
                </button>
                <button
                  onClick={() => setRightPanel('search')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                    rightPanel === 'search'
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </button>
                <button
                  onClick={() => setRightPanel('editor-settings')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                    rightPanel === 'editor-settings'
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Editor
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-auto">
                {rightPanel === 'git' && (
                  <GitPanel
                    modifiedFiles={openFiles.filter(f => f.isModified).map(f => f.path)}
                  />
                )}
                {rightPanel === 'search' && (
                  <GlobalSearch
                    isOpen={true}
                    onClose={() => setRightPanel(null)}
                    onFileOpen={openFileHandler}
                    searchInFiles={searchInFiles}
                  />
                )}
                {rightPanel === 'editor-settings' && (
                  <EditorSettingsPanel
                    config={editorConfig}
                    onChange={(changes) => setEditorConfig(prev => ({ ...prev, ...changes }))}
                  />
                )}
                {rightPanel === 'settings' && (
                  <SettingsPanel />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel Toggle */}
        <div className="w-10 bg-gray-800 border-l border-gray-700 flex flex-col items-center py-2 gap-1">
          <button
            onClick={() => setRightPanel(rightPanel === 'git' ? null : 'git')}
            className={`p-2 rounded transition-colors ${
              rightPanel === 'git' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Git"
          >
            <GitBranch className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'search' ? null : 'search')}
            className={`p-2 rounded transition-colors ${
              rightPanel === 'search' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'editor-settings' ? null : 'editor-settings')}
            className={`p-2 rounded transition-colors ${
              rightPanel === 'editor-settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="p-2 rounded transition-colors text-gray-400 hover:text-white hover:bg-gray-700"
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        activeFile={activeFile}
        hasUnsavedChanges={modifiedCount > 0}
        editorConfig={editorConfig}
      />

      {/* Modals */}
      <QuickOpen
        isOpen={showQuickOpen}
        onClose={() => setShowQuickOpen(false)}
        onFileSelect={openFileHandler}
        files={fileTree}
        recentFiles={recentFiles}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      <GoToLineModal
        isOpen={showGoToLine}
        onClose={() => setShowGoToLine(false)}
        onGoToLine={handleGoToLine}
        currentLine={activeFile?.cursorPosition.line}
        totalLines={activeFile?.content.split('\n').length}
      />

      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      <CreateFileModal
        isOpen={showCreateFileModal}
        onClose={() => setShowCreateFileModal(false)}
        onCreate={handleCreateFile}
        type={createFileType}
        parentPath={createFilePath}
      />

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          actions={contextMenu.actions}
        />
      )}
    </div>
  );
};

export default IDE;
