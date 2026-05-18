interface Props {
  size?: number;
  withText?: boolean;
  className?: string;
}

const CarracoLogo = ({ size = 36, withText = true, className = "" }: Props) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative rounded-2xl gradient-primary flex items-center justify-center glow"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 32 32" fill="none" style={{ width: size * 0.62, height: size * 0.62 }}>
          <path
            d="M10 24V8h6c3 0 5 2 5 4.5S19 17 16 17h-2l7 7"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="24" cy="9" r="1.6" fill="white" />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-lg tracking-tight">
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
