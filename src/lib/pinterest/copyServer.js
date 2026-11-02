// getPinCopy(locale) – alle Texte für Pinterest und Ideenboard (Server):
// ideenboard.seite.* wird mit den kurzen Insel-Texten zusammengeführt, damit
// die Seiten wie gewohnt t.card.…, t.share.… lesen. Quelle: src/messages.
import "server-only";
import { getMessages } from "next-intl/server";

export async function getPinCopy(locale) {
  const m = await getMessages({ locale });
  const { seite = {}, ...shell } = m?.ideenboard || {};
  return { pinterest: m?.pinterest || {}, ideenboard: { ...shell, ...seite } };
}
