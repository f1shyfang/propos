'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/icon';

interface Milestone {
  id: number;
  title: string;
  dayOffset: number | null;
  dueDate: string | null;
  completedAt: string | null;
  status: string;
  notes?: string | null;
}

interface SettlementTimelineProps {
  milestones: Milestone[];
  onToggle?: (id: number, completed: boolean) => Promise<void>;
  readOnly?: boolean;
}

export function SettlementTimeline({ milestones, onToggle, readOnly = false }: SettlementTimelineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!milestones || milestones.length === 0) return null;

  return (
    <div>
      <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--pg-text-faint)] mb-3">
        Milestone timeline · {milestones.filter(m => m.status === 'completed').length}/{milestones.length} complete
      </div>
      <div className="flex flex-col">
        {milestones.map((m, i) => {
          const overdue = mounted && m.dueDate && m.status !== 'completed' && new Date(m.dueDate) < new Date();
          return (
            <div key={m.id} className="flex gap-[14px] pb-1">
              <div className="flex flex-col items-center w-5 shrink-0">
                <button
                  role="checkbox"
                  aria-checked={m.status === 'completed'}
                  aria-label={`Toggle ${m.title}`}
                  onClick={() => !readOnly && onToggle && onToggle(m.id, m.status !== 'completed')}
                  disabled={readOnly}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    m.status === 'completed'
                      ? 'border-[var(--pg-green)] bg-[var(--pg-green)]'
                      : overdue
                      ? 'border-[var(--pg-red)] bg-transparent'
                      : 'border-[var(--pg-border)] bg-transparent'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {m.status === 'completed' && <Icon name="check" size={10} color="white" />}
                </button>
                {i < milestones.length - 1 && <div className="flex-1 w-[2px] bg-[var(--pg-border)] min-h-[24px] my-[2px]" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[13px] font-medium ${
                    m.status === 'completed' ? 'line-through text-[var(--pg-text-faint)]' : 'text-[var(--pg-text)]'
                  }`}>
                    {m.title}
                  </span>
                  {overdue && <span className="pg-badge pg-badge-red text-[10px]">Overdue</span>}
                </div>
                {m.dueDate && (
                  <div className="text-[11.5px] text-[var(--pg-text-faint)] mt-[2px]">
                    Day {m.dayOffset} · {new Date(m.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    {m.completedAt && ` · Completed ${new Date(m.completedAt).toLocaleDateString('en-AU')}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
