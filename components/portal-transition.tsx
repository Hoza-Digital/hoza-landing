"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PortalTransition() {
  const [active, setActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let target = "";
    let scrollTimer = 0;
    let navigationTimer = 0;
    let endTimer = 0;
    let transitioning = false;

    const begin = () => {
      transitioning = true;
      setActive(true);
      document.documentElement.classList.add("portal-active");
    };

    const finish = () => {
      setActive(false);
      transitioning = false;
      document.documentElement.classList.remove("portal-active");
    };

    const handler = (event: Event) => {
      target = (event as CustomEvent<{ targetId: string }>).detail.targetId;
      begin();
      scrollTimer = window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "auto", block: "start" });
      }, 250);
      endTimer = window.setTimeout(finish, 690);
    };

    const routeHandler = (event: MouseEvent) => {
      if (transitioning || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin) return;

      const startsOnArticle = current.pathname === "/article" || current.pathname.startsWith("/article/");
      const opensArticle = destination.pathname === "/article" || destination.pathname.startsWith("/article/");
      const sameLocation = destination.pathname === current.pathname
        && destination.search === current.search
        && destination.hash === current.hash;
      if ((!startsOnArticle && !opensArticle) || sameLocation) return;

      event.preventDefault();
      begin();
      navigationTimer = window.setTimeout(() => {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      }, 250);
      endTimer = window.setTimeout(finish, 690);
    };

    window.addEventListener("hoza:portal", handler);
    window.addEventListener("click", routeHandler, true);
    return () => {
      window.removeEventListener("hoza:portal", handler);
      window.removeEventListener("click", routeHandler, true);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(navigationTimer);
      window.clearTimeout(endTimer);
      document.documentElement.classList.remove("portal-active");
    };
  }, [router]);

  return (
    <div className={`portal-transition ${active ? "is-active" : ""}`} aria-hidden="true">
      <div className="portal-o"><span /></div>
    </div>
  );
}
