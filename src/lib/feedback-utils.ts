export const VALID_FEEDBACK_STATUSES = ['new', 'viewed', 'interested', 'need_more_info', 'not_for_me'] as const;
export const CLIENT_FEEDBACK_STATUSES = ['interested', 'need_more_info', 'not_for_me'] as const;
export type FeedbackStatus = typeof VALID_FEEDBACK_STATUSES[number];
export type ClientFeedbackStatus = typeof CLIENT_FEEDBACK_STATUSES[number];

export function validateClientFeedbackStatus(status: string): boolean {
  return (CLIENT_FEEDBACK_STATUSES as readonly string[]).includes(status);
}

export function validateFeedbackStatus(status: string): boolean {
  return (VALID_FEEDBACK_STATUSES as readonly string[]).includes(status);
}

const LABELS: Record<string, string> = {
  new: 'New',
  viewed: 'Viewed',
  interested: 'Interested',
  need_more_info: 'Need more info',
  not_for_me: 'Not for me',
};

export function normalizeFeedbackLabel(status: string): string {
  return LABELS[status] ?? status;
}
