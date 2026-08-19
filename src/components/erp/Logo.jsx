import { useCompanySettings } from "@/hooks/useCompanySettings";

export default function Logo({ variant = "full", size = 40, light = false, tagline = true }) {
  const { settings } = useCompanySettings();

  const hasCustomName = settings?.nom_entreprise && settings.nom_entreprise.trim() !== "";
  const nom = hasCustomName ? settings.nom_entreprise : null;
  const slogan = settings?.slogan || "Manage • Optimize • Deliver";
  const logoUrl = settings?.logo_url;

  if (variant === "icon") {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={nom || "Logo"}
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: size, height: size }}
        />
      );
    }
    return <LogoIcon size={size} light={light} />;
  }

  const M = light ? "text-white" : "text-navy";
  const Y = light ? "text-blue-200" : "text-primary";
  const rest = light ? "text-white" : "text-navy";
  const tg = light ? "text-blue-200" : "text-muted-foreground";
  const line = light ? "bg-white/30" : "bg-navy/30";

  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={nom || "MY Logistics"}
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: size, height: size }}
        />
      ) : (
        <LogoIcon size={size} light={light} />
      )}
      <div className="leading-none">
        {nom ? (
          <div className={`text-base font-extrabold tracking-tight ${M}`}>
            {nom}
          </div>
        ) : (
          <div className="text-base font-extrabold tracking-tight">
            <span className={M}>M</span>
            <span className={Y}>Y</span>
            <span className={rest}> Logistics</span>
          </div>
        )}
        {tagline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-px w-3 ${line}`} />
            <span className={`text-[8px] font-semibold uppercase tracking-[0.12em] ${tg}`}>
              {slogan}
            </span>
            <span className={`h-px w-3 ${line}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function LogoIcon({ size = 40, light = false }) {
  const stroke = light ? "stroke-white" : "stroke-navy";
  const accent = light ? "stroke-blue-200" : "stroke-primary";
  const fill = light ? "fill-white" : "fill-navy";

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" className={`${stroke}`} strokeWidth="2" fill="none" />
      <path d="M 7 24 A 17 17 0 0 1 41 24" className={`${accent}`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 9 34 Q 24 42 39 34" className={`${accent}`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="25" y="18" width="10" height="7" rx="1" className={fill} />
      <path d="M 20 20 L 25 20 L 25 25 L 20 25 Z" className={fill} />
      <circle cx="23" cy="26" r="1.3" className={fill} />
      <circle cx="32" cy="26" r="1.3" className={fill} />
      <path d="M 13 17 L 19 13 L 23 13" className={`${accent}`} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <text x="12" y="31" fontSize="14" fontWeight="800" fontFamily="Inter, sans-serif" className={fill}>M</text>
      <text x="22" y="31" fontSize="14" fontWeight="800" fontFamily="Inter, sans-serif" className={light ? "fill-blue-200" : "fill-primary"}>Y</text>
    </svg>
  );
}