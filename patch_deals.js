const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/deals/[id]/page.tsx', 'utf8');

// Add 'activity' to Tab type
content = content.replace(
  "type Tab = 'overview' | 'due_diligence' | 'cma' | 'offer' | 'settlement' | 'contacts' | 'documents';",
  "type Tab = 'overview' | 'due_diligence' | 'cma' | 'offer' | 'settlement' | 'contacts' | 'documents' | 'activity';"
);

// Add Activity to TABS array
content = content.replace(
  "['documents', 'Documents'],",
  "['documents', 'Documents'],\n    ['activity', 'Activity Feed'],"
);

// Add state for activities
content = content.replace(
  "const [documents, setDocuments] = useState<Document[]>([]);",
  "const [documents, setDocuments] = useState<Document[]>([]);\n  const [activities, setActivities] = useState<any[]>([]);"
);

// Load activities
content = content.replace(
  "setDocuments(data.documents ?? []);",
  "setDocuments(data.documents ?? []);\n    fetch(`/api/deals/${id}/activity`).then(r=>r.ok?r.json():null).then(d=>d&&setActivities(d.actions ?? []));"
);

// Add Activity Tab UI
const activityTabCode = `
        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <div className="pg-card-flat" style={{ padding: '24px 32px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Client Activity Feed</h3>
            {activities.length === 0 ? (
              <div style={{ color: 'var(--pg-text-dim)', fontSize: 13 }}>No recent activity.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activities.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pg-accent)', marginTop: 6 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.actionType.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Entity: {a.entityType}</div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{new Date(a.createdAt).toLocaleString('en-AU')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
`;

content = content.replace(
  "        {/* OFFER TAB */}",
  activityTabCode + "\n        {/* OFFER TAB */}"
);

fs.writeFileSync('src/app/(dashboard)/deals/[id]/page.tsx', content);
