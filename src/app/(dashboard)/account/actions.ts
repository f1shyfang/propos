"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();

  if (!full_name) {
    redirect(`/account?error=${encodeURIComponent("Name is required.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/account?saved=1");
}
