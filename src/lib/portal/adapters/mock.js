import "server-only";
import { randomUUID } from "node:crypto";
import {
  feedbackSchema,
  idSchema,
  listAppointmentsSchema,
  messageIdsSchema,
  messageSchema,
  listDocumentsSchema,
  planningRequestSchema,
} from "../schemas";
import { readJson, updateJson } from "../store";
import { buildSeed } from "./mockSeed";

// Mock adapter: serves the demo data from /.data/portal/demo.json (seeded on
// first access). Writes (feedback, planning requests) are appended there too.

const STORE = "demo";

async function db() {
  const data = await readJson(STORE, null);
  if (data) return data;
  return updateJson(STORE, null, (current) => {
    const value = current || buildSeed();
    return { value, result: value };
  });
}

// customerId is an internal ownership field – never hand it to the UI.
function strip(record) {
  if (!record) return null;
  const { customerId: _owner, ...rest } = record;
  return rest;
}
const own = (customerId) => (r) => r.customerId === customerId;
const byDateDesc = (field) => (a, b) => String(b[field]).localeCompare(String(a[field]));

export const mockAdapter = {
  name: "mock",

  async findCustomerByEmail(email) {
    const { customers } = await db();
    return customers.find((c) => c.email.toLowerCase() === String(email).toLowerCase()) || null;
  },

  async getCustomer(customerId) {
    const { customers } = await db();
    return customers.find((c) => c.id === customerId) || null;
  },

  async listProjects(customerId) {
    const { projects } = await db();
    return projects.filter(own(customerId)).sort(byDateDesc("updatedAt")).map(strip);
  },

  async getProject(customerId, projectId) {
    if (!idSchema.safeParse(projectId).success) return null;
    const { projects } = await db();
    return strip(projects.find((p) => p.id === projectId && p.customerId === customerId));
  },

  async listDocuments(customerId, opts) {
    const { type, projectId } = listDocumentsSchema.parse(opts ?? {});
    const { documents } = await db();
    return documents
      .filter(own(customerId))
      .filter((d) => (!type || d.type === type) && (!projectId || d.projectId === projectId))
      .sort(byDateDesc("date"))
      .map(strip);
  },

  async listAppointments(customerId, opts) {
    const { projectId, from } = listAppointmentsSchema.parse(opts ?? {});
    const { appointments } = await db();
    const fromMs = from ? Date.parse(from) : null;
    return appointments
      .filter(own(customerId))
      .filter((a) => (!projectId || a.projectId === projectId) && (fromMs === null || Date.parse(a.end) >= fromMs))
      .sort((a, b) => a.start.localeCompare(b.start))
      .map(strip);
  },

  async getProductPass(customerId, productPassId) {
    if (!idSchema.safeParse(productPassId).success) return null;
    const { productPasses } = await db();
    return strip(productPasses.find((p) => p.id === productPassId && p.customerId === customerId));
  },

  async listRenderings(customerId, projectId) {
    const { renderings } = await db();
    return renderings
      .filter(own(customerId))
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.version - a.version)
      .map(strip);
  },

  async listMessages(customerId, opts = {}) {
    const { messages } = await db();
    return messages
      .filter(own(customerId))
      .filter((m) => !opts.projectId || m.projectId === opts.projectId)
      .sort(byDateDesc("sentAt"))
      .map(strip);
  },

  async addFeedback(customerId, input) {
    const data = feedbackSchema.parse(input);
    await db();
    return updateJson(STORE, null, (current) => {
      if (!current.projects.some((p) => p.id === data.projectId && p.customerId === customerId)) {
        throw new Error("Projekt nicht gefunden");
      }
      const entry = { id: `FB-${randomUUID()}`, customerId, createdAt: new Date().toISOString(), ...data };
      current.feedback = [...(current.feedback || []), entry];
      return { value: current, result: { id: entry.id, createdAt: entry.createdAt } };
    });
  },

  async requestPlanning(customerId, input) {
    const data = planningRequestSchema.parse(input);
    await db();
    return updateJson(STORE, null, (current) => {
      if (data.projectId && !current.projects.some((p) => p.id === data.projectId && p.customerId === customerId)) {
        throw new Error("Projekt nicht gefunden");
      }
      const entry = { id: `PLN-${randomUUID()}`, customerId, createdAt: new Date().toISOString(), status: "neu", ...data };
      current.planningRequests = [...(current.planningRequests || []), entry];
      return { value: current, result: { id: entry.id, createdAt: entry.createdAt } };
    });
  },

  async markMessagesRead(customerId, messageIds) {
    const ids = new Set(messageIdsSchema.parse(messageIds));
    if (!ids.size) return 0;
    const { messages } = await db();
    if (!messages.some((m) => ids.has(m.id) && m.customerId === customerId && !m.read)) return 0;
    return updateJson(STORE, null, (current) => {
      let changed = 0;
      current.messages = current.messages.map((m) => {
        if (!ids.has(m.id) || m.customerId !== customerId || m.read) return m;
        changed++;
        return { ...m, read: true };
      });
      return { value: current, result: changed };
    });
  },

  async sendMessage(customerId, input) {
    const data = messageSchema.parse(input);
    await db();
    return updateJson(STORE, null, (current) => {
      if (data.projectId && !current.projects.some((p) => p.id === data.projectId && p.customerId === customerId)) {
        throw new Error("Projekt nicht gefunden");
      }
      const customer = current.customers.find((c) => c.id === customerId);
      const entry = {
        id: `MSG-${randomUUID()}`,
        customerId,
        projectId: data.projectId || null,
        from: "kunde",
        author: customer?.displayName || "Kunde",
        body: data.body,
        sentAt: new Date().toISOString(),
        read: true,
      };
      current.messages = [...(current.messages || []), entry];
      return { value: current, result: strip(entry) };
    });
  },
};
