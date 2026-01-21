export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 0;
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (char === '\n') {
      line++;
      column = 0;
      i++;
      continue;
    }

    if (char === ';' && source[i + 1] === ';') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }

    if (/\s/.test(char)) {
      i++;
      column++;
      continue;
    }

    const startLine = line;
    const startColumn = column;

    if (char === '"') {
      let value = '';
      i++;
      column++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\' && i + 1 < source.length) {
          i++;
          column++;
          const next = source[i];
          if (next === 'n') value += '\n';
          else if (next === 't') value += '\t';
          else if (next === '"') value += '"';
          else if (next === '\\') value += '\\';
          else value += next;
        } else {
          value += source[i];
        }
        i++;
        column++;
      }
      i++;
      column++;
      tokens.push({ type: 'STRING', value, line: startLine, column: startColumn });
      continue;
    }

    if (/[0-9]/.test(char)) {
      let value = '';
      while (i < source.length && /[0-9.xXoOeE+-]/.test(source[i])) {
        value += source[i];
        i++;
        column++;
      }
      tokens.push({ type: 'NUMBER', value, line: startLine, column: startColumn });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (i < source.length && /[a-zA-Z0-9_-]/.test(source[i])) {
        value += source[i];
        i++;
        column++;
      }
      if (value === 'true') tokens.push({ type: 'TRUE', value, line: startLine, column: startColumn });
      else if (value === 'false') tokens.push({ type: 'FALSE', value, line: startLine, column: startColumn });
      else if (value === 'nil') tokens.push({ type: 'NIL', value, line: startLine, column: startColumn });
      else tokens.push({ type: 'SYMBOL', value, line: startLine, column: startColumn });
      continue;
    }

    if (char === ':') {
      let value = ':';
      i++;
      column++;
      while (i < source.length && /[a-zA-Z0-9_-]/.test(source[i])) {
        value += source[i];
        i++;
        column++;
      }
      tokens.push({ type: 'KEYWORD', value, line: startLine, column: startColumn });
      continue;
    }

    if (char === '-' && source[i + 1] === '>') {
      tokens.push({ type: 'ARROW', value: '->', line: startLine, column: startColumn });
      i += 2;
      column += 2;
      continue;
    }

    const singleCharTokens: Record<string, string> = {
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
      '.': 'DOT',
      '=': 'EQUAL',
      '+': 'PLUS',
      '-': 'MINUS',
      '*': 'STAR',
      '/': 'SLASH',
      '<': 'LT',
      '>': 'GT',
      '%': 'PERCENT',
    };

    if (singleCharTokens[char]) {
      tokens.push({ type: singleCharTokens[char], value: char, line: startLine, column: startColumn });
      i++;
      column++;
      continue;
    }

    i++;
    column++;
  }

  tokens.push({ type: 'EOF', value: '', line, column });
  return tokens;
}
