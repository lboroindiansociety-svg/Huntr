import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export type UserClientResult =
  | { supabase: SupabaseClient; user: User }
  | { error: string; status: number };

export async function createUserSupabaseClient(req: Request): Promise<UserClientResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Sign in to sync listings", status: 401 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return { error: "Supabase is not configured", status: 500 };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: "Sign in to sync listings", status: 401 };
  }

  return { supabase, user };
}
