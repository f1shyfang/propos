const fs = require('fs');
let content = fs.readFileSync('src/app/api/feedback/route.ts', 'utf8');

if (!content.includes('db.insert(userActionsTable)')) {
  content = content.replace(
    'import { requireRole } from "@/lib/session";',
    `import { requireRole } from "@/lib/session";\nimport { db } from "@/lib/db";\nimport { userActionsTable } from "@/lib/db/schema";`
  );
  
  content = content.replace(
    '  logDemoAction({',
    `  await db.insert(userActionsTable).values({
    userId: profile.id,
    actionType: "feedback_submit",
    entityType: "shortlist",
    entityId: shortlist.id,
    metadata: { feedback_status: shortlist.feedback_status }
  }).catch(console.error);

  logDemoAction({`
  );
  fs.writeFileSync('src/app/api/feedback/route.ts', content);
}

let content2 = fs.readFileSync('src/app/api/portal/shortlists/[id]/route.ts', 'utf8');
if (!content2.includes('db.insert(userActionsTable)')) {
  content2 = content2.replace(
    'import { requireRole } from "@/lib/session";',
    `import { requireRole } from "@/lib/session";\nimport { db } from "@/lib/db";\nimport { userActionsTable } from "@/lib/db/schema";`
  );
  
  content2 = content2.replace(
    '  return NextResponse.json({ success: true, status: shortlist.feedback_status });',
    `  await db.insert(userActionsTable).values({
    userId: profile.id,
    actionType: "feedback_submit",
    entityType: "shortlist",
    entityId: id,
    metadata: { status, comment }
  }).catch(console.error);

  return NextResponse.json({ success: true, status: shortlist.feedback_status });`
  );
  fs.writeFileSync('src/app/api/portal/shortlists/[id]/route.ts', content2);
}
