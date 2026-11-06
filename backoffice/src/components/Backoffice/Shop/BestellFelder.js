"use client";
// Feldwerte der Bestellung (Klasse Feldwert, Variante B): Zuständig, interne Notiz (Autosave 1 s), Abholfrist.
// Sofort gespeichert, Toast „Gespeichert · Rückgängig“ setzt den alten Wert zurück.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Backoffice/Toast";
import Knopf from "@/components/Backoffice/Knopf";
import Datumsfeld from "@/components/Backoffice/Formular/Datumsfeld";
import { feldwertAction } from "@/lib/backoffice/shop/actions";
import { T } from "@/lib/backoffice/shop/texte";

export default function BestellFelder({ name, zugewiesen, notiz: start, abholungBis, schreiben = true, ich, doctype = "PH Bestellung" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [notiz, setNotiz] = useState(start);
  const [stand, setStand] = useState("");
  const zuletzt = useRef(start);
  const speichern = async (feld, wert, { leise = false, text } = {}) => {
    const r = await feldwertAction({ doctype, name, feld, wert });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    if (!leise)
      zeige(text || T.toast.gespeichert, {
        art: "ok",
        aktion: { titel: "Rückgängig", onClick: async () => { await feldwertAction({ doctype, name, feld, wert: r.ergebnis.alt }); router.refresh(); } },
      });
    router.refresh();
  };
  useEffect(() => {
    if (notiz === zuletzt.current) return;
    setStand("ungespeichert");
    const t = setTimeout(async () => {
      zuletzt.current = notiz;
      await speichern("notiz_intern", notiz, { leise: true });
      setStand(`gespeichert ${new Date().toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notiz]);
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3" data-testid="bestell-felder">
      <div className="bo-shop-feld">
        <span className="bo-shop-label">Zuständig</span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15px]">{zugewiesen ? zugewiesen.split("@")[0] : "Niemand"}</span>
          {schreiben && ich !== zugewiesen && <Knopf size="s" variant="ghost" onClick={() => speichern("zugewiesen_an", ich || "")}>Ich übernehme</Knopf>}
          {schreiben && zugewiesen && <Knopf size="s" variant="ghost" onClick={() => speichern("zugewiesen_an", "")}>Freigeben</Knopf>}
        </span>
      </div>
      <label className="bo-shop-feld md:col-span-2">
        <span className="bo-shop-label">Interne Notiz <span className="font-normal text-bo-text-faint" aria-live="polite">{stand}</span></span>
        <textarea className="bo-shop-input" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} disabled={!schreiben} maxLength={1000} data-testid="notiz-intern" />
      </label>
      {abholungBis !== null && abholungBis !== undefined && (
        <div className="bo-shop-feld">
          <span className="bo-shop-label">Abholfrist</span>
          <Datumsfeld value={abholungBis} aria-label="Abholfrist" disabled={!schreiben} onChange={(iso) => iso && iso !== abholungBis && speichern("abholung_bis", iso, { text: T.toast.abholfristGesetzt(iso.split("-").reverse().join(".")) })} />
        </div>
      )}
    </div>
  );
}
