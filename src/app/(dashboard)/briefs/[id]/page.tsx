import { redirect } from "next/navigation";

export default async function BriefDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/briefs/${id}/matches`);
}
