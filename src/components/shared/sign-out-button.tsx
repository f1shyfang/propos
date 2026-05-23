"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Icon } from "@/components/shared/icon";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className="pg-btn">
      <Icon name="logout" size={13} />
      Sign out
    </button>
  );
}
