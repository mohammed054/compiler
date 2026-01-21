# Rune

A functional Lisp-like programming language with hygienic macros, implemented in TypeScript with a full web IDE.

## Features

- **Functional core**: Lambda calculus with let bindings, pattern matching
- **Hygienic macros**: Syntax-quote based macro system with gensym
- **Pattern matching**: ML-style pattern matching with multiple clauses
- **Data structures**: Lists, vectors, maps (hash maps)
- **First-class functions**: Anonymous functions, closures
- **Full web IDE**: Monaco Editor, REPL, live execution

## Quick Start

### Online

Visit [rune-lang.dev](https://rune-lang.dev) to try Rune in your browser.

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to see the IDE.

### Build for Production

```bash
npm run build
npm run preview
```

## Language Examples

### Basic Functions

```rune
(defn factorial n
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))

(print (factorial 5))  ;; 120
```

### Pattern Matching

```rune
(defn fib n
  (match n
    0 -> 0
    1 -> 1
    n -> (+ (fib (- n 1)) (fib (- n 2)))))

(print (fib 10))  ;; 55
```

### Macros

```rune
(defmacro when [cond body]
  `(if ~cond ~body nil))

(when (= 2 2)
  (print "2 equals 2!"))
```

### Higher-Order Functions

```rune
(def double (fn [x] (* x 2)))
(def numbers [1 2 3 4 5])

(print (map double numbers))         ;; (2 4 6 8 10)
(print (filter (fn [x] (> x 2)) numbers))  ;; (3 4 5)
(print (reduce + numbers))           ;; 15
```

### Data Structures

```rune
(def person {:name "Alice" :age 30 :city "NYC"})
(print (:name person))  ;; Alice

(def colors [:red :green :blue])
(print (car colors))    ;; :red
(print (cdr colors))    ;; (:green :blue)
```

## Architecture

```
src/
├── lexer/          # Tokenization
├── parser/         # Parsing (Chevrotain)
├── ast/            # AST type definitions
├── eval/           # Interpreter/Evaluator
├── macros/         # Macro expansion
├── runtime/        # Built-in functions
└── web/            # React frontend + Monaco
```

## Tech Stack

- **Language**: TypeScript
- **Parser**: Chevrotain
- **Editor**: Monaco Editor
- **Frontend**: React + Vite
- **Deploy**: GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
