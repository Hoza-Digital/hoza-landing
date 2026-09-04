import { Capabilities } from "./capabilities";
import { CursorLight } from "./cursor-light";
import { EnquiryLauncher } from "./enquiry-launcher";
import { FinalCta } from "./final-cta";
import { FloatingWhatsapp } from "./floating-whatsapp";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { MobileContactBar } from "./mobile-contact-bar";
import { MotionProvider } from "./motion-provider";
import { Navigation } from "./navigation";
import { Process } from "./process";
import { Regional } from "./regional";
import { Technology } from "./technology";
import { WhyHoza } from "./why-hoza";

export function HozaLanding() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <CursorLight />
      <Navigation />
      <main id="main-content">
        <Hero />
        <Capabilities />
        <WhyHoza />
        <Process />
        <Technology />
        <Regional />
        <FinalCta />
      </main>
      <Footer />
      <FloatingWhatsapp />
      <MobileContactBar />
      <EnquiryLauncher />
    </MotionProvider>
  );
}
