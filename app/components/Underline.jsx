/**
 * Wraps a phrase in a hand-drawn marker stroke that draws itself in on load.
 *
 * Server component: the animation is pure CSS, so the text stays in the
 * static HTML and no JavaScript is needed to render it.
 */
export default function Underline({ children, className = "" }) {
  return (
    <span className={`nm-underline ${className}`}>
      {children}
      <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path
          d="M4 13.5C52 6.5 104 15.5 152 9.5C200 3.5 248 12 296 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
