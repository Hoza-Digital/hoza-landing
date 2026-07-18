"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { openEnquiry } from "@/lib/events";

export function MobileContactBar() {
  const [visible, setVisible] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/6285111505115?text=Hi%20Hoza%2C%20I%27m%20interested%20in%20discussing%20a%20digital%20project.%20Can%20you%20help%20me%3F";

  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="mobile-contact-bar" aria-label="Quick contact actions">
      <button type="button" onClick={openEnquiry}>START A PROJECT <span>↗</span></button>
      <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Contact Hoza on WhatsApp"><MessageCircle size={19} /></a>
    </div>
  );
}
