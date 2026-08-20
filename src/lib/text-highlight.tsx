function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countMatches(text: string, term: string): number {
  const t = term.trim();
  if (!t || !text) return 0;
  const re = new RegExp(escapeRegExp(t), "gi");
  return (text.match(re) ?? []).length;
}

// Splits `text` on case-insensitive matches of `term` and wraps each match in
// <mark>. `text-inherit` on the mark means it reads normally inside visible
// text (Resultado Final) but disappears when the parent forces text-transparent
// (the HighlightedTextarea/HighlightedInput backdrop layer) — only the mark's
// background shows through there.
export function renderHighlighted(text: string, term: string): React.ReactNode {
  const t = term.trim();
  if (!t || !text) return text;
  const re = new RegExp(`(${escapeRegExp(t)})`, "gi");
  const parts = text.split(re);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-[3px] bg-highlight text-inherit">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
