import type { Token, TokenType } from "../types/highlight";
import type { DiffLine } from "../types/diff";
import { getWasmPath } from "./languageMap";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Parser: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let parserInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languageCache = new Map<string, any>();

export async function initHighlighter(): Promise<void> {
  if (parserInstance) return;

  const module = await import("web-tree-sitter");
  Parser = module.default ?? module;

  await Parser.init({
    locateFile: () => "/wasm/tree-sitter.wasm",
  });
  parserInstance = new Parser();
}

export async function loadLanguage(lang: string): Promise<unknown> {
  const cached = languageCache.get(lang);
  if (cached) return cached;

  const wasmPath = getWasmPath(lang);
  const language = await Parser.Language.load(wasmPath);
  languageCache.set(lang, language);
  return language;
}

const nodeTypeToToken: Record<string, TokenType> = {
  // Keywords
  if: "keyword",
  else: "keyword",
  for: "keyword",
  while: "keyword",
  return: "keyword",
  function: "keyword",
  const: "keyword",
  let: "keyword",
  var: "keyword",
  class: "keyword",
  import: "keyword",
  export: "keyword",
  from: "keyword",
  async: "keyword",
  await: "keyword",
  new: "keyword",
  this: "keyword",
  super: "keyword",
  extends: "keyword",
  implements: "keyword",
  interface: "keyword",
  type: "keyword",
  enum: "keyword",
  public: "keyword",
  private: "keyword",
  protected: "keyword",
  static: "keyword",
  readonly: "keyword",
  fn: "keyword",
  pub: "keyword",
  mod: "keyword",
  use: "keyword",
  struct: "keyword",
  impl: "keyword",
  trait: "keyword",
  where: "keyword",
  mut: "keyword",
  match: "keyword",
  def: "keyword",
  lambda: "keyword",
  try: "keyword",
  catch: "keyword",
  finally: "keyword",
  throw: "keyword",
  typeof: "keyword",
  instanceof: "keyword",
  in: "keyword",
  of: "keyword",
  as: "keyword",

  // Strings
  string: "string",
  string_literal: "string",
  template_string: "string",
  raw_string_literal: "string",
  string_content: "string",
  escape_sequence: "string",

  // Numbers
  number: "number",
  integer: "number",
  integer_literal: "number",
  float: "number",
  float_literal: "number",

  // Comments
  comment: "comment",
  line_comment: "comment",
  block_comment: "comment",

  // Functions
  function_declaration: "function",
  method_definition: "function",
  arrow_function: "function",
  call_expression: "function",

  // Types
  type_identifier: "type",
  predefined_type: "type",
  generic_type: "type",
  type_annotation: "type",
  primitive_type: "type",

  // Properties
  property_identifier: "property",
  shorthand_property_identifier: "property",
  field_identifier: "property",

  // Constants
  true: "constant",
  false: "constant",
  null: "constant",
  undefined: "constant",
  none: "constant",
  None: "constant",
  True: "constant",
  False: "constant",

  // Operators
  binary_expression: "operator",
  unary_expression: "operator",

  // Punctuation
  "{": "punctuation",
  "}": "punctuation",
  "(": "punctuation",
  ")": "punctuation",
  "[": "punctuation",
  "]": "punctuation",
  ";": "punctuation",
  ":": "punctuation",
  ",": "punctuation",
  ".": "punctuation",
};

export function getTokenType(nodeType: string): TokenType {
  return nodeTypeToToken[nodeType] ?? "default";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectTokens(node: any, tokens: Token[]): void {
  if (node.childCount === 0) {
    const tokenType = getTokenType(node.type);
    tokens.push({
      type: tokenType,
      content: node.text,
      start: node.startIndex,
      end: node.endIndex,
    });
  } else {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) collectTokens(child, tokens);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tokenizeLine(tree: any, originalText: string): Token[] {
  const rawTokens: Token[] = [];
  collectTokens(tree.rootNode, rawTokens);
  rawTokens.sort((a, b) => a.start - b.start);

  // Fill in gaps (whitespace) between tokens
  const tokens: Token[] = [];
  let lastEnd = 0;

  for (const token of rawTokens) {
    if (token.start > lastEnd) {
      // There's a gap - add whitespace token
      tokens.push({
        type: "default",
        content: originalText.slice(lastEnd, token.start),
        start: lastEnd,
        end: token.start,
      });
    }
    tokens.push(token);
    lastEnd = token.end;
  }

  // Add any trailing content
  if (lastEnd < originalText.length) {
    tokens.push({
      type: "default",
      content: originalText.slice(lastEnd),
      start: lastEnd,
      end: originalText.length,
    });
  }

  return tokens;
}

export async function highlightLines(
  lines: DiffLine[],
  language: string
): Promise<DiffLine[]> {
  if (!parserInstance) {
    await initHighlighter();
  }

  try {
    const lang = await loadLanguage(language);
    parserInstance.setLanguage(lang);

    return lines.map((line) => {
      if (line.type === "meta") return line;

      const tree = parserInstance.parse(line.content);
      if (!tree) return line;

      const tokens = tokenizeLine(tree, line.content);

      return {
        ...line,
        tokens,
      };
    });
  } catch (error) {
    console.error("Highlighting failed:", error);
    return lines;
  }
}
