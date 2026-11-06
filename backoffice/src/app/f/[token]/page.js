import { CloudDownload, KeyRound, Link2Off, TimerOff, TriangleAlert } from "lucide-react";
import { backofficeService } from "@/lib/backoffice/frappe";
import { ablage, ablageCode } from "@/lib/backoffice/ablage/methoden";
import { sichereMockSeed } from "@/lib/backoffice/ablage/daten";
import { groesseText, tokenGueltig } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";
import Vorschaubild from "@/components/Backoffice/Ablage/Vorschaubild";

// Öffentliche Freigabeseite /f/<token> (Konzept §3.5): ohne Anmeldung, noindex, Sie-Form. Der Server fragt
// ph_ablage.api.freigabe_aufloesen mit dem Service-Token (nur_info=1 zählt keinen Download); der Download
// läuft über /f/<token>/laden. Keine Kunden-/Projektnamen, keine Tracker.
export const dynamic = "force-dynamic";
export const metadata = { title: "Datei · Platzhirsch" };

const O = T.oeffentlich;

function datum(iso) {
  const d = new Date(String(iso || "").replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "–";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function Rahmen({ children, testid }) {
  return (
    <main className="bo-abl-oeffentlich" data-testid={testid}>
      <div className="bo-abl-oeffentlich__karte bo-erscheinen">{children}</div>
    </main>
  );
}

function Zustand({ icon: Ico, titel, text, testid }) {
  return (
    <Rahmen testid={testid}>
      <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-2 text-center">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH</p>
        <span className="grid size-14 place-items-center rounded-full bg-bo-surface-2 text-bo-text-soft">
          <Ico className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.018em]">{titel}</h1>
        <p className="max-w-[34ch] text-[15px] leading-[22px] text-bo-text-soft">{text}</p>
        <p className="pt-2 text-xs text-bo-text-faint">{O.kontakt}</p>
      </div>
    </Rahmen>
  );
}

export default async function Freigabe({ params, searchParams }) {
  const { token } = await params;
  const sp = await searchParams;
  if (!tokenGueltig(token)) return <Zustand icon={Link2Off} titel={O.ungueltig.titel} text={O.ungueltig.text} testid="abl-f-ungueltig" />;
  const client = backofficeService();
  sichereMockSeed(client);
  let info = null;
  let passwortNoetig = false;
  try {
    info = await ablage(client, "freigabe_aufloesen", { token, nur_info: 1 });
  } catch (err) {
    const code = ablageCode(err);
    if (code === "password_required") passwortNoetig = true;
    else if (code === "invalid_token" || code === "not_found") return <Zustand icon={Link2Off} titel={O.ungueltig.titel} text={O.ungueltig.text} testid="abl-f-ungueltig" />;
    else if (code === "expired") return <Zustand icon={TimerOff} titel={O.abgelaufen.titel} text={O.abgelaufen.text} testid="abl-f-abgelaufen" />;
    else if (code === "rate_limited") return <Zustand icon={TriangleAlert} titel={O.zuViele.titel} text={O.zuViele.text} testid="abl-f-limit" />;
    else return <Zustand icon={TriangleAlert} titel={O.fehler.titel} text={O.fehler.text} testid="abl-f-fehler" />;
  }
  const falsch = sp?.fehler === "passwort";
  const name = info?.dateiname || "";
  const endung = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return (
    <Rahmen testid="abl-f">
      <div className="bo-abl-oeffentlich__bild">
        <Vorschaubild datei={{ datei: "x", endung, vorschau_art: undefined, vorschau_status: "Keine" }} />
      </div>
      <div className="bo-abl-oeffentlich__inhalt">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-medium text-bo-text-soft">{O.von}</p>
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.018em] break-words" data-testid="abl-f-name">
            {passwortNoetig ? O.titel : name}
          </h1>
          {info && (
            <p className="text-[13px] text-bo-text-soft tabular-nums">
              {groesseText(info.groesse)} · {O.gueltigBis(datum(info.ablauf))}
            </p>
          )}
        </div>
        {passwortNoetig ? (
          <form method="post" action={`/f/${encodeURIComponent(token)}/laden`} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[13px] font-medium text-bo-text-soft">
                <KeyRound className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {O.passwortHinweis}
              </span>
              <input type="password" name="passwort" required minLength={1} autoComplete="current-password" className="bo-input h-12" aria-label={O.passwort} aria-invalid={falsch || undefined} aria-describedby={falsch ? "abl-f-falsch" : undefined} data-testid="abl-f-passwort" />
            </label>
            {falsch && (
              <p id="abl-f-falsch" className="text-[13px] text-bo-ziegel-text" role="alert" data-testid="abl-f-falsch">
                {O.passwortFalsch}
              </p>
            )}
            <button type="submit" className="bo-knopf bo-knopf--primary inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold" data-testid="abl-f-laden">
              <CloudDownload className="size-5" strokeWidth={1.75} aria-hidden="true" />
              {O.herunterladen}
            </button>
          </form>
        ) : (
          <a href={`/f/${encodeURIComponent(token)}/laden`} className="bo-knopf bo-knopf--primary inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold" data-testid="abl-f-laden" download>
            <CloudDownload className="size-5" strokeWidth={1.75} aria-hidden="true" />
            {O.herunterladen}
          </a>
        )}
        <p className="text-xs leading-4 text-bo-text-faint">{O.hinweis}</p>
        <p className="bo-abl-oeffentlich__marke bo-wortmarke pt-2 text-xs text-bo-text-soft">PLATZHIRSCH</p>
      </div>
    </Rahmen>
  );
}
