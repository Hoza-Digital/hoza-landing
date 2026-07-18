"use client";

import { ArrowDown } from "lucide-react";
import { openEnquiry, portalTo } from "@/lib/events";
import { MagneticButton } from "./magnetic-button";

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <span className="hero-wordmark">HOZA</span>
      <span className="hero-orbit orbit-one" />
      <span className="hero-orbit orbit-two" />
      <div className="hero-core">
        <span className="core-ring" />
        <span className="core-dot" />
        <span className="core-label">FAST FORWARD</span>
      </div>
      <div className="fragment fragment-browser">
        <div className="fragment-bar"><i /><i /><i /></div>
        <div className="fragment-title" />
        <div className="fragment-grid"><i /><i /><i /></div>
      </div>
      <div className="fragment fragment-mobile">
        <div className="mobile-notch" />
        <div className="mobile-signal" />
        <div className="mobile-lines"><i /><i /><i /></div>
      </div>
      <div className="fragment fragment-workflow">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none">
          <path d="M10 13 C30 13 30 45 52 45 S72 22 91 22" />
        </svg>
        <i className="node n1" /><i className="node n2" /><i className="node n3" />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="hero" className="hero section-grid" aria-labelledby="hero-heading">
      <div className="animated-grid" aria-hidden="true" />
      <HeroVisual />
      <div className="hero-copy">
        <p className="hero-kicker"><span>HOZA — FAST FORWARD</span><span>EST. / INDONESIA</span></p>
        <h1 id="hero-heading" className="hero-heading velocity-heading" data-velocity-heading>
          <span>WE BUILD</span>
          <span>DIGITAL THINGS.</span>
          <span className="accent-line">FAST.</span>
        </h1>
        <div className="hero-bottom">
          <p className="hero-description">Websites, applications, mobile products and automation systems built for businesses ready to move forward.</p>
          <div className="hero-actions">
            <MagneticButton onClick={openEnquiry}>Start a Project</MagneticButton>
          </div>
        </div>
      </div>
      <div className="hero-system-labels" aria-hidden="true">
        <span>INDONESIA / SINGAPORE / WORLDWIDE</span>
        <span><i /> SYSTEM STATUS: READY</span>
        <span>BUILD MODE: ACTIVE</span>
      </div>
      <button className="scroll-indicator" onClick={() => portalTo("capabilities")} aria-label="Scroll to capabilities">
        <span>SCROLL TO MOVE FORWARD</span><ArrowDown size={15} />
      </button>
    </section>
  );
}
