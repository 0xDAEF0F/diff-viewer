import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const wasmDir = join(root, "public", "wasm");
const nodeModules = join(root, "node_modules");

if (!existsSync(wasmDir)) {
  mkdirSync(wasmDir, { recursive: true });
}

// Copy core tree-sitter WASM (handle both old and new naming)
const wasmName = existsSync(join(nodeModules, "web-tree-sitter", "tree-sitter.wasm"))
  ? "tree-sitter.wasm"
  : "web-tree-sitter.wasm";
copyFileSync(
  join(nodeModules, "web-tree-sitter", wasmName),
  join(wasmDir, "tree-sitter.wasm")
);

// Copy language WASMs
const languages = [
  "typescript",
  "tsx",
  "javascript",
  "rust",
  "json",
  "css",
  "html",
  "python",
];

for (const lang of languages) {
  const src = join(nodeModules, "tree-sitter-wasms", "out", `tree-sitter-${lang}.wasm`);
  const dest = join(wasmDir, `tree-sitter-${lang}.wasm`);
  if (existsSync(src)) {
    copyFileSync(src, dest);
  }
}

console.log("WASM files copied to public/wasm/");
