interface Props {
  size?: number;
  hat?: "none" | "cap" | "crown" | "graduation";
  glasses?: "none" | "round" | "sun";
  mood?: "happy" | "focus" | "wink";
  className?: string;
}

/**
 * Carraco — a cute owl mascot that represents focus + wisdom.
 * Fully SVG, themable via currentColor, supports a few unlockable items.
 */
const Mascot = ({ size = 120, hat = "none", glasses = "none", mood = "happy", className = "" }: Props) => {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(234 89% 78%)" />
            <stop offset="100%" stopColor="hsl(328 86% 72%)" />
          </linearGradient>
          <radialGradient id="cheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="hsl(328 90% 75% / 0.7)" />
            <stop offset="100%" stopColor="hsl(328 90% 75% / 0)" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="60" cy="110" rx="28" ry="4" fill="hsl(234 50% 30% / 0.18)" />

        {/* Body */}
        <ellipse cx="60" cy="68" rx="36" ry="38" fill="url(#body)" />

        {/* Belly */}
        <ellipse cx="60" cy="78" rx="22" ry="22" fill="white" fillOpacity="0.95" />

        {/* Wings */}
        <path d="M28 60 Q22 78 30 92 Q35 84 36 70 Z" fill="hsl(234 70% 60%)" opacity="0.9" />
        <path d="M92 60 Q98 78 90 92 Q85 84 84 70 Z" fill="hsl(328 70% 60%)" opacity="0.9" />

        {/* Ear tufts */}
        <path d="M34 36 L38 22 L46 34 Z" fill="hsl(234 70% 55%)" />
        <path d="M86 36 L82 22 L74 34 Z" fill="hsl(328 70% 55%)" />

        {/* Eyes background */}
        <circle cx="46" cy="56" r="13" fill="white" />
        <circle cx="74" cy="56" r="13" fill="white" />

        {/* Pupils */}
        {mood === "wink" ? (
          <>
            <circle cx="46" cy="58" r="5" fill="hsl(230 40% 12%)" />
            <path d="M68 56 Q74 60 80 56" stroke="hsl(230 40% 12%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="46" cy="58" r="5" fill="hsl(230 40% 12%)" />
            <circle cx="74" cy="58" r="5" fill="hsl(230 40% 12%)" />
            <circle cx="48" cy="56" r="1.6" fill="white" />
            <circle cx="76" cy="56" r="1.6" fill="white" />
          </>
        )}

        {/* Cheeks */}
        <circle cx="34" cy="72" r="6" fill="url(#cheek)" />
        <circle cx="86" cy="72" r="6" fill="url(#cheek)" />

        {/* Beak */}
        <path d="M55 70 L65 70 L60 78 Z" fill="hsl(38 92% 55%)" />

        {/* Mouth */}
        {mood === "focus" ? (
          <line x1="56" y1="84" x2="64" y2="84" stroke="hsl(230 40% 20%)" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M54 82 Q60 88 66 82" stroke="hsl(230 40% 20%)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* Glasses */}
        {glasses === "round" && (
          <g stroke="hsl(230 40% 20%)" strokeWidth="2" fill="none">
            <circle cx="46" cy="58" r="11" />
            <circle cx="74" cy="58" r="11" />
            <line x1="57" y1="58" x2="63" y2="58" />
          </g>
        )}
        {glasses === "sun" && (
          <g fill="hsl(230 40% 12%)" stroke="hsl(230 40% 12%)" strokeWidth="2">
            <rect x="35" y="50" width="22" height="12" rx="4" />
            <rect x="63" y="50" width="22" height="12" rx="4" />
            <line x1="57" y1="56" x2="63" y2="56" />
          </g>
        )}

        {/* Hat */}
        {hat === "cap" && (
          <g>
            <path d="M30 38 Q60 14 90 38 L90 44 L30 44 Z" fill="hsl(234 89% 60%)" />
            <ellipse cx="60" cy="44" rx="34" ry="4" fill="hsl(234 89% 50%)" />
          </g>
        )}
        {hat === "crown" && (
          <g fill="hsl(38 92% 55%)" stroke="hsl(38 92% 40%)" strokeWidth="1.5">
            <path d="M34 36 L42 22 L50 34 L60 18 L70 34 L78 22 L86 36 L86 44 L34 44 Z" />
            <circle cx="60" cy="26" r="2.5" fill="hsl(328 86% 60%)" />
          </g>
        )}
        {hat === "graduation" && (
          <g>
            <rect x="28" y="36" width="64" height="8" fill="hsl(230 40% 15%)" />
            <polygon points="20,36 60,22 100,36 60,50" fill="hsl(230 40% 15%)" />
            <circle cx="60" cy="36" r="2" fill="hsl(38 92% 55%)" />
            <path d="M60 36 L78 36 L76 50" stroke="hsl(38 92% 55%)" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Mascot;
