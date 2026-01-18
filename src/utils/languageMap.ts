const extensionToLanguage: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  rs: "rust",
  json: "json",
  css: "css",
  html: "html",
  htm: "html",
  py: "python",
  pyw: "python",
};

export function getLanguageFromPath(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return extensionToLanguage[ext] ?? null;
}

export function getWasmPath(language: string): string {
  return `/wasm/tree-sitter-${language}.wasm`;
}

export function getSupportedLanguages(): string[] {
  return [...new Set(Object.values(extensionToLanguage))];
}
