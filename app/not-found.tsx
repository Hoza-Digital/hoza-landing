import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <p className="eyebrow">SYSTEM / 404</p>
      <h1>PAGE<br />NOT FOUND.</h1>
      <p>The route moved faster than expected.</p>
      <Link className="button button-primary" href="/">Return to Hoza</Link>
    </main>
  );
}
