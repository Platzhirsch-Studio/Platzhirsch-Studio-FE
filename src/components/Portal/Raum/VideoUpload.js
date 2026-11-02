"use client";
// Raumvideo senden: Einwilligung, Auswahl/Aufnahme, Vorprüfung (Typ, Größe,
// Dauer), Upload in 4-MB-Stücken mit Wiederholung, danach Status „in Arbeit“.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Video } from "lucide-react";
import { RAUM_CONFIG, formatBytes } from "@/lib/raumzwilling/config";
import { EINWILLIGUNG_DETAILS, EINWILLIGUNG_KURZ } from "@/lib/raumzwilling/einwilligung";

const V = RAUM_CONFIG.video;
const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function dauerVon(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const fertig = (d) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : null);
    };
    v.onloadedmetadata = () => fertig(v.duration);
    v.onerror = () => fertig(null);
    setTimeout(() => fertig(null), 8000);
    v.src = url;
  });
}

async function api(url, init) {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
  if (!res.ok) {
    const err = new Error(data.error || "Senden fehlgeschlagen.");
    err.daten = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function VideoUpload({ projektId }) {
  const router = useRouter();
  const [datei, setDatei] = useState(null);
  const [sekunden, setSekunden] = useState(null);
  const [einwilligung, setEinwilligung] = useState(false);
  const [a4, setA4] = useState(false);
  const [fehler, setFehler] = useState("");
  const [zustand, setZustand] = useState("bereit"); // bereit | sendet | fertig
  const [anteil, setAnteil] = useState(0);
  const input = useRef(null);
  const basis = `/api/portal/raum/${projektId}/video`;

  async function waehle(e) {
    setFehler("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setFehler("Bitte ein Video wählen.");
      return;
    }
    if (f.size > V.maxBytes) {
      setFehler(`Das Video ist ${formatBytes(f.size)} groß. Erlaubt sind ${formatBytes(V.maxBytes)}. Bitte kürzer aufnehmen.`);
      return;
    }
    const d = await dauerVon(f);
    if (d && d > V.maxSeconds + 1) {
      setFehler(`Das Video dauert ${Math.round(d)} Sekunden. Erlaubt sind ${V.maxSeconds} Sekunden.`);
      return;
    }
    if (d && d < V.minSeconds) {
      setFehler(`Das Video dauert nur ${Math.round(d)} Sekunden. Bitte gehen Sie einmal ganz um den Raum (etwa 90 Sekunden).`);
      return;
    }
    setDatei(f);
    setSekunden(d);
  }

  async function senden(e) {
    e.preventDefault();
    setFehler("");
    if (!einwilligung) {
      setFehler("Bitte bestätigen Sie die Einwilligung.");
      return;
    }
    if (!datei) {
      setFehler("Bitte zuerst ein Video wählen oder aufnehmen.");
      return;
    }
    setZustand("sendet");
    try {
      const start = await api(`${basis}?schritt=start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: datei.name.slice(0, 160) || "raumvideo", bytes: datei.size, typ: datei.type, sekunden: sekunden ? Math.round(sekunden * 10) / 10 : null, einwilligung: "ja", a4 }),
      });
      const stueck = start.stueck;
      let offset = 0;
      while (offset < datei.size) {
        const teil = datei.slice(offset, Math.min(datei.size, offset + stueck));
        let versuch = 0;
        for (;;) {
          try {
            const r = await api(`${basis}?upload=${start.uploadId}&offset=${offset}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: teil });
            offset = r.empfangen;
            break;
          } catch (err) {
            if (err.status === 409 && Number.isFinite(err.daten?.empfangen)) {
              offset = err.daten.empfangen;
              break;
            }
            if (++versuch >= 4) throw err;
            await new Promise((r) => setTimeout(r, 800 * versuch));
          }
        }
        setAnteil(offset / datei.size);
      }
      await api(`${basis}?schritt=fertig`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uploadId: start.uploadId }) });
      setZustand("fertig");
      router.refresh();
    } catch (err) {
      setZustand("bereit");
      setFehler(`${err.message} Ihr Video wurde nicht vollständig gesendet. Bitte erneut versuchen.`);
    }
  }

  if (zustand === "fertig") {
    return (
      <p role="status" className="border border-success/40 bg-success/10 px-4 py-3 text-[15px] text-ink">
        Danke. Ihr Raumvideo ist angekommen. Wir bauen daraus Ihren Raum und melden uns hier im Portal.
      </p>
    );
  }

  return (
    <form onSubmit={senden} className="space-y-5" noValidate>
      <div>
        <input ref={input} id="raumvideo" type="file" accept="video/*" capture="environment" className="sr-only" onChange={waehle} />
        <label
          htmlFor="raumvideo"
          className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 border border-dashed border-pebble bg-white px-4 text-[15px] font-semibold text-ink hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink`}
        >
          <Video size={18} aria-hidden="true" />
          {datei ? "Anderes Video wählen" : "Raumvideo aufnehmen oder wählen"}
        </label>
        <p className="mt-2 text-xs text-ink/70">
          MP4, MOV oder WebM · höchstens {formatBytes(V.maxBytes)} und {V.maxSeconds / 60} Minuten
        </p>
        {datei && (
          <p className="mt-2 text-sm text-ink" aria-live="polite">
            Gewählt: {datei.name} · {formatBytes(datei.size)}
            {sekunden ? ` · ${Math.round(sekunden)} Sekunden` : ""}
          </p>
        )}
      </div>

      <label className="flex min-h-11 items-start gap-3 text-[15px] text-ink">
        <input type="checkbox" checked={a4} onChange={(e) => setA4(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
        <span>Ich habe ein A4-Blatt auf den Boden gelegt und mitgefilmt.</span>
      </label>

      <div className="border border-ink/15 bg-bone p-4">
        <label className="flex items-start gap-3 text-[15px] text-ink">
          <input type="checkbox" required checked={einwilligung} onChange={(e) => setEinwilligung(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" aria-describedby="einw-details" />
          <span>{EINWILLIGUNG_KURZ}</span>
        </label>
        <details id="einw-details" className="mt-3 pl-8 text-sm text-ink/80">
          <summary className={`min-h-6 cursor-pointer font-semibold text-ink underline underline-offset-4 ${fokus}`}>Details zu Zweck, Speicherdauer und Widerruf</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {EINWILLIGUNG_DETAILS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>

      {fehler && (
        <p role="alert" className="border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {fehler}
        </p>
      )}

      {zustand === "sendet" ? (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-ink">Video wird gesendet … {Math.round(anteil * 100)} %</p>
          <div className="h-1.5 w-full bg-ink/10" aria-hidden="true">
            <div className="h-1.5 bg-ink" style={{ width: `${Math.round(anteil * 100)}%` }} />
          </div>
          <p className="text-xs text-ink/70">Bitte die Seite offen lassen. Bei schwachem Netz dauert es etwas länger.</p>
        </div>
      ) : (
        <button type="submit" className={`inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold tracking-wide text-white hover:bg-ink-deep sm:w-auto ${fokus}`}>
          <Upload size={16} aria-hidden="true" /> Raumvideo senden
        </button>
      )}
    </form>
  );
}
