"use client";

import { ArrowRight } from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";
import { services } from "@/lib/content";
import { AnimatedHeading } from "./animated-heading";
import { ServiceVisual } from "./service-visual";

export function Capabilities() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const moveToTab = (index: number) => {
    const next = (index + services.length) % services.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveToTab(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveToTab(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveToTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveToTab(services.length - 1);
    }
  };

  return (
    <section id="capabilities" className="section capabilities section-grid" aria-labelledby="capabilities-heading">
      <div className="section-intro" data-reveal>
        <p className="section-marker">What we build</p>
        <AnimatedHeading as="h2" className="section-title" >
          <span id="capabilities-heading">ONE TEAM.</span><span>MANY POSSIBILITIES.</span>
        </AnimatedHeading>
        <p className="section-summary">One team from interface to infrastructure. Built around the job, not a fixed package.</p>
      </div>
      <div className="capabilities-layout">
        <div className="service-list" role="tablist" aria-label="Hoza capabilities">
          {services.map((service, index) => (
            <button
              key={service.title}
              ref={(element) => { tabsRef.current[index] = element; }}
              id={`service-tab-${index}`}
              className={`service-row ${active === index ? "is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              role="tab"
              aria-selected={active === index}
              aria-controls="service-preview"
              tabIndex={active === index ? 0 : -1}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span className="service-number">0{index + 1}</span>
              <span className="service-title">{service.title}</span>
              <span className="service-description">{service.description}</span>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
        <div id="service-preview" className="service-preview-wrap" role="tabpanel" aria-labelledby={`service-tab-${active}`} aria-live="polite">
          <ServiceVisual mode={services[active].mode} title={services[active].title} />
        </div>
      </div>
    </section>
  );
}
