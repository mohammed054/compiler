import { createToken, Lexer } from 'chevrotain';

export const LPAREN = createToken({ name: 'LPAREN', pattern: /\(/ });
export const RPAREN = createToken({ name: 'RPAREN', pattern: /\)/ });
export const LBRACKET = createToken({ name: 'LBRACKET', pattern: /\[/ });
export const RBRACKET = createToken({ name: 'RBRACKET', pattern: /\]/ });
export const LBRACE = createToken({ name: 'LBRACE', pattern: /\{/ });
export const RBRACE = createToken({ name: 'RBRACE', pattern: /\}/ });

export const NUMBER = createToken({
  name: 'NUMBER',
  pattern: /-?(?:0x[0-9a-fA-F]+|0o[0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/,
});

export const STRING = createToken({
  name: 'STRING',
  pattern: /"(?:[^"\\]|\\.)*"/,
});

export const SYMBOL = createToken({
  name: 'SYMBOL',
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

export const KEYWORD = createToken({
  name: 'KEYWORD',
  pattern: /:[a-zA-Z_][a-zA-Z0-9_-]*/,
});

export const TRUE = createToken({ name: 'TRUE', pattern: /true/ });
export const FALSE = createToken({ name: 'FALSE', pattern: /false/ });
export const NIL = createToken({ name: 'NIL', pattern: /nil/ });

export const QUOTE = createToken({ name: 'QUOTE', pattern: /'/ });
export const QUASIQUOTE = createToken({ name: 'QUASIQUOTE', pattern: /`/ });
export const UNQUOTE = createToken({ name: 'UNQUOTE', pattern: /,/ });
export const SPLICE = createToken({ name: 'SPLICE', pattern: /~@|~\^|@/ });

export const COMMENT = createToken({
  name: 'COMMENT',
  pattern: /;;.*/,
});

export const WHITESPACE = createToken({
  name: 'WHITESPACE',
  pattern: /\s+/,
});

export const allTokens = [
  WHITESPACE,
  COMMENT,
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  LBRACE,
  RBRACE,
  NUMBER,
  STRING,
  KEYWORD,
  TRUE,
  FALSE,
  NIL,
  SYMBOL,
  QUOTE,
  QUASIQUOTE,
  UNQUOTE,
  SPLICE,
];

export const EOF_TOKEN = createToken({ name: 'EOF', pattern: /$/ });

export const RuneLexer = new Lexer({
  modes: { main: allTokens },
  defaultMode: 'main',
});
