"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { getPortal } from "@/lib/portal/dal";
import { getActionLimiter } from "@/lib/portal/actionLimit";
import { messageSchema } from "@/lib/portal/schemas";

// Server Action of the mailbox (/de/portal/nachrichten). Verifies the session
// (getPortal -> login redirect), checks project ownership, validates with zod
// and writes through the adapter (mock: demo.json; Frappe: Communication).
// R6: rate limit per IP BEFORE the session check and per customer after it,
// both through the shared limit store (@/lib/portal/actionLimit).

const TOO_MANY = "Zu viele Nachrichten in kurzer Zeit. Bitte später erneut versuchen oder rufen Sie uns an.";

export async function sendPortalMessage(_prev, formData) {
  const values = { body: String(formData?.get?.("body") ?? ""), projectId: String(formData?.get?.("projectId") ?? "") };
  const limiter = getActionLimiter();
  if (!(await limiter.checkIp(await headers())).ok) return { ok: false, values, message: TOO_MANY };

  const portal = await getPortal("/de/portal/nachrichten");
  if (!(await limiter.checkCustomer("messages", portal.customerId)).ok) return { ok: false, values, message: TOO_MANY };

  const parsed = messageSchema.safeParse({ body: values.body, projectId: values.projectId || undefined });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, values, errors: { [String(issue.path[0] ?? "body")]: issue.message }, message: "Bitte prüfen Sie Ihre Eingabe." };
  }

  if (parsed.data.projectId) {
    const projects = await portal.listProjects();
    if (!projects.some((p) => p.id === parsed.data.projectId)) {
      return { ok: false, values, errors: { projectId: "Bitte ein Projekt aus der Liste wählen." }, message: "Bitte prüfen Sie Ihre Eingabe." };
    }
  }

  try {
    await portal.sendMessage(parsed.data);
  } catch (err) {
    console.error("[portal/nachrichten] Senden fehlgeschlagen:", err);
    return { ok: false, values, message: "Nicht gesendet – technischer Fehler. Bitte erneut versuchen oder rufen Sie uns an." };
  }

  refresh();
  return { ok: true, message: "Danke – Ihre Nachricht ist bei Ihrem Beratungsteam angekommen." };
}
