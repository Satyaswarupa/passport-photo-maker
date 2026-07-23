"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* matchMedia is an external store, so it is subscribed to rather than mirrored
 * into state. Defined at module scope to keep the subscription stable. */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribeMotion = (onChange) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getMotionSnapshot = () => window.matchMedia(REDUCED_MOTION).matches;
const getMotionServerSnapshot = () => false;

/**
 * Cycles through phrases with a typing / deleting effect.
 *
 * Three things this deliberately gets right:
 *  - The first phrase is the initial state, so it is present in the static
 *    HTML and the client's first render matches the server's.
 *  - The longest phrase is rendered invisibly underneath to reserve width,
 *    so the surrounding layout never jolts as the text grows and shrinks.
 *  - The animated text is hidden from assistive tech, which reads the plain
 *    sentence in `srLabel` instead of a stream of half-typed words.
 */
export default function Typewriter({
  words,
  srLabel,
  typingMs = 65,
  deletingMs = 30,
  holdMs = 1700,
  className = "",
}) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0]);
  const [phase, setPhase] = useState("hold"); // typing | hold | deleting

  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );
  const animate = !reducedMotion;

  useEffect(() => {
    if (!animate) return undefined;

    const word = words[index];
    let delay = typingMs;
    let next;

    if (phase === "typing") {
      if (text === word) {
        delay = 0;
        next = () => setPhase("hold");
      } else {
        next = () => setText(word.slice(0, text.length + 1));
      }
    } else if (phase === "hold") {
      delay = holdMs;
      next = () => setPhase("deleting");
    } else {
      if (text === "") {
        delay = typingMs;
        next = () => {
          setIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        };
      } else {
        delay = deletingMs;
        next = () => setText(word.slice(0, text.length - 1));
      }
    }

    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [animate, text, phase, index, words, typingMs, deletingMs, holdMs]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <>
      <span className="sr-only">{srLabel}</span>
      <span className="relative inline-flex" aria-hidden="true">
        {/* Invisible sizer keeps the line from reflowing as the text changes. */}
        <span className={`invisible ${className}`}>{longest}</span>
        <span className={`absolute inset-0 flex items-center whitespace-nowrap ${className}`}>
          {animate ? text : words[0]}
          {animate && <span className="nm-caret" />}
        </span>
      </span>
    </>
  );
}
