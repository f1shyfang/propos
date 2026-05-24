import { demoProfiles, type Profile, type Role } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentProfile(preferredRole?: Role): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        return profile as Profile;
      }
    }
  }

  return demoProfiles.find((profile) => profile.role === preferredRole) ?? demoProfiles[0];
}

export async function requireRole(role: Role): Promise<Profile> {
  return getCurrentProfile(role);
}
