// Deploy: supabase functions deploy rgh-notify
// Secrets: supabase secrets set RESEND_API_KEY=... FROM_EMAIL="Research Genius Hub <orders@yourdomain.com>" ADMIN_EMAIL=researchgeniushub@gmail.com SITE_URL=https://researchgeniushub.github.io
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const env = (k: string) => Deno.env.get(k) || "";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const gbp = (n: number) => "£" + Number(n || 0).toFixed(2);
const wrap = (title: string, body: string) => `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0F1B33"><h2 style="border-bottom:3px solid #D9A21B;padding-bottom:8px">${esc(title)}</h2>${body}<p style="color:#666;font-size:13px;margin-top:24px">Research Genius Hub · ${esc(env("SITE_URL"))}/account.html</p></div>`;
const rows = (o: any) => `<table style="border-collapse:collapse;width:100%">${Object.entries({
  "Order": o.id, "Service": o.data?.service, "Title": o.data?.title, "Subject": o.data?.subject, "Level": o.data?.level,
  "Referencing": o.data?.style, "Length": o.data?.pages, "Deadline": o.data?.due || o.data?.tier, "Total": o.status === "awaiting_quote" ? "Quote needed" : gbp(o.total),
  "Student": `${o.data?.customer || ""} <${o.data?.customerEmail || ""}>`, "Instructions": o.data?.instructions
}).map(([k, v]) => `<tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;width:130px">${k}</td><td style="padding:6px;border:1px solid #ddd;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}</table>`;

async function send(to: string[], subject: string, html: string, replyTo?: string, attachments: any[] = []) {
  const r = await fetch("https://api.resend.com/emails", { method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("FROM_EMAIL"), to, subject, html, reply_to: replyTo, attachments }) });
  if (!r.ok) throw new Error("Email failed: " + await r.text());
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { type, order_id, event_id } = await req.json();
    const auth = req.headers.get("Authorization") || "";
    const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: auth } } });
    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return new Response("Sign in required", { status: 401, headers: cors });
    const { data: role } = await asUser.rpc("my_role");
    const staff = role === "admin" || role === "staff";
    const { data: o } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (!o || (!staff && o.user_id !== user.id)) return new Response("Not allowed", { status: 403, headers: cors });
    const ADMIN = env("ADMIN_EMAIL"), studentEmail = o.data?.customerEmail || user.email!;
    const { data: ev } = event_id ? await admin.from("order_events").select("*").eq("id", event_id).single() : { data: null };

    // collect files: order requirements, or the files of one event (max ~30 MB attached, the rest as 7-day links)
    const paths: string[] = type === "student_update" ? (ev?.files || []).map((f: any) => f.path) : [];
    if (type === "order_placed") {
      const pre = `${o.user_id}/${o.id}/`;
      const { data: l } = await admin.storage.from("requirements").list(pre);
      (l || []).filter((f: any) => f.name && f.id).forEach((f: any) => paths.push(pre + f.name));
    }
    const attach: any[] = [], links: string[] = []; let size = 0;
    for (const p of paths) {
      const { data: blob } = await admin.storage.from("requirements").download(p); if (!blob) continue;
      const name = p.split("/").pop()!.replace(/^\d+-/, "");
      if (size + blob.size < 30e6) { size += blob.size; attach.push({ filename: name, content: encodeBase64(new Uint8Array(await blob.arrayBuffer())) }); }
      else { const { data: u } = await admin.storage.from("requirements").createSignedUrl(p, 604800); if (u) links.push(`<li><a href="${u.signedUrl}">${esc(name)}</a></li>`); }
    }
    const linkHtml = links.length ? `<p>Large files (links valid 7 days):</p><ul>${links.join("")}</ul>` : "";
    const fileNote = paths.length ? `<p>${paths.length} file(s) attached: ${paths.map(p => esc(p.split("/").pop()!.replace(/^\d+-/, ""))).join(", ")}</p>` : "<p>No files attached.</p>";
    const site = env("SITE_URL") + "/account.html";

    if (type === "order_placed" || type === "payment_reported" || type === "student_update") {
      const head = { order_placed: "New order", payment_reported: "Payment reported", student_update: ev?.kind === "feedback" ? "Revision feedback" : "Additional instructions / documents" }[type];
      let extra = "";
      if (type === "student_update") extra = `<p><b>What was added:</b> ${esc(ev.summary)}</p><p style="white-space:pre-wrap">${esc(ev.message)}</p>`;
      if (type === "payment_reported") { const { data: p } = await admin.from("payments").select("*").eq("order_id", o.id).order("created_at", { ascending: false }).limit(1).single(); extra = `<p><b>Payment:</b> ${gbp(p?.amount)} (${esc(p?.portion)}) via ${esc(p?.method)}, ref ${esc(p?.reference || "none")}. Please confirm in the staff page.</p>`; }
      await send([ADMIN], `${head}: ${o.id} · ${o.data?.customer || ""}`, wrap(head!, extra + rows(o) + fileNote + linkHtml + `<p><a href="${env("SITE_URL")}/admin.html">Open staff page</a></p>`), studentEmail, attach);
      const stuMsg = { order_placed: "Thank you. We have received your order and any files you attached. We will review it and email you the next step.",
        payment_reported: "We have received your payment report. We will check it and email you as soon as it is confirmed.",
        student_update: "We have received what you added. Our team will review it and email you the next step." }[type];
      await send([studentEmail], `${head} received: ${o.id}`, wrap(head + " received", `<p>${stuMsg}</p>${extra}${rows(o)}${fileNote}<p><a href="${site}">View in your account</a></p>`), ADMIN, attach);
    } else if (type === "staff_message" && staff && ev) {
      const owing = Math.max(0, Number(o.total) - Number(o.paid_amount));
      let status = "An update on your order.";
      if (ev.kind === "confirmation") status = ev.summary === "received" ? "We have received your documents and your order is being worked on." : ev.summary === "partial" ? `We confirmed your part payment (${gbp(o.paid_amount)}). Balance outstanding: ${gbp(owing)}.` : "We confirmed your full payment. Thank you.";
      if (ev.kind === "quote") status = `Your price is ${gbp(o.total)}. Pay from your account to start.`;
      if (ev.kind === "delivery") status = o.access === "full" ? "Your work is ready. You can view it online and download it from your account." : `Your work is ready. You can preview it online now. Please pay the balance of ${gbp(owing)} to unlock the full document and download.`;
      await send([studentEmail], `Update on order ${o.id}`, wrap("Update on your order", `<p><b>${esc(status)}</b></p><p><b>Next step:</b></p><p style="white-space:pre-wrap">${esc(ev.message)}</p><p><a href="${site}">Open your account</a></p>`), ADMIN);
      await send([ADMIN], `Sent to student · ${o.id}`, wrap("Copy of student email", `<p>${esc(status)}</p><p style="white-space:pre-wrap">${esc(ev.message)}</p>`));
    } else return new Response("Bad request", { status: 400, headers: cors });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) { return new Response(String((e as Error).message), { status: 500, headers: cors }); }
});
