import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAdapter } from "./adapters";
import { PORTAL_LOGIN_PATH, SESSION_COOKIE } from "./config";
import { readSessionValue } from "./session";

// Data Access Layer of the portal – THE entry point for every portal page,
// component and route handler. The auth check lives here, next to the data,
// not in a layout (layouts don't re-run on client navigation) and not in
// src/proxy.js (left untouched on purpose).
//
//   Page / Server Component:  const portal = await getPortal("/de/portal/projekte");
//                             const projects = await portal.listProjects();
//   Route Handler (/api/portal/**):
//                             const auth = await requireApiSession(request);
//                             if (auth.response) return auth.response;
//                             const projects = await auth.portal.listProjects();

/** Session from the cookie, or null. Memoised per request. */
export const getSession = cache(async () => {
  const store = await cookies();
  const session = readSessionValue(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  // The customer must still exist (deleted/blocked in ERP -> logged out).
  const customer = await getAdapter().getCustomer(session.customerId);
  return customer ? { ...session, customer } : null;
});

/** Redirects to the login page when there is no valid session. */
export async function verifySession(returnTo) {
  const session = await getSession();
  if (!session) {
    const target = returnTo ? `${PORTAL_LOGIN_PATH}?next=${encodeURIComponent(returnTo)}` : PORTAL_LOGIN_PATH;
    redirect(target);
  }
  return session;
}

function bind(customerId, customer) {
  const a = getAdapter();
  return {
    customer,
    customerId,
    listProjects: () => a.listProjects(customerId),
    getProject: (projectId) => a.getProject(customerId, projectId),
    listDocuments: (opts) => a.listDocuments(customerId, opts),
    listAppointments: (opts) => a.listAppointments(customerId, opts),
    getProductPass: (productPassId) => a.getProductPass(customerId, productPassId),
    listRenderings: (projectId) => a.listRenderings(customerId, projectId),
    listMessages: (opts) => a.listMessages(customerId, opts),
    addFeedback: (input) => a.addFeedback(customerId, input),
    requestPlanning: (input) => a.requestPlanning(customerId, input),
    markMessagesRead: (ids) => a.markMessagesRead(customerId, ids),
    sendMessage: (input) => a.sendMessage(customerId, input),
  };
}

/**
 * Verified, customer-scoped data access for pages. `returnTo` is the portal
 * path to come back to after login (e.g. "/de/portal/dokumente").
 */
export async function getPortal(returnTo) {
  const session = await verifySession(returnTo);
  return bind(session.customerId, session.customer);
}

/** For route handlers: { portal } or { response: 401 }. */
export async function requireApiSession(request) {
  const session = readSessionValue(request.cookies.get(SESSION_COOKIE)?.value);
  const customer = session ? await getAdapter().getCustomer(session.customerId) : null;
  if (!customer) {
    return {
      response: NextResponse.json({ error: "Nicht angemeldet" }, { status: 401, headers: { "Cache-Control": "no-store" } }),
    };
  }
  return { session, portal: bind(customer.id, customer) };
}
