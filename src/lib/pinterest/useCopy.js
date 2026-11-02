// usePinCopy() – kurze Texte für Inseln an jeder Quelle (Pinterest-Link,
// „Zum Ideenboard“, Kopfzeilen-Link) aus src/messages: `pinterest.*` und
// `ideenboard.{add, addAria, added, addedStatus, removedStatus, full, view, nav}`.
// Die Seitentexte `ideenboard.seite.*` gehen NICHT in den Client-Payload
// (SERVER_ONLY_SUBKEYS); die Ideenboard-Seiten holen sie mit getPinCopy()
// (./copyServer.js) und reichen sie als Prop weiter.
// Funktioniert in Inseln und in nicht-async Server-Komponenten.
import { useMessages } from "next-intl";

export function usePinCopy() {
  const m = useMessages();
  const { seite: _seite, ...shell } = m?.ideenboard || {};
  return { pinterest: m?.pinterest || {}, ideenboard: shell };
}
