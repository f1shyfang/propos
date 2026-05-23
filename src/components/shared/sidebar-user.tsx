import { createClient } from '@/lib/supabase/server';
import { getUserDisplay } from '@/lib/user-display';

import { SidebarFooter } from './sidebar-footer';

export async function SidebarUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const display = getUserDisplay(user);

  return <SidebarFooter user={display} />;
}
