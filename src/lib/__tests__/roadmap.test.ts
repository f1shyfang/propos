import { describe, it, expect } from 'vitest';
import { generateDefaultRoadmap, ROADMAP_MILESTONES, calcRoadmapDates, type RoadmapMilestone } from '../roadmap-utils';

describe('ROADMAP_MILESTONES', () => {
  it('contains the standard buyer journey blocks', () => {
    const required = ['brief_complete', 'finance_approved', 'property_search', 'inspections', 'shortlist_finalised', 'offer_made', 'due_diligence', 'settlement'];
    required.forEach(id => expect(ROADMAP_MILESTONES.some(m => m.id === id)).toBe(true));
  });

  it('has at least 8 default milestones', () => {
    expect(ROADMAP_MILESTONES.length).toBeGreaterThanOrEqual(8);
  });

  it('each milestone has id, label, defaultDurationDays', () => {
    ROADMAP_MILESTONES.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.defaultDurationDays).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('generateDefaultRoadmap', () => {
  it('returns a list of milestones in order', () => {
    const roadmap = generateDefaultRoadmap(new Date('2026-07-01'));
    expect(roadmap.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < roadmap.length; i++) {
      expect(roadmap[i].startDate.getTime()).toBeGreaterThanOrEqual(roadmap[i - 1].startDate.getTime());
    }
  });

  it('first milestone starts on the given start date', () => {
    const start = new Date('2026-07-01');
    const roadmap = generateDefaultRoadmap(start);
    expect(roadmap[0].startDate.toDateString()).toBe(start.toDateString());
  });

  it('each milestone has an endDate after startDate', () => {
    const roadmap = generateDefaultRoadmap(new Date('2026-07-01'));
    roadmap.forEach(m => {
      expect(m.endDate.getTime()).toBeGreaterThanOrEqual(m.startDate.getTime());
    });
  });
});

describe('calcRoadmapDates', () => {
  it('recomputes dates when a duration changes', () => {
    const milestones: RoadmapMilestone[] = [
      { id: 'a', label: 'A', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-15'), durationDays: 14, notes: '' },
      { id: 'b', label: 'B', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-22'), durationDays: 7, notes: '' },
    ];
    const updated = calcRoadmapDates(milestones, 0, 21); // extend first block to 21 days
    expect(updated[0].durationDays).toBe(21);
    expect(updated[1].startDate.getTime()).toBeGreaterThan(milestones[1].startDate.getTime());
  });

  it('propagates date changes through all downstream milestones', () => {
    const milestones: RoadmapMilestone[] = [
      { id: 'a', label: 'A', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-08'), durationDays: 7, notes: '' },
      { id: 'b', label: 'B', startDate: new Date('2026-07-08'), endDate: new Date('2026-07-15'), durationDays: 7, notes: '' },
      { id: 'c', label: 'C', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-22'), durationDays: 7, notes: '' },
    ];
    const updated = calcRoadmapDates(milestones, 0, 14);
    // All downstream milestones should shift
    expect(updated[2].startDate.getTime()).toBeGreaterThan(milestones[2].startDate.getTime());
  });
});
