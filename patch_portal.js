const fs = require('fs');

// Patch PortalDashboardPage
let portal = fs.readFileSync('src/app/(portal)/portal/page.tsx', 'utf8');

// Header section
portal = portal.replace(
  "<div style={{ display: \"flex\", gap: 24, alignItems: \"center\", marginBottom: 40, borderBottom: \"1px solid var(--pg-border)\", paddingBottom: 24 }}>",
  "<div className=\"flex flex-col md:flex-row gap-6 items-start md:items-center mb-10 border-b border-[var(--pg-border)] pb-6\">"
);

// Two Columns section
portal = portal.replace(
  "<div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr\", gap: 24 }}>",
  "<div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">"
);

// Suggest form section
portal = portal.replace(
  "<div style={{ display: \"flex\", alignItems: \"center\", gap: 16 }}>",
  "<div className=\"flex flex-col md:flex-row md:items-center gap-4 md:gap-6\">"
);
portal = portal.replace(
  "<form onSubmit={handleSuggest} style={{ display: \"flex\", gap: 8, flex: 2 }}>",
  "<form onSubmit={handleSuggest} className=\"flex flex-col sm:flex-row gap-2 flex-[2] w-full\">"
);

fs.writeFileSync('src/app/(portal)/portal/page.tsx', portal);

// Patch PropertyDrawer
let drawer = fs.readFileSync('src/components/shared/property-drawer.tsx', 'utf8');

drawer = drawer.replace(
  "width: '100%', maxWidth: 520,",
  "/* width: '100%', maxWidth: 520, handled by tailwind */"
);

drawer = drawer.replace(
  "animation: 'pg-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',",
  "animation: 'pg-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',\n        }}\n        className=\"w-full md:w-[520px] max-w-full\"\n      >"
);

// We need to be careful with the replace above because it was inside `style={{ ... }}`.
// Let's use string operations instead.
