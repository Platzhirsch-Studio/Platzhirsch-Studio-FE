"use client";
// Primäraktionen im Seitenkopf (je Seite eine in Tinte): „Neue Anfrage“, „Neuer Kontakt“, „Neuer Termin“ –
// öffnen den Dialog (Schnellanlage § 3.3); `?neu=1` in der URL öffnet ihn beim Laden (Palette, Glocke).

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Knopf from "../Knopf";
import { NeueAnfrageDialog, NeuerKontaktDialog } from "./Dialoge";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";

function useNeuParam() {
  const sp = useSearchParams();
  const router = useRouter();
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    if (sp?.get("neu") !== "1") return;
    const t = setTimeout(() => setOffen(true), 0);
    return () => clearTimeout(t);
  }, [sp]);
  const schliessen = () => {
    setOffen(false);
    if (sp?.get("neu") === "1") {
      const q = new URLSearchParams(sp.toString());
      q.delete("neu");
      router.replace(`${pfad}${q.toString() ? `?${q}` : ""}`, { scroll: false });
    }
  };
  return [offen, setOffen, schliessen];
}

export function NeueAnfrageKnopf({ variant = "primary" }) {
  const [offen, setOffen, schliessen] = useNeuParam();
  return (
    <>
      <Knopf variant={variant} icon="Plus" onClick={() => setOffen(true)} data-testid="crm-neue-anfrage-knopf">{T.knopf.neueAnfrage}</Knopf>
      <NeueAnfrageDialog offen={offen} onSchliessen={schliessen} />
    </>
  );
}

export function NeuerKontaktKnopf() {
  const [offen, setOffen, schliessen] = useNeuParam();
  return (
    <>
      <Knopf variant="primary" icon="UserPlus" onClick={() => setOffen(true)} data-testid="crm-neuer-kontakt-knopf">{T.knopf.neuerKontakt}</Knopf>
      <NeuerKontaktDialog offen={offen} onSchliessen={schliessen} />
    </>
  );
}

export function NeuerTerminKnopf({ berater = [], ich, kontakt, anfrage, variant = "primary", titel = T.knopf.neuerTerminKopf, autoOffen = false }) {
  const [offen, setOffen] = useState(autoOffen);
  return (
    <>
      <Knopf variant={variant} icon="CalendarPlus" onClick={() => setOffen(true)} data-testid="crm-neuer-termin-knopf">{titel}</Knopf>
      {offen && <TerminAnlegenDialog offen onSchliessen={() => setOffen(false)} berater={berater} ich={ich} kontakt={kontakt} anfrage={anfrage} />}
    </>
  );
}
