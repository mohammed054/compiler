import { CstParser, CstNode } from 'chevrotain';
import {
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  LBRACE,
  RBRACE,
  NUMBER,
  STRING,
  KEYWORD,
  SYMBOL,
  TRUE,
  FALSE,
  NIL,
  QUOTE,
  QUASIQUOTE,
  UNQUOTE,
  allTokens,
  RuneLexer,
} from './tokens';

export class RuneParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public program = this.RULE('program', () => {
    const body: CstNode[] = [];
    this.MANY(() => {
      body.push(this.SUBRULE(this.expression));
    });
    return { type: 'Program', body };
  });

  public expression = this.RULE('expression', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.atom) },
      { ALT: () => this.SUBRULE(this.list) },
      { ALT: () => this.SUBRULE(this.vector) },
      { ALT: () => this.SUBRULE(this.map) },
      { ALT: () => this.SUBRULE(this.quote) },
      { ALT: () => this.SUBRULE(this.quasiquote) },
      { ALT: () => this.SUBRULE(this.unquote) },
    ]);
  });

  private atom = this.RULE('atom', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.number) },
      { ALT: () => this.SUBRULE(this.string) },
      { ALT: () => this.SUBRULE(this.symbol) },
      { ALT: () => this.SUBRULE(this.keyword) },
      { ALT: () => this.SUBRULE(this.boolean) },
      { ALT: () => this.SUBRULE(this.nil) },
    ]);
  });

  private number = this.RULE('number', () => {
    const token = this.CONSUME(NUMBER);
    return {
      type: 'Literal',
      value: parseFloat(token.image),
    };
  });

  private string = this.RULE('string', () => {
    const token = this.CONSUME(STRING);
    return {
      type: 'Literal',
      value: token.image.slice(1, -1),
    };
  });

  private symbol = this.RULE('symbol', () => {
    const token = this.CONSUME(SYMBOL);
    return {
      type: 'Symbol',
      value: token.image,
    };
  });

  private keyword = this.RULE('keyword', () => {
    const token = this.CONSUME(KEYWORD);
    return {
      type: 'Literal',
      value: token.image,
    };
  });

  private boolean = this.RULE('boolean', () => {
    const token = this.OR([
      { ALT: () => this.CONSUME(TRUE) },
      { ALT: () => this.CONSUME(FALSE) },
    ]);
    return {
      type: 'Literal',
      value: token.image === 'true',
    };
  });

  private nil = this.RULE('nil', () => {
    const token = this.CONSUME(NIL);
    return {
      type: 'Literal',
      value: null,
    };
  });

  private list = this.RULE('list', () => {
    this.CONSUME(LPAREN);
    const elements: CstNode[] = [];
    let first = true;
    this.MANY(() => {
      if (first) {
        elements.push(this.SUBRULE(this.expression));
        first = false;
      } else {
        elements.push(this.SUBRULE2(this.expression));
      }
    });
    this.CONSUME(RPAREN);
    return {
      type: 'List',
      elements,
    };
  });

  private vector = this.RULE('vector', () => {
    this.CONSUME(LBRACKET);
    const elements: CstNode[] = [];
    let first = true;
    this.MANY(() => {
      if (first) {
        elements.push(this.SUBRULE(this.expression));
        first = false;
      } else {
        elements.push(this.SUBRULE2(this.expression));
      }
    });
    this.CONSUME(RBRACKET);
    return {
      type: 'Vector',
      elements,
    };
  });

  private map = this.RULE('map', () => {
    this.CONSUME(LBRACE);
    const pairs: { key: CstNode; value: CstNode }[] = [];
    this.MANY(() => {
      const key = this.SUBRULE(this.expression);
      const value = this.SUBRULE2(this.expression);
      pairs.push({ key, value });
    });
    this.CONSUME(RBRACE);
    return {
      type: 'Map',
      pairs,
    };
  });

  private quote = this.RULE('quote', () => {
    this.CONSUME(QUOTE);
    const expr = this.SUBRULE(this.expression);
    return {
      type: 'Quote',
      expr,
    };
  });

  private quasiquote = this.RULE('quasiquote', () => {
    this.CONSUME(QUASIQUOTE);
    const expr = this.SUBRULE(this.expression);
    return {
      type: 'Quasiquote',
      expr,
    };
  });

  private unquote = this.RULE('unquote', () => {
    this.CONSUME(UNQUOTE);
    const expr = this.SUBRULE(this.expression);
    return {
      type: 'Unquote',
      expr,
    };
  });
}

export function parseProgram(source: string): { cst: CstNode; errors: any[] } {
  const parser = new RuneParser();
  const lexResult = RuneLexer.tokenize(source);
  parser.input = lexResult.tokens;
  
  try {
    const cst = parser.program();
    return { cst, errors: parser.errors };
  } catch (e) {
    const emptyCst: CstNode = { name: 'Program', children: {} };
    return { cst: emptyCst, errors: [{ message: String(e) }] };
  }
}
