// rgh-staff. Deploy normally (JWT check ON). Admin only.
// Actions: create (new staff login) and reset (new temporary password).
// Login email rule matches account.html: researchgeniushub+<username>@gmail.com
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const env = (k: string) => Deno.env.get(k) || "";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: role } = await asUser.rpc("my_role");
    if (role !== "admin") return json({ error: "Admin only" }, 403);

    const b = await req.json();

    if (b.action === "create") {
      const username = String(b.username || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const password = String(b.password || "");
      const services: string[] = Array.isArray(b.services) ? b.services.map(String) : [];
      if (!username) return json({ error: "Enter a username (letters and numbers)." }, 400);
      if (password.length < 10) return json({ error: "The temporary password must be at least 10 characters." }, 400);
      if (!services.length) return json({ error: "Choose at least one service." }, 400);

      const { data: taken } = await admin.from("staff_profiles").select("user_id").eq("username", username).maybeSingle();
      if (taken) return json({ error: `The username "${username}" is already used.` }, 400);

      const email = "researchgeniushub+" + username + "@gmail.com";
      const { data: created, error: ce } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (ce || !created?.user) return json({ error: ce?.message || "Could not create the login." }, 400);

      const { error: pe } = await admin.from("staff_profiles").insert({
        user_id: created.user.id,
        username,
        full_name: String(b.full_name || username).trim(),
        services,
        active: true,
        must_confirm: true,          // on first sign-in they enter their own email and phone
        contact_approved: false,
      });
      if (pe) {                      // roll back the login so the username can be tried again
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: pe.message }, 500);
      }
      return json({ ok: true, username });
    }

    if (b.action === "reset") {
      const password = String(b.password || "");
      if (password.length < 10) return json({ error: "The temporary password must be at least 10 characters." }, 400);
      const { error } = await admin.auth.admin.updateUserById(String(b.user_id), { password });
      if (error) return json({ error: error.message }, 500);
      await admin.from("staff_profiles").update({ must_confirm: true }).eq("user_id", b.user_id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});
