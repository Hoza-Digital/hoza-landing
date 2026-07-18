import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="site-footer section-grid">
      <div><Logo /><p>Websites, applications and automation systems built fast.</p></div>
      <div><span>LOCATION</span><p>INDONESIA / SINGAPORE / WORLDWIDE</p></div>
      <div><span>SYSTEM</span><p><i /> AVAILABLE FOR SELECT PROJECTS</p></div>
      <div><span>© {new Date().getFullYear()} HOZA</span><p>BUILD FAST. MOVE FORWARD.</p></div>
    </footer>
  );
}
