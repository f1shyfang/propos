"use client";

import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "calc(100vh - 80px)", display: "grid", placeItems: "center", padding: 24 }}>
      <form
        className="pg-card-flat"
        style={{ width: "100%", maxWidth: 380, padding: 24 }}
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/portal");
        }}
      >
        <div className="pg-label">Client portal</div>
        <h1 className="pg-display" style={{ margin: "8px 0 18px", fontSize: 28 }}>Sign in as Sarah</h1>
        <label className="pg-label">Email</label>
        <input className="pg-input" defaultValue="sarah@demo.com" type="email" style={{ marginBottom: 12 }} />
        <label className="pg-label">Password</label>
        <input className="pg-input" defaultValue="password123" type="password" style={{ marginBottom: 18 }} />
        <button className="pg-btn pg-btn-primary" style={{ width: "100%", justifyContent: "center" }}>Open portal</button>
      </form>
    </main>
  );
}
