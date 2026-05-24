export const queryKeys = {
  me: ['me'] as const,
  portal: {
    shortlists: ['portal', 'shortlists'] as const,
  },
  briefs: {
    all: ['briefs'] as const,
    matches: (briefId: number | string, all = true) =>
      ['briefs', String(briefId), 'matches', all ? 'all' : 'paged'] as const,
  },
  deals: {
    all: ['deals'] as const,
  },
  offMarket: {
    all: ['off-market'] as const,
  },
};
