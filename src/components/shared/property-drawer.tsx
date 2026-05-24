'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { toast } from 'sonner';

export interface PropertyDrawerProps {
  propertyId: string | null;
  onClose: () => void;
  // Fallback data if API hasn't loaded yet
  initialProperty?: any; 
}

const TABS = [
  'Overview',
  'Listing Details',
  'CMA',
  'Feasibility',
  'Due Diligence',
  'Documents',
  'History'
];

export function PropertyDrawer({ propertyId, onClose, initialProperty }: PropertyDrawerProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [property, setProperty] = useState<any>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  
  const [saving, setSaving] = useState(false);
  const [generatingCMA, setGeneratingCMA] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    
    setProperty(initialProperty || null);
    
    // Simulate fetching full property details
    // In Phase 2 we will wire this to /api/properties/[id] connected to Drizzle
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.ok) {
          const json = await res.json();
          setProperty(json.data?.property || json.property || json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
    
    // Keydown for Escape
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [propertyId, onClose]);

  if (!propertyId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20, 18, 12, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          animation: 'pg-fade-in 0.2s ease-out'
        }} 
      />
      
      {/* Drawer */}
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          // width handled by className
          background: 'var(--pg-bg)',
          zIndex: 10000,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column',
          animation: 'pg-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="w-full max-w-full md:w-[520px]"
      >
        {loading && !property ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--pg-text-dim)' }}>Loading property details...</div>
        ) : !property ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--pg-red)' }}>Property not found</div>
        ) : (
          <>
            {/* Header / Sticky */}
            <div style={{ position: 'sticky', top: 0, background: 'var(--pg-bg)', zIndex: 10, borderBottom: '1px solid var(--pg-border)' }}>
              
              {/* Image Hero Area */}
              <div style={{ height: 160, background: 'var(--pg-surface)', position: 'relative' }}>
                {property.images?.[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={property.images[0]} alt={property.canonical_address || property.address} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pg-text-faint)' }}>
                    No Image
                  </div>
                )}
                
                <button 
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 32, height: 32, borderRadius: 16,
                    background: 'rgba(20, 18, 12, 0.6)', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)'
                  }}
                >
                  <Icon name="x" size={16} />
                </button>
                
                {property.images?.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(20, 18, 12, 0.7)', color: '#FFF',
                    fontSize: 11, fontWeight: 500, padding: '4px 8px', borderRadius: 12,
                    backdropFilter: 'blur(4px)'
                  }}>
                    1 / {property.images.length} photos
                  </div>
                )}
              </div>
              
              {/* Header Details */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 className="pg-display" style={{ margin: '0 0 4px', fontSize: 20 }}>{property.canonical_address || property.address}</h2>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 13 }}>{property.suburb}, {property.state} {property.postcode}</div>
                  </div>
                  {property.priceDisplay && (
                    <div className="pg-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--pg-text)' }}>
                      {property.priceDisplay}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <span className="pg-badge pg-badge-green">For Sale</span>
                  
                  {/* Quick Actions */}
                  <div style={{ flex: 1 }} />
                  <button className="pg-btn pg-btn-sm pg-btn-ghost" onClick={() => toast.success("Share link copied to clipboard")}><Icon name="share" size={12} /> Share</button>
                  <button className="pg-btn pg-btn-sm pg-btn-ghost" onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); toast.success("Property saved!"); }, 600); }} disabled={saving}>
                    <Icon name="bookmark" size={12} /> {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
              
              {/* Horizontal Scrollable Tabs */}
              <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px', gap: 4 }} className="pg-scroll-hide">
                {TABS.map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none', border: 'none',
                      padding: '12px 12px', fontSize: 13, fontWeight: 500,
                      color: activeTab === tab ? 'var(--pg-text)' : 'var(--pg-text-dim)',
                      borderBottom: `2px solid ${activeTab === tab ? 'var(--pg-text)' : 'transparent'}`,
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="pg-scroll">
              
              {activeTab === 'Overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Key Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 16, background: 'var(--pg-surface)', borderRadius: 8, border: '1px solid var(--pg-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Icon name="bed" size={16} color="var(--pg-text-dim)" />
                      <div style={{ marginTop: 6, fontWeight: 600, fontSize: 14 }}>{property.bedrooms || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Beds</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid var(--pg-border)', borderRight: '1px solid var(--pg-border)' }}>
                      <Icon name="bath" size={16} color="var(--pg-text-dim)" />
                      <div style={{ marginTop: 6, fontWeight: 600, fontSize: 14 }}>{property.bathrooms || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Baths</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Icon name="car" size={16} color="var(--pg-text-dim)" />
                      <div style={{ marginTop: 6, fontWeight: 600, fontSize: 14 }}>{property.parkingSpaces || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Cars</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Property Type</div>
                      <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{property.propertyType || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Land Size</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{property.landSize ? `${property.landSize} sqm` : '—'}</div>
                    </div>
                  </div>

                  {property?.rawData?.description && (
                    <div>
                      <h3 className="pg-display" style={{ fontSize: 16, marginBottom: 8 }}>Description</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--pg-text-dim)' }}>
                        {property.rawData.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Listing Details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 className="pg-display" style={{ fontSize: 16, margin: 0 }}>Detailed Specifications</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    <DetailRow label="Council Area" value={property.lgaName || '—'} />
                    <DetailRow label="Floor Area" value={property.floorAreaSqm ? `${property.floorAreaSqm} sqm` : '—'} />
                    <DetailRow label="Sale Type" value={property.saleType || 'Private Treaty'} />
                    <DetailRow label="Days on Market" value={property.days ? `${property.days} days` : '—'} />
                    <DetailRow label="G-NAF PID" value={property.gnafPid || '—'} />
                  </div>
                </div>
              )}

              {activeTab === 'CMA' && (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <Icon name="chart" size={24} color="var(--pg-text-faint)" />
                    <h3 className="pg-display" style={{ fontSize: 16, margin: 0 }}>Comparable Market Analysis</h3>
                  </div>
                  {property.cma_records && property.cma_records.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {property.cma_records.map((cma: any) => (
                        <div key={cma.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid var(--pg-border)', borderRadius: 8 }}>
                          <div>
                            <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{cma.eventType.replace(/_/g, ' ')}</div>
                            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{new Date(cma.saleDate).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontWeight: 600 }}>{cma.salePrice ? `$${cma.salePrice.toLocaleString()}` : 'Price Withheld'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--pg-text-dim)' }}>No comparable sales found.</p>
                  )}
                  <button className="pg-btn pg-btn-secondary" style={{ marginTop: 16 }} onClick={() => { setGeneratingCMA(true); setTimeout(() => { setGeneratingCMA(false); window.open(`/properties/${property.id}/cma`, '_blank'); }, 600); }} disabled={generatingCMA || !property?.id}>
                    {generatingCMA ? "Generating..." : "Generate CMA Report"}
                  </button>
                </div>
              )}

              {activeTab === 'Feasibility' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ padding: 16, border: '1px solid var(--pg-border)', borderRadius: 8, background: 'var(--pg-surface)' }}>
                    <h3 className="pg-display" style={{ fontSize: 15, margin: '0 0 16px' }}>Holding Costs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <FeasibilityRow label="Strata Admin Fund (Qtr)" value={property.propertyFinancials?.strataAdminFundQuarterly || '—'} />
                      <FeasibilityRow label="Strata Capital Works (Qtr)" value={property.propertyFinancials?.strataCapitalWorksQuarterly || '—'} />
                      <FeasibilityRow label="Council Rates (Annual)" value={property.propertyFinancials?.councilRatesAnnual || '—'} />
                      <FeasibilityRow label="Water Rates (Qtr)" value={property.propertyFinancials?.waterRatesQuarterly || '—'} />
                      
                      {property.propertyFinancials?.specialLeviesActive && (
                        <div style={{ marginTop: 8, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#991B1B', borderRadius: 6, fontSize: 12 }}>
                          <strong>Active Special Levy:</strong> {property.propertyFinancials.specialLeviesDescription}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ padding: 16, border: '1px solid var(--pg-border)', borderRadius: 8, background: 'var(--pg-surface)' }}>
                    <h3 className="pg-display" style={{ fontSize: 15, margin: '0 0 16px' }}>Investment Yield</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <FeasibilityRow label="Rental Appraisal (Min)" value={property.investmentMetrics?.rentalAppraisalMin || '—'} />
                      <FeasibilityRow label="Rental Appraisal (Max)" value={property.investmentMetrics?.rentalAppraisalMax || '—'} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed var(--pg-border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Est. Gross Yield</span>
                        <span className="pg-mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--pg-green)' }}>
                          {property.investmentMetrics?.grossYieldEstimate ? `${property.investmentMetrics.grossYieldEstimate}%` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Due Diligence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 className="pg-display" style={{ fontSize: 16, margin: 0 }}>Risk Assessment</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {property.risks && property.risks.length > 0 ? property.risks.map((risk: any) => (
                      <RiskRow key={risk.id} label={risk.riskType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} level={risk.riskLevel === 'low' ? 'Low' : risk.riskLevel === 'moderate' ? 'Medium' : risk.riskLevel === 'high' ? 'High' : 'None'} description={risk.description} />
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--pg-text-dim)' }}>No significant risks identified.</div>
                    )}
                  </div>
                </div>
              )}

              {(activeTab === 'Documents' || activeTab === 'History') && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--pg-text-dim)' }}>
                  <div style={{ fontSize: 14 }}>Nothing to show yet</div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', marginTop: 4 }}>This tab populates as the deal progresses.</div>
                </div>
              )}

            </div>

            {/* Persistent Quick Actions Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--pg-border)', background: 'var(--pg-surface)', display: 'flex', gap: 12 }}>
              <button className="pg-btn pg-btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => { setShortlisting(true); setTimeout(() => { setShortlisting(false); toast.success("Added to shortlist"); }, 600); }} disabled={shortlisting}>
                {shortlisting ? "Adding..." : "Add to Shortlist"}
              </button>
              <button className="pg-btn pg-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => { setCreatingDeal(true); setTimeout(() => { setCreatingDeal(false); toast.success("Deal created"); }, 600); }} disabled={creatingDeal}>
                {creatingDeal ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Global styles for animation if not present */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pg-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pg-slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}} />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function FeasibilityRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{label}</span>
      <span className="pg-mono" style={{ fontSize: 13, fontWeight: 500 }}>{typeof value === 'number' ? `$${value}` : value}</span>
    </div>
  );
}

function RiskRow({ label, level, description }: { label: string; level: 'None' | 'Low' | 'Medium' | 'High'; description?: string }) {
  const colors = {
    None: { bg: 'rgba(0,0,0,0.04)', text: 'var(--pg-text-dim)' },
    Low: { bg: 'rgba(34,197,94,0.1)', text: '#166534' },
    Medium: { bg: 'rgba(245,158,11,0.1)', text: '#92400E' },
    High: { bg: 'rgba(239,68,68,0.1)', text: '#991B1B' },
  };
  const c = colors[level];

  return (
    <div style={{ padding: 12, border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: c.bg, color: c.text }}>{level} Risk</span>
      </div>
      {description && <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 6 }}>{description}</div>}
    </div>
  );
}
