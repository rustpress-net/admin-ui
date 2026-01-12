/**
 * FileTree - VS Code-like file explorer
 * Browses the RustPress project root
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  FileJson, FileCode, FileText, Image, Settings, Database,
  Package, Cog, Terminal, FileType
} from 'lucide-react';
import { listDirectory, type FileNode } from '../../services/fileSystemService';
import type { OpenFile } from './IDE';

// ============================================
// TYPES
// ============================================

interface FileTreeProps {
  onFileSelect: (path: string, name: string) => void;
  activeFilePath: string | null;
  openFiles: OpenFile[];
  searchQuery: string;
  /** Root path to browse (e.g., 'themes', 'functions', '' for project root) */
  rootPath?: string;
  /** Display label for the root folder */
  rootLabel?: string;
}

// ============================================
// HELPERS
// ============================================

function getFileIcon(name: string): React.ReactNode {
  const ext = name.split('.').pop()?.toLowerCase();
  const iconClass = "w-4 h-4";

  // Special files
  if (name === 'Cargo.toml' || name === 'package.json') {
    return <Package className={`${iconClass} text-orange-400`} />;
  }
  if (name === 'Cargo.lock' || name === 'package-lock.json') {
    return <FileText className={`${iconClass} text-gray-500`} />;
  }
  if (name.startsWith('.env')) {
    return <Cog className={`${iconClass} text-yellow-500`} />;
  }
  if (name === 'docker-compose.yml' || name === 'Dockerfile') {
    return <Terminal className={`${iconClass} text-blue-400`} />;
  }
  if (name.endsWith('.sql')) {
    return <Database className={`${iconClass} text-blue-500`} />;
  }

  switch (ext) {
    case 'json':
      return <FileJson className={`${iconClass} text-yellow-400`} />;
    case 'html':
    case 'htm':
      return <FileCode className={`${iconClass} text-orange-400`} />;
    case 'css':
    case 'scss':
      return <FileCode className={`${iconClass} text-blue-400`} />;
    case 'js':
    case 'jsx':
      return <FileCode className={`${iconClass} text-yellow-300`} />;
    case 'ts':
    case 'tsx':
      return <FileCode className={`${iconClass} text-blue-300`} />;
    case 'rs':
      return <FileCode className={`${iconClass} text-orange-500`} />;
    case 'toml':
      return <Settings className={`${iconClass} text-gray-400`} />;
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      return <Image className={`${iconClass} text-purple-400`} />;
    case 'md':
      return <FileText className={`${iconClass} text-gray-400`} />;
    case 'yml':
    case 'yaml':
      return <FileType className={`${iconClass} text-red-400`} />;
    default:
      return <File className={`${iconClass} text-gray-400`} />;
  }
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query) return nodes;

  const lowerQuery = query.toLowerCase();

  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        acc.push(node);
      }
    } else if (node.children) {
      const filteredChildren = filterTree(node.children, query);
      if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, []);
}

// ============================================
// TREE NODE COMPONENT
// ============================================

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  onFileSelect: (path: string, name: string) => void;
  activeFilePath: string | null;
  openFiles: OpenFile[];
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  onFileSelect,
  activeFilePath,
  openFiles,
  expandedFolders,
  toggleFolder
}) => {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isActive = node.path === activeFilePath;
  const isOpen = openFiles.some(f => f.path === node.path);
  const isModified = openFiles.find(f => f.path === node.path)?.isModified;

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.id);
    } else {
      onFileSelect(node.path, node.name);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm hover:bg-gray-700/50 transition-colors ${
          isActive ? 'bg-blue-600/30 text-blue-300' : isOpen ? 'text-white' : 'text-gray-400'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse for folders */}
        {isFolder ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )
        ) : (
          <span className="w-3.5" />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        {/* Name */}
        <span className="flex-1 truncate">{node.name}</span>

        {/* Modified indicator */}
        {isModified && (
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
        )}
      </button>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                activeFilePath={activeFilePath}
                openFiles={openFiles}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const FileTree: React.FC<FileTreeProps> = ({
  onFileSelect,
  activeFilePath,
  openFiles,
  searchQuery,
  rootPath = '',
  rootLabel = 'RustPress'
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['crates', 'themes', 'config', 'admin-ui', 'admin-ui/src', 'src'])
  );

  // Load file tree on mount or when rootPath changes
  useEffect(() => {
    async function loadFileTree() {
      setLoading(true);
      try {
        const tree = await listDirectory(rootPath);
        setFileTree(tree);
      } catch (error) {
        console.error('Error loading file tree:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFileTree();
  }, [rootPath]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredTree = useMemo(() => filterTree(fileTree, searchQuery), [fileTree, searchQuery]);

  if (loading) {
    return (
      <div className="py-4 px-3 text-sm text-gray-500 text-center">
        Loading files...
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {rootLabel}
      </div>
      {filteredTree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          activeFilePath={activeFilePath}
          openFiles={openFiles}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />
      ))}
      {filteredTree.length === 0 && searchQuery && (
        <div className="px-3 py-4 text-sm text-gray-500 text-center">
          No files match "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default FileTree;
