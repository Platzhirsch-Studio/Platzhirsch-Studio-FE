// Hülle der Personal-Seiten (Server): Shell mit Stempelpille im Kopfzeilen-Slot (Konzept § 4.1, Abhängigkeit F1:
// bis die Shell die Pille auf jeder Seite einhängt, steht sie auf allen Personal-Seiten). `StempelSlot` ist die
// Schnittstelle für die Fundament-Einbindung (`<Shell kopfSlot={<StempelSlot session={s} />}>`).

import Shell from "../Shell/Shell";
import { kontext, ladeStempel } from "@/lib/backoffice/personal/daten";
import { StempelPille } from "./Stempel";

export default async function PersonalHuelle({ ctx, breit = false, children }) {
  const stempel = await ladeStempel(ctx).catch(() => null);
  return (
    <Shell session={ctx.session} breit={breit} kopfSlot={stempel?.mitarbeiter ? <StempelPille stempel={stempel} /> : null}>
      {children}
    </Shell>
  );
}

/** Für Fundament F1: Stempelpille für jede Backoffice-Seite (rendert nichts ohne Mitarbeiter-Datensatz). */
export async function StempelSlot({ session }) {
  const stempel = await kontext(session)
    .then((ctx) => ladeStempel(ctx))
    .catch(() => null);
  return stempel?.mitarbeiter ? <StempelPille stempel={stempel} /> : null;
}
