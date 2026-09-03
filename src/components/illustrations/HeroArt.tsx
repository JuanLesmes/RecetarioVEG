import { P } from './palette';

/** Composición decorativa de la portada: hojas, un bowl y granos flotando. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="hero-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.leaf} />
          <stop offset="1" stopColor={P.greenDark} />
        </linearGradient>
        <linearGradient id="hero-leaf2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.lime} />
          <stop offset="1" stopColor={P.green} />
        </linearGradient>
      </defs>
      <g opacity="0.95">
        <path d="M250 30 C300 40 316 100 286 150 C250 130 224 80 250 30 Z" fill="url(#hero-leaf)" />
        <path d="M252 34 C266 70 276 110 284 146" stroke={P.plate} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M40 200 C20 150 60 110 110 118 C104 172 80 206 40 200 Z" fill="url(#hero-leaf2)" />
        <path d="M44 196 C64 168 84 142 106 122" stroke={P.plate} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      </g>
      <ellipse cx="170" cy="222" rx="80" ry="10" fill={P.shadow} />
      <path d="M96 150 H244 C244 194 212 220 170 220 C128 220 96 194 96 150 Z" fill={P.bowlBlue} />
      <path d="M116 196 C132 212 150 220 170 220 C212 220 244 194 244 150 H228 C228 182 204 204 170 204 C150 204 132 202 116 196 Z" fill={P.bowlBlueDark} opacity="0.6" />
      <ellipse cx="170" cy="150" rx="74" ry="16" fill={P.bowlBlueDark} />
      <ellipse cx="170" cy="148" rx="66" ry="12" fill={P.cream} />
      <path d="M114 146 C124 120 150 116 168 126 C186 112 216 120 226 146 Z" fill={P.cream} />
      <ellipse cx="132" cy="138" rx="16" ry="10" fill={P.green} />
      <ellipse cx="132" cy="136" rx="10" ry="6" fill={P.lime} />
      <circle cx="160" cy="132" r="6" fill={P.yellow} />
      <circle cx="172" cy="140" r="6" fill={P.yellow} />
      <circle cx="150" cy="144" r="5" fill={P.yellow} />
      <circle cx="198" cy="134" r="11" fill={P.red} />
      <circle cx="198" cy="134" r="5" fill={P.tomato} />
      <ellipse cx="214" cy="144" rx="10" ry="6" fill={P.orange} />
      <ellipse cx="184" cy="146" rx="11" ry="6" fill={P.purple} opacity="0.8" />
      <g fill={P.yellow} opacity="0.9">
        <circle cx="70" cy="60" r="5" />
        <circle cx="96" cy="40" r="3.5" />
        <circle cx="120" cy="70" r="4" />
      </g>
      <g fill={P.red} opacity="0.9">
        <circle cx="228" cy="200" r="4" />
        <circle cx="286" cy="182" r="5" />
      </g>
      <g fill={P.green} opacity="0.9">
        <path d="M150 50 c-8 -2 -10 -10 -4 -16 c6 2 8 8 4 16 Z" />
        <path d="M290 84 c-8 -2 -10 -10 -4 -16 c6 2 8 8 4 16 Z" />
      </g>
    </svg>
  );
}
