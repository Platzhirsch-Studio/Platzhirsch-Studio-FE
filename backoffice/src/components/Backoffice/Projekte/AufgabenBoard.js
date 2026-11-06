"use client";
// Aufgaben (10-konzept-projekte.md § 5.14): Schnellanlage mit Token (@Person, #Projekt, !hoch/!niedrig, heute/morgen/
// TT.MM.) und Kanban Offen · In Arbeit · Erledigt · Verworfen (Status = Feldwert ohne Folge → sofort, Rückgängig 8 s).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kanban from "../Kanban/Kanban";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { aufgabeAnlegenAction, aufgabeStatusAction } from "@/lib/backoffice/projekte/actions";
import { schnellanlage } from "@/lib/backoffice/projekte/schnell";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

const A = TEXTE.aufgaben;

export default function AufgabenBoard({ spalten, statusTon, projekte = [], leute = [], vorProjekt = "", fokus = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [text, setText] = useState(vorProjekt ? `#${projekte.find((p) => p.name === vorProjekt)?.titel || ""} ` : "");
  const [fehler, setFehler] = useState("");
  const [pending, start] = useTransition();
  const deutung = useMemo(() => schnellanlage(text, { projekte, leute, heute: new Date().toISOString().slice(0, 10) }), [text, projekte, leute]);
  const anlegen = () =>
    start(async () => {
      setFehler("");
      const r = await aufgabeAnlegenAction({ projekt: deutung.projekt || vorProjekt, titel: deutung.titel, faellig: deutung.faellig, zugewiesen_an: deutung.person, prioritaet: deutung.prioritaet });
      if (!r?.ok) return setFehler(r?.message || TEXTE.fehler.unbekannt);
      zeige(A.angelegt, { art: "ok" });
      setText("");
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-6">
      <Kachel titel="Schnellanlage" unter={A.schnell} dicht testid="schnellanlage">
        <form className="flex flex-wrap items-center gap-3" onSubmit={(e) => (e.preventDefault(), anlegen())}>
          <input autoFocus={fokus} className="bo-input min-w-[260px] flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder={A.schnell} aria-label="Neue Aufgabe" data-testid="schnell-text" />
          <Knopf type="submit" variant="primary" icon="Plus" laedt={pending} disabled={!deutung.titel}>Anlegen</Knopf>
        </form>
        <p className="mt-2 text-[13px] text-bo-text-soft" aria-live="polite" data-testid="schnell-deutung">
          {text.trim()
            ? [deutung.projektTitel ? `Projekt ${deutung.projektTitel}` : A.projektPflicht, deutung.personName ? `für ${deutung.personName}` : "", deutung.faellig ? `fällig ${deutung.faellig.slice(8, 10)}.${deutung.faellig.slice(5, 7)}.` : "", deutung.prioritaet !== "Normal" ? `Priorität ${deutung.prioritaet}` : ""].filter(Boolean).join(" · ")
            : "#Küche am See @Paul morgen !hoch"}
        </p>
        {fehler && <p role="alert" className="mt-1 text-[13px] text-bo-danger-text">{fehler}</p>}
      </Kachel>
      <Kanban
        doctype="PH Projekt Aufgabe"
        spalten={spalten}
        titelFeld="titel"
        kartenFelder={[{ fieldname: "projekt_titel", label: "Projekt" }, { fieldname: "faellig_text", label: "Fällig" }, { fieldname: "zugewiesen_an", label: "Zuständig" }]}
        statusTon={statusTon}
        hrefBasis="/projekte/objekt/aufgabe"
        onVerschiebe={async ({ name, nach }) => {
          const r = await aufgabeStatusAction({ name, status: nach });
          if (!r?.ok) return r || { ok: false };
          zeige(nach === "Erledigt" ? A.erledigt : `Aufgabe auf ${nach}`, { art: "ok", aktion: { titel: "Rückgängig", onClick: async () => (await aufgabeStatusAction({ name, status: r.alt }), router.refresh()) } });
          return { ok: true };
        }}
      />
    </div>
  );
}
