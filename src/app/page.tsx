import Link from "next/link";
import { StmblClient } from "@/components/stmbl-client";

export default function Home() {
  return (
    <main className="page-shell">
      <nav className="top-nav" aria-label="Primary">
        <div className="brand-block">
          <span className="brand-mark">ST</span>
          <div>
            <p className="brand-name">STMBL</p>
            <p className="brand-subtitle">stmbl.hodlhq.app</p>
          </div>
        </div>
        <div className="nav-links">
          <Link href="/saved">Saved</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </nav>
      <StmblClient />
    </main>
  );
}
