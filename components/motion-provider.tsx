"use client";

import { useEffect } from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        if (element.dataset.revealed === "true") return;
        element.dataset.revealed = "true";
        animations.push(element.animate(
          [
            { opacity: 0.72, transform: "translate3d(0, 1.5rem, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
          ],
          { duration: 560, easing: "cubic-bezier(.16,1,.3,1)" },
        ));
        observer.unobserve(element);
      });
    }, { rootMargin: "0px 0px -12%", threshold: 0.08 });

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => observer.observe(element));

    const processLine = document.querySelector<HTMLElement>("[data-process-line]");
    if (processLine) {
      const lineObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        animations.push(processLine.animate(
          [{ transform: "scaleY(.08)" }, { transform: "scaleY(1)" }],
          { duration: 720, easing: "cubic-bezier(.16,1,.3,1)" },
        ));
        lineObserver.disconnect();
      }, { threshold: 0.1 });
      lineObserver.observe(processLine);
      return () => {
        observer.disconnect();
        lineObserver.disconnect();
        animations.forEach((animation) => animation.cancel());
      };
    }

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return children;
}
