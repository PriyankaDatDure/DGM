"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AppHeaderProps {
  username: string;
}

export default function AppHeader({ username }: AppHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="top-header">
      <div className="header-brand">
        <h1>DGM Daily Weather Forecast</h1>
        <div className="sub">Climate &amp; Health Early Warning · Central African Republic</div>
      </div>
      <div className="header-actions">
        <Link href="/" className="icon-btn header-home-btn" title="Home" aria-label="Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="user-pill" title={`Signed in as ${username}`}>
          <span className="user-avatar" aria-hidden="true">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="user-name">{username}</span>
        </div>
        <Link href="/dashboard" className="btn admin-link-btn">
          Dashboard
        </Link>
        <button
          className="btn logout-btn"
          type="button"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
