// Slot „Lieferungen“ für Kundenakte und Auftragsmappe (Slot-API v1). Ohne JSX, damit das Slot-Register in
// Unit-Tests ladbar bleibt. Zeigt je Lieferschein Nummer, Lieferart, Termin und Status als Wort (W17).

import { createElement as h } from "react";

const STATUS = { Entwurf: "Entwurf", Gepackt: "Gepackt", Uebergeben: "Übergeben", Zugestellt: "Zugestellt", Storniert: "Storniert" };
const TON = { Entwurf: "stein", Gepackt: "cognac", Uebergeben: "see", Zugestellt: "salbei", Storniert: "ziegel" };

function datum(iso) {
  if (!iso) return "";
  const s = String(iso);
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
}

export default function LieferungenSlot({ daten = [] }) {
  const zeilen = Array.isArray(daten) ? daten : [];
  return h(
    "div",
    { className: "bo-log-zeilen", "data-testid": "slot-lieferungen" },
    ...zeilen.map((l) =>
      h(
        "a",
        { key: l.name, className: "bo-log-zeile", href: `/logistik/lieferscheine/${encodeURIComponent(l.name)}` },
        h(
          "span",
          { className: "min-w-0" },
          h("span", { className: "bo-log-zeile__titel block" }, `${l.lieferart || "Lieferung"} · ${l.status === "Zugestellt" ? `zugestellt ${datum(l.zugestellt_am)}` : l.wunschtermin ? `Wunsch ${datum(l.wunschtermin)}` : datum(l.datum)}`),
          h("span", { className: "bo-log-zeile__unter block bo-log-mono" }, l.name),
        ),
        h("span", { className: "bo-log-chip", "data-ton": TON[l.status] || "stein" }, l.status === "Zugestellt" && l.lieferart === "Abholung" ? "Abgeholt" : STATUS[l.status] || l.status),
      ),
    ),
    daten?.kommission ? h("p", { className: "bo-log-cap", style: { padding: "8px 14px" } }, `${daten.kommission} Positionen Kommissionsware im Lager`) : null,
  );
}
