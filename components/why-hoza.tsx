import Image from "next/image";
import { advantages } from "@/lib/content";
import { AnimatedHeading } from "./animated-heading";

export function WhyHoza() {
  return (
    <section id="about" className="section why-section section-grid" aria-labelledby="why-heading">
      <div className="why-heading-wrap" data-reveal>
        <p className="section-marker">Why Hoza</p>
        <AnimatedHeading as="h2" className="section-title">
          <span id="why-heading">LESS TALK.</span><span>MORE SHIPPED.</span>
        </AnimatedHeading>
      </div>
      <figure className="why-studio-media" data-reveal>
        <Image
          src="/media/hoza-studio-process.webp"
          alt="Wireframes, interface prototypes and precision tools arranged across a digital product workbench."
          fill
          sizes="(max-width: 820px) calc(100vw - 2.5rem), calc(100vw - 8rem)"
        />
        <figcaption>
          <span>INTERFACE / INFRASTRUCTURE / DELIVERY</span>
          <span>ONE CONNECTED BUILD SYSTEM</span>
        </figcaption>
      </figure>
      <div className="advantages-list">
        {advantages.map((item) => (
          <article className="advantage-row" key={item.number} data-reveal>
            <span className="advantage-number">{item.number}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <span className="advantage-signal" aria-hidden="true"><i /><i /><i /></span>
          </article>
        ))}
      </div>
      <div className="why-manifesto" data-reveal>
        <span>FROM IDEA TO LAUNCHED.</span>
        <span>ONE TEAM FROM INTERFACE TO INFRASTRUCTURE.</span>
        <span>CLEAR SCOPE. FAST EXECUTION. WORKING PRODUCT.</span>
      </div>
    </section>
  );
}
