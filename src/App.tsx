import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import Editor, { loader } from '@monaco-editor/react';

const DEFAULT_CODE = `;; Rune Language - A functional language with hygienic macros

;; Define a function
(defn factorial n
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))

;; Test it
(print "Factorial of 5:" (factorial 5))

;; Higher-order functions
(def double (fn [x] (* x 2)))
(def numbers [1 2 3 4 5])
(print "Doubled:" (map double numbers))

;; Macros!
(defmacro when [cond body]
  \`(if ~cond ~body nil))

(when (= 2 2)
  (print "2 equals 2!"))

;; Data structures
(def person {:name "Alice" :age 30 :city "NYC"})
(print "Person:" person)
(print "Name:" (:name person))
`;

const EXAMPLES = [
  { name: 'Hello', code: '(print "Hello, Rune!")' },
  { name: 'Factorial', code: '(defn factorial n\n  (if (= n 0) 1 (* n (factorial (- n 1)))))\n(print (factorial 5))' },
  { name: 'Macros', code: '(defmacro when [cond body]\n  `(if ~cond ~body nil))\n(when true (print "works!"))' },
  { name: 'Recursion', code: '(defn fib n\n  (if (< n 2) n\n    (+ (fib (- n 1)) (fib (- n 2)))))\n(print (fib 10))' },
  { name: 'Collections', code: '(def nums [1 2 3 4 5])\n(print "Sum:" (reduce + nums))\n(print "Filter even:" (filter (fn [x] (= (% x 2) 0)) nums))' },
];

interface OutputLine {
  type: 'value' | 'error' | 'info' | 'time';
  text: string;
}

interface ExecutionStats {
  expressions: number;
  timeMs: number;
}

loader.config({ monaco: window.monaco });

function SkeletonLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1a1a2e',
      padding: '15px',
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '60px',
            height: '28px',
            background: '#2a2a4a',
            borderRadius: '6px',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
      <div style={{
        flex: 1,
        background: '#0f0f1a',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        border: '1px solid #2a2a4a',
      }}>
        <h1 style={{
          margin: '0 0 16px',
          fontSize: '28px',
          background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Welcome to Rune
        </h1>
        <p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '16px' }}>
          Rune is a <strong>functional Lisp-like programming language</strong> that runs entirely in your browser.
        </p>
        <h3 style={{ color: '#00d4ff', margin: '24px 0 12px' }}>Features</h3>
        <ul style={{ color: '#ccc', lineHeight: 1.8, paddingLeft: '20px' }}>
          <li>First-class functions & closures</li>
          <li>Hygienic macros with syntax-quote</li>
          <li>Lists, vectors, and hash maps</li>
          <li>Higher-order functions (map, filter, reduce)</li>
          <li>Pattern matching (coming soon)</li>
        </ul>
        <h3 style={{ color: '#00d4ff', margin: '24px 0 12px' }}>Quick Start</h3>
        <p style={{ color: '#aaa', marginBottom: '24px' }}>
          Type or select an example, then click <strong>Run</strong> to see results below.
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start Coding →
        </button>
      </div>
    </div>
  );
}

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [replInput, setReplInput] = useState('');
  const [replHistory, setReplHistory] = useState<string[]>([]);
  const [replHistoryIndex, setReplHistoryIndex] = useState(-1);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('rune-welcome-seen');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('rune-code');
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rune-code', code);
  }, [code]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('rune-welcome-seen', 'true');
  };

  const formatValue = (v: any): string => {
    if (v === null) return 'nil';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
    if (v === true) return 'true';
    if (v === false) return 'false';
    if (v && typeof v === 'object') {
      if (v.type === 'list') return `(${v.values?.map(formatValue).join(' ') || ''})`;
      if (v.type === 'vector') return `[${v.values?.map(formatValue).join(' ') || ''}]`;
      if (v.type === 'map') {
        const pairs: string[] = [];
        v.entries?.forEach((val: any, key: string) => pairs.push(`${key} ${formatValue(val)}`));
        return `{${pairs.join(' ')}}`;
      }
      if (v.type === 'fn') return '#<fn>';
    }
    return String(v);
  };

  const formatCode = useCallback(() => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;

    const fullCode = model.getValue();
    const lines = fullCode.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      if (trimmed.startsWith(')') || trimmed.startsWith(']') || trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indented = '  '.repeat(indentLevel) + trimmed;
      
      if (trimmed.endsWith('(') || trimmed.endsWith('[') || trimmed.endsWith('{') || 
          (trimmed.endsWith(')') && trimmed.length > 1 && !trimmed.startsWith(';'))) {
        indentLevel++;
      }
      
      return indented;
    });

    editorRef.current.setValue(formattedLines.join('\n'));
  }, []);

  const runCode = useCallback(async (source: string) => {
    const startTime = performance.now();
    const newOutput: OutputLine[] = [];
    let expressionCount = 0;

    try {
      const { tokenize } = await import('./lexer/tokenizer');
      const { parseProgram } = await import('./parser/parser');
      const { Evaluator } = await import('./eval/evaluator');

      const tokens = tokenize(source);

      if (tokens.some(t => t.type === 'ERROR')) {
        const errorToken = tokens.find(t => t.type === 'ERROR');
        newOutput.push({ type: 'error', text: `Lexing error at line ${errorToken?.line}: ${errorToken?.value}` });
        setOutput(newOutput);
        return;
      }

      const { cst, errors } = parseProgram(source);

      if (errors.length > 0) {
        newOutput.push({ type: 'error', text: errors[0].message });
        setOutput(newOutput);
        return;
      }

      const evaluator = new Evaluator();

      for (const expr of cst.body) {
        try {
          expressionCount++;
          const value = evaluator.eval(expr);
          if (value !== null && value !== undefined) {
            newOutput.push({ type: 'value', text: formatValue(value) });
          }
        } catch (e: any) {
          newOutput.push({ type: 'error', text: e.message });
        }
      }
    } catch (e: any) {
      newOutput.push({ type: 'error', text: e.message });
    }

    const endTime = performance.now();
    const timeMs = endTime - startTime;
    
    setStats({ expressions: expressionCount, timeMs });
    if (expressionCount > 0) {
      newOutput.push({ type: 'time', text: `Executed ${expressionCount} expression${expressionCount !== 1 ? 's' : ''} in ${timeMs.toFixed(2)}ms` });
    }
    
    setOutput(newOutput);
  }, []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    runCode(code).finally(() => setIsRunning(false));
  }, [code, runCode]);

  const handleReplSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    const newOutput = [...output, { type: 'info' as const, text: `> ${replInput}` }];
    setOutput(newOutput);
    setReplHistory([...replHistory, replInput]);
    setReplHistoryIndex(-1);

    setIsRunning(true);
    runCode(replInput).then(() => {
      setReplInput('');
      setIsRunning(false);
    });
  }, [replInput, output, replHistory, runCode]);

  const handleReplKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (replHistoryIndex < replHistory.length - 1) {
        const newIndex = replHistoryIndex + 1;
        setReplHistoryIndex(newIndex);
        setReplInput(replHistory[replHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (replHistoryIndex > 0) {
        const newIndex = replHistoryIndex - 1;
        setReplHistoryIndex(newIndex);
        setReplInput(replHistory[replHistory.length - 1 - newIndex]);
      } else {
        setReplHistoryIndex(-1);
        setReplInput('');
      }
    }
  }, [replHistory, replHistoryIndex]);

  const loadExample = useCallback((exampleCode: string) => {
    setCode(exampleCode);
  }, []);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    setIsEditorLoading(false);

    monaco.editor.defineTheme('rune-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0f0f1a',
        'editor.foreground': '#e0e0e0',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#00d4ff',
        'editorLineNumber.foreground': '#4a4a6a',
        'editorLineNumber.activeForeground': '#00d4ff',
      },
    });

    monaco.editor.setTheme('rune-dark');
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      const timer = setTimeout(() => {
        handleRun();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, handleRun]);

  return (
    <div className="container">
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      
      <header className="header">
        <div className="logo">
          <h1>Rune</h1>
          <span className="tagline">A functional language with hygienic macros</span>
        </div>
        <div className="actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setCode(';; Clear\n')}
            disabled={isRunning}
          >
            Clear
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={formatCode}
            disabled={isRunning}
            title="Format code"
          >
            Format
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run ▶'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-pane">
          <div className="pane-header">Editor</div>
          <div className="editor-container">
            {isEditorLoading ? (
              <SkeletonLoader />
            ) : (
              <Editor
                height="100%"
                defaultLanguage="scheme"
                theme="rune-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: !isMobile },
                  fontSize: isMobile ? 12 : 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                  fontLigatures: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            )}
          </div>
          <div className="examples-panel">
            <div className="examples-title">Examples</div>
            <div className="examples-grid">
              {EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  className="example-chip"
                  onClick={() => loadExample(example.code)}
                  disabled={isRunning}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="output-pane">
          <div className="pane-header">
            Output
            {stats && (
              <span style={{ float: 'right', fontSize: '0.75rem', color: '#666' }}>
                {stats.timeMs.toFixed(1)}ms
              </span>
            )}
          </div>
          <div className="output-content">
            {output.length === 0 ? (
              <div className="output-line output-info">
                {isRunning ? 'Running code...' : 'Run some code to see output...'}
              </div>
            ) : (
              output.map((line, i) => (
                <div
                  key={i}
                  className={`output-line output-${line.type}`}
                >
                  {line.text}
                </div>
              ))
            )}
          </div>

          <div className="repl-container">
            <div className="pane-header">REPL</div>
            <div className="repl-output">
              {output.slice(-5).map((line, i) => (
                <div key={i} className={`output-line output-${line.type}`}>
                  {line.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleReplSubmit} className="repl-input-container">
              <span className="repl-prompt">»</span>
              <input
                type="text"
                className="repl-input"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                onKeyDown={handleReplKeyDown}
                placeholder="Enter Rune expression..."
                disabled={isRunning}
              />
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content {
            flex-direction: column !important;
          }
          .editor-pane, .output-pane {
            flex: none !important;
            height: 50% !important;
          }
          .header {
            padding: 10px 12px !important;
          }
          .logo h1 {
            font-size: 1.2rem !important;
          }
          .tagline {
            display: none !important;
          }
          .btn {
            padding: 6px 12px !important;
            font-size: 0.75rem !important;
          }
          .pane-header {
            padding: 8px 12px !important;
            font-size: 0.75rem !important;
          }
          .examples-panel {
            display: none !important;
          }
          .output-content {
            font-size: 0.8rem !important;
          }
          .repl-output {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
