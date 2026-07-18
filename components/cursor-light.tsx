"use client";

import { useEffect, useRef } from "react";

export function CursorLight() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    document.body.classList.add("custom-cursor-enabled");

    const move = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
      cursorRef.current?.style.setProperty("--pointer-x", `${event.clientX}px`);
      cursorRef.current?.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    const over = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      cursorRef.current?.classList.toggle("is-active", Boolean(target.closest("a, button, input, textarea, select, [data-cursor]")));
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseover", over);
    return () => {
      document.body.classList.remove("custom-cursor-enabled");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor-dot" aria-hidden="true"><span /></div>
  );
}
