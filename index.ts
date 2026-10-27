// Deploy WITHOUT the JWT check (students are not signed in; the access code is the check):
//   supabase functions deploy rgh-sample --no-verify-jwt
// Uses the same secrets as rgh-notify (RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL, SITE_URL).
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Expose-Headers": "x-opens-left,x-status" };
const env = (k: string) => Deno.env.get(k) || "";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json();
    if (b.action === "notify_code") {            // staff only: email the access code
      const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
      const { data: role } = await asUser.rpc("my_role"); if (role !== "admin" && role !== "staff") return json({ error: "Staff only" }, 403);
      const { data: a } = await admin.from("sample_access").select("*").eq("id", b.access_id).single();
      if (!a || a.status !== "approved") return json({ error: "Not approved" }, 400);
      const { data: s } = await admin.from("samples").select("title").eq("id", a.sample_id).single();
      const link = `${env("SITE_URL")}/samples.html#open=${a.sample_id}`;
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#0F1B33"><h2 style="border-bottom:3px solid #D9A21B">Your sample access code</h2>
        <p>Thank you. Your payment for <b>${s?.title || "your sample"}</b> (${a.pages_paid} page${a.pages_paid > 1 ? "s" : ""}) is confirmed.</p>
        <p style="font-size:28px;letter-spacing:4px;font-weight:bold">${a.code}</p>
        <p>Go to <a href="${link}">the samples page</a>, enter this email address and the code.</p>
        <ul><li>You can read online <b>${a.open_limit} times</b> (each time you open it after closing the tab counts as one).</li><li>You can <b>download once</b>. After you download, the code stops working.</li></ul>
        <p>You will also see this code in your account if you sign in with this email.</p></div>`;
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env("FROM_EMAIL"), to: [a.email], bcc: [env("ADMIN_EMAIL")], subject: "Your sample access code", html, reply_to: env("ADMIN_EMAIL") }) });
      if (!r.ok) return json({ error: "Email failed: " + await r.text() }, 500);
      return json({ ok: true });
    }
    if (b.action !== "view" && b.action !== "download") return json({ error: "Unknown action" }, 400);
    const email = String(b.email || "").trim().toLowerCase(), code = String(b.code || "").trim().toUpperCase();
    const { data: a } = await admin.from("sample_access").select("*").eq("sample_id", b.sample_id).ilike("email", email).eq("code", code).maybeSingle();
    if (!a) return json({ error: "That email and code do not match." }, 404);
    if (a.status === "requested") return json({ error: "pending", message: "We have not confirmed your payment yet. We will email your code as soon as we do." }, 202);
    if (a.status !== "approved") return json({ error: "Your access has ended." }, 410);
    const sess = String(b.session || "");
    let opensLeft = a.open_limit - a.opens_used;
    if (b.action === "view") {
      if (sess && sess === a.last_session) { /* same open tab: no extra use */ }
      else if (a.opens_used >= a.open_limit) return json({ error: `You have used all ${a.open_limit} online sessions. Download is still available once.` }, 410);
      else { opensLeft -= 1; await admin.from("sample_access").update({ opens_used: a.opens_used + 1, last_session: sess || crypto.randomUUID() }).eq("id", a.id); }
    } else {
      if (a.download_used >= a.download_limit) return json({ error: "This code has already been used to download." }, 410);
      await admin.from("sample_access").update({ download_used: a.download_used + 1, status: "closed" }).eq("id", a.id);
    }
    const { data: s } = await admin.from("samples").select("title,file_path,free_pages").eq("id", b.sample_id).single();
    if (!s?.file_path) return json({ error: "This sample has no document." }, 404);
    const { data: blob } = await admin.storage.from("samples").download(s.file_path);
    if (!blob) return json({ error: "Document missing." }, 500);
    const src = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
    const upto = Math.min(src.getPageCount(), (s.free_pages || 1) + a.pages_paid);
    const out = await PDFDocument.create(), pages = await out.copyPages(src, Array.from({ length: upto }, (_, i) => i)), font = await out.embedFont(StandardFonts.Helvetica);
    pages.forEach(p => { out.addPage(p); p.drawText(`Licensed to ${email}`, { x: 24, y: 12, size: 8, font, color: rgb(0.45, 0.45, 0.45) }); });
    const bytes = await out.save();
    return new Response(bytes, { headers: { ...cors, "Content-Type": "application/pdf", "Cache-Control": "no-store", "x-opens-left": String(Math.max(0, opensLeft)), "Content-Disposition": b.action === "download" ? `attachment; filename="${String(s.title).replace(/[^\w\- ]+/g, "")}.pdf"` : "inline" } });
  } catch (e) { return json({ error: String((e as Error).message) }, 500); }
});
