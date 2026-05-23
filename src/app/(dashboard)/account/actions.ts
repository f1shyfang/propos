"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function updateProfile(formData: FormData) {
  const sessionData = await auth.api.getSession({ headers: await headers() });
  if (!sessionData) redirect("/login");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();

  if (!full_name) {
    redirect(`/account?error=${encodeURIComponent("Name is required.")}`);
  }

  await db
    .update(user)
    .set({ name: full_name, organization, updatedAt: new Date() })
    .where(eq(user.id, sessionData.user.id));

  revalidatePath("/", "layout");
  redirect("/account?saved=1");
}
