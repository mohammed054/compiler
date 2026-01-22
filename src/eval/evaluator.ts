import { Expr } from '../parser/parser';

interface ListValue {
  type: 'list';
  values: Value[];
}

interface VectorValue {
  type: 'vector';
  values: Value[];
}

interface MapValue {
  type: 'map';
  entries: Record<string, Value>;
}

interface FnValue {
  type: 'fn';
  params: string[];
  body: Expr[];
  env: Env;
}

interface SpliceValue {
  type: 'splice';
  values: Value[];
}

interface Env {
  parent: Env | null;
  bindings: Record<string, Value>;
}

type Value = number | string | boolean | null | ListValue | VectorValue | MapValue | FnValue | SpliceValue;

function isListValue(v: Value): v is ListValue {
  return v !== null && typeof v === 'object' && (v as any).type === 'list';
}

function isVectorValue(v: Value): v is VectorValue {
  return v !== null && typeof v === 'object' && (v as any).type === 'vector';
}

function isMapValue(v: Value): v is MapValue {
  return v !== null && typeof v === 'object' && (v as any).type === 'map';
}

function isFnValue(v: Value): v is FnValue {
  return v !== null && typeof v === 'object' && (v as any).type === 'fn';
}

function isSpliceValue(v: Value): v is SpliceValue {
  return v !== null && typeof v === 'object' && (v as any).type === 'splice';
}

export class Evaluator {
  private env: Env;
  private macros: Map<string, { params: string[]; body: Expr[] }>;

  constructor(env?: Env) {
    this.env = env || this.createGlobalEnv();
    this.macros = new Map();
  }

  private createGlobalEnv(): Env {
    const env: Env = {
      parent: null,
      bindings: {},
    };

    env.bindings['+'] = this.primitiveFn((args) => args.reduce((a, b) => (a as number) + (b as number), 0));
    env.bindings['-'] = this.primitiveFn((args) => args.reduce((a, b) => (a as number) - (b as number)));
    env.bindings['*'] = this.primitiveFn((args) => args.reduce((a, b) => (a as number) * (b as number), 1));
    env.bindings['/'] = this.primitiveFn((args) => args.reduce((a, b) => (a as number) / (b as number)));
    env.bindings['='] = this.primitiveFn((args) => args[0] === args[1]);
    env.bindings['<'] = this.primitiveFn((args) => (args[0] as number) < (args[1] as number));
    env.bindings['>'] = this.primitiveFn((args) => (args[0] as number) > (args[1] as number));
    env.bindings['<='] = this.primitiveFn((args) => (args[0] as number) <= (args[1] as number));
    env.bindings['>='] = this.primitiveFn((args) => (args[0] as number) >= (args[1] as number));
    env.bindings['%'] = this.primitiveFn((args) => (args[0] as number) % (args[1] as number));

    env.bindings['cons'] = this.primitiveFn((args) => {
      const list = args[1] as ListValue;
      return { type: 'list' as const, values: [args[0], ...list.values] };
    });

    env.bindings['car'] = this.primitiveFn((args) => {
      const list = args[0] as ListValue;
      return list.values[0];
    });

    env.bindings['cdr'] = this.primitiveFn((args) => {
      const list = args[0] as ListValue;
      return { type: 'list' as const, values: list.values.slice(1) };
    });

    env.bindings['list'] = this.primitiveFn((args) => ({ type: 'list' as const, values: args }));
    env.bindings['vec'] = this.primitiveFn((args) => ({ type: 'vector' as const, values: (args[0] as any).values || args[0] }));
    env.bindings['vec?'] = this.primitiveFn((args) => isVectorValue(args[0]));
    env.bindings['list?'] = this.primitiveFn((args) => isListValue(args[0]));
    env.bindings['map?'] = this.primitiveFn((args) => isMapValue(args[0]));
    env.bindings['fn?'] = this.primitiveFn((args) => isFnValue(args[0]));
    env.bindings['nil?'] = this.primitiveFn((args) => args[0] === null);
    env.bindings['true?'] = this.primitiveFn((args) => args[0] === true);
    env.bindings['false?'] = this.primitiveFn((args) => args[0] === false);

    env.bindings['print'] = this.primitiveFn((args) => {
      console.log(...args.map(v => this.formatValue(v)));
      return null;
    });

    env.bindings['str'] = this.primitiveFn((args) => args.map(v => this.formatValue(v)).join(''));
    env.bindings['type-of'] = this.primitiveFn((args) => {
      if (args[0] === null) return 'nil';
      if (typeof args[0] === 'number') return 'number';
      if (typeof args[0] === 'string') return 'string';
      if (args[0] === true || args[0] === false) return 'boolean';
      if (isListValue(args[0])) return 'list';
      if (isVectorValue(args[0])) return 'vector';
      if (isMapValue(args[0])) return 'map';
      if (isFnValue(args[0])) return 'fn';
      return 'unknown';
    });

    return env;
  }

  private primitiveFn(fn: (args: Value[]) => Value): Value {
    return { type: 'fn', params: [], body: [], env: this.env };
  }

  private formatValue(v: Value): string {
    if (v === null) return 'nil';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
    if (v === true) return 'true';
    if (v === false) return 'false';
    if (isListValue(v)) return `(${v.values.map(this.formatValue.bind(this)).join(' ')})`;
    if (isVectorValue(v)) return `[${v.values.map(this.formatValue.bind(this)).join(' ')}]`;
    if (isMapValue(v)) {
      const pairs: string[] = [];
      Object.entries(v.entries).forEach(([key, val]) => pairs.push(`${key} ${this.formatValue(val)}`));
      return `{${pairs.join(' ')}}`;
    }
    if (isFnValue(v)) return '#<fn>';
    return String(v);
  }

  public evalProgram(body: Expr[]): Value[] {
    const results: Value[] = [];
    for (const expr of body) {
      const result = this.eval(expr);
      results.push(result);
    }
    return results;
  }

  public eval(expr: Expr): Value {
    switch (expr.type) {
      case 'Literal':
        return expr.value;

      case 'Symbol': {
        const value = this.env.bindings[expr.value];
        if (value !== undefined) {
          return value;
        }
        if (this.env.parent) {
          return this.lookupInParent(this.env.parent, expr.value);
        }
        throw new Error(`Undefined symbol: ${expr.value}`);
      }

      case 'List': {
        if (expr.elements.length === 0) {
          return { type: 'list', values: [] };
        }

        const first = this.eval(expr.elements[0]);

        if (isFnValue(first)) {
          return this.apply(first, expr.elements.slice(1));
        }

        if (first === 'Symbol' && typeof first === 'string') {
          return this.specialForm(first as string, expr.elements.slice(1));
        }

        if (typeof first === 'string') {
          return this.specialForm(first, expr.elements.slice(1));
        }

        throw new Error(`Cannot call non-function`);
      }

      case 'Vector': {
        return {
          type: 'vector',
          values: expr.elements.map(e => this.eval(e)),
        };
      }

      case 'Map': {
        const entries: Record<string, Value> = {};
        for (const pair of expr.pairs) {
          const key = this.eval(pair.key);
          if (typeof key !== 'string') {
            throw new Error('Map keys must be strings');
          }
          entries[key] = this.eval(pair.value);
        }
        return { type: 'map', entries };
      }

      case 'Quote':
        return this.evalQuote(expr.expr);

      case 'Quasiquote':
        return this.evalQuasiquote(expr.expr);

      case 'Unquote':
        throw new Error('Unquote outside quasiquote');

      case 'Splice':
        throw new Error('Splice outside quasiquote');

      default:
        throw new Error(`Unknown expression type: ${(expr as any).type}`);
    }
  }

  private lookupInParent(env: Env, name: string): Value {
    const value = env.bindings[name];
    if (value !== undefined) {
      return value;
    }
    if (env.parent) {
      return this.lookupInParent(env.parent, name);
    }
    throw new Error(`Undefined symbol: ${name}`);
  }

  private apply(fn: FnValue, args: Expr[]): Value {
    const evaluatedArgs = args.map(a => this.eval(a));

    if (fn.body.length === 0) {
      return { type: 'fn', params: fn.params, body: [], env: fn.env };
    }

    const newEnv: Env = {
      parent: fn.env,
      bindings: {},
    };

    for (let i = 0; i < fn.params.length; i++) {
      newEnv.bindings[fn.params[i]] = evaluatedArgs[i];
    }

    const nestedEval = new Evaluator(newEnv);
    let result: Value = null;

    for (const expr of fn.body) {
      result = nestedEval.eval(expr);
    }

    return result;
  }

  private specialForm(name: string, args: Expr[]): Value {
    switch (name) {
      case 'fn': {
        const params = ((args[0] as any)?.value || '').split(' ').filter(Boolean);
        const body = args.slice(1);
        return { type: 'fn' as const, params, body, env: this.env };
      }

      case 'def': {
        const sym = args[0] as any;
        const value = this.eval(args[1]);
        this.env.bindings[sym.value] = value;
        return null;
      }

      case 'defn': {
        const n = args[0] as any;
        const nameStr = n.value;
        const params = ((args[1] as any)?.value || '').split(' ').filter(Boolean);
        const body = args.slice(2);
        const fn = { type: 'fn' as const, params, body, env: this.env };
        this.env.bindings[nameStr] = fn;
        return null;
      }

      case 'defmacro': {
        const mname = (args[0] as any).value;
        const params = ((args[1] as any)?.value || '').split(' ').filter(Boolean);
        const body = args.slice(2);
        this.macros.set(mname, { params, body });
        return null;
      }

      case 'let': {
        const bindings = (args[0] as any).elements;
        const body = args.slice(1);
        const newEnv: Env = {
          parent: this.env,
          bindings: {},
        };
        const nestedEval = new Evaluator(newEnv);

        for (let i = 0; i < bindings.length; i += 2) {
          const sym = bindings[i] as any;
          const value = this.eval(bindings[i + 1]);
          newEnv.bindings[sym.value] = value;
        }

        let result: Value = null;
        for (const expr of body) {
          result = nestedEval.eval(expr);
        }
        return result;
      }

      case 'if': {
        const condition = this.eval(args[0]);
        if (condition !== false && condition !== null) {
          return this.eval(args[1]);
        } else if (args[2]) {
          return this.eval(args[2]);
        }
        return null;
      }

      case 'do': {
        let result: Value = null;
        for (const expr of args) {
          result = this.eval(expr);
        }
        return result;
      }

      default: {
        const macro = this.macros.get(name);
        if (macro) {
          const expanded = this.expandMacro(name, macro, args);
          return this.eval(expanded);
        }
        throw new Error(`Unknown special form: ${name}`);
      }
    }
  }

  private expandMacro(name: string, macro: { params: string[]; body: Expr[] }, args: Expr[]): Expr {
    const newEnv: Record<string, string> = {};

    for (let i = 0; i < macro.params.length; i++) {
      const arg = args[i] as any;
      newEnv[macro.params[i]] = arg?.value || '';
    }

    const hygienicEnv: Record<string, string> = {};
    const counter = { value: 0 };

    for (const param of macro.params) {
      counter.value++;
      const sym = `${param}__gen${counter.value}`;
      hygienicEnv[param] = sym;
    }

    const expanded = this.substitute(macro.body[0], hygienicEnv);
    return expanded;
  }

  private substitute(expr: Expr, env: Record<string, string>): Expr {
    switch (expr.type) {
      case 'Symbol': {
        const value = env[expr.value];
        if (value) {
          return { type: 'Symbol', value };
        }
        return expr;
      }

      case 'List': {
        if (expr.elements.length > 0) {
          const first = expr.elements[0];
          if (first.type === 'Symbol' && (first as any).value === 'unquote') {
            const symValue = env[(expr.elements[1] as any).value];
            if (symValue) {
              return { type: 'Symbol', value: symValue };
            }
          }
        }
        return {
          type: 'List',
          elements: expr.elements.map(e => this.substitute(e, env)),
        };
      }

      default:
        return expr;
    }
  }

  private evalQuote(expr: Expr): Value {
    switch (expr.type) {
      case 'Symbol':
        return (expr as any).value;
      case 'List':
        return {
          type: 'list',
          values: (expr as any).elements.map((e: Expr) => this.evalQuote(e)),
        };
      case 'Vector':
        return {
          type: 'vector',
          values: (expr as any).elements.map((e: Expr) => this.evalQuote(e)),
        };
      case 'Map':
        return {
          type: 'map',
          entries: {},
        };
      default:
        return this.eval(expr);
    }
  }

  private evalQuasiquote(expr: Expr): Value {
    switch (expr.type) {
      case 'Unquote':
        return this.eval((expr as any).expr);
      case 'Splice': {
        const value = this.eval((expr as any).expr);
        if (isListValue(value)) {
          return { type: 'splice', values: value.values };
        }
        return { type: 'splice', values: [value] };
      }
      case 'List': {
        const list = expr as any;
        const values: Value[] = [];
        for (const e of list.elements) {
          const result = this.evalQuasiquote(e);
          if (result && typeof result === 'object' && (result as any).type === 'splice') {
            values.push(...(result as SpliceValue).values);
          } else {
            values.push(result);
          }
        }
        return { type: 'list', values };
      }
      default:
        return this.evalQuote(expr);
    }
  }
}
