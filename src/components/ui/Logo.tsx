import * as React from "react";

/**
 * Merklogo: vulpen-punt die uit een open boek omhoog komt (blauw-teal verloop),
 * nagemaakt als SVG. `mono` rendert een wit silhouet voor donkere achtergronden.
 */
export function LogoMark({
  size = 32,
  mono = false,
  className,
}: {
  size?: number;
  mono?: boolean;
  className?: string;
}) {
  const fill = mono ? "#ffffff" : "url(#bijlesLogoGrad)";
  const cut = mono ? "rgba(255,255,255,0)" : "#eafaff";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {!mono && (
        <defs>
          <linearGradient id="bijlesLogoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3cc6d6" />
            <stop offset="1" stopColor="#1f5e8a" />
          </linearGradient>
        </defs>
      )}
      {/* open boek */}
      <path d="M60 82 L18 72 L13 91 L60 101 Z" fill={fill} />
      <path d="M60 82 L102 72 L107 91 L60 101 Z" fill={fill} />
      {/* schacht + kraagband */}
      <rect x="56" y="60" width="8" height="24" rx="2" fill={fill} />
      <rect x="50.5" y="55" width="19" height="7" rx="2.5" fill={fill} />
      {/* pen-punt */}
      <path d="M60 8 L76 46 C76 53 69 57 60 57 C51 57 44 53 44 46 Z" fill={fill} />
      {/* spleet + luchtgat (negatieve ruimte) */}
      <line x1="60" y1="16" x2="60" y2="43" stroke={cut} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="46.5" r="3" fill={cut} />
    </svg>
  );
}
