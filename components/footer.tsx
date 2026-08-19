import { Logo } from "./logo";
import { Facebook, Instagram } from "lucide-react";

export function SocialLinks({ className = "footer-socials" }: { className?: string }) {
  return (
    <nav className={className} aria-label="Hoza Digital social media">
      <a className="social-x-link" href="https://x.com/hozadigital" target="_blank" rel="noreferrer noopener" aria-label="Hoza Digital on X" title="X">
        <span className="social-x-mark" aria-hidden="true" />
      </a>
      <a href="https://www.instagram.com/hozadigital/" target="_blank" rel="noreferrer noopener" aria-label="Hoza Digital on Instagram" title="Instagram">
        <Instagram aria-hidden="true" />
      </a>
      <a href="https://www.facebook.com/profile.php?id=61593012301979" target="_blank" rel="noreferrer noopener" aria-label="Hoza Digital on Facebook" title="Facebook">
        <Facebook aria-hidden="true" />
      </a>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site-footer section-grid">
      <div className="footer-brand"><Logo /><p>Websites, applications and automation systems built fast.</p></div>
      <div className="footer-location"><span>LOCATION</span><p>INDONESIA / SINGAPORE / WORLDWIDE</p></div>
      <div className="footer-system"><span>SYSTEM</span><p><i /> AVAILABLE FOR SELECT PROJECTS</p></div>
      <div className="footer-follow">
        <span>FOLLOW</span>
        <SocialLinks />
      </div>
      <div className="footer-copyright"><span>© {new Date().getFullYear()} HOZA</span><p>BUILD FAST. MOVE FORWARD.</p></div>
    </footer>
  );
}
