import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="page-shell page-stack">
      <div className="glass-panel sub-page-panel">
        <p className="eyebrow">Saved discoveries</p>
        <h1>Saved</h1>
        <p>This scaffold leaves room for saved casts, users, and channels once real persistence is wired in.</p>
        <Link href="/" className="text-link">
          Back to STMBL
        </Link>
      </div>
    </main>
  );
}
