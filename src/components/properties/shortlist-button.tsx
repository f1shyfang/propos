'use client';

import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { toast } from 'sonner';

export function ShortlistButton({ propertyId, briefId = 'brief-sarah' }: { propertyId: string, briefId?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleShortlist() {
    setLoading(true);
    try {
      const res = await fetch('/api/shortlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, briefId })
      });
      if (res.ok) {
        toast.success('Property added to shortlist!');
      } else {
        toast.error('Failed to add to shortlist');
      }
    } catch (e) {
      toast.error('Failed to add to shortlist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleShortlist} disabled={loading} className="pg-btn pg-btn-primary shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
      <Icon name="bookmark" size={14} />
      {loading ? 'Adding...' : 'Add to Shortlist'}
    </button>
  );
}
