export enum TokenType {
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  SYMBOL = 'SYMBOL',
  KEYWORD = 'KEYWORD',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NIL = 'NIL',
  QUOTE = 'QUOTE',
  QUASIQUOTE = 'QUASIQUOTE',
  UNQUOTE = 'UNQUOTE',
  SPLICE = 'SPLICE',
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  location: { start: number; end: number; line: number; column: number };
}
