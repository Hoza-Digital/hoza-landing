import Image from "next/image";

export function FloatingWhatsapp() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/6285111505115?text=Hi%20Hoza%2C%20I%27m%20interested%20in%20discussing%20a%20digital%20project.%20Can%20you%20help%20me%3F";

  return (
    <a
      className="floating-whatsapp"
      href={whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Hoza on WhatsApp"
    >
      <span className="floating-whatsapp-icon" aria-hidden="true">
        <Image src="/whatsapp-logo.svg" alt="" width={38} height={38} style={{ width: 38, height: 38 }} />
      </span>
    </a>
  );
}
