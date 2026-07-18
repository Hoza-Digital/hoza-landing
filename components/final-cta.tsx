"use client";

import { Mail, MessageCircle, PhoneCall } from "lucide-react";
import { openEnquiry } from "@/lib/events";
import { AnimatedHeading } from "./animated-heading";
import { DraggableWordmark } from "./draggable-wordmark";
import { MagneticButton } from "./magnetic-button";

export function FinalCta() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/6285111505115?text=Hi%20Hoza%2C%20I%27m%20interested%20in%20discussing%20a%20digital%20project.%20Can%20you%20help%20me%3F";
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hozadigital@gmail.com";

  return (
    <section id="contact" className="final-cta section-grid" aria-labelledby="final-heading">
      <DraggableWordmark />
      <div className="final-content" data-reveal>
        <p className="final-prompt">Ready when you are.</p>
        <AnimatedHeading as="h2" className="final-heading">
          <span id="final-heading">HAVE SOMETHING</span><span>TO BUILD?</span>
        </AnimatedHeading>
        <p>Tell us what you are trying to create, improve or automate. We will help you determine the best way to move forward.</p>
        <MagneticButton onClick={openEnquiry}>Start Your Project</MagneticButton>
      </div>
      <div className="contact-options" data-reveal>
        <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><span>Contact on WhatsApp</span><i>↗</i></a>
        <button type="button" onClick={openEnquiry}><PhoneCall /><span>Schedule a Call</span><i>↗</i></button>
        <a href={`mailto:${email}`}><Mail /><span>Send an Email</span><i>↗</i></a>
      </div>
    </section>
  );
}
