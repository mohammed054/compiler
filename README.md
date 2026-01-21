# Rune

A functional Lisp-like programming language with hygienic macros, implemented in TypeScript with a full web IDE.

## Try It Online

**[https://mohammed054.github.io/compiler/](https://mohammed054.github.io/compiler/)**

## Features

- **Functional core**: Lambda calculus with let bindings
- **Hygienic macros**: Syntax-quote based macro system with gensym
- **Data structures**: Lists, vectors, maps (hash maps)
- **First-class functions**: Anonymous functions, closures
- **Full web IDE**: Monaco Editor, REPL, live execution

## Language Examples

### Basic Functions

```rune
(defn factorial n
  (if (= n 0)
    1
    (* n (factorial (- n 1)))))

(print (factorial 5))  ;; 120
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
```

### Data Structures

```rune
(def person {:name "Alice" :age 30 :city "NYC"})
(print (:name person))  ;; Alice

(def colors [:red :green :blue])
(print (car colors))    ;; :red
(print (cdr colors))    ;; (:green :blue)
```

## Tech Stack

- **Language**: TypeScript
- **Parser**: Chevrotain
- **Editor**: Monaco Editor
- **Frontend**: React + Vite
- **Deploy**: GitHub Pages

## License

MIT
