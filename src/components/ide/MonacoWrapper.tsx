/**
 * MonacoWrapper - Monaco Editor integration with VS Code features
 */

import React, { useRef, useCallback } from 'react';
import Editor, { OnMount, BeforeMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// ============================================
// TYPES
// ============================================

interface EditorOptions {
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  bracketMatching?: boolean;
  indentGuides?: boolean;
}

interface MonacoWrapperProps {
  path: string;
  content: string;
  language: string;
  onChange: (content: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSave?: () => void;
  onGoToLine?: () => void;
  onFindReplace?: () => void;
  editorOptions?: EditorOptions;
}

// ============================================
// THEME DEFINITION
// ============================================

const defineTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme('rustpress-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'tag', foreground: '569CD6' },
      { token: 'attribute.name', foreground: '9CDCFE' },
      { token: 'attribute.value', foreground: 'CE9178' },
      { token: 'delimiter', foreground: '808080' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'function', foreground: 'DCDCAA' },
    ],
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2a3e',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#aeafad',
      'editorWhitespace.foreground': '#3b3b3b',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.selectionHighlightBackground': '#add6ff26',
      'editorLineNumber.foreground': '#5a5a5a',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editorGutter.background': '#1e1e2e',
      'minimap.background': '#1e1e2e',
    }
  });
};

// ============================================
// JINJA2/TEMPLATE LANGUAGE SUPPORT
// ============================================

const registerJinja2Support = (monaco: Monaco) => {
  // Register a custom language for HTML with Jinja2
  monaco.languages.register({ id: 'html-jinja' });

  // Extend HTML tokenizer with Jinja2 patterns
  monaco.languages.setMonarchTokensProvider('html-jinja', {
    defaultToken: '',
    tokenPostfix: '.html',

    // Jinja2 delimiters
    jinjaStatement: /\{%.*?%\}/,
    jinjaExpression: /\{\{.*?\}\}/,
    jinjaComment: /\{#.*?#\}/,

    tokenizer: {
      root: [
        // Jinja2 comment
        [/\{#/, 'comment.jinja', '@jinjaComment'],
        // Jinja2 statement
        [/\{%/, 'keyword.jinja', '@jinjaStatement'],
        // Jinja2 expression
        [/\{\{/, 'variable.jinja', '@jinjaExpression'],
        // HTML
        [/<!DOCTYPE/, 'metatag', '@doctype'],
        [/<!--/, 'comment', '@comment'],
        [/(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/, ['delimiter', 'tag', '', 'delimiter']],
        [/(<)(script)/, ['delimiter', { token: 'tag', next: '@script' }]],
        [/(<)(style)/, ['delimiter', { token: 'tag', next: '@style' }]],
        [/(<)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
        [/(<\/)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
        [/</, 'delimiter'],
        [/[^<{]+/, ''],
      ],

      jinjaComment: [
        [/#\}/, 'comment.jinja', '@pop'],
        [/./, 'comment.jinja'],
      ],

      jinjaStatement: [
        [/%\}/, 'keyword.jinja', '@pop'],
        [/\b(if|else|elif|endif|for|endfor|block|endblock|extends|include|macro|endmacro|call|endcall|filter|endfilter|set|raw|endraw|with|endwith|autoescape|endautoescape)\b/, 'keyword.jinja'],
        [/\b(and|or|not|in|is)\b/, 'keyword.jinja'],
        [/"[^"]*"/, 'string.jinja'],
        [/'[^']*'/, 'string.jinja'],
        [/\d+/, 'number.jinja'],
        [/\w+/, 'variable.jinja'],
        [/./, 'keyword.jinja'],
      ],

      jinjaExpression: [
        [/\}\}/, 'variable.jinja', '@pop'],
        [/\|/, 'operator.jinja'],
        [/"[^"]*"/, 'string.jinja'],
        [/'[^']*'/, 'string.jinja'],
        [/\d+/, 'number.jinja'],
        [/\w+/, 'variable.jinja'],
        [/./, 'variable.jinja'],
      ],

      doctype: [
        [/[^>]+/, 'metatag.content'],
        [/>/, 'metatag', '@pop'],
      ],

      comment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment.content'],
        [/./, 'comment.content'],
      ],

      otherTag: [
        [/\/?>/, 'delimiter', '@pop'],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, ''],
      ],

      script: [
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }],
        [/./, { token: '@rematch', next: '@scriptWithCustomType' }],
      ],

      scriptWithCustomType: [
        [/<\/script\s*>/, { token: 'delimiter', next: '@popall' }],
        [/./, 'source.js'],
      ],

      style: [
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }],
        [/./, { token: '@rematch', next: '@styleWithCustomType' }],
      ],

      styleWithCustomType: [
        [/<\/style\s*>/, { token: 'delimiter', next: '@popall' }],
        [/./, 'source.css'],
      ],
    },
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MonacoWrapper: React.FC<MonacoWrapperProps> = ({
  path,
  content,
  language,
  onChange,
  onCursorChange,
  onSave,
  onGoToLine,
  onFindReplace,
  editorOptions = {}
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Before mount - set up theme and languages
  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineTheme(monaco);
    registerJinja2Support(monaco);
  };

  // On mount - configure editor
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Focus editor
    editor.focus();

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Add custom commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.copyLinesDownAction')?.run();
    });

    // Save command
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
      });
    }

    // Go to line command
    if (onGoToLine) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
        onGoToLine();
      });
    }

    // Find/Replace command
    if (onFindReplace) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
        onFindReplace();
      });
    }
  };

  // Handle content changes
  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  // Determine language (use html-jinja for HTML files)
  const effectiveLanguage = language === 'html' ? 'html' : language;

  return (
    <Editor
      path={path}
      value={content}
      language={effectiveLanguage}
      theme="rustpress-dark"
      onChange={handleChange}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={{
        fontSize: editorOptions.fontSize || 13,
        fontFamily: editorOptions.fontFamily || "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
        fontLigatures: true,
        lineHeight: (editorOptions.fontSize || 13) * 1.5,
        minimap: {
          enabled: editorOptions.minimap !== false,
          maxColumn: 80,
          renderCharacters: false,
        },
        lineNumbers: editorOptions.lineNumbers !== false ? 'on' : 'off',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        folding: true,
        foldingStrategy: 'indentation',
        bracketPairColorization: { enabled: editorOptions.bracketMatching !== false },
        guides: {
          bracketPairs: editorOptions.bracketMatching !== false,
          indentation: editorOptions.indentGuides !== false,
        },
        wordWrap: editorOptions.wordWrap ? 'on' : 'off',
        tabSize: editorOptions.tabSize || 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: 'full',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        acceptSuggestionOnEnter: 'on',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        padding: { top: 10, bottom: 10 },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true,
        links: true,
        colorDecorators: true,
        renderWhitespace: 'selection',
        renderControlCharacters: false,
      }}
      loading={
        <div className="h-full flex items-center justify-center bg-gray-900">
          <div className="text-gray-400 text-sm">Loading editor...</div>
        </div>
      }
    />
  );
};

export default MonacoWrapper;
