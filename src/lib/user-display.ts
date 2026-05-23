import type { User } from "@supabase/supabase-js";

export type UserDisplay = {
  name: string;
  email: string;
  org: string;
  initials: string;
};

export function getUserDisplay(user: User | null): UserDisplay {
  if (!user) {
    return {
      name: "Guest",
      email: "",
      org: "Propos",
      initials: "G",
    };
  }

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  const email = user.email ?? "";
  const name = fullName || email.split("@")[0] || "User";
  const org =
    (typeof meta.organization === "string" && meta.organization) ||
    (typeof meta.company === "string" && meta.company) ||
    "Buyer's agency";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return { name, email, org, initials };
}
