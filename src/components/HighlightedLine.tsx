import { memo } from "react";
import type { Token, TokenType } from "../types/highlight";

const tokenStyles: Record<TokenType, string> = {
  keyword: "text-purple-400",
  string: "text-green-400",
  number: "text-orange-400",
  comment: "text-gray-500 italic",
  function: "text-blue-400",
  variable: "text-cyan-400",
  type: "text-yellow-400",
  operator: "text-pink-400",
  punctuation: "text-gray-400",
  property: "text-cyan-300",
  constant: "text-orange-300",
  default: "",
};

interface HighlightedLineProps {
  tokens: Token[];
}

export const HighlightedLine = memo(function HighlightedLine({
  tokens,
}: HighlightedLineProps) {
  return (
    <>
      {tokens.map((token, idx) => (
        <span key={idx} className={tokenStyles[token.type]}>
          {token.content}
        </span>
      ))}
    </>
  );
});
