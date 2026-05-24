export function buildBriefMatchesHref(briefId: number): string {
  return `/briefs/${briefId}?tab=matches`;
}

/** Legacy route segment; use a redirect page to `buildBriefMatchesHref`. */
export function buildLegacyBriefMatchesPath(briefId: number): string {
  return `/briefs/${briefId}/matches`;
}

export function buildClientBriefHref(briefId: number): string {
  return `/client-brief/${briefId}`;
}

export function buildClientBriefUrl(briefId: number, origin: string): string {
  return `${origin}${buildClientBriefHref(briefId)}`;
}

type PollTimestamps = {
  sharedAt: Date | null;
  feedbackAt: Date | null;
};

export function shouldIncludeFeedbackPollItem(
  row: PollTimestamps,
  since: Date | null,
): boolean {
  if (!row.sharedAt) return false;
  if (!since || Number.isNaN(since.getTime())) return true;
  if (row.sharedAt > since) return true;
  if (row.feedbackAt && row.feedbackAt > since) return true;
  return false;
}

export function buildClientFeedbackUpdate(input: {
  feedbackStatus: string;
  feedbackText?: string | null;
  feedbackReason?: string | null;
}): {
  feedbackStatus: string;
  feedbackText: string | null;
  feedbackReason: string | null;
} {
  const feedbackText =
    input.feedbackText != null && String(input.feedbackText).trim() !== ''
      ? String(input.feedbackText).trim()
      : null;
  const feedbackReason =
    input.feedbackReason != null && String(input.feedbackReason).trim() !== ''
      ? String(input.feedbackReason).trim()
      : null;
  return {
    feedbackStatus: input.feedbackStatus,
    feedbackText,
    feedbackReason,
  };
}
