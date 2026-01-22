# Rune

A functional Lisp-like programming language with hygienic macros, implemented in TypeScript with a full-featured web IDE.

## Live Demo

**[https://mohammed054.github.io/compiler/](https://mohammed054.github.io/compiler/)**

---

## What is Rune?

Rune is a Lisp-inspired programming language that runs entirely in the browser. It combines the elegance of functional programming with the power of Lisp macros, all accessible through an interactive web-based development environment.

At its core, Rune embraces the Lisp philosophy: code is data, and data is code. The language uses S-expressions (parenthesized lists) as its primary syntax, making it simple, uniform, and highly extensible through macros.

---

## Core Concepts

### Everything is an Expression

In Rune, everything is an expression that evaluates to a value. There are no statements, only expressions:

```rune
(if (> x 0)
  "positive"
  "non-positive")  ;; Returns a string based on condition

(do
  (print "side effect")
  42)  ;; Returns the last expression's value
```

### First-Class Functions

Functions are values that can be passed around, stored in variables, and returned from other functions:

```rune
;; Create and assign a function
(def double (fn [x] (* x 2)))

;; Pass function as argument
(print (map double [1 2 3]))  ;; (2 4 6)

;; Return a function from another function
(def make-adder [n]
  (fn [x] (+ x n)))

(def add5 (make-adder 5))
(print (add5 10))  ;; 15
```

### Closures

Functions capture their lexical environment, enabling closures:

```rune
(def make-counter []
  (let [count 0]
    (fn []
      (let [result count]
        (set count (+ count 1))
        result))))

(def c1 (make-counter))
(print (c1))  ;; 0
(print (c1))  ;; 1
(print (c1))  ;; 2
```

---

## Syntax and Semantics

### Basic Types

Rune supports familiar data types:

```rune
;; Numbers (integers and floats)
(def age 30)
(def pi 3.14159)

;; Strings
(def name "Alice")
(def greeting "Hello, ")

;; Booleans
(def is-active true)
(def is-disabled false)

;; Nil (null/None)
(def nothing nil)
```

### Collections

Rune provides three primary collection types:

**Lists** - Linked lists, the fundamental Lisp data structure:
```rune
(def fruits '("apple" "banana" "orange"))
(car fruits)    ;; "apple"
(cdr fruits)    ;; '("banana" "orange")
(cons "cherry" fruits)  ;; '("cherry" "apple" "banana" "orange")
```

**Vectors** - Array-like, indexed collections:
```rune
(def numbers [1 2 3 4 5])
(nth numbers 0)  ;; 1 (access by index)
(length numbers)  ;; 5
```

**Maps** - Hash maps for key-value storage:
```rune
(def person {:name "Alice" :age 30 :city "NYC"})
(:name person)    ;; "Alice" (keyword access)
(get person :age) ;; 30
(assoc person :job "Engineer")  ;; {:name "Alice" :age 30 :city "NYC" :job "Engineer"}
```

### Keywords

Keywords are symbolic identifiers starting with `:` that serve as efficient map keys:

```rune
(def config {:host "localhost" :port 8080 :ssl true})
(:host config)  ;; "localhost"
```

### Special Forms

Special forms are expressions with evaluation rules that differ from normal function calls:

**Variable Definition:**
```rune
(def x 10)           ;; Simple binding
(def point [x y])    ;; Vector destructuring in binding
```

**Function Definition:**
```rune
(defn add [a b]
  (+ a b))

(defn factorial [n]
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))
```

**Conditionals:**
```rune
(if condition
  then-expr
  else-expr)

(cond
  (= x 0) "zero"
  (> x 0) "positive"
  true "negative")
```

**Local Bindings:**
```rune
(let [x 10
      y 20]
  (+ x y))  ;; 30
```

**Quoting:**
```rune
(quote my-symbol)    ;; Prevents evaluation
'my-symbol           ;; Shorthand for quote
```

---

## Hygienic Macros

Macros are Rune's most powerful feature, enabling compile-time code generation and domain-specific languages.

### Macro Basics

A macro is a function that operates on unevaluated code:

```rune
(defmacro unless [cond body else]
  `(if ~cond ~else ~body))

(unless (= 2 3)
  "2 does not equal 3"
  "math is broken")
;; Expands to: (if (not (= 2 3)) "2 does not equal 3" "math is broken")
```

### Syntax Quote and Unquote

The syntax quote (`) preserves structure while unquote (~) injects evaluated values:

```rune
(defmacro with-greeting [msg expr]
  `(do
     (print "Greeting:" ~msg)
     ~expr))

(with-greeting "Hello"
  (+ 1 2))
;; Expands to:
;; (do
;;   (print "Greeting:" "Hello")
;;   (+ 1 2))
```

### Unquote-Splice (~@)

When you need to inject a list as multiple elements:

```rune
(defmacro debug-all [exprs]
  `(do
     ~@(map (fn [e] `(print '~e ":" ~e)) exprs)))

(debug-all [x y z])
;; Expands to multiple print statements
```

### Hygiene Through Gensym

Macros automatically generate unique symbol names to prevent variable capture:

```rune
(defmacro when [cond body]
  `(if ~cond ~body nil))

;; The gensym mechanism ensures internal symbols don't conflict
;; with user code, even if user code uses similar names
```

### Practical Macro Examples

**Creating a Domain-Specific Language:**

```rune
(defmacro deftest [name & body]
  `(def ~name
     (fn []
       (print "Running test:" '~name)
       ~@body)))

(deftest addition-works
  (assert (= (+ 1 2) 3))
  (assert (= (+ -1 1) 0)))
```

**Building Control Structures:**

```rune
(defmacro while [cond & body]
  `(let [loop# (fn []
                 (if ~cond
                   (do
                     ~@body
                     (loop#))))]
     (loop#)))

(let [i 0]
  (while (< i 5)
    (print i)
    (set i (+ i 1))))
```

---

## Built-In Functions

### Arithmetic Operators

```rune
(+ 1 2 3 4)    ;; 10 (variadic)
(- 10 3)       ;; 7
(* 4 5)        ;; 20
(/ 20 4)       ;; 5.0
(% 10 3)       ;; 1 (modulo)
```

### Comparison

```rune
(= x y)         ;; Equality
(< x y)         ;; Less than
(> x y)         ;; Greater than
(<= x y)        ;; Less than or equal
(>= x y)        ;; Greater than or equal
```

### List Operations

```rune
(car list)        ;; First element
(cdr list)        ;; Rest of list (all but first)
(cons element list)  ;; Prepend element
(list & args)     ;; Create list
```

### Higher-Order Functions

```rune
(map fn collection)        ;; Apply function to each element
(filter fn collection)     ;; Keep elements where fn returns truthy
(reduce fn collection)     ;; Fold left
(reduce fn collection init)  ;; With initial value
```

### Type Predicates

```rune
(list? x)      ;; Is x a list?
(vector? x)    ;; Is x a vector?
(map? x)       ;; Is x a map?
(fn? x)        ;; Is x a function?
(nil? x)       ;; Is x nil?
(number? x)    ;; Is x a number?
(string? x)    ;; Is x a string?
```

### Type Conversion

```rune
(list vector)  ;; Convert vector to list
(vec list)     ;; Convert list to vector
(str & args)   ;; Concatenate values into string
(type-of x)    ;; Get type name as string
```

---

## How It Works

### Architecture Overview

The Rune interpreter is built as a pipeline:

```
Source Code → Tokenizer → Parser → AST → Evaluator → Output
```

### The Tokenizer

The tokenizer (lexer) converts raw text into a sequence of tokens:

```rune
(+ 1 2)  →  [LPAREN, SYMBOL("+"), NUMBER("1"), NUMBER("2"), RPAREN]
```

Token types include:
- **Structural**: `(`, `)`, `[`, `]`, `{`, `}`
- **Keywords**: `:keyword`, `true`, `false`, `nil`
- **Literals**: numbers, strings
- **Symbols**: function names, variable names
- **Special**: `'`, `` ` ``, `,`, `~` (quote, quasiquote, unquote, splice)

### The Parser

The parser consumes tokens and builds an Abstract Syntax Tree (AST). Rune uses a recursive descent parser that:

1. Recognizes matching pairs of delimiters
2. Builds nested List/Vector/Map expressions
3. Handles quoting at the syntax tree level

Each AST node is typed:
```typescript
type Expr =
  | { type: 'Literal'; value: Value }
  | { type: 'Symbol'; value: string }
  | { type: 'List'; elements: Expr[] }
  | { type: 'Vector'; elements: Expr[] }
  | { type: 'Map'; pairs: { key: Expr; value: Expr }[] }
  | { type: 'Quote'; expr: Expr }
  | { type: 'Quasiquote'; expr: Expr }
  | { type: 'Unquote'; expr: Expr }
  | { type: 'Splice'; expr: Expr }
```

### The Evaluator

The evaluator performs symbolic execution using an environment (scope chain):

1. **Environment**: A mapping of symbols to values, with support for lexical scoping through parent links

2. **Evaluation Rules**:
   - **Literals**: Return their value directly
   - **Symbols**: Look up in current environment, walking up parent scopes
   - **Lists**: 
     - Special forms (def, defn, let, if, etc.) have custom evaluation
     - Function calls evaluate arguments then apply the function
   - **Vectors/Maps**: Evaluate all elements, construct the collection

3. **Function Application**:
   - Create a new environment with function's parameters bound to arguments
   - Evaluate function body in that environment
   - Return the last expression's value

### Macro Expansion

Macros operate before evaluation:

1. Recognize macro call
2. Extract macro definition (parameter names and body)
3. Evaluate macro arguments (unlike normal function args)
4. Substitute arguments into macro body using gensym for hygiene
5. Evaluate the expanded code

This two-phase evaluation (expand then eval) enables powerful metaprogramming.

---

## The Web IDE

Rune comes with a full-featured browser-based development environment:

### Editor Features

- **Syntax Highlighting**: Custom theme optimized for Rune syntax
- **Code Completion**: Context-aware suggestions for symbols and special forms
- **Error Highlighting**: Real-time feedback on syntax and evaluation errors
- **Multiple Examples**: Pre-built examples demonstrating key features
- **Format Button**: Automatic code formatting

### REPL (Read-Eval-Print Loop)

The interactive REPL allows immediate feedback:

- Evaluate expressions one at a time
- Access previously defined variables and functions
- History navigation with arrow keys
- Recent output displayed for quick reference

### Session Persistence

The IDE saves your code between page visits using localStorage, ensuring you never lose work.

### Live Execution

Code runs entirely in the browser with:
- Sub-millisecond execution time tracking
- Expression-by-expression evaluation
- Full error messages with source locations

---

## Example Programs

### Factorial with Recursion

```rune
(defn factorial [n]
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))

(print (factorial 10))  ;; 3628800
```

### Higher-Order Functions

```rune
(def numbers [1 2 3 4 5])

(def double (fn [x] (* x 2)))
(def is-even (fn [x] (= (% x 2) 0)))

(print (map double numbers))         ;; (2 4 6 8 10)
(print (filter is-even numbers))     ;; (2 4)
(print (reduce + numbers))           ;; 15
```

### Custom Control Flow with Macros

```rune
(defmacro unless [cond then else]
  `(if ~cond ~else ~then))

(unless (= 1 0)
  "1 is not 0"
  "math is broken")

;; Output: "1 is not 0"
```

### Data Processing Pipeline

```rune
(def data [{:name "Alice" :score 85}
           {:name "Bob" :score 92}
           {:name "Charlie" :score 78}])

(def high-scores
  (filter (fn [p] (> (:score p) 80)) data))

(print high-scores)
;; ({:name Alice :score 85} {:name Bob :score 92})
```

---

## Design Philosophy

Rune is designed with several guiding principles:

1. **Simplicity**: Minimal syntax (just lists and a few delimiters) leads to powerful expressiveness

2. **Consistency**: Code and data use the same representation (lists), enabling metaprogramming

3. **Hygiene**: Macros are hygienic by default, preventing accidental variable capture

4. **Interactivity**: First-class REPL and web IDE support exploratory programming

5. **Functional Purity**: Emphasizes immutable data and side-effect-free functions where possible

---

## Language Reference

### Operator Precedence

All Rune expressions use fully parenthesized syntax. There is no operator precedence to remember—every call site is explicit.

### Evaluation Strategy

Rune uses **eager evaluation** (arguments are fully evaluated before the function body runs), with **normal-order** evaluation available through macros.

### Truthiness

Only `false` and `nil` are falsy. All other values are truthy, including `0`, empty strings, and empty collections.

### Immutability

All Rune data structures are immutable. Operations that appear to modify data actually return new copies:

```rune
(def v1 [1 2 3])
(def v2 (conj v1 4))
(print v1)  ;; [1 2 3] (unchanged)
print v2)  ;; [1 2 3 4] (new vector)
```

---

## Technical Details

### Implementation

- **Language**: TypeScript
- **Parser**: Custom recursive descent parser
- **Editor**: Monaco Editor (VS Code's editor)
- **Frontend**: React
- **Build Tool**: Vite

### Performance

- Tokenization: O(n) where n is source length
- Parsing: O(n) for most expressions, O(n²) for deeply nested forms
- Evaluation: Depends on operations, but generally efficient for interpreted code
- Memory: Linear in source size plus runtime allocations

### Browser Compatibility

Rune runs in any modern browser with ES2020 support, thanks to the Monaco Editor's requirements.

---

## Extending Rune

Rune can be extended through:

1. **New Special Forms**: Add cases to the evaluator's `specialForm` method
2. **Built-In Functions**: Add bindings to the global environment
3. **Macro Libraries**: Create reusable macro collections
4. **Custom Themes**: Modify Monaco editor theme configuration

---

## License

MIT
