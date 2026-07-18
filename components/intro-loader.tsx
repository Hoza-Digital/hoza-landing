"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";

export function IntroLoader() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const key = "hoza-intro-seen";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "true");
    const showTimer = window.setTimeout(() => setShow(true), 0);
    const leaveTimer = window.setTimeout(() => setLeaving(true), 920);
    const removeTimer = window.setTimeout(() => setShow(false), 1380);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`intro-loader ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="intro-topline"><span>INITIALISING HOZA</span><span>00—100</span></div>
      <div className="intro-center">
        <Logo className="intro-logo" decorative />
        <span className="intro-sequence">DESIGN / DEVELOP / DEPLOY</span>
      </div>
      <div className="intro-track"><span /></div>
    </div>
  );
}
