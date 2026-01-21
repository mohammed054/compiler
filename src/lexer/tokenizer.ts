const WHITESPACE_RE = /^\s+/;
const NUMBER_RE = /^-?(?:0x[0-9a-fA-F]+|0o[0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/;
const KEYWORD_RE = /^:[a-zA-Z_][a-zA-Z0-9_-]*/;
const SINGLE_CHAR_TOKENS: Record<string, string> = {
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  '{': 'LBRACE',
  '}': 'RBRACE',
  "'": 'QUOTE',
  '`': 'QUASIQUOTE',
  ',': 'UNQUOTE',
  '~': 'SPLICE',
  '^': 'SPLICE',
  '@': 'SPLICE',
};

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

export class Tokenizer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 0;

  constructor(source: string) {
    this.source = source;
  }

  private getLocation(): { start: number; end: number; line: number; column: number } {
    return { start: this.pos, end: this.pos, line: this.line, column: this.column };
  }

  private advance(): void {
    if (this.source[this.pos] === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    this.pos++;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      if (char === ';' && this.source[this.pos + 1] === ';') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance();
        }
        continue;
      }

      if (char === '#' && this.source[this.pos + 1] === '|') {
        this.advance();
        this.advance();
        while (this.pos < this.source.length) {
          if (this.source[this.pos] === '|' && this.source[this.pos + 1] === '#') {
            this.advance();
            this.advance();
            break;
          }
          this.advance();
        }
        continue;
      }

      const wsMatch = this.source.slice(this.pos).match(WHITESPACE_RE);
      if (wsMatch) {
        for (const c of wsMatch[0]) {
          this.advance();
        }
        continue;
      }

      if (char === '"') {
        const start = this.pos;
        this.advance();
        let value = '';
        while (this.pos < this.source.length && this.source[this.pos] !== '"') {
          if (this.source[this.pos] === '\\') {
            this.advance();
            switch (this.source[this.pos]) {
              case 'n': value += '\n'; break;
              case 't': value += '\t'; break;
              case 'r': value += '\r'; break;
              case '\\': value += '\\'; break;
              case '"': value += '"'; break;
              default: value += this.source[this.pos];
            }
          } else {
            value += this.source[this.pos];
          }
          this.advance();
        }
        this.advance();
        tokens.push({
          type: TokenType.STRING,
          value,
          location: { start, end: this.pos, line: this.line, column: this.column },
        });
        continue;
      }

      const numMatch = this.source.slice(this.pos).match(NUMBER_RE);
      if (numMatch) {
        const start = this.pos;
        const value = numMatch[0];
        this.pos += value.length;
        this.column += value.length;
        tokens.push({
          type: TokenType.NUMBER,
          value,
          location: { start, end: this.pos, line: this.line, column: this.column },
        });
        continue;
      }

      if (char === ':') {
        const start = this.pos;
        const match = this.source.slice(this.pos).match(KEYWORD_RE);
        if (match) {
          const value = match[0];
          this.pos += value.length;
          this.column += value.length;
          tokens.push({
            type: TokenType.KEYWORD,
            value,
            location: { start, end: this.pos, line: this.line, column: this.column },
          });
        }
        continue;
      }

      if (SINGLE_CHAR_TOKENS[char]) {
        tokens.push({
          type: TokenType[SINGLE_CHAR_TOKENS[char] as keyof typeof TokenType] as TokenType,
          value: char,
          location: this.getLocation(),
        });
        this.advance();
        continue;
      }

      const start = this.pos;
      let value = '';
      while (this.pos < this.source.length && !/\s|[\(\)\[\]{}\']`,~^@]/.test(this.source[this.pos])) {
        value += this.source[this.pos];
        this.advance();
      }
      this.column += value.length;

      if (value === 'true') {
        tokens.push({ type: TokenType.TRUE, value, location: this.getLocation() });
      } else if (value === 'false') {
        tokens.push({ type: TokenType.FALSE, value, location: this.getLocation() });
      } else if (value === 'nil') {
        tokens.push({ type: TokenType.NIL, value, location: this.getLocation() });
      } else {
        tokens.push({ type: TokenType.SYMBOL, value, location: this.getLocation() });
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', location: this.getLocation() });

    return tokens;
  }
}

export function tokenize(source: string): Token[] {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokenize();
}
