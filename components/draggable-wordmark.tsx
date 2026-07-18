"use client";

import { useRef } from "react";

export function DraggableWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ dragging: false, x: 0, y: 0, startX: 0, startY: 0 });

  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    state.current.dragging = true;
    state.current.startX = event.clientX - state.current.x;
    state.current.startY = event.clientY - state.current.y;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!state.current.dragging || !ref.current) return;
    state.current.x = Math.max(-90, Math.min(90, event.clientX - state.current.startX));
    state.current.y = Math.max(-45, Math.min(45, event.clientY - state.current.startY));
    const skew = state.current.x / 24;
    ref.current.style.transform = `translate3d(${state.current.x}px, ${state.current.y}px, 0) skewX(${skew}deg)`;
  };

  const up = () => {
    state.current.dragging = false;
    if (!ref.current) return;
    ref.current.style.transition = "transform 650ms cubic-bezier(.16,1,.3,1)";
    ref.current.style.transform = "translate3d(0,0,0) skewX(0deg)";
    state.current.x = 0;
    state.current.y = 0;
    window.setTimeout(() => { if (ref.current) ref.current.style.transition = ""; }, 700);
  };

  return (
    <div className="final-wordmark-wrap" aria-hidden="true">
      <div ref={ref} className="final-wordmark" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>HOZA</div>
      <span>DRAG TO MOVE FORWARD</span>
    </div>
  );
}
