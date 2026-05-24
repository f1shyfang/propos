const fs = require('fs');
let content = fs.readFileSync('src/components/shared/properties-view.tsx', 'utf8');

// Header wrapper
content = content.replace(
  "<div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--pg-border)' }}>",
  "<div className=\"flex flex-col sm:flex-row items-stretch sm:items-center p-4 sm:px-6 sm:py-4 gap-3 border-b border-[var(--pg-border)]\">"
);

// Split view container
content = content.replace(
  "<div style={{ flex: 1, display: 'flex', minHeight: 0 }}>",
  "<div className=\"flex-1 flex flex-col md:flex-row min-h-0\">"
);

// List container
content = content.replace(
  "<div style={{ width: 380, flex: '0 0 380px', borderRight: '1px solid var(--pg-border)', overflow: 'auto', background: 'var(--pg-bg)', position: 'relative' }} className=\"pg-scroll\">",
  "<div className=\"w-full md:w-[380px] md:flex-none border-b md:border-b-0 md:border-r border-[var(--pg-border)] overflow-auto bg-[var(--pg-bg)] relative h-[50vh] md:h-auto pg-scroll\">"
);

// Map container
content = content.replace(
  "<div style={{ flex: 1, background: '#e0e0e0', position: 'relative' }}>",
  "<div className=\"flex-1 bg-[#e0e0e0] relative h-[50vh] md:h-auto\">"
);

fs.writeFileSync('src/components/shared/properties-view.tsx', content);
