// src/lib/ezarri/konfigurator/katalog-index.js – Nachschlagen im Konfigurator-Katalog (Team B).
//
// Rein (Browser, Server, node --test). Eingabe: Katalog aus katalog.js (voll oder Teil).
//   buildIndex(katalog) → {byId, byMid, mosaic(mid), resolveRef(mid, format, {safe, ref}),
//                          isMixable(mid), label(mid), formatsOf(mid), spezialFuer(mid, art)}
// Mosaik-ID (mid) = Konfigurator-ID ("38") oder Referenz-ID ohne Konfigurator-Daten.

const FORMAT_SUFFIX = /\s+(25|50|hexa)(\s*mm)?(\s+safe)?$/i;

/** Anzeigename ohne Formatangabe: "2508-A 25" → "2508-A". */
export function baseName(name) {
  return String(name || "").replace(FORMAT_SUFFIX, "").replace(/\s+safe$/i, "").trim();
}

export function buildIndex(katalog) {
  const refs = katalog?.refs || [];
  const byId = new Map(refs.map((r) => [r.id, r]));
  const byMid = new Map();
  for (const r of refs) {
    if (r.typ === "corner" || r.typ === "cove") continue;
    let m = byMid.get(r.mid);
    if (!m) {
      m = { mid: r.mid, refs: {}, safe: {}, alle: [] };
      byMid.set(r.mid, m);
    }
    m.alle.push(r);
    const f = r.fmt || "25";
    if (r.safe) m.safe[f] ??= r.id;
    else m.refs[f] ??= r.id;
  }
  for (const m of byMid.values()) {
    const base = byId.get(m.refs["25"] || m.refs["50"] || m.refs.hexa || m.safe["25"] || m.safe["50"]) || m.alle[0];
    m.base = base;
    m.name = baseName(base.name);
    m.kol = base.kol;
    m.mx = m.alle.some((r) => r.mx);
  }
  const kol = katalog?.kollektionen || {};

  /** Referenz für Mosaik + Format (bevorzugt exakt `ref`, dann Safe-Wunsch, dann Basis). */
  function resolveRef(mid, format = "25", { safe = false, ref } = {}) {
    if (ref && byId.has(ref)) {
      const r = byId.get(ref);
      if ((r.fmt || "25") === format || r.mid !== mid) return r;
    }
    const m = byMid.get(mid);
    if (!m) return byId.get(mid) || null;
    const id = (safe && m.safe[format]) || m.refs[format] || m.safe[format];
    return byId.get(id) || m.base;
  }

  return {
    byId,
    byMid,
    katalog,
    teil: Boolean(katalog?.teil),
    mosaic: (mid) => byMid.get(mid) || null,
    resolveRef,
    isMixable: (mid) => Boolean(byMid.get(mid)?.mx),
    label: (mid) => byMid.get(mid)?.name || byId.get(mid)?.name || mid,
    kollektion: (id) => (kol[id] ? kol[id][0] : id),
    linie: (id) => (kol[id] ? kol[id][1] : null),
    /** Formate, in denen das Mosaik erhältlich ist. */
    formatsOf(mid) {
      const m = byMid.get(mid);
      if (!m) return [];
      return ["25", "50", "hexa"].filter((f) => m.refs[f] || m.safe[f]);
    },
    /** Corner-/Cove-Referenz passend zum Mosaik (über die Spezialteile einer seiner Referenzen). */
    spezialFuer(mid, art) {
      const m = byMid.get(mid);
      if (!m) return null;
      for (const r of m.alle) if (r.spez?.[art] && byId.has(r.spez[art])) return byId.get(r.spez[art]);
      for (const r of m.alle) if (r.spez?.[art]) return { id: r.spez[art], name: r.spez[art], fehlt: true };
      return null;
    },
    fuge: (id) => (katalog?.fugen || []).find((g) => g.id === id) || null,
  };
}

/** Kann ein Zustand mit diesem (Teil-)Katalog gezeichnet werden? */
export function hasAll(index, state) {
  const mids = [...state.mix.map((e) => e.id), ...state.kanaele.map((e) => e.id), ...(state.pattern?.ids || [])];
  return mids.every((mid) => index.byMid.has(mid) || index.byId.has(mid));
}
