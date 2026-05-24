"use client";

import { Icon } from "@/components/shared/icon";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="pg-btn pg-btn-primary"
      style={{ display: "flex", gap: "8px", alignItems: "center" }}
    >
      <Icon name="printer" size={16} /> Print Report
    </button>
  );
}
