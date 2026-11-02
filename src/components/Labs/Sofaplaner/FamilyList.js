// QM Sofaplaner R1 P2-6: the list of all models is rendered only on request
// (smaller page, no 90 tiny links in the first render).
// Tempo fix2 (qa-screenshots/tempo/fix2.md): the texts are resolved HERE on
// the server (makeT for the page locale) and handed to the small toggle as
// plain strings. Before, this was a client component with useT(), and that
// put the whole English planner dictionary (ui-en.js, ≈ 10 KB gzip) into the
// first bundle of /de/sofaplaner. Same markup, same texts, same behaviour.
import { makeT } from "../../../lib/sofaplaner/copy/t.js";
import { sourceCopy } from "../../../lib/sofaplaner/copy/source.js";
import FamilyListToggle from "./FamilyListToggle";

export default function FamilyList({ items, total, locale = "de" }) {
  const T = makeT(locale);
  const SC = sourceCopy(T.locale);
  return (
    <FamilyListToggle
      items={items}
      locale={T.locale}
      modelWord={SC.modelWord}
      summary={T("Alle {n} Modelle im Planer ({total} Elemente)", { n: items.length, total })}
      countText={T("{n} Elemente")}
      outdoorText={T("Outdoor")}
    />
  );
}
