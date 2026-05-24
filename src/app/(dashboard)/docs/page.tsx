'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { formatFileSize, getDocTagColor, DOC_TAGS } from '@/lib/doc-utils';

interface Doc {
  id: number;
  dealId: number | null;
  filename: string;
  tag: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  clientVisible: boolean;
  status: string | null;
  createdAt: string;
  dealStatus: string | null;
  propertyAddress: string | null;
  propertySuburb: string | null;
  clientName: string | null;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('');

  async function load(tag: string) {
    setLoading(true);
    const url = tag ? `/api/docs?tag=${encodeURIComponent(tag)}` : '/api/docs';
    const res = await fetch(url);
    if (res.ok) setDocs((await res.json()).docs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(''); }, []);

  function handleTagChange(tag: string) {
    setSelectedTag(tag);
    load(tag);
  }

  async function downloadDoc(docId: number) {
    const res = await fetch(`/api/docs/${docId}/download-url`);
    if (!res.ok) return;
    const { downloadUrl } = await res.json();
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  const clientVisible = docs.filter(d => d.clientVisible);
  const agentOnly = docs.filter(d => !d.clientVisible);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
        title="Documents"
        actions={
          <select
            value={selectedTag}
            onChange={e => handleTagChange(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12 }}
          >
            <option value="">All types</option>
            {DOC_TAGS.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }} className="pg-scroll">
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>
            Loading documents…
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--pg-text-dim)', marginBottom: 6 }}>No documents yet</div>
            <div style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>
              Documents are added from the Documents tab inside each deal.
            </div>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 24 }}>
            {[
              { label: 'Client-visible', list: clientVisible, icon: 'users' as const },
              { label: 'Agent only', list: agentOnly, icon: 'shield' as const },
            ]
              .filter(({ list }) => list.length > 0)
              .map(({ label, list, icon }) => (
                <section key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Icon name={icon} size={13} color="var(--pg-text-faint)" />
                    <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-dim)' }}>
                      {label}
                    </h2>
                    <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{list.length}</span>
                  </div>

                  <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 0.5fr 0.6fr', padding: '9px 16px', borderBottom: '1px solid var(--pg-border)', fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                      <span>Filename</span><span>Deal</span><span>Client</span><span>Added</span><span style={{ textAlign: 'right' }}>Size</span><span />
                    </div>
                    {list.map((doc, i, a) => (
                      <div key={doc.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 0.5fr 0.6fr', padding: '12px 16px', borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none', fontSize: 13, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <Icon name="file-text" size={15} color="var(--pg-text-faint)" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</div>
                            {doc.tag && (
                              <span style={{ fontSize: 10.5, fontWeight: 500, color: getDocTagColor(doc.tag), marginTop: 1, display: 'inline-block' }}>
                                {doc.tag}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          {doc.dealId ? (
                            <a href={`/deals/${doc.dealId}`} style={{ color: 'var(--pg-accent)', textDecoration: 'none', fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {doc.propertyAddress ?? `Deal #${doc.dealId}`}
                            </a>
                          ) : '—'}
                          {doc.propertySuburb && (
                            <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{doc.propertySuburb}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.clientName ?? '—'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)' }}>
                          {new Date(doc.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', textAlign: 'right', fontFamily: 'var(--pg-font-mono)' }}>
                          {formatFileSize(doc.fileSize)}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {doc.status === 'ready' && (
                            <button type="button" className="pg-btn pg-btn-sm" onClick={() => void downloadDoc(doc.id)}>
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
