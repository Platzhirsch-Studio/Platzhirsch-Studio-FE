// src/lib/commerce/shipping/mock.js
// MOCK des LetMeShip-Adapters (Testmodus ohne Zugangsdaten). Macht KEINE
// Netzwerkaufrufe. Tarife sind feste BEISPIELWERTE, klar als Mock benannt –
// keine echten Versandkosten. Versicherung (Glas) als eigener Mock-Zuschlag,
// damit Tests prüfen können, dass sie im Tarif enthalten ist.
// Keine "@/"-Importe.

export const MOCK_TARIFE = Object.freeze({
  AT: Object.freeze({ guenstig: Object.freeze({ id: "mock-at-standard", carrier: "MOCK-Carrier", name: "MOCK Standard (kein echter Tarif)", cent: 500, tage: 3 }) }),
  DE: Object.freeze({ guenstig: Object.freeze({ id: "mock-de-standard", carrier: "MOCK-Carrier", name: "MOCK Standard DE (kein echter Tarif)", cent: 900, tage: 4 }) }),
});
export const MOCK_VERSICHERUNG_CENT = 200;

/** Minimales gültiges PDF (Text „MOCK-ETIKETT“), Base64. */
export function mockLabelPdf(text) {
  const t = String(text).replace(/[()\\]/g, "");
  const stream = `BT /F1 18 Tf 40 200 Td (${t}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 298] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1").toString("base64");
}

/**
 * @param {{ fail?: boolean, now?: () => number }} [o]  fail: simuliert „API antwortet nicht“
 */
export function createMockShippingAdapter({ fail = false, now = () => Date.now() } = {}) {
  let n = 0;
  return {
    kind: "letmeship-mock",
    umgebung: "mock",
    mock: true,
    async quote({ ziel, versichern }) {
      if (fail) throw Object.assign(new Error("letmeship timeout"), { code: "timeout" });
      const t = MOCK_TARIFE[ziel.land]?.guenstig;
      if (!t) throw Object.assign(new Error("letmeship keine_tarife"), { code: "keine_tarife" });
      const cent = t.cent + (versichern ? MOCK_VERSICHERUNG_CENT : 0);
      return { serviceId: t.id, carrier: t.carrier, name: versichern ? `${t.name} + Versicherung` : t.name, cent, tage: t.tage, raw: { baseServiceDetails: { id: t.id, carrier: t.carrier, name: t.name } } };
    },
    async createShipment({ referenz }) {
      if (fail) throw Object.assign(new Error("letmeship timeout"), { code: "timeout" });
      n += 1;
      const stamp = String(now()).slice(-8);
      const awb = `MOCK${stamp}${n}`;
      return { shipmentId: `mock-shp-${stamp}-${n}`, awb, carrier: "MOCK-Carrier", labelPdfBase64: mockLabelPdf(`MOCK-ETIKETT ${referenz} ${awb}`) };
    },
    async tracking() {
      return { awb: null, status: "MOCK", carrier: "MOCK-Carrier" };
    },
  };
}
