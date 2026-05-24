import { redirect } from 'next/navigation';
import { buildBriefMatchesHref } from '@/lib/core-flow-utils';

export default async function BriefMatchesRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(buildBriefMatchesHref(Number(id)));
}
