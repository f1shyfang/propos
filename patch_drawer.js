const fs = require('fs');
let drawer = fs.readFileSync('src/components/shared/property-drawer.tsx', 'utf8');

drawer = drawer.replace(
  "width: '100%', maxWidth: 520,",
  "// width handled by className"
);

drawer = drawer.replace(
  "          animation: 'pg-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',\n        }}\n      >",
  "          animation: 'pg-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',\n        }}\n        className=\"w-full max-w-full md:w-[520px]\"\n      >"
);

fs.writeFileSync('src/components/shared/property-drawer.tsx', drawer);
