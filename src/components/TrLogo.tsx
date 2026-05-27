type Props = { className?: string };

export function TrLogo({ className = "" }: Props) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative grid h-10 w-10 place-items-center rounded-lg border border-current/20 backdrop-blur-sm"
           style={{ background: "color-mix(in oklab, currentColor 10%, transparent)" }}>
        <span className="font-display text-lg tracking-tight">TR</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-display text-base">TR Estratégia</span>
        <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">Empresarial</span>
      </div>
    </div>
  );
}
