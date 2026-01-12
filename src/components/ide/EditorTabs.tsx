/**
 * EditorTabs - Multi-tab file management like VS Code
 * Features: Pin tabs, drag-and-drop reorder, middle-click close
 */

import React, { useRef, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import type { OpenFile } from './IDE';

// ============================================
// TYPES
// ============================================

interface EditorTabsProps {
  files: OpenFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onPinFile?: (path: string) => void;
  onReorderFiles?: (files: OpenFile[]) => void;
}

// ============================================
// HELPERS
// ============================================

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json': return 'text-yellow-400';
    case 'html': case 'htm': return 'text-orange-400';
    case 'css': case 'scss': return 'text-blue-400';
    case 'js': case 'ts': return 'text-yellow-300';
    default: return 'text-gray-400';
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EditorTabs: React.FC<EditorTabsProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCloseFile,
  onPinFile,
  onReorderFiles
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  // Check for overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
      }
    };

    checkOverflow();
    const container = containerRef.current;
    container?.addEventListener('scroll', checkOverflow);
    window.addEventListener('resize', checkOverflow);

    return () => {
      container?.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [files]);

  // Scroll to active tab
  useEffect(() => {
    if (activeFilePath && containerRef.current) {
      const activeTab = containerRef.current.querySelector(`[data-path="${activeFilePath}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeFilePath]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMiddleClick = (e: React.MouseEvent, path: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onCloseFile(path);
    }
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedTab(path);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', path);
  };

  const handleDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== path) {
      setDragOverTab(path);
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetPath || !onReorderFiles) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    const draggedFile = files.find(f => f.path === draggedTab);
    const targetFile = files.find(f => f.path === targetPath);

    if (!draggedFile || !targetFile) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    // Don't allow moving unpinned tabs before pinned tabs
    if (targetFile.isPinned && !draggedFile.isPinned) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    const newFiles = [...files];
    const draggedIndex = newFiles.findIndex(f => f.path === draggedTab);
    const targetIndex = newFiles.findIndex(f => f.path === targetPath);

    newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);

    onReorderFiles(newFiles);
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  if (files.length === 0) {
    return (
      <div className="h-9 bg-gray-800 border-b border-gray-700" />
    );
  }

  return (
    <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center relative">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-full px-1 bg-gray-800 hover:bg-gray-700 border-r border-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {files.map(file => {
          const isActive = file.path === activeFilePath;
          const iconColor = getFileIcon(file.name);
          const isDragging = file.path === draggedTab;
          const isDragOver = file.path === dragOverTab;

          return (
            <div
              key={file.path}
              data-path={file.path}
              draggable
              onDragStart={(e) => handleDragStart(e, file.path)}
              onDragOver={(e) => handleDragOver(e, file.path)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, file.path)}
              onDragEnd={handleDragEnd}
              onMouseDown={(e) => handleMiddleClick(e, file.path)}
              onClick={() => onSelectFile(file.path)}
              className={`group flex items-center gap-2 px-3 h-9 text-xs font-medium cursor-pointer border-r border-gray-700 min-w-0 transition-all ${
                isActive
                  ? 'bg-gray-900 text-white border-t-2 border-t-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-750'
              } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-l-2 border-l-blue-400' : ''}`}
              style={{ backgroundColor: isActive ? '#1e1e2e' : undefined }}
            >
              {/* Pin indicator */}
              {file.isPinned && (
                <Pin className="w-3 h-3 text-blue-400 flex-shrink-0 rotate-45" />
              )}

              {/* Modified indicator or file icon dot */}
              {!file.isPinned && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  file.isModified ? 'bg-yellow-500' : iconColor.replace('text-', 'bg-')
                }`} />
              )}

              {/* File name */}
              <span className="truncate max-w-32">{file.name}</span>

              {/* Pin button (on hover) */}
              {onPinFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinFile(file.path);
                  }}
                  className={`p-0.5 rounded hover:bg-gray-600 transition-colors ${
                    file.isPinned ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title={file.isPinned ? 'Unpin tab' : 'Pin tab'}
                >
                  <Pin className="w-3 h-3" />
                </button>
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.path);
                }}
                className={`p-0.5 rounded hover:bg-gray-600 transition-colors ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 h-full px-1 bg-gray-800 hover:bg-gray-700 border-l border-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default EditorTabs;
