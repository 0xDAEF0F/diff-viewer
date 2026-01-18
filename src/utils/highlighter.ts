import type { Token, TokenType, LineTokenMap } from "../types/highlight";
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

function buildLineOffsets(content: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

function findLineForOffset(offsets: number[], offset: number): number {
  let low = 0;
  let high = offsets.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (offsets[mid] <= offset) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

function mapTokensToLines(content: string, tokens: Token[]): LineTokenMap {
  const lineOffsets = buildLineOffsets(content);
  const lineTokenMap: LineTokenMap = new Map();
  const lines = content.split("\n");

  // Initialize empty arrays for all lines (1-indexed)
  for (let i = 0; i < lines.length; i++) {
    lineTokenMap.set(i + 1, []);
  }

  for (const token of tokens) {
    const startLine = findLineForOffset(lineOffsets, token.start);
    const endLine = findLineForOffset(lineOffsets, Math.max(token.start, token.end - 1));

    if (startLine === endLine) {
      // Token is on a single line
      const lineStart = lineOffsets[startLine];
      const lineTokens = lineTokenMap.get(startLine + 1) ?? [];
      lineTokens.push({
        type: token.type,
        content: token.content,
        start: token.start - lineStart,
        end: token.end - lineStart,
      });
      lineTokenMap.set(startLine + 1, lineTokens);
    } else {
      // Token spans multiple lines - split it
      for (let line = startLine; line <= endLine; line++) {
        const lineStart = lineOffsets[line];
        const lineEnd = line + 1 < lineOffsets.length ? lineOffsets[line + 1] - 1 : content.length;
        const tokenStartInFile = Math.max(token.start, lineStart);
        const tokenEndInFile = Math.min(token.end, lineEnd + 1);
        const tokenContent = content.slice(tokenStartInFile, tokenEndInFile);

        if (tokenContent.length > 0) {
          const lineTokens = lineTokenMap.get(line + 1) ?? [];
          lineTokens.push({
            type: token.type,
            content: tokenContent,
            start: tokenStartInFile - lineStart,
            end: tokenEndInFile - lineStart,
          });
          lineTokenMap.set(line + 1, lineTokens);
        }
      }
    }
  }

  // Sort tokens by start position and fill gaps
  for (const [lineNum, lineTokens] of lineTokenMap) {
    lineTokens.sort((a, b) => a.start - b.start);

    const lineContent = lines[lineNum - 1] ?? "";
    const filledTokens: Token[] = [];
    let lastEnd = 0;

    for (const token of lineTokens) {
      if (token.start > lastEnd) {
        filledTokens.push({
          type: "default",
          content: lineContent.slice(lastEnd, token.start),
          start: lastEnd,
          end: token.start,
        });
      }
      filledTokens.push(token);
      lastEnd = token.end;
    }

    if (lastEnd < lineContent.length) {
      filledTokens.push({
        type: "default",
        content: lineContent.slice(lastEnd),
        start: lastEnd,
        end: lineContent.length,
      });
    }

    lineTokenMap.set(lineNum, filledTokens);
  }

  return lineTokenMap;
}

async function parseFullFile(content: string, language: string): Promise<LineTokenMap> {
  if (!parserInstance) {
    await initHighlighter();
  }

  const lang = await loadLanguage(language);
  parserInstance.setLanguage(lang);

  const tree = parserInstance.parse(content);
  if (!tree) {
    return new Map();
  }

  const tokens: Token[] = [];
  collectTokens(tree.rootNode, tokens);
  tokens.sort((a, b) => a.start - b.start);

  return mapTokensToLines(content, tokens);
}

export async function highlightLines(
  lines: DiffLine[],
  language: string,
  oldContent: string | null,
  newContent: string | null
): Promise<DiffLine[]> {
  if (!parserInstance) {
    await initHighlighter();
  }

  try {
    // Parse full files to get token maps
    const oldTokenMap = oldContent ? await parseFullFile(oldContent, language) : null;
    const newTokenMap = newContent ? await parseFullFile(newContent, language) : null;

    return lines.map((line) => {
      if (line.type === "meta") return line;

      let tokens: Token[] | undefined;
      const { oldLine, newLine } = line;

      if (line.type === "deleted" && oldTokenMap && oldLine !== undefined) {
        tokens = oldTokenMap.get(oldLine);
      } else if (line.type === "added" && newTokenMap && newLine !== undefined) {
        tokens = newTokenMap.get(newLine);
      } else if (line.type === "context") {
        // Context lines exist in both - prefer new, fallback to old
        if (newTokenMap && newLine !== undefined) {
          tokens = newTokenMap.get(newLine);
        } else if (oldTokenMap && oldLine !== undefined) {
          tokens = oldTokenMap.get(oldLine);
        }
      }

      if (tokens && tokens.length > 0) {
        return { ...line, tokens };
      }

      return line;
    });
  } catch (error) {
    console.error("Highlighting failed:", error);
    return lines;
  }
}
