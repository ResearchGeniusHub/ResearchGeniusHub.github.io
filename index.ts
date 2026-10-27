// Deploy: supabase functions deploy rgh-staff   (admin only; uses the service role key that Supabase injects)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json();
    const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: role } = await asUser.rpc("my_role");
    if (role !== "admin") return out({ error: "Admin only" }, 403);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if ((b.password || "").length < 10 && ["create", "reset"].includes(b.action)) return out({ error: "Use a password of at least 10 characters." }, 400);
    if (b.action === "create") {
      const username = String(b.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!username) return out({ error: "Enter a staff username (letters and numbers)." }, 400);
      const email = `researchgeniushub+${username}@gmail.com`;   // same convention the Staff sign-in tab already uses
      const { data, error } = await admin.auth.admin.createUser({ email, password: b.password, email_confirm: true, user_metadata: { name: b.full_name || username } });
      if (error) return out({ error: error.message }, 400);
      const { error: e2 } = await admin.from("staff_profiles").insert({ user_id: data.user.id, username, full_name: b.full_name || username, services: b.services || [] });
      if (e2) { await admin.auth.admin.deleteUser(data.user.id); return out({ error: e2.message }, 400); }
      return out({ ok: true, username });
    }
    if (b.action === "reset") {
      const { error } = await admin.auth.admin.updateUserById(b.user_id, { password: b.password });
      if (error) return out({ error: error.message }, 400);
      await admin.from("staff_profiles").update({ must_confirm: true }).eq("user_id", b.user_id);   // staff must re-enter email and phone
      return out({ ok: true });
    }
    return out({ error: "Unknown action" }, 400);
  } catch (e) { return out({ error: String((e as Error).message) }, 500); }
});
