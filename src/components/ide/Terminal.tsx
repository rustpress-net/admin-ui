/**
 * Terminal - Embedded terminal panel
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, Plus, ChevronDown, Trash2, Copy } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

interface TerminalSession {
  id: string;
  name: string;
  lines: TerminalLine[];
  cwd: string;
}

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  height?: number;
  onHeightChange?: (height: number) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  isOpen,
  onClose,
  onToggle,
  height = 200,
  onHeightChange
}) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: '1',
      name: 'bash',
      lines: [
        { id: '1', type: 'info', content: 'RustPress Terminal v1.0.0', timestamp: new Date() },
        { id: '2', type: 'info', content: 'Type "help" for available commands.', timestamp: new Date() }
      ],
      cwd: '/rustpress'
    }
  ]);
  const [activeSession, setActiveSession] = useState('1');
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const currentSession = sessions.find(s => s.id === activeSession);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.lines]);

  const handleCommand = useCallback((command: string) => {
    if (!command.trim()) return;

    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `$ ${command}`,
      timestamp: new Date()
    };

    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Simulate command processing
    let outputLines: TerminalLine[] = [];

    switch (command.toLowerCase().split(' ')[0]) {
      case 'help':
        outputLines = [
          { id: `${Date.now()}-1`, type: 'output', content: 'Available commands:', timestamp: new Date() },
          { id: `${Date.now()}-2`, type: 'output', content: '  help     - Show this help message', timestamp: new Date() },
          { id: `${Date.now()}-3`, type: 'output', content: '  clear    - Clear terminal', timestamp: new Date() },
          { id: `${Date.now()}-4`, type: 'output', content: '  ls       - List files', timestamp: new Date() },
          { id: `${Date.now()}-5`, type: 'output', content: '  pwd      - Print working directory', timestamp: new Date() },
          { id: `${Date.now()}-6`, type: 'output', content: '  echo     - Print text', timestamp: new Date() },
        ];
        break;
      case 'clear':
        setSessions(prev => prev.map(s =>
          s.id === activeSession ? { ...s, lines: [] } : s
        ));
        return;
      case 'ls':
        outputLines = [
          { id: `${Date.now()}-1`, type: 'output', content: 'themes/    functions/    plugins/    assets/', timestamp: new Date() },
        ];
        break;
      case 'pwd':
        outputLines = [
          { id: `${Date.now()}-1`, type: 'output', content: currentSession?.cwd || '/rustpress', timestamp: new Date() },
        ];
        break;
      case 'echo':
        outputLines = [
          { id: `${Date.now()}-1`, type: 'output', content: command.slice(5), timestamp: new Date() },
        ];
        break;
      default:
        outputLines = [
          { id: `${Date.now()}-1`, type: 'error', content: `Command not found: ${command.split(' ')[0]}`, timestamp: new Date() },
        ];
    }

    setSessions(prev => prev.map(s =>
      s.id === activeSession
        ? { ...s, lines: [...s.lines, newLine, ...outputLines] }
        : s
    ));

    setInput('');
  }, [activeSession, currentSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const addSession = () => {
    const newId = Date.now().toString();
    setSessions(prev => [...prev, {
      id: newId,
      name: `bash ${sessions.length + 1}`,
      lines: [
        { id: '1', type: 'info', content: 'New terminal session started.', timestamp: new Date() }
      ],
      cwd: '/rustpress'
    }]);
    setActiveSession(newId);
  };

  const closeSession = (id: string) => {
    if (sessions.length === 1) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession === id) {
      setActiveSession(sessions[0].id === id ? sessions[1]?.id : sessions[0].id);
    }
  };

  // Resize handling
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      if (onHeightChange) {
        onHeightChange(Math.max(100, Math.min(500, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onHeightChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-900 border-t border-gray-700 flex flex-col"
        >
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            onMouseDown={handleResizeStart}
            className={`h-1 cursor-row-resize hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : 'bg-gray-700'}`}
          />

          {/* Tab Bar */}
          <div className="flex items-center bg-gray-800 border-b border-gray-700">
            <div className="flex-1 flex items-center overflow-x-auto">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs border-r border-gray-700 ${
                    session.id === activeSession
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>{session.name}</span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
                      className="p-0.5 hover:bg-gray-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}
              <button
                onClick={addSession}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700"
                title="New Terminal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 px-2">
              <button
                onClick={() => setSessions(prev => prev.map(s =>
                  s.id === activeSession ? { ...s, lines: [] } : s
                ))}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                title="Clear"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="flex-1 overflow-auto p-2 font-mono text-xs cursor-text"
          >
            {currentSession?.lines.map(line => (
              <div
                key={line.id}
                className={`py-0.5 ${
                  line.type === 'error' ? 'text-red-400' :
                  line.type === 'info' ? 'text-blue-400' :
                  line.type === 'input' ? 'text-green-400' : 'text-gray-300'
                }`}
              >
                {line.content}
              </div>
            ))}
            <div className="flex items-center text-green-400">
              <span className="mr-2">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-white"
                spellCheck={false}
                autoFocus
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Terminal;
