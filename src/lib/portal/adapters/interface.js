// Contract every portal data adapter fulfils (mock today, Frappe/ERPNext later).
//
// RULES
// - Every method except findCustomerByEmail takes the customerId of the
//   VERIFIED session as first argument and must only return records of that
//   customer (unknown/foreign ids -> null or []). Never call adapters directly
//   from pages – use getPortal() from "@/lib/portal/dal", which binds the
//   customerId from the session.
// - Return plain JSON-serialisable objects (they cross into Client Components).
// - Dates are ISO strings with offset ("2026-11-04T09:30:00+01:00").
// - Money: no prices exist in the backoffice yet. `amount` is always null and
//   `amountNote` carries AMOUNT_ON_REQUEST ("auf Anfrage") until the owner
//   provides values; the UI renders amountLabel(doc) (constants.js).
//
// TYPES (JSDoc, the project is plain JavaScript)
//
/**
 * @typedef {Object} Customer
 * @property {string} id               ERPNext: Customer.name
 * @property {string} email            login address (Contact.email_id / Portal User)
 * @property {string} salutation       "Frau" | "Herr" | "Familie" | ""
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} displayName      e.g. "Familie Muster"
 * @property {string} [phone]
 * @property {{street:string, zip:string, city:string, country:string}} [address]
 * @property {{name:string, email:string, phone:string}} advisor   Platzhirsch contact person
 *
 * @typedef {Object} ProjectStep
 * @property {import("../constants").PROJECT_STEP_KEYS[number]} key
 * @property {"erledigt"|"aktiv"|"offen"} state
 * @property {string|null} date        done date or planned date
 * @property {string} [note]
 *
 * @typedef {Object} ProjectItem
 * @property {string} id
 * @property {string} name             e.g. "Sofa Connery"
 * @property {string} brand
 * @property {string} category         "Sofa" | "Teppich" | "Leuchte" | ...
 * @property {number} quantity
 * @property {string} [variant]        cover/finish/size text
 * @property {"geplant"|"angeboten"|"bestellt"|"geliefert"|"montiert"} status
 * @property {string|null} productPassId
 *
 * @typedef {Object} Trade
 * @property {string} id
 * @property {"tischler"|"elektriker"|"installateur"|"steinmetz"|"maler"|"bodenleger"} trade
 * @property {string} company          placeholder until partners are confirmed
 * @property {"offen"|"geplant"|"in_arbeit"|"erledigt"} status
 * @property {string} scope
 * @property {string|null} appointmentId
 *
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} room
 * @property {string} currentStep      key of PROJECT_STEPS
 * @property {ProjectStep[]} steps     always all 8 steps, in order
 * @property {ProjectItem[]} items
 * @property {Trade[]} trades          coordinated trades (kitchen projects)
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [summary]
 *
 * @typedef {Object} PortalDocument
 * @property {string} id               ERPNext document name, e.g. "SAL-QTN-2026-00012"
 * @property {"angebot"|"auftragsbestaetigung"|"lieferschein"|"rechnung"} type
 * @property {string} projectId
 * @property {string} title
 * @property {string} number
 * @property {string} date
 * @property {"neu"|"gelesen"|"angenommen"|"bezahlt"|"offen"} status
 * @property {number|null} amount
 * @property {string} amountNote
 * @property {{name:string, mime:string, size:number, storageKey:string}|null} file
 *            storageKey is server-side only (ERPNext File.file_url later) –
 *            serve it through an authenticated route, never from /public.
 *
 * @typedef {Object} Appointment
 * @property {string} id
 * @property {string|null} projectId
 * @property {string} kind             key of APPOINTMENT_KINDS
 * @property {string} title
 * @property {string} start
 * @property {string} end
 * @property {string} location
 * @property {"bestaetigt"|"angefragt"|"abgesagt"} status
 * @property {string} [note]
 *
 * @typedef {Object} ProductPass
 * @property {string} id
 * @property {string} itemId
 * @property {string} projectId
 * @property {string} product
 * @property {string} brand
 * @property {string} [serialNumber]
 * @property {string[]} materials
 * @property {string[]} care           care instructions
 * @property {{months:number|null, note:string}} warranty
 * @property {string|null} deliveredAt
 * @property {{title:string, storageKey:string}[]} attachments
 *
 * @typedef {Object} Rendering
 * @property {string} id
 * @property {string} projectId
 * @property {string} title
 * @property {number} version
 * @property {string} createdAt
 * @property {string|null} image       server-side storage key or null (placeholder)
 * @property {string} [description]
 * @property {boolean} aiGenerated     true -> UI must label it "KI-generiert" (AI Act Art. 50)
 *
 * @typedef {Object} Message
 * @property {string} id
 * @property {string|null} projectId
 * @property {"studio"|"kunde"} from
 * @property {string} author
 * @property {string} body
 * @property {string} sentAt
 * @property {boolean} read
 *
 * @typedef {Object} PortalAdapter
 * @property {string} name
 * @property {(email:string) => Promise<Customer|null>} findCustomerByEmail   auth only
 * @property {(customerId:string) => Promise<Customer|null>} getCustomer
 * @property {(customerId:string) => Promise<Project[]>} listProjects
 * @property {(customerId:string, projectId:string) => Promise<Project|null>} getProject
 * @property {(customerId:string, opts?:{type?:string, projectId?:string}) => Promise<PortalDocument[]>} listDocuments
 * @property {(customerId:string, opts?:{projectId?:string, from?:string}) => Promise<Appointment[]>} listAppointments
 * @property {(customerId:string, productPassId:string) => Promise<ProductPass|null>} getProductPass
 * @property {(customerId:string, projectId:string) => Promise<Rendering[]>} listRenderings
 * @property {(customerId:string, opts?:{projectId?:string}) => Promise<Message[]>} listMessages
 * @property {(customerId:string, input:object) => Promise<{id:string, createdAt:string}>} addFeedback
 * @property {(customerId:string, input:object) => Promise<{id:string, createdAt:string}>} requestPlanning
 * @property {(customerId:string, messageIds:string[]) => Promise<number>} markMessagesRead
 *            marks studio messages as read (only own ids), returns how many changed
 * @property {(customerId:string, input:{body:string, projectId?:string}) => Promise<Message>} sendMessage
 *            customer reply in the mailbox (/de/portal/nachrichten)
 * @property {(customerId:string) => Promise<import("../../kundenkarte/adapters/interface").PortalCard|null>} getCustomerCard
 *            Kundenkarte (04.11.2026): Stufe, Vorteile mit genutzt/verfügbar, Einlösungen,
 *            Wallet-Flags – Frappe später über ph_kundenkarte.api.portal_card(kontakt, kunde_token);
 *            null, wenn der Kunde keine Karte hat.
 */

export const ADAPTER_METHODS = [
  "findCustomerByEmail",
  "getCustomer",
  "listProjects",
  "getProject",
  "listDocuments",
  "listAppointments",
  "getProductPass",
  "listRenderings",
  "listMessages",
  "addFeedback",
  "requestPlanning",
  "markMessagesRead",
  "sendMessage",
  "getCustomerCard",
];

/** Throws early if an adapter misses a method of the contract. */
export function assertAdapter(adapter) {
  const missing = ADAPTER_METHODS.filter((m) => typeof adapter?.[m] !== "function");
  if (missing.length) throw new Error(`Portal-Adapter "${adapter?.name}" unvollständig: ${missing.join(", ")}`);
  return adapter;
}
