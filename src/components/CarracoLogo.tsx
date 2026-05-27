interface Props {
  size?: number;
  withText?: boolean;
  className?: string;
}

/**
 * Carraco logo — stylized owl head inside a gradient squircle.
 * Works in both light & dark themes.
 */
const CarracoLogo = ({ size = 36, withText = true, className = "" }: Props) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative rounded-2xl gradient-primary flex items-center justify-center glow shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          {/* Ear tufts */}
          <path d="M10 11 L8 5 L14 9 Z" fill="white" fillOpacity="0.95" />
          <path d="M30 11 L32 5 L26 9 Z" fill="white" fillOpacity="0.95" />

          {/* Head */}
          <path
            d="M20 7 C28 7 33 13 33 21 C33 28 27 33 20 33 C13 33 7 28 7 21 C7 13 12 7 20 7 Z"
            fill="white"
            fillOpacity="0.98"
          />

          {/* Eye discs */}
          <circle cx="15" cy="19" r="5.2" fill="hsl(234 89% 60%)" />
          <circle cx="25" cy="19" r="5.2" fill="hsl(328 86% 60%)" />

          {/* Pupils */}
          <circle cx="15" cy="19.5" r="2.2" fill="#0a0a1a" />
          <circle cx="25" cy="19.5" r="2.2" fill="#0a0a1a" />
          <circle cx="15.8" cy="18.6" r="0.7" fill="white" />
          <circle cx="25.8" cy="18.6" r="0.7" fill="white" />

          {/* Beak */}
          <path d="M18 24 L22 24 L20 28 Z" fill="hsl(38 92% 55%)" />

          {/* Quill accent (writing owl) */}
          <path
            d="M30 30 L35 35"
            stroke="hsl(38 92% 55%)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="35.5" cy="35.5" r="0.9" fill="hsl(38 92% 55%)" />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-lg tracking-tight gradient-text">
            Carraco
          </span>
          <span className="font-mono-score text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Write • Level up
          </span>
        </div>
      )}
    </div>
  );
};

export default CarracoLogo;
