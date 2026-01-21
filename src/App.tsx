import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

const DEFAULT_CODE = `;; Rune Language - A functional language with hygienic macros

;; Define a function
(defn factorial n
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))

;; Test it
(print "Factorial of 5:" (factorial 5))

;; Pattern matching with match
(defn describe-number n
  (match n
    0 -> "zero"
    1 -> "one"
    n -> (str "number " n)))

(print (describe-number 0))
(print (describe-number 5))

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
  { name: 'Pattern Match', code: '(defn fib n\n  (match n\n    0 -> 0\n    1 -> 1\n    n -> (+ (fib (- n 1)) (fib (- n 2)))))\n(print (fib 10))' },
  { name: 'Collections', code: '(def nums [1 2 3 4 5])\n(print "Sum:" (reduce + nums))\n(print "Filter even:" (filter (fn [x] (= (% x 2) 0)) nums))' },
];

interface OutputLine {
  type: 'value' | 'error' | 'info';
  text: string;
}

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [replInput, setReplInput] = useState('');
  const [replHistory, setReplHistory] = useState<string[]>([]);
  const [replHistoryIndex, setReplHistoryIndex] = useState(-1);

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

  const runCode = useCallback(async (source: string) => {
    const newOutput: OutputLine[] = [];

    try {
      const { tokenize } = await import('./lexer/tokenizer');
      const { RuneParser } = await import('./parser/parser');
      const { cstToAst } = await import('./parser/cstToAst');
      const { Evaluator } = await import('./eval/evaluator');

      const tokens = tokenize(source);

      const ParserClass = RuneParser as any;
      const parser = new ParserClass();
      parser.input = tokens;
      const cst = parser.program();

      if (parser.errors && parser.errors.length > 0) {
        newOutput.push({ type: 'error', text: parser.errors[0].message });
        setOutput(newOutput);
        return;
      }

      const ast = cstToAst(cst);
      const evaluator = new Evaluator();

      for (const expr of ast) {
        try {
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

    setOutput(newOutput);
  }, []);

  const handleRun = useCallback(() => {
    runCode(code);
  }, [code, runCode]);

  const handleReplSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    const newOutput = [...output, { type: 'info' as const, text: `> ${replInput}` }];
    setOutput(newOutput);
    setReplHistory([...replHistory, replInput]);
    setReplHistoryIndex(-1);

    runCode(replInput).then(() => {
      setReplInput('');
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

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <h1>Rune</h1>
          <span className="tagline">A functional language with hygienic macros</span>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => setCode(';; Clear\n')}>
            Clear
          </button>
          <button className="btn btn-primary" onClick={handleRun}>
            Run ▶
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-pane">
          <div className="pane-header">Editor</div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="scheme"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
              }}
            />
          </div>
          <div className="examples-panel">
            <div className="examples-title">Examples</div>
            <div className="examples-grid">
              {EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  className="example-chip"
                  onClick={() => loadExample(example.code)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="output-pane">
          <div className="pane-header">Output</div>
          <div className="output-content">
            {output.length === 0 ? (
              <div className="output-line output-info">Run some code to see output...</div>
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
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
