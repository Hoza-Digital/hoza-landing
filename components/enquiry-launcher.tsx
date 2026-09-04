"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const EnquiryModal = dynamic(() => import("./enquiry-modal").then((module) => module.EnquiryModal), {
  ssr: false,
  loading: () => <div className="enquiry-loading" role="status">Opening project enquiry…</div>,
});

// Do not download the form and country dataset until someone requests them.
export function EnquiryLauncher() {
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    const activate = () => setActivated(true);
    window.addEventListener("hoza:open-enquiry", activate);
    return () => window.removeEventListener("hoza:open-enquiry", activate);
  }, []);
  return activated ? <EnquiryModal initiallyOpen /> : null;
}
