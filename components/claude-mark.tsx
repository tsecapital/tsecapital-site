// Stylized radiant "spark" mark used in the Claude lockups. Decorative, drawn
// in currentColor so it inherits the surrounding text color. This is an
// original mark — drop an official Anthropic/Claude SVG into /public and swap
// this out if you want the exact brand asset.
export function ClaudeMark({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {rays.map((a) => (
          <line key={a} x1="24" y1="17" x2="24" y2="3" transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
    </svg>
  );
}
