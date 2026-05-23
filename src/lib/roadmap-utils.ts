export interface RoadmapMilestoneTemplate {
  id: string;
  label: string;
  defaultDurationDays: number;
  description?: string;
}

export const ROADMAP_MILESTONES: RoadmapMilestoneTemplate[] = [
  { id: 'brief_complete', label: 'Brief Complete', defaultDurationDays: 7, description: 'Buyer brief signed off and search criteria confirmed' },
  { id: 'finance_approved', label: 'Finance Approved', defaultDurationDays: 21, description: 'Pre-approval or formal finance approval obtained' },
  { id: 'property_search', label: 'Property Search', defaultDurationDays: 42, description: 'Active search phase — inspections and shortlisting' },
  { id: 'inspections', label: 'Inspections', defaultDurationDays: 14, description: 'Physical inspections of shortlisted properties' },
  { id: 'shortlist_finalised', label: 'Shortlist Finalised', defaultDurationDays: 7, description: 'Client approves shortlist and selects preferred property' },
  { id: 'due_diligence', label: 'Due Diligence', defaultDurationDays: 14, description: 'Building/pest, contract review, strata (if applicable)' },
  { id: 'offer_made', label: 'Offer Made', defaultDurationDays: 7, description: 'Offer submitted and negotiation completed' },
  { id: 'settlement', label: 'Settlement', defaultDurationDays: 42, description: 'Cooling-off, finance confirmation, pre-settlement inspection, keys collected' },
];

export interface RoadmapMilestone {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  notes: string;
}

export function generateDefaultRoadmap(startDate: Date): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = [];
  let cursor = new Date(startDate);

  for (const template of ROADMAP_MILESTONES) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + template.defaultDurationDays);

    milestones.push({
      id: template.id,
      label: template.label,
      startDate: start,
      endDate: end,
      durationDays: template.defaultDurationDays,
      notes: '',
    });

    cursor = new Date(end);
  }

  return milestones;
}

export function calcRoadmapDates(milestones: RoadmapMilestone[], changedIndex: number, newDurationDays: number): RoadmapMilestone[] {
  const updated = milestones.map(m => ({ ...m }));
  updated[changedIndex].durationDays = newDurationDays;
  updated[changedIndex].endDate = new Date(updated[changedIndex].startDate);
  updated[changedIndex].endDate.setDate(updated[changedIndex].endDate.getDate() + newDurationDays);

  for (let i = changedIndex + 1; i < updated.length; i++) {
    updated[i].startDate = new Date(updated[i - 1].endDate);
    updated[i].endDate = new Date(updated[i].startDate);
    updated[i].endDate.setDate(updated[i].endDate.getDate() + updated[i].durationDays);
  }

  return updated;
}
