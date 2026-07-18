"use client";

import { useEffect, useState } from "react";

export function PortalTransition() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let target = "";
    let scrollTimer = 0;
    let endTimer = 0;

    const handler = (event: Event) => {
      target = (event as CustomEvent<{ targetId: string }>).detail.targetId;
      setActive(true);
      document.documentElement.classList.add("portal-active");
      scrollTimer = window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "auto", block: "start" });
      }, 250);
      endTimer = window.setTimeout(() => {
        setActive(false);
        document.documentElement.classList.remove("portal-active");
      }, 690);
    };

    window.addEventListener("hoza:portal", handler);
    return () => {
      window.removeEventListener("hoza:portal", handler);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(endTimer);
      document.documentElement.classList.remove("portal-active");
    };
  }, []);

  return (
    <div className={`portal-transition ${active ? "is-active" : ""}`} aria-hidden="true">
      <div className="portal-o"><span /></div>
    </div>
  );
}
