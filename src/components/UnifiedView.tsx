import type { DiffLine } from "../types/diff";
import { HighlightedLine } from "./HighlightedLine";

interface UnifiedViewProps {
  lines: DiffLine[];
}

export function UnifiedView({ lines }: UnifiedViewProps) {
  return (
    <table className="w-full font-mono text-sm border-collapse">
      <tbody>
        {lines.map((line, idx) => (
          <tr
            key={idx}
            className={
              line.type === "added"
                ? "bg-green-500/20"
                : line.type === "deleted"
                  ? "bg-red-500/20"
                  : line.type === "meta"
                    ? "bg-[var(--bg-tertiary)]"
                    : ""
            }
          >
            <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)]">
              {line.oldLine ?? ""}
            </td>
            <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)]">
              {line.newLine ?? ""}
            </td>
            <td className="w-6 text-center select-none text-[var(--text-secondary)]">
              {line.type === "added"
                ? "+"
                : line.type === "deleted"
                  ? "-"
                  : " "}
            </td>
            <td
              className={`pl-2 whitespace-pre ${
                line.type === "meta"
                  ? "text-[var(--text-secondary)] italic"
                  : ""
              }`}
            >
              {line.tokens ? (
                <HighlightedLine tokens={line.tokens} />
              ) : (
                <span
                  className={
                    line.type === "added"
                      ? "text-green-400"
                      : line.type === "deleted"
                        ? "text-red-400"
                        : "text-[var(--text-primary)]"
                  }
                >
                  {line.content}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
