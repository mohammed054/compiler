import { tokenize, Token } from '../lexer/tokenizer';

export type Expr =
  | { type: 'Literal'; value: string | number | boolean | null }
  | { type: 'Symbol'; value: string }
  | { type: 'List'; elements: Expr[] }
  | { type: 'Vector'; elements: Expr[] }
  | { type: 'Map'; pairs: { key: Expr; value: Expr }[] }
  | { type: 'Quote'; expr: Expr }
  | { type: 'Quasiquote'; expr: Expr }
  | { type: 'Unquote'; expr: Expr };

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private atEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  parseProgram(): { body: Expr[]; errors: ParseError[] } {
    const body: Expr[] = [];
    const errors: ParseError[] = [];

    while (!this.atEnd()) {
      try {
        const expr = this.parseExpr();
        if (expr) body.push(expr);
      } catch (e: any) {
        const token = this.peek();
        errors.push({ message: e.message, line: token.line, column: token.column });
        this.advance();
      }
    }

    return { body, errors };
  }

  parseExpr(): Expr | null {
    const token = this.peek();

    if (token.type === 'EOF' || token.type === 'COMMENT') {
      this.advance();
      return null;
    }

    if (token.type === 'RPAREN' || token.type === 'RBRACKET' || token.type === 'RBRACE') {
      throw new Error(`Unexpected ${token.type}`);
    }

    switch (token.type) {
      case 'LPAREN':
        return this.parseList();
      case 'LBRACKET':
        return this.parseVector();
      case 'LBRACE':
        return this.parseMap();
      case 'QUOTE':
        return this.parseQuote();
      case 'QUASIQUOTE':
        return this.parseQuasiquote();
      case 'UNQUOTE':
        return this.parseUnquote();
      case 'NUMBER':
        this.advance();
        return { type: 'Literal', value: parseFloat(token.value) };
      case 'STRING':
        this.advance();
        return { type: 'Literal', value: token.value };
      case 'TRUE':
        this.advance();
        return { type: 'Literal', value: true };
      case 'FALSE':
        this.advance();
        return { type: 'Literal', value: false };
      case 'NIL':
        this.advance();
        return { type: 'Literal', value: null };
      case 'KEYWORD':
        this.advance();
        return { type: 'Literal', value: token.value };
      case 'SYMBOL':
        this.advance();
        return { type: 'Symbol', value: token.value };
      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }

  private parseList(): Expr {
    this.expect('LPAREN');
    const elements: Expr[] = [];

    while (this.peek().type !== 'RPAREN' && this.peek().type !== 'EOF') {
      const expr = this.parseExpr();
      if (expr) elements.push(expr);
    }

    this.expect('RPAREN');
    return { type: 'List', elements };
  }

  private parseVector(): Expr {
    this.expect('LBRACKET');
    const elements: Expr[] = [];

    while (this.peek().type !== 'RBRACKET' && this.peek().type !== 'EOF') {
      const expr = this.parseExpr();
      if (expr) elements.push(expr);
    }

    this.expect('RBRACKET');
    return { type: 'Vector', elements };
  }

  private parseMap(): Expr {
    this.expect('LBRACE');
    const pairs: { key: Expr; value: Expr }[] = [];

    while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
      const key = this.parseExpr();
      if (!key) throw new Error('Expected key in map');
      const value = this.parseExpr();
      if (!value) throw new Error('Expected value in map');
      pairs.push({ key, value });
    }

    this.expect('RBRACE');
    return { type: 'Map', pairs };
  }

  private parseQuote(): Expr {
    this.expect('QUOTE');
    const expr = this.parseExpr();
    return { type: 'Quote', expr: expr! };
  }

  private parseQuasiquote(): Expr {
    this.expect('QUASIQUOTE');
    const expr = this.parseExpr();
    return { type: 'Quasiquote', expr: expr! };
  }

  private parseUnquote(): Expr {
    this.expect('UNQUOTE');
    const expr = this.parseExpr();
    return { type: 'Unquote', expr: expr! };
  }

  private expect(type: string): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at line ${token.line}`);
    }
    return this.advance();
  }
}

export function parseProgram(source: string): { cst: { type: string; body: Expr[] }; errors: ParseError[] } {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  const { body, errors } = parser.parseProgram();
  return { cst: { type: 'Program', body }, errors };
}

export function parseExpression(source: string): Expr {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  const expr = parser.parseExpr();
  return expr!;
}
