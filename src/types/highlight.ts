export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "function"
  | "variable"
  | "type"
  | "operator"
  | "punctuation"
  | "property"
  | "constant"
  | "default";

export interface Token {
  type: TokenType;
  content: string;
  start: number;
  end: number;
}

export type LineTokenMap = Map<number, Token[]>;
