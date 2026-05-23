"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function landingRedirect(error: string) {
  redirect(`/?error=${encodeURIComponent(error)}`);
}

function dashboardRedirect() {
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });

  if (error) {
    const returnTo = String(formData.get("returnTo") ?? "");
    if (returnTo === "/") {
      landingRedirect(error.message);
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const next = String(formData.get("next") ?? "");
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const name = String(formData.get("name") ?? "").trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { full_name: name } } : undefined,
  });

  if (error) {
    const returnTo = String(formData.get("returnTo") ?? "");
    if (returnTo === "/") {
      landingRedirect(error.message);
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    dashboardRedirect();
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/login?message=Account created. Sign in to continue.");
  }

  dashboardRedirect();
}

export async function demoSignup(formData: FormData) {
  formData.set("returnTo", "/");
  await signup(formData);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
