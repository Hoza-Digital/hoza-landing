"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { openEnquiry, portalTo } from "@/lib/events";
import { Logo } from "./logo";

const links = [
  ["Services", "capabilities"],
  ["Process", "process"],
  ["Contact", "contact"],
] as const;

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    const background = document.querySelectorAll<HTMLElement>(".skip-link, main, footer, .floating-whatsapp, .mobile-contact-bar");
    background.forEach((element) => { element.inert = open; });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!open || !headerRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        window.requestAnimationFrame(() => toggleRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(headerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])"))
        .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open");
      background.forEach((element) => { element.inert = false; });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    if (open) window.requestAnimationFrame(() => toggleRef.current?.focus());
    portalTo(id);
  };

  return (
    <header ref={headerRef} className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
      <button className="nav-logo" onClick={() => go("hero")} aria-label="Go to top" tabIndex={open ? -1 : 0}><Logo decorative /></button>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map(([label, id]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
        <Link href="/article">Article</Link>
      </nav>
      <div className="nav-actions">
        <button className="nav-cta" onClick={openEnquiry}>Start a Project <span>↗</span></button>
        <button ref={toggleRef} className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden={!open}>
        {open && (
          <div className="mobile-menu-inner">
            <span className="mobile-menu-intro">HOZA / FAST FORWARD</span>
            {links.map(([label, id], index) => (
              <button key={id} onClick={() => go(id)}>
                <span>0{index + 1}</span>{label}
              </button>
            ))}
            <Link href="/article" onClick={() => setOpen(false)}>
              <span>04</span>Article
            </Link>
            <button className="mobile-project" onClick={() => { setOpen(false); window.requestAnimationFrame(() => { toggleRef.current?.focus(); openEnquiry(); }); }}>START A PROJECT ↗</button>
            <p>INDONESIA / SINGAPORE / WORLDWIDE</p>
          </div>
        )}
      </div>
    </header>
  );
}
