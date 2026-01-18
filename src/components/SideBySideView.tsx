import type { DiffLine, SideBySideLine } from "../types/diff";
import { HighlightedLine } from "./HighlightedLine";

interface SideBySideViewProps {
  lines: DiffLine[];
}

function buildSideBySideLines(lines: DiffLine[]): SideBySideLine[] {
  const result: SideBySideLine[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "meta") {
      result.push({ left: line, right: line });
      i++;
    } else if (line.type === "context") {
      result.push({ left: line, right: line });
      i++;
    } else if (line.type === "deleted") {
      // Collect consecutive deletions and additions
      const deletions: DiffLine[] = [];
      const additions: DiffLine[] = [];

      while (i < lines.length && lines[i].type === "deleted") {
        deletions.push(lines[i]);
        i++;
      }
      while (i < lines.length && lines[i].type === "added") {
        additions.push(lines[i]);
        i++;
      }

      // Pair deletions with additions
      const maxLen = Math.max(deletions.length, additions.length);
      for (let j = 0; j < maxLen; j++) {
        result.push({
          left: deletions[j],
          right: additions[j],
        });
      }
    } else if (line.type === "added") {
      result.push({ right: line });
      i++;
    } else {
      i++;
    }
  }

  return result;
}

function renderCell(line?: DiffLine, isLeft?: boolean) {
  if (!line) {
    return (
      <>
        <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)] bg-[var(--bg-tertiary)]">
          {""}
        </td>
        <td className="pl-2 whitespace-pre bg-[var(--bg-tertiary)]">{""}</td>
      </>
    );
  }

  const lineNum = isLeft ? line.oldLine : line.newLine;
  const bgClass =
    line.type === "added"
      ? "bg-green-500/20"
      : line.type === "deleted"
        ? "bg-red-500/20"
        : line.type === "meta"
          ? "bg-[var(--bg-tertiary)]"
          : "";
  const textClass =
    line.type === "meta"
      ? "text-[var(--text-secondary)] italic"
      : "";

  const fallbackTextClass =
    line.type === "added"
      ? "text-green-400"
      : line.type === "deleted"
        ? "text-red-400"
        : "text-[var(--text-primary)]";

  return (
    <>
      <td
        className={`w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)] ${bgClass}`}
      >
        {lineNum ?? ""}
      </td>
      <td className={`pl-2 whitespace-pre ${bgClass} ${textClass}`}>
        {line.tokens ? (
          <HighlightedLine tokens={line.tokens} />
        ) : (
          <span className={fallbackTextClass}>{line.content}</span>
        )}
      </td>
    </>
  );
}

export function SideBySideView({ lines }: SideBySideViewProps) {
  const sideBySideLines = buildSideBySideLines(lines);

  return (
    <table className="w-full font-mono text-sm border-collapse">
      <tbody>
        {sideBySideLines.map((row, idx) => (
          <tr key={idx}>
            {renderCell(row.left, true)}
            <td className="w-px bg-[var(--border-color)]" />
            {renderCell(row.right, false)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
