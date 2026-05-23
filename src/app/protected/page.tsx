import { redirect } from "next/navigation";

import { signOut } from "../login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Protected page</h1>
      <p className="text-sm text-gray-600">
        Signed in as <span className="font-mono">{user.email}</span>
      </p>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
