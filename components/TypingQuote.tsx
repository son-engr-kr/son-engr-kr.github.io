"use client";

import { useEffect, useState } from "react";

const FULL_TEXT =
  "“Dreams feel real while we’re in them.” · Inception · So do good simulations.";
const TYPING_SPEED_MS = 35;

export function TypingQuote() {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (length >= FULL_TEXT.length) return;
    const t = setTimeout(() => setLength((n) => n + 1), TYPING_SPEED_MS);
    return () => clearTimeout(t);
  }, [length]);

  return (
    <p className="relative mt-4 max-w-2xl text-[var(--color-fg)]">
      <span aria-hidden className="invisible">
        {FULL_TEXT}
      </span>
      <span className="absolute inset-0">
        {FULL_TEXT.slice(0, length)}
        <span
          aria-hidden
          className="ml-0.5 inline-block w-[2px] animate-cursor-blink bg-[var(--color-accent)] align-baseline"
          style={{ height: "1em" }}
        />
      </span>
      <span className="sr-only">{FULL_TEXT}</span>
    </p>
  );
}
