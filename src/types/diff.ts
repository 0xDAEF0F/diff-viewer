export type LineType = "added" | "deleted" | "context" | "meta";

export interface DiffLine {
  type: LineType;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface SideBySideLine {
  left?: DiffLine;
  right?: DiffLine;
}
