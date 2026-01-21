export interface SourceLocation {
  start: number;
  end: number;
  line: number;
  column: number;
}

export interface Node {
  type: string;
  location?: SourceLocation;
}

export interface Program extends Node {
  type: 'Program';
  body: Expr[];
}

export type Expr =
  | Literal
  | Symbol
  | List
  | Vector
  | Map
  | Quote
  | Quasiquote
  | Unquote
  | Lambda
  | Let
  | If
  | Def
  | Defn
  | DefMacro
  | Do
  | Match
  | Splice;

export interface Literal extends Node {
  type: 'Literal';
  value: number | string | boolean | null;
}

export interface Symbol extends Node {
  type: 'Symbol';
  value: string;
}

export interface List extends Node {
  type: 'List';
  elements: Expr[];
}

export interface Vector extends Node {
  type: 'Vector';
  elements: Expr[];
}

export interface Map extends Node {
  type: 'Map';
  pairs: MapPair[];
}

export interface MapPair {
  key: Expr;
  value: Expr;
}

export interface Quote extends Node {
  type: 'Quote';
  expr: Expr;
}

export interface Quasiquote extends Node {
  type: 'Quasiquote';
  expr: Expr;
}

export interface Unquote extends Node {
  type: 'Unquote';
  expr: Expr;
}

export interface Lambda extends Node {
  type: 'Lambda';
  params: string[];
  body: Expr[];
}

export interface Let extends Node {
  type: 'Let';
  bindings: [Expr, Expr][];
  body: Expr[];
}

export interface If extends Node {
  type: 'If';
  condition: Expr;
  thenBranch: Expr;
  elseBranch?: Expr;
}

export interface Def extends Node {
  type: 'Def';
  name: string;
  value: Expr;
}

export interface Defn extends Node {
  type: 'Defn';
  name: string;
  params: string[];
  body: Expr[];
}

export interface DefMacro extends Node {
  type: 'DefMacro';
  name: string;
  params: string[];
  body: Expr[];
}

export interface Do extends Node {
  type: 'Do';
  body: Expr[];
}

export interface Match extends Node {
  type: 'Match';
  expr: Expr;
  clauses: [Expr, Expr][];
}

export interface Splice extends Node {
  type: 'Splice';
  expr: Expr;
}

export type Value = 
  | number 
  | string 
  | boolean 
  | null 
  | ListValue 
  | VectorValue 
  | MapValue 
  | FnValue;

export interface ListValue {
  type: 'list';
  values: Value[];
}

export interface VectorValue {
  type: 'vector';
  values: Value[];
}

export interface MapValue {
  type: 'map';
  entries: Record<string, Value>;
}

export interface FnValue {
  type: 'fn';
  params: string[];
  body: Expr[];
  env: Env;
}

export interface Env {
  parent: Env | null;
  bindings: Record<string, Value>;
}

export function createLocation(start: number, end: number, line: number, column: number): SourceLocation {
  return { start, end, line, column };
}
