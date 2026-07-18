"use client";

import { ArrowUpRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";

export function MagneticButton({
  children,
  onClick,
  href,
  variant = "primary",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "text";
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  const move = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
    event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "translate3d(0, 0, 0)";
  };

  const className = `button button-${variant} magnetic`;
  const content = <><span>{children}</span><ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" /></>;

  if (href) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} className={className} href={href} aria-label={ariaLabel} onMouseMove={move} onMouseLeave={reset}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} className={className} type="button" aria-label={ariaLabel} onClick={onClick} onMouseMove={move} onMouseLeave={reset}>
      {content}
    </button>
  );
}
