"use client";

import { useRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type UIEvent } from "react";
import { renderHighlighted } from "@/lib/text-highlight";

// Strips `bg-*` tokens (exact class match, not substring) so the foreground
// field can be made transparent without a Tailwind cascade-order fight —
// the backdrop layer keeps the original background so the highlighted
// marks show through it at the right spots.
function stripBg(className: string) {
  return className
    .split(/\s+/)
    .filter((c) => c && !c.startsWith("bg-"))
    .join(" ");
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  highlight?: string;
  wrapperClassName?: string;
};

// Renders a normal <textarea> when there's no active search term (byte-identical
// to before). When a term is present, layers a read-only backdrop <div> with the
// same text (matches wrapped in <mark>) behind a transparent-background textarea,
// so the docente sees highlights right where they type while still editing the
// real form control on top.
export function HighlightedTextarea({ highlight, wrapperClassName, className = "", value, onScroll, ...rest }: TextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const text = typeof value === "string" ? value : "";
  const activo = Boolean(highlight?.trim());

  if (!activo) {
    return <textarea value={value} className={`${wrapperClassName ?? ""} ${className}`.trim()} {...rest} />;
  }

  const syncScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    onScroll?.(e);
  };

  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <div
        ref={backdropRef}
        aria-hidden
        className={`${className} pointer-events-none absolute inset-0 w-full overflow-hidden whitespace-pre-wrap break-words text-transparent`}
      >
        {renderHighlighted(text, highlight!)}
      </div>
      <textarea
        value={value}
        onScroll={syncScroll}
        className={`${stripBg(className)} relative w-full bg-transparent`}
        {...rest}
      />
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  highlight?: string;
  wrapperClassName?: string;
};

export function HighlightedInput({ highlight, wrapperClassName, className = "", value, onScroll, ...rest }: InputProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const text = typeof value === "string" ? value : "";
  const activo = Boolean(highlight?.trim());

  if (!activo) {
    return <input value={value} className={`${wrapperClassName ?? ""} ${className}`.trim()} {...rest} />;
  }

  const syncScroll = (e: UIEvent<HTMLInputElement>) => {
    if (backdropRef.current) backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    onScroll?.(e);
  };

  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <div
        ref={backdropRef}
        aria-hidden
        className={`${className} pointer-events-none absolute inset-0 w-full overflow-hidden whitespace-pre text-transparent`}
      >
        {renderHighlighted(text, highlight!)}
      </div>
      <input
        value={value}
        onScroll={syncScroll}
        className={`${stripBg(className)} relative w-full bg-transparent`}
        {...rest}
      />
    </div>
  );
}
