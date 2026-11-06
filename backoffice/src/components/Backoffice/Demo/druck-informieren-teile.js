"use client";
// Client-Teil der Demo „druck-informieren“ (Team P0-5c): G-05 LeitungBitten, G-17 DruckPanel/DruckMenue,
// G-18 Informieren, G-19 AnDieKassa im Lounge-Stil. Beispielwerte sind als solche benannt (@beispiel.invalid);
// Aktionen laufen gegen den Mock (Aufgabe wird angelegt, Mail nur als Kommentar „nicht versendet“).

import { useState } from "react";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import { Pille } from "../StatusBadge";
import { Icon } from "../icons";
import { Menue, MenuePunkt } from "../Overlay";
import Informieren, { InformierenChip, InformierenSheet } from "../Informieren/Informieren";
import LeitungBitten from "../LeitungBitten";
import AnDieKassa from "../AnDieKassa";
import DruckPanel, { DruckKnopf } from "../Druck/DruckPanel";
import DruckMenue from "../Druck/DruckMenue";
import { formateFuer } from "@/lib/backoffice/druck";

const TEXTE = {
  team: "Bausteine von Team P0-5c",
  titel: "Drucken, Informieren, Leitung, Kassa",
  einleitung: "Vier Muster, die jeder Bereich gleich verwendet. Alles läuft gegen die Beispieldaten – Mails werden nicht versendet, die Aufgabe für die Leitung landet in der Testdatenbank.",
  informieren: { titel: "Kunden informieren", unter: "Chip am Objekt, Sheet mit Vorschau, Senden mit Rückgängig" },
  aenderung: "Liefertermin auf KW 48 verschoben",
  zustaende: "Zustände des Chips",
  ohneMail: "Kunde ohne E-Mail ansehen",
  leitung: { titel: "Leitung bitten", unter: "Wenn eine Aktion nur der Leitung zusteht" },
  gesperrt: "Rechnung freigeben",
  nurLeitung: "Nur Faktura-Leitung",
  imMenue: "Im Menü einer Akte",
  aktionen: "Aktionen",
  stornieren: "Stornieren",
  angefragtBeispiel: "So sieht es nach dem Bitten aus",
  druck: { titel: "Drucken", unter: "Druckpanel mit Vorschau, Formaten und Warteschlange · Strg+P" },
  ohneBeleg: "Keine Rechnung in den Beispieldaten.",
  formate: (n) => `${n} Formate`,
  offline: "Mit Gerätedrucker (nicht erreichbar)",
  kiosk: "Am Arbeitsplatz (Packtisch)",
  kassa: { titel: "An der Kassa", unter: "Statt Bargeld-Feldern in Shop, Faktura, Logistik, Projekte, Service" },
  ohneRecht: "Ohne Kassa-Recht",
};

const EMPFAENGER = { name: "Familie Stadler", email: "stadler@beispiel.invalid", telefon: "+43 5574 00000", bevorzugt: "E-Mail" };
const OHNE_MAIL = { name: "Johanna Fink", telefon: "+43 5574 00001", bevorzugt: "Telefon" };

function Abschnitt({ titel, unter, className, children, testid }) {
  return (
    <Kachel titel={titel} unter={unter} className={className} testid={testid}>
      <div className="grid min-w-0 gap-5">{children}</div>
    </Kachel>
  );
}

function Unterkopf({ children }) {
  return <h3 className="px-1 text-[13px] leading-[18px] font-medium text-bo-text-soft">{children}</h3>;
}

export default function DemoDruckInformierenTeile({ modus, rechnung, lieferschein, projekt, darfBitten, darfKassa, versand }) {
  const [ohneMail, setOhneMail] = useState(false);
  const [offlineOffen, setOfflineOffen] = useState(false);
  const [mailOffen, setMailOffen] = useState(false);
  const objekt = projekt ? { doctype: "PH Projekt", name: projekt.name, titel: projekt.titel } : null;
  const vorlagen = [
    {
      id: "liefertermin",
      titel: "Liefertermin",
      betreff: "Neuer Liefertermin für {projekt}",
      text: "Guten Tag {kunde},\n\nIhr Liefertermin für „{projekt}“ hat sich geändert: neu ist {termin}. Wir melden uns zwei Tage vorher mit der genauen Uhrzeit.\n\nFreundliche Grüße\nIhr Platzhirsch-Team",
      methode: { name: "portal_status_senden", felder: { nachricht: "text" } },
    },
    {
      id: "montage",
      titel: "Montage",
      betreff: "Montagetermin für {projekt}",
      text: "Guten Tag {kunde},\n\ndie Montage für „{projekt}“ ist für {montage} geplant. Bitte sorgen Sie dafür, dass der Raum frei zugänglich ist.\n\nFreundliche Grüße\nIhr Platzhirsch-Team",
      methode: { name: "portal_status_senden", felder: { nachricht: "text" } },
    },
  ];
  const werte = { kunde: EMPFAENGER.name, projekt: projekt?.titel || "", termin: "KW 48" };
  const rechnungFormate = formateFuer("PH Rechnung");

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-druck-informieren">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <Abschnitt {...TEXTE.informieren} className="lg:col-span-7" testid="demo-informieren">
          {objekt ? (
            <div className="grid gap-4 rounded-bo-karte bg-bo-surface-2 p-4 sm:p-5">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <p className="bo-titel min-w-0 text-balance">{objekt.titel}</p>
                <Pille material="see">Lieferung</Pille>
              </div>
              <p className="flex items-center gap-2 text-[14px] text-bo-text-soft">
                <Icon name="CalendarDays" className="size-4" />
                {TEXTE.aenderung}
              </p>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Informieren objekt={objekt} empfaenger={EMPFAENGER} vorlagen={vorlagen} werte={werte} versand={versand} testid="demo-info" />
              </div>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Unterkopf>{TEXTE.zustaende}</Unterkopf>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <InformierenChip objekt={{ doctype: "PH Projekt", name: "beispiel" }} onOeffnen={() => setOhneMail(true)} testid="demo-chip-offen" />
              <InformierenChip zustand="informiert" text="Kunde informiert · E-Mail heute 14:05" testid="demo-chip-informiert" />
              <InformierenChip zustand="fehler" objekt={{ doctype: "PH Projekt", name: "beispiel-2" }} onOeffnen={() => setOhneMail(true)} testid="demo-chip-fehler" />
            </div>
          </div>
          <div>
            <Knopf size="s" variant="ghost" icon="Phone" onClick={() => setOhneMail(true)} data-testid="demo-ohne-mail">
              {TEXTE.ohneMail}
            </Knopf>
          </div>
          {objekt && <InformierenSheet offen={ohneMail} onSchliessen={() => setOhneMail(false)} objekt={objekt} empfaenger={OHNE_MAIL} vorlagen={vorlagen} werte={{ ...werte, kunde: OHNE_MAIL.name }} versand={versand} testid="demo-ohne-mail-sheet" />}
        </Abschnitt>

        <Abschnitt {...TEXTE.leitung} className="lg:col-span-5" testid="demo-leitung">
          <div className="grid justify-items-start gap-3 rounded-bo-karte bg-bo-surface-2 p-4 sm:p-5">
            <Knopf variant="secondary" icon="BadgeCheck" disabled grund={TEXTE.nurLeitung}>
              {TEXTE.gesperrt}
            </Knopf>
            {rechnung && <LeitungBitten erlaubt={darfBitten} bereich="faktura" bereichTitel="Faktura" aktion="freigeben" aktionTitel={TEXTE.gesperrt} objekt={{ doctype: "PH Rechnung", name: rechnung, titel: rechnung }} testid="demo-leitung-knopf" />}
          </div>
          <div className="grid gap-2">
            <Unterkopf>{TEXTE.imMenue}</Unterkopf>
            {rechnung && (
              <Menue label={TEXTE.aktionen} breite={300} ausloeser={(p) => <Knopf {...p} icon="Ellipsis" iconRechts="ChevronDown" data-testid="demo-leitung-menue">{TEXTE.aktionen}</Knopf>}>
                <MenuePunkt icon="RotateCcw" deaktiviert grund={TEXTE.nurLeitung}>
                  {TEXTE.stornieren}
                </MenuePunkt>
                <LeitungBitten variante="menue" erlaubt={darfBitten} bereich="faktura" bereichTitel="Faktura" aktion="stornieren" aktionTitel={TEXTE.stornieren} objekt={{ doctype: "PH Rechnung", name: rechnung, titel: rechnung }} testid="demo-leitung-punkt" />
              </Menue>
            )}
          </div>
          <div className="grid gap-2">
            <Unterkopf>{TEXTE.angefragtBeispiel}</Unterkopf>
            <LeitungBitten erlaubt bereich="faktura" aktion="beispiel" aktionTitel="Beispiel" objekt={{ doctype: "PH Rechnung", name: "beispiel" }} angefragt={{ zeit: "2026-11-04T09:14:00", href: null }} testid="demo-leitung-angefragt" />
          </div>
        </Abschnitt>

        <Abschnitt {...TEXTE.druck} className="lg:col-span-7" testid="demo-druck">
          {rechnung ? (
            <div className="grid gap-4 rounded-bo-karte bg-bo-surface-2 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-bo-surface text-bo-text-soft shadow-(--bo-sh-btn)">
                  <Icon name="FileText" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[17px] leading-6 font-semibold tracking-[-0.012em]">Rechnung {rechnung}</p>
                  <p className="text-[13px] text-bo-text-soft">{TEXTE.formate(rechnungFormate.length)} · {rechnungFormate.map((f) => f.titel).join(" · ")}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DruckKnopf doctype="PH Rechnung" name={rechnung} titel={`Rechnung ${rechnung}`} pdf={modus === "frappe"} testdaten={modus !== "frappe"} perEmail={objekt ? () => setMailOffen(true) : undefined} />
                <Knopf variant="ghost" icon="Printer" onClick={() => setOfflineOffen(true)} data-testid="demo-druck-offline">
                  {TEXTE.offline}
                </Knopf>
              </div>
              <DruckPanel offen={offlineOffen} onSchliessen={() => setOfflineOffen(false)} doctype="PH Rechnung" name={rechnung} titel={`Rechnung ${rechnung}`} pdf={modus === "frappe"} testdaten={modus !== "frappe"} drucker={{ name: "Bondrucker Kassa 1", erreichbar: false }} testid="demo-druck-offline-panel" />
              {objekt && <InformierenSheet offen={mailOffen} onSchliessen={() => setMailOffen(false)} objekt={objekt} empfaenger={EMPFAENGER} vorlagen={vorlagen} werte={werte} versand={versand} testid="demo-druck-mail" />}
            </div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{TEXTE.ohneBeleg}</p>
          )}
          <div className="grid gap-2">
            <Unterkopf>{TEXTE.kiosk}</Unterkopf>
            <div>
              <DruckMenue
                groesse="l"
                pdf={modus === "frappe"}
                eintraege={[
                  { id: "lieferschein", name: lieferschein },
                  { id: "packliste", name: lieferschein },
                  { id: "etikett", grund: "Etikett kommt vom Versanddienst, sobald das Paket abgeschlossen ist." },
                  { id: "bon", deaktiviert: true, grund: "Kein Kassenbeleg zu diesem Auftrag." },
                ]}
                testid="demo-druck-menue"
              />
            </div>
          </div>
        </Abschnitt>

        <Abschnitt {...TEXTE.kassa} className="lg:col-span-5" testid="demo-kassa">
          <div className="grid gap-3">
            <AnDieKassa darf={darfKassa} kunde="KT-2026-00012" beleg={rechnung || undefined} testid="demo-kassa-zahlung" />
            <AnDieKassa variante="erstattung" darf={darfKassa} kunde="KT-2026-00012" beleg="GS-2026-00003" testid="demo-kassa-erstattung" />
            <AnDieKassa variante="gutschein" darf={darfKassa} flaeche testid="demo-kassa-gutschein" />
          </div>
          <div className="grid gap-2">
            <Unterkopf>{TEXTE.ohneRecht}</Unterkopf>
            <AnDieKassa darf={false} flaeche testid="demo-kassa-ohne-recht" />
          </div>
        </Abschnitt>
      </div>
    </div>
  );
}
