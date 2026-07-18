import { useId } from "react";

type LogoProps = {
  compact?: boolean;
  className?: string;
  decorative?: boolean;
};

export function Logo({ compact = false, className = "", decorative = false }: LogoProps) {
  const maskId = `hoza-logo-${useId().replace(/:/g, "")}`;
  const classes = ["logo", compact ? "logo-mark-only" : "logo-lockup", className].filter(Boolean).join(" ");
  const accessibility = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": "Hoza" };

  return (
    <span className={classes} {...accessibility}>
      {compact ? (
        <svg className="logo-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <path
            className="logo-ink"
            fillRule="evenodd"
            d="M54 24h92l30 30v92l-30 30H54l-30-30V54l30-30Zm18 34-14 14v56l14 14h56l14-14V72l-14-14H72Z"
          />
          <circle className="logo-signal" cx="100" cy="100" r="10" />
        </svg>
      ) : (
        <svg className="logo-svg" viewBox="0 0 680 200" aria-hidden="true" focusable="false">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect width="680" height="200" fill="#000" />
              <path d="M30 42H60V86H116V42H146V158H116V114H60V158H30Z" fill="#fff" />
              <path d="M194 42H272L302 72V128L272 158H194L164 128V72L194 42Z" fill="#fff" />
              <path d="M207 72H259L272 85V115L259 128H207L194 115V85L207 72Z" fill="#000" />
              <path d="M326 42H470V70L381 130H470V158H326V130L415 70H326ZM548 42H586L650 158H614L600 132H534L520 158H484L548 42Z" fill="#fff" />
              <path d="M567 72L588 112H546L567 72Z" fill="#000" />
            </mask>
          </defs>
          <rect className="logo-ink" width="680" height="200" mask={`url(#${maskId})`} />
          <circle className="logo-signal" cx="233" cy="100" r="8" />
        </svg>
      )}
    </span>
  );
}
