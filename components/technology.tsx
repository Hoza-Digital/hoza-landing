import { technologyGroups } from "@/lib/content";
import { AnimatedHeading } from "./animated-heading";

const ticker = ["NEXT.JS", "REACT", "TYPESCRIPT", "NODE.JS", "REACT NATIVE", "POSTGRESQL", "AWS", "VERCEL", "N8N", "OPENAI", "ANALYTICS"];

export function Technology() {
  return (
    <section className="section technology-section" aria-labelledby="technology-heading">
      <div className="section-grid technology-header" data-reveal>
        <p className="section-marker">Technology</p>
        <AnimatedHeading as="h2" className="section-title">
          <span id="technology-heading">THE RIGHT TOOL</span><span>FOR THE JOB.</span>
        </AnimatedHeading>
        <p className="section-summary">Hoza selects technology based on business needs, scalability and maintainability.</p>
      </div>
      <div className="tech-ticker" aria-hidden="true">
        <div>{[...ticker, ...ticker].map((item, index) => <span key={`${item}-${index}`}>{item}<i /></span>)}</div>
      </div>
      <div className="tech-matrix section-grid">
        {technologyGroups.map(([group, ...items], index) => (
          <article className="tech-row" key={group} data-reveal>
            <span className="tech-index">0{index + 1}</span>
            <h3>{group}</h3>
            <div>{items.map((item) => <span key={item}>{item}</span>)}</div>
            <span className="tech-ready">READY <i /></span>
          </article>
        ))}
      </div>
    </section>
  );
}
