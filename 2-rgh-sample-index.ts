// rgh-sample. Deploy WITH --no-verify-jwt (students are not signed in; the access code is the check).
// Staff/admin actions (approve, resend) check the caller's login inside this function.
// Secrets (same as rgh-notify): RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL, SITE_URL
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "x-opens-left,x-kind",
};
const env = (k: string) => Deno.env.get(k) || "";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
const money = (n: number) => "£" + Number(n || 0).toFixed(2);
const WORDS_PER_PAGE = 275;

async function callerIsStaff(req: Request): Promise<boolean> {
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const { data: role } = await asUser.rpc("my_role");
  return role === "admin" || role === "staff";
}

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/L to avoid confusion
  let c = "";
  for (const b of crypto.getRandomValues(new Uint8Array(8))) c += chars[b % chars.length];
  return c;
}

async function emailCode(a: any, title: string, code: string): Promise<{ emailed: boolean; why?: string }> {
  const link = `${env("SITE_URL")}/samples.html#open=${a.sample_id}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#0F1B33"><h2 style="border-bottom:3px solid #D9A21B">Your sample access code</h2>
    <p>Thank you. Your payment for <b>${title}</b> (${a.pages} page${a.pages > 1 ? "s" : ""}, ${money(a.amount)}) is confirmed.</p>
    <p style="font-size:28px;letter-spacing:4px;font-weight:bold">${code}</p>
    <p>Go to <a href="${link}">the samples page</a>, enter this email address and the code.</p>
    <ul><li>You can read online <b>${a.open_limit} times</b> (each time you open it after closing the tab counts as one).</li><li>You can <b>download once</b>. After you download, the code stops working.</li></ul>
    <p>You will also see this code in your account if you sign in with this email.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("FROM_EMAIL"), to: [a.email], bcc: [env("ADMIN_EMAIL")], subject: "Your sample access code", html, reply_to: env("ADMIN_EMAIL") }),
  });
  if (!r.ok) return { emailed: false, why: (await r.text()).slice(0, 200) };
  return { emailed: true };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json();

    // ---- Staff/admin actions -------------------------------------------------
    if (b.action === "approve" || b.action === "resend" || b.action === "notify_code") {
      if (!(await callerIsStaff(req))) return json({ error: "Staff only" }, 403);
      const { data: a } = await admin.from("sample_access").select("*").eq("id", b.access_id).single();
      if (!a) return json({ error: "Request not found" }, 404);
      const { data: s } = await admin.from("samples").select("title").eq("id", a.sample_id).single();
      const title = s?.title || "your sample";
      let code = a.code as string;

      if (b.action === "approve") {                       // payment confirmed: create the code
        if (a.status !== "requested") return json({ error: "This request is already " + a.status + "." }, 400);
        code = makeCode();
        const { error } = await admin.from("sample_access").update({
          status: "approved", code, approved_at: new Date().toISOString(), opens_used: 0, download_used: 0, last_session: null,
        }).eq("id", a.id);
        if (error) return json({ error: error.message }, 500);
      } else {                                            // resend or notify: code must already be live
        if (a.status !== "approved" || !code) return json({ error: "Only an approved code can be sent. Confirm payment, or reset uses first." }, 400);
      }

      const mail = await emailCode({ ...a, amount: a.amount ?? 0 }, title, code);
      return json({ ok: true, code, emailed: mail.emailed, why: mail.why || "" });
    }

    // ---- Student actions: view online or download with the access code -----
    if (b.action !== "view" && b.action !== "download") return json({ error: "Unknown action" }, 400);
    const email = String(b.email || "").trim().toLowerCase(), code = String(b.code || "").trim().toUpperCase();
    const { data: a } = await admin.from("sample_access").select("*").eq("sample_id", b.sample_id).eq("email", email).eq("code", code).maybeSingle();
    if (!a) return json({ error: "That email and code do not match." }, 404);
    if (a.status === "requested") return json({ error: "pending", message: "We have not confirmed your payment yet. We will email your code as soon as we do." }, 202);
    if (a.status !== "approved") return json({ error: "Your access has ended." }, 410);

    const { data: s } = await admin.from("samples").select("title,file_path,free_pages").eq("id", b.sample_id).single();
    if (!s) return json({ error: "Sample not found." }, 404);

    const sess = String(b.session || "");
    const sameSession = b.action === "view" && !!sess && sess === a.last_session;   // same open tab: no extra use
    const countsAsOpen = b.action === "view" && !sameSession;
    if (countsAsOpen && a.opens_used >= a.open_limit) return json({ error: `You have used all ${a.open_limit} online sessions. Download is still available once.` }, 410);
    if (b.action === "download" && a.download_used >= a.download_limit) return json({ error: "This code has already been used to download." }, 410);
    const opensLeft = Math.max(0, a.open_limit - a.opens_used - (countsAsOpen ? 1 : 0));
    const paidPages = a.pages || 1;
    const freePages = s.free_pages || 1;
    const headers: Record<string, string> = { ...cors, "Cache-Control": "no-store", "x-opens-left": String(opensLeft) };

    let response: Response;
    if (!s.file_path) {
      // Text-only sample (Word or .txt upload): send the text the student has paid for
      const { data: ft } = await admin.from("sample_full").select("body").eq("sample_id", b.sample_id).maybeSingle();
      const body = String(ft?.body || "");
      const limit = (freePages + paidPages) * WORDS_PER_PAGE;
      let count = 0, cut = body.length;
      for (const m of body.matchAll(/\S+/g)) { if (++count >= limit) { cut = (m.index ?? 0) + m[0].length; break; } }
      headers["x-kind"] = "text";
      headers["Content-Type"] = "application/json";
      response = new Response(JSON.stringify({ title: s.title, text: body.slice(0, cut) }), { headers });
    } else {
      // PDF: free pages plus the pages paid for, watermarked with the student's email
      const { data: blob } = await admin.storage.from("samples").download(s.file_path);
      if (!blob) return json({ error: "Document missing. Re-upload the sample in Admin > Samples." }, 500);
      const src = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
      const upto = Math.min(src.getPageCount(), freePages + paidPages);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, Array.from({ length: upto }, (_, i) => i));
      const font = await out.embedFont(StandardFonts.Helvetica);
      pages.forEach(p => { out.addPage(p); p.drawText(`Licensed to ${email}`, { x: 24, y: 12, size: 8, font, color: rgb(0.45, 0.45, 0.45) }); });
      const bytes = await out.save();
      headers["Content-Type"] = "application/pdf";
      headers["Content-Disposition"] = b.action === "download"
        ? `attachment; filename="${String(s.title).replace(/[^\w\- ]+/g, "")}.pdf"` : "inline";
      response = new Response(bytes, { headers });
    }

    // Count the use only after the content is ready
    if (countsAsOpen) await admin.from("sample_access").update({ opens_used: a.opens_used + 1, last_session: sess || crypto.randomUUID() }).eq("id", a.id);
    if (b.action === "download") await admin.from("sample_access").update({ download_used: a.download_used + 1, status: "closed" }).eq("id", a.id);
    return response;
  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});
