import type { Token } from "./highlight";

export type LineType = "added" | "deleted" | "context" | "meta";

export interface DiffLine {
  type: LineType;
  content: string;
  oldLine?: number;
  newLine?: number;
  tokens?: Token[];
}

export interface SideBySideLine {
  left?: DiffLine;
  right?: DiffLine;
}
