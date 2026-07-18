import { processSteps } from "@/lib/content";
import { AnimatedHeading } from "./animated-heading";

export function Process() {
  return (
    <section id="process" className="section process-section section-grid" aria-labelledby="process-heading">
      <div className="process-sticky" data-reveal>
        <p className="section-marker">How we move</p>
        <AnimatedHeading as="h2" className="section-title">
          <span id="process-heading">IDEA TO</span><span>LAUNCH.</span>
        </AnimatedHeading>
        <p className="section-summary">Enough process to remove uncertainty. Never enough to slow the work down.</p>
        <div className="process-status"><span><i /> CURRENT MODE</span><strong>FORWARD</strong></div>
      </div>
      <div className="process-steps">
        <div className="process-line"><span data-process-line /></div>
        {processSteps.map(([number, title, description]) => (
          <article className="process-step" key={number} data-reveal>
            <span className="process-dot" aria-hidden="true" />
            <span className="process-number">{number}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
