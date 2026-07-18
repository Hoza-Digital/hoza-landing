"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="error-page">
      <p className="eyebrow">SYSTEM / RECOVERY</p>
      <h1>INTERFACE<br />INTERRUPTED.</h1>
      <p>A visual module stopped unexpectedly. The core page is safe to retry.</p>
      <button className="button button-primary" type="button" onClick={reset}>Restart Interface <span>↗</span></button>
    </main>
  );
}
