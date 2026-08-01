"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const links = [
  ["Services", "/#capabilities"],
  ["Process", "/#process"],
  ["Contact", "/#contact"],
] as const;

export function ArticleHeader() {
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
    const background = document.querySelectorAll<HTMLElement>(".skip-link, main, footer");
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

  const closeMenu = () => setOpen(false);

  return (
    <header ref={headerRef} className={`site-nav article-site-nav ${scrolled ? "is-scrolled" : ""}`}>
      <Link className="nav-logo" href="/" aria-label="Hoza home" tabIndex={open ? -1 : 0}>
        <Logo decorative />
      </Link>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        <Link className="is-current" href="/article" aria-current="page">Article</Link>
      </nav>

      <div className="nav-actions">
        <Link className="nav-cta" href="/#contact" tabIndex={open ? -1 : 0}>Start a Project <span>↗</span></Link>
        <button
          ref={toggleRef}
          className="menu-toggle"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="article-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div id="article-mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden={!open}>
        {open && (
          <div className="mobile-menu-inner">
            <span className="mobile-menu-intro">HOZA / FAST FORWARD</span>
            {links.map(([label, href], index) => (
              <Link href={href} key={href} onClick={closeMenu}>
                <span>0{index + 1}</span>{label}
              </Link>
            ))}
            <Link href="/article" onClick={closeMenu} aria-current="page">
              <span>04</span>Article
            </Link>
            <Link className="mobile-project" href="/#contact" onClick={closeMenu}>START A PROJECT ↗</Link>
            <p>INDONESIA / SINGAPORE / WORLDWIDE</p>
          </div>
        )}
      </div>
    </header>
  );
}
