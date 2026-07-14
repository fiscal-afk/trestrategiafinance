import logoAsset from "@/assets/tr-logo.asset.json";

type Props = { className?: string; invert?: boolean };

export function TrLogo({ className = "", invert = true }: Props) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={logoAsset.url}
        alt="TR Estratégia Empresarial"
        className="h-12 w-auto object-contain"
        style={invert ? { filter: "invert(1) brightness(2)" } : undefined}
      />
    </div>
  );
}
