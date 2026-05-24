"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "My properties", href: "/portal" },
    { name: "Documents", href: "/portal/documents" },
    { name: "Activity", href: "/portal/activity" },
  ];

  return (
    <nav style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
      {tabs.map((t) => {
        const isActive = pathname === t.href || (t.href !== "/portal" && pathname.startsWith(t.href));
        return (
          <Link key={t.name} href={t.href} style={{
            padding: '7px 12px',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--pg-text)' : 'var(--pg-text-dim)',
            background: isActive ? 'var(--pg-bg-2)' : 'transparent',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            {t.name}
          </Link>
        );
      })}
    </nav>
  );
}
