"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/content";
import { AnimatedHeading } from "./animated-heading";

function ProjectVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: [0, 0.45, 0.8] });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <video ref={ref} muted loop playsInline preload="none" poster={poster} aria-label={`${title} interface motion preview`}><source src={src} type="video/mp4" /></video>;
}

export function ProjectShowcase() {
  const [openCase, setOpenCase] = useState<string | null>(null);

  return (
    <section id="work" className="section work-section" aria-labelledby="work-heading">
      <div className="section-grid work-header" data-reveal>
        <p className="section-marker">Selected work</p>
        <AnimatedHeading as="h2" className="section-title">
          <span id="work-heading">BUILT TO WORK.</span><span>DESIGNED TO IMPRESS.</span>
        </AnimatedHeading>
        <p className="section-summary">Concept projects showing the kind of clarity, systems thinking and finish Hoza brings to the work.</p>
      </div>
      <div className="projects-stack">
        {projects.map((project) => (
          <article className={`project-card project-${project.theme}`} key={project.number} data-reveal>
            <div className="project-media">
              <ProjectVideo src={project.video} poster={project.poster} title={project.type} />
              <div className="project-chrome"><span>HOZA / CASE {project.number}</span><span>LIVE INTERFACE</span></div>
              <div className="project-cursor-label">VIEW<br />CASE</div>
            </div>
            <div className="project-info section-grid">
              <div className="project-index"><span>{project.number}</span><span>{project.type}</span></div>
              <h3>{project.title}</h3>
              <div className="project-copy">
                <p>{project.description}</p>
                <p className="project-services">{project.services}</p>
              </div>
              <button
                className="case-link"
                type="button"
                aria-label={`View ${project.type} case study details`}
                aria-expanded={openCase === project.number}
                aria-controls={`case-detail-${project.number}`}
                onClick={() => setOpenCase((current) => current === project.number ? null : project.number)}
              >
                {openCase === project.number ? "Close Case Study" : "View Case Study"} <ArrowUpRight size={20} />
              </button>
            </div>
            <div id={`case-detail-${project.number}`} className={`case-detail section-grid ${openCase === project.number ? "is-open" : ""}`} aria-hidden={openCase !== project.number}>
              <article><span>01 / CHALLENGE</span><p>{project.challenge}</p></article>
              <article><span>02 / APPROACH</span><p>{project.approach}</p></article>
              <article><span>03 / OUTCOME</span><p>{project.outcome}</p></article>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
