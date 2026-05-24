'use client';

import { useMemo } from 'react';
import type { RoadmapMilestone } from '@/lib/roadmap-utils';

interface GanttRoadmapProps {
  roadmap: RoadmapMilestone[];
}

const BAR_COLORS = ['#E5B100', '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6', '#6366F1'];

function barColor(i: number) {
  return BAR_COLORS[i % BAR_COLORS.length];
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function GanttRoadmap({ roadmap }: GanttRoadmapProps) {
  const overallStart = roadmap[0].startDate;
  const overallEnd = roadmap[roadmap.length - 1].endDate;
  const totalSpan = Math.max(1, (overallEnd.getTime() - overallStart.getTime()) / (1000 * 60 * 60 * 24));

  const weeks = useMemo(() => {
    const list: Date[] = [];
    let cursor = new Date(overallStart);
    while (cursor <= overallEnd) {
      list.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return list;
  }, [overallStart, overallEnd]);

  const today = new Date();
  const todayOffsetDays = (today.getTime() - overallStart.getTime()) / (1000 * 60 * 60 * 24);
  const showToday = todayOffsetDays >= 0 && todayOffsetDays <= totalSpan;
  const todayLeftPct = showToday ? (todayOffsetDays / totalSpan) * 100 : null;

  return (
    <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--pg-border)', height: 42 }}>
        <div style={{
          width: 200, flexShrink: 0, padding: '10px 16px',
          fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase',
          borderRight: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center',
        }}>
          Milestone
        </div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
          {weeks.map((w, i) => (
            <div key={i} style={{
              flex: 1, borderLeft: i === 0 ? 'none' : '1px dashed var(--pg-border)',
              padding: '6px 4px 0', fontSize: 10, color: 'var(--pg-text-faint)',
              minWidth: 0, textAlign: 'center', lineHeight: 1.3,
            }}>
              <div>{w.getDate()}</div>
              <div>{w.toLocaleDateString('en-AU', { month: 'short' })}</div>
            </div>
          ))}
          {todayLeftPct != null && (
            <div style={{
              position: 'absolute', left: `${todayLeftPct}%`, top: 0, bottom: 0, width: 2,
              background: 'var(--pg-red)', zIndex: 10,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: 4, fontSize: 9, fontWeight: 600,
                color: 'var(--pg-red)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Today</div>
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      {roadmap.map((m, i) => {
        const offsetDays = (m.startDate.getTime() - overallStart.getTime()) / (1000 * 60 * 60 * 24);
        const leftPct = (offsetDays / totalSpan) * 100;
        const widthPct = (m.durationDays / totalSpan) * 100;
        const color = barColor(i);

        return (
          <div key={m.id} style={{
            display: 'flex', borderBottom: i < roadmap.length - 1 ? '1px solid var(--pg-border)' : 'none',
            alignItems: 'center', minHeight: 52,
          }}>
            {/* Label column */}
            <div style={{ width: 200, flexShrink: 0, padding: '10px 16px', borderRight: '1px solid var(--pg-border)' }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                {formatDate(m.startDate)} → {formatDate(m.endDate)}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ flex: 1, position: 'relative', height: 52, overflow: 'hidden' }}>
              {weeks.map((_, wi) => (
                <div key={wi} style={{
                  position: 'absolute', left: `${(wi / weeks.length) * 100}%`,
                  top: 0, bottom: 0, width: 1,
                  borderLeft: wi === 0 ? 'none' : '1px dashed var(--pg-border)',
                }} />
              ))}
              {todayLeftPct != null && (
                <div style={{
                  position: 'absolute', left: `${todayLeftPct}%`, top: 0, bottom: 0, width: 2,
                  background: 'var(--pg-red)', zIndex: 10,
                }} />
              )}
              <div style={{
                position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                top: '50%', transform: 'translateY(-50%)', height: 22,
                background: color, borderRadius: 5, opacity: 0.85,
                display: 'flex', alignItems: 'center', padding: '0 8px', minWidth: 4,
              }}>
                {widthPct > 12 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, color: '#FFF',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{m.durationDays}d</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
