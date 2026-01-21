import { CstNode } from 'chevrotain';
import {
  Expr,
  Literal,
  Symbol,
  List,
  Vector,
  Map,
  MapPair,
  Quote,
  Quasiquote,
  Unquote,
  Lambda,
  Let,
  If,
  Def,
  Defn,
  DefMacro,
  Do,
  Match,
  Splice,
  Program,
} from '../ast/types';

function transform(node: CstNode): Expr {
  const n = node as any;
  const name = n.type;

  switch (name) {
    case 'Literal':
      return {
        type: 'Literal' as const,
        value: n.value,
      };

    case 'Symbol':
      return {
        type: 'Symbol' as const,
        value: n.value,
      };

    case 'List': {
      const elements = (n.elements || []).map(transform);
      return {
        type: 'List' as const,
        elements,
      };
    }

    case 'Vector': {
      const elements = (n.elements || []).map(transform);
      return {
        type: 'Vector' as const,
        elements,
      };
    }

    case 'Map': {
      const pairs = (n.pairs || []).map((p: any) => ({
        key: transform(p.key),
        value: transform(p.value),
      }));
      return {
        type: 'Map' as const,
        pairs,
      };
    }

    case 'Quote':
      return {
        type: 'Quote' as const,
        expr: transform(n.expr),
      };

    case 'Quasiquote':
      return {
        type: 'Quasiquote' as const,
        expr: transform(n.expr),
      };

    case 'Unquote':
      return {
        type: 'Unquote' as const,
        expr: transform(n.expr),
      };

    default:
      throw new Error(`Unknown CST node type: ${name}`);
  }
}

export function cstToAst(cst: CstNode): Expr[] {
  const prog = cst as any;
  if (prog.type === 'Program') {
    return (prog.body || []).map(transform);
  }
  return [transform(cst)];
}
