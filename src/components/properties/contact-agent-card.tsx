'use client';

import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { toast } from 'sonner';

export function ContactAgentCard({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        toast.success('Message sent to listing agent!');
        setMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pg-card p-6 shadow-sm">
      <h2 className="pg-display m-0 mb-4 text-lg font-semibold">Listing Agent</h2>
      
      <div className="flex gap-4 items-center mb-5">
        <div className="w-12 h-12 rounded-full bg-[var(--pg-primary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
          MC
        </div>
        <div>
          <div className="font-semibold text-[15px]">Michael Chen</div>
          <div className="text-[var(--pg-text-dim)] text-xs mt-0.5">Ray White Real Estate</div>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <a href="tel:0400000000" className="pg-btn flex-1 justify-center no-underline shadow-sm hover:shadow-md transition-all duration-200">
          <Icon name="phone" size={14} /> Call
        </a>
        <a href="mailto:michael@demo.com" className="pg-btn flex-1 justify-center no-underline shadow-sm hover:shadow-md transition-all duration-200">
          <Icon name="mail" size={14} /> Email
        </a>
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-2">
        <label className="block text-xs font-medium text-[var(--pg-text-dim)]">Send a quick message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi Michael, is this property still available for private inspection this weekend?"
          className="w-full min-h-[80px] p-3 border border-[var(--pg-border)] rounded-lg text-[13px] resize-y focus:outline-none focus:border-[var(--pg-primary)] focus:ring-1 focus:ring-[var(--pg-primary)] transition-all"
        />
        <button type="submit" disabled={loading || !message.trim()} className="pg-btn pg-btn-primary w-full justify-center mt-2 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
