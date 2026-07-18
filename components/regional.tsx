import { AnimatedHeading } from "./animated-heading";

export function Regional() {
  return (
    <section className="section regional-section section-grid" aria-labelledby="regional-heading">
      <div className="regional-copy" data-reveal>
        <p className="section-marker">Where we work</p>
        <AnimatedHeading as="h2" className="section-title">
          <span id="regional-heading">BUILT IN INDONESIA.</span><span>READY FOR ANYWHERE.</span>
        </AnimatedHeading>
        <p className="section-summary">Hoza combines regional business understanding with international product standards, helping companies build effective digital products without unnecessary complexity.</p>
      </div>
      <div className="network-map" role="img" aria-label="Network connecting Indonesia, Singapore and worldwide markets" data-reveal>
        <div className="map-grid" aria-hidden="true" />
        <svg viewBox="0 0 900 520" aria-hidden="true">
          <defs>
            <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--violet-dark)" />
              <stop offset="0.45" stopColor="var(--violet)" />
              <stop offset="1" stopColor="var(--lavender)" />
            </linearGradient>
          </defs>
          <path className="map-outline" d="M70 258 C120 190 178 188 225 145 C285 90 342 115 385 173 C420 220 475 205 525 175 C592 135 645 145 704 195 C748 232 799 218 850 165" />
          <path className="map-route route-one" d="M322 334 C380 250 424 275 472 245" />
          <path className="map-route route-two" d="M472 245 C560 170 653 190 755 130" />
          <path className="map-route route-three" d="M322 334 C245 255 180 262 100 212" />
          <circle className="map-pulse p1" cx="322" cy="334" r="8" />
          <circle className="map-pulse p2" cx="472" cy="245" r="8" />
          <circle className="map-pulse p3" cx="755" cy="130" r="8" />
        </svg>
        <div className="map-label indonesia"><strong>INDONESIA</strong><span>06.2088° S / 106.8456° E</span></div>
        <div className="map-label singapore"><strong>SINGAPORE</strong><span>01.3521° N / 103.8198° E</span></div>
        <div className="map-label worldwide"><strong>WORLDWIDE</strong><span>REMOTE / CONNECTED</span></div>
        <div className="map-readout"><span>NETWORK STATUS</span><strong>CONNECTED</strong></div>
      </div>
    </section>
  );
}
