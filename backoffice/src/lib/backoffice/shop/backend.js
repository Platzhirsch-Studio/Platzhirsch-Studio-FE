// Ein Weg zum Backend für alle Shop-Aktionen: im Mock die nachgebildete Wirkung (mockWirkung.js), sonst die
// echte ph_shop-Methode über den Frappe-Client (run_doc_method / call / workflow). Rein (keine "@/"-Importe).

import { mockMethode, mockCall, mockWorkflow } from "./mockWirkung.js";

const istMock = (client) => client?.modus === "mock" && typeof client.tabelle === "function";

/** Dokumentmethode (z. B. PH Bestellung.packen). */
export function methode(client, doctype, name, m, args = {}) {
  return istMock(client) ? mockMethode(client, doctype, name, m, args) : client.runDocMethod(doctype, name, m, args);
}

/** Whitelisted Funktion (z. B. ph_shop.api.backoffice.check_voucher). */
export function aufruf(client, method, args = {}) {
  return istMock(client) ? mockCall(client, method, args) : client.call(method, args);
}

/** Workflow-Übergang (Als geprüft übernehmen, Zurück auf Offen). */
export function workflow(client, doctype, name, aktion) {
  return istMock(client) ? mockWorkflow(client, doctype, name, aktion) : client.workflowAction(doctype, name, aktion);
}
