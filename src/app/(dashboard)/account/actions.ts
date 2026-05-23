"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();

  if (!full_name) {
    redirect(`/account?error=${encodeURIComponent("Name is required.")}`);
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name, organization },
  });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/account?saved=1");
}
