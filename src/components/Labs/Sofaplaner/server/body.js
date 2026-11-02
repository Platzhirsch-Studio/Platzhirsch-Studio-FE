// Sofaplaner – JSON-Body der Teilen-Route mit harter Byte-Grenze (Team
// katalog-modell-code, 31.10.2026).
//
// Vorher las die Route den Body mit request.text() vollständig ein und prüfte
// erst danach die Länge (in UTF-16-Zeichen, nicht in Bytes). Ein Client konnte
// so beliebig große Bodies in den Arbeitsspeicher schicken. Jetzt:
// - nur Content-Type application/json (die eigene Oberfläche sendet genau das;
//   ein fremdes <form> kann diesen Typ ohne CORS-Vorabfrage nicht setzen),
// - Content-Length über der Grenze → sofort 413,
// - der Stream wird höchstens bis zur Grenze gelesen, dann abgebrochen.
// Ohne "server-only" und ohne "@/…"-Importe, damit node --test die Datei lädt.

/** → { json } oder { status, error } */
export async function readJsonLimited(request, maxBytes) {
  const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return { status: 415, error: "Bitte als JSON senden." };
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { status: 413, error: "Plan zu groß." };
  if (!request.body) return { status: 400, error: "Ungültiges JSON." };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return { status: 413, error: "Plan zu groß." };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.byteLength;
  }
  try {
    return { json: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { status: 400, error: "Ungültiges JSON." };
  }
}
