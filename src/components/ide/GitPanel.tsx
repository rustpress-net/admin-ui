/**
 * GitPanel - Simplified Git controls for the IDE
 * Works with the RustPress project root
 */

import React, { useState } from 'react';
import {
  GitBranch, GitCommit, Upload, Download,
  RefreshCw, ChevronDown, File, Check, AlertCircle
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface GitPanelProps {
  modifiedFiles: string[];
}

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const GitPanel: React.FC<GitPanelProps> = ({
  modifiedFiles
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(modifiedFiles));

  // Git info for the RustPress project
  const gitInfo = {
    branch: 'main',
    remoteUrl: 'https://github.com/rustpress/rustpress.git',
    hasUncommittedChanges: modifiedFiles.length > 0
  };

  // Mock recent commits - in real implementation, fetch from backend
  const recentCommits: CommitInfo[] = [
    { hash: 'a1b2c3d', message: 'Update header styles', author: 'Developer', date: '2 hours ago' },
    { hash: 'e4f5g6h', message: 'Add footer widgets', author: 'Developer', date: '1 day ago' },
    { hash: 'i7j8k9l', message: 'Initial theme setup', author: 'Developer', date: '3 days ago' },
  ];

  const toggleFile = (path: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(modifiedFiles));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || selectedFiles.size === 0) return;

    setIsCommitting(true);
    // Simulate commit - in real implementation, call backend API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsCommitting(false);
    setCommitMessage('');
    // toast.success('Changes committed successfully');
  };

  const handlePush = async () => {
    setIsPushing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPushing(false);
    // toast.success('Pushed to remote');
  };

  const handlePull = async () => {
    setIsPulling(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPulling(false);
    // toast.success('Pulled from remote');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Branch Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Current Branch
          </h3>
          <button className="p-1 hover:bg-gray-700 rounded" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        <button className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-600">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">{gitInfo.branch}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Changes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Changes ({modifiedFiles.length})
          </h3>
          {modifiedFiles.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                All
              </button>
              <span className="text-gray-600">/</span>
              <button
                onClick={deselectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                None
              </button>
            </div>
          )}
        </div>

        {modifiedFiles.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500 bg-gray-800/50 rounded">
            <Check className="w-4 h-4 text-green-500" />
            No uncommitted changes
          </div>
        ) : (
          <div className="space-y-1 max-h-40 overflow-auto">
            {modifiedFiles.map(path => (
              <label
                key={path}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(path)}
                  onChange={() => toggleFile(path)}
                  className="w-3.5 h-3.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                />
                <File className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-gray-300 truncate flex-1">{path}</span>
                <span className="text-xs text-yellow-500">M</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Commit Section */}
      {modifiedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Commit
          </h3>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded resize-none focus:outline-none focus:border-blue-500"
            rows={3}
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || selectedFiles.size === 0 || isCommitting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
          >
            {isCommitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <GitCommit className="w-4 h-4" />
            )}
            Commit {selectedFiles.size > 0 && `(${selectedFiles.size})`}
          </button>
        </div>
      )}

      {/* Sync Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Sync
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePull}
            disabled={isPulling}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors"
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Pull
          </button>
          <button
            onClick={handlePush}
            disabled={isPushing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Push
          </button>
        </div>
      </div>

      {/* Recent Commits */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Commits
        </h3>
        <div className="space-y-1">
          {recentCommits.map(commit => (
            <div
              key={commit.hash}
              className="px-2 py-2 hover:bg-gray-800 rounded cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400">{commit.hash}</span>
                <span className="text-xs text-gray-500">{commit.date}</span>
              </div>
              <p className="text-xs text-gray-300 truncate mt-0.5">{commit.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remote Info */}
      {gitInfo.remoteUrl && (
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Remote: <span className="text-gray-400">{gitInfo.remoteUrl}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default GitPanel;
