import "server-only";
import { adapterName } from "@/lib/portal/config";
import { beforeSceneFor, roomTypeOf, sceneFor, VARIANT_LETTERS } from "../scenes";
import { demoRenderings } from "./planungSeed";
import { listEntries } from "./planungStore";

// Builds the view model of /de/portal/projekte/[id] from the portal core
// (getProject, listRenderings – customer-scoped via getPortal) plus the
// feature store (feedback entries). Returns null for unknown/foreign ids.

export async function loadPlanning(portal, projectId) {
  const project = await portal.getProject(projectId);
  if (!project) return null;

  const core = await portal.listRenderings(projectId);
  const extras = adapterName() === "mock" ? demoRenderings(projectId).filter((d) => !core.some((r) => r.id === d.id)) : [];
  const renderings = [...core, ...extras].sort((a, b) => a.version - b.version);

  const roomType = roomTypeOf(project.room);
  const variants = renderings.map((r, i) => ({
    id: r.id,
    letter: VARIANT_LETTERS[i] || String(i + 1),
    title: r.title,
    version: r.version,
    description: r.description || "",
    createdAt: r.createdAt,
    aiGenerated: Boolean(r.aiGenerated),
    imageUrl: r.image ? `/api/portal/feedback/rendering/${encodeURIComponent(r.id)}` : null,
    scene: sceneFor(roomType, i),
    demo: Boolean(r.demo),
  }));

  const customerName = [portal.customer.firstName, portal.customer.lastName].filter(Boolean).join(" ") || portal.customer.displayName;
  const entries = await listEntries(portal.customerId, projectId, customerName);

  // Latest vote per variant wins; "none" withdraws it.
  const votes = {};
  for (const e of entries) if (e.kind === "vote" && e.from === "kunde") votes[e.renderingId] = e.vote === "none" ? null : e.vote;
  const approval = [...entries].reverse().find((e) => e.kind === "freigabe") || null;

  return {
    project,
    roomType,
    beforeScene: beforeSceneFor(roomType),
    variants,
    entries: entries.filter((e) => e.kind !== "vote"),
    votes,
    approval,
  };
}
