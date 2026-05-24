export type UserDisplay = {
  name: string;
  email: string;
  org: string;
  initials: string;
};

export type ProfileFields = {
  fullName: string;
  organization: string;
  email: string;
};

type AuthUser = {
  name?: string | null;
  email?: string | null;
  organization?: string | null;
};

export function getProfileFields(user: AuthUser | null): ProfileFields {
  if (!user) return { fullName: "", organization: "", email: "" };
  return {
    fullName: user.name ?? "",
    organization: user.organization ?? "",
    email: user.email ?? "",
  };
}

export function getUserDisplay(user: AuthUser | null): UserDisplay {
  if (!user) {
    return { name: "Guest", email: "", org: "PropOS", initials: "G" };
  }

  const email = user.email ?? "";
  const name = user.name || email.split("@")[0] || "User";
  const org = user.organization || "Buyer's agency";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return { name, email, org, initials };
}
