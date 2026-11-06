import "server-only";

// Frappe/ERPNext adapter – NOT CONNECTED YET (no write access, no price field,
// no portal API on backoffice.platzhirsch.studio today). This file documents
// the mapping so the switch is a config change: PORTAL_ADAPTER=frappe.
//
// Auth to Frappe: server-to-server API key of a dedicated, read-mostly
// integration user (env FRAPPE_API_KEY / FRAPPE_API_SECRET, header
// "Authorization: token key:secret"). The portal session stays ours; we never
// log the customer into Frappe's own /me portal. Alternative later: Frappe
// "Website User" + Portal Settings, with our magic link replaced by Frappe's
// login – kept out for now because Frappe's portal pages cannot be styled to
// this site.
//
// Method -> Frappe REST (GET /api/resource/<Doctype>?filters=…&fields=…)
//
// findCustomerByEmail(email)
//   Contact  filters [["Contact Email","email_id","=",email]]  -> links (Dynamic Link
//   link_doctype="Customer") -> Customer.name. Alternatively Portal User child table
//   on Customer (field portal_users.user) if Website Users are created.
// getCustomer(id)        Customer/<id>  (customer_name, customer_primary_contact,
//                        customer_primary_address -> Address), account_manager -> advisor
// listProjects(id)       Project filters [["customer","=",id]]  + custom field
//                        `ph_portal_step` (Select: anfrage…uebergabe) and child table
//                        `ph_portal_steps` (step, date, note). Items: Sales Order Item
//                        of linked Sales Orders, or Quotation Item while in "angebot".
//                        Trades: custom child table `ph_trades` (trade, supplier -> Supplier,
//                        status, scope, event).
// getProject(id, pid)    Project/<pid>, check project.customer === id
// listDocuments(id, {type})
//   angebot               Quotation      filters party_name=id, quotation_to="Customer", docstatus=1
//   auftragsbestaetigung  Sales Order    filters customer=id, docstatus=1
//   lieferschein          Delivery Note  filters customer=id, docstatus=1
//   rechnung              Sales Invoice  filters customer=id, docstatus=1
//   PDF: GET /api/method/frappe.utils.print_format.download_pdf?doctype=…&name=…
//   (proxied through an authenticated portal route; never public). Amounts stay
//   null until the owner enables prices (grand_total exists but is not yet maintained).
// listAppointments(id)   Event with Event Participants (reference_doctype="Customer",
//                        reference_docname=id); kind from custom field `ph_kind`.
//                        Internal follow-ups: ToDo (reference_type="Project").
// getProductPass(id, p)  custom doctype `PH Product Pass` (item, serial_no -> Serial No,
//                        materials, care, warranty_months, delivered_on) + File attachments
//                        (File attached_to_doctype="PH Product Pass").
// listRenderings(id,pid) File filters attached_to_doctype="Project", attached_to_name=pid,
//                        is_private=1, plus custom field `ph_ai_generated` (Check).
// listMessages(id)       Communication filters reference_doctype="Project",
//                        communication_type="Communication", sent_or_received.
// addFeedback(id, x)     POST Comment (reference_doctype="Project", comment_type="Comment")
//                        or custom doctype `PH Portal Feedback`.
// requestPlanning(id, x) POST Lead/Opportunity (opportunity_from="Customer", party_name=id)
//                        or ToDo assigned to the advisor.
// markMessagesRead(id, ids)  PUT Communication/<name> {seen: 1} for each id whose
//                        reference is a Project of this customer.
// sendMessage(id, x)     POST Communication (communication_type="Communication",
//                        sent_or_received="Received", reference_doctype="Project",
//                        reference_name=x.projectId, sender=customer email) – the team
//                        answers from the Project timeline in Desk.
// Magic-link mail        POST /api/method/frappe.core.doctype.communication.email.make
//                        or a whitelisted `platzhirsch_studio.api.portal_send_login_link`.

function notConnected(method) {
  return async () => {
    throw new Error(`Frappe-Portaladapter noch nicht angebunden (${method}). PORTAL_ADAPTER=mock verwenden.`);
  };
}

export const frappeAdapter = {
  name: "frappe",
  findCustomerByEmail: notConnected("findCustomerByEmail"),
  getCustomer: notConnected("getCustomer"),
  listProjects: notConnected("listProjects"),
  getProject: notConnected("getProject"),
  listDocuments: notConnected("listDocuments"),
  listAppointments: notConnected("listAppointments"),
  getProductPass: notConnected("getProductPass"),
  listRenderings: notConnected("listRenderings"),
  listMessages: notConnected("listMessages"),
  addFeedback: notConnected("addFeedback"),
  requestPlanning: notConnected("requestPlanning"),
  markMessagesRead: notConnected("markMessagesRead"),
  sendMessage: notConnected("sendMessage"),
  // Kundenkarte: ph_kundenkarte.api.portal_card(kontakt, kunde_token) → PortalCard
  // (src/lib/kundenkarte/adapters/frappe.js createFrappeAdapter().portalCard).
  getCustomerCard: notConnected("getCustomerCard"),
};
