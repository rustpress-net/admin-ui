/**
 * Breadcrumbs - File path navigation
 */

import React from 'react';
import { ChevronRight, Folder, File } from 'lucide-react';

interface BreadcrumbsProps {
  path: string;
  onNavigate?: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  path,
  onNavigate
}) => {
  if (!path) return null;

  const parts = path.split('/').filter(Boolean);
  const isFile = parts.length > 0 && parts[parts.length - 1].includes('.');

  const buildPath = (index: number) => {
    return parts.slice(0, index + 1).join('/');
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-900/50 border-b border-gray-700/50 text-xs overflow-x-auto">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const fullPath = buildPath(index);
        const isFolder = !isLast || !isFile;

        return (
          <React.Fragment key={fullPath}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            )}
            <button
              onClick={() => onNavigate?.(fullPath)}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
                isLast
                  ? 'text-gray-300'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {isFolder ? (
                <Folder className="w-3.5 h-3.5 text-yellow-500" />
              ) : (
                <File className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="truncate max-w-[120px]">{part}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
