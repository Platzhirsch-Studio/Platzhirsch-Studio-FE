// Abschnitt „Bestellungen“ für die Kundenakte (Slot-API v1, akte/slots/shop.js): Online-, Telefon- und Showroom-
// Bestellungen des Kontakts mit Status und Betrag. Ohne JSX und ohne Next-Importe, damit das Slot-Register auch
// unter node --test geladen werden kann (Register-Prüfung). Server-tauglich, bekommt nur { daten }.
import { createElement as h } from "react";
import { statusInfo } from "../../../lib/backoffice/shop/status.js";
import { cent, datum } from "../../../lib/backoffice/format.js";

export default function BestellungenSlot({ daten = [] }) {
  return h(
    "ul",
    { className: "bo-shop-zeilen", "data-testid": "slot-shop-bestellungen" },
    daten.map((b) => {
      const st = statusInfo("PH Bestellung", b.status, b);
      return h(
        "li",
        { key: b.name, className: "bo-shop-zeile", style: { gridTemplateColumns: "minmax(0,1fr) auto auto" } },
        h("span", { className: "min-w-0" },
          h("a", { href: `/shop/bestellungen/${encodeURIComponent(b.name)}`, className: "block truncate text-[15px] font-semibold hover:underline" }, b.name),
          h("span", { className: "bo-shop-unter" }, `${datum(b.angelegt)} · ${b.lieferart === "abholung" ? "Abholung" : "Versand"}`)),
        h("span", { className: "bo-pille", "data-ton": st.ton }, st.anzeige),
        h("span", { className: "tabular-nums font-medium" }, cent(b.gesamt_cent)),
      );
    }),
  );
}
