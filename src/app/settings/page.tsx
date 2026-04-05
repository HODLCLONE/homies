import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="page-shell page-stack">
      <div className="glass-panel sub-page-panel">
        <p className="eyebrow">Discovery tuning</p>
        <h1>Settings</h1>
        <p>Planned controls: strictness, mode defaults, muted authors, muted channels, anti-repeat tuning, and pool refresh controls.</p>
        <Link href="/" className="text-link">
          Back to STMBL
        </Link>
      </div>
    </main>
  );
}
