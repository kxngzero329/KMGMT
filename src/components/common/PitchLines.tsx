export function PitchLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 600"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <g stroke="currentColor" strokeWidth="1">
        <path d="M40 20H460V580H40Z M40 300H460 M145 20V110H355V20 M195 20V60H305V20 M145 580V490H355V580 M195 580V540H305V580" />
        <circle cx="250" cy="300" r="75" />
        <circle cx="250" cy="300" r="3" />
        <path d="M195 110Q250 175 305 110 M195 490Q250 425 305 490" />
      </g>
    </svg>
  );
}
