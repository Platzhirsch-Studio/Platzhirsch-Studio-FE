"use server";
// Server Actions der Eingabe-Bausteine (Team P0-6): Foto/Datei privat anhängen (G-30) und Unterschrift
// einmalig setzen (G-23). Jede Aktion prüft die Sitzung erneut und gibt { ok:true, … } | { ok:false, code,
// fehler } zurück – nie werfen. Mock-Pfad: derselbe Client (MockClient legt Dateien im Speicher ab);
// ohne Ziel-Datensatz (Baustein-Demo) antwortet der Mock mit einer Demo-Antwort, Frappe lehnt ab.

import { createHash } from "node:crypto";
import { getSession } from "@/lib/backoffice/auth/dal";
import { backofficeMode } from "@/lib/backoffice/config";
import { backoffice } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { TEXTE } from "./texte";

const T = TEXTE.aktion;
const MAX_BYTES = 15 * 1024 * 1024;
const BILD = /^image\/(jpeg|png|webp|heic|heif|gif)$/;
const FELD = /^[a-z][a-z0-9_]{0,63}$/;
const DOCTYPE = /^[A-Za-z][A-Za-z0-9 _-]{0,79}$/;
const demoUnterschriften = globalThis.__phBoDemoUnterschriften || (globalThis.__phBoDemoUnterschriften = new Map());

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, fehler: err.message };
  console.error("[backoffice] Eingabe-Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", fehler: T.nichtErreichbar };
}

function dateiname(roh, ersatz) {
  const n = String(roh || "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").slice(-120).trim();
  return n || ersatz;
}

/**
 * Bild privat an einen Datensatz hängen. FormData: datei (File), doctype, name, [aufgenommen].
 * @returns {Promise<{ok:true, datei:{url:string, name:string}, demo?:boolean} | {ok:false, code:string, fehler:string}>}
 */
export async function dateiHochladenAction(formData) {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", fehler: T.nichtAngemeldet };
  const datei = formData?.get?.("datei");
  const doctype = String(formData?.get?.("doctype") || "");
  const name = String(formData?.get?.("name") || "");
  if (!datei || typeof datei.arrayBuffer !== "function") return { ok: false, code: "invalid", fehler: T.ungueltig };
  if (!BILD.test(datei.type || "")) return { ok: false, code: "invalid", fehler: TEXTE.foto.keinBild };
  if (datei.size > MAX_BYTES) return { ok: false, code: "invalid", fehler: TEXTE.foto.zuGross };
  const dn = dateiname(datei.name, `foto-${Date.now()}.jpg`);
  if (!doctype || !name) {
    if (backofficeMode() === "mock") return { ok: true, demo: true, datei: { name: dn, url: "" } };
    return { ok: false, code: "invalid", fehler: T.ungueltig };
  }
  if (!DOCTYPE.test(doctype)) return { ok: false, code: "invalid", fehler: T.ungueltig };
  try {
    const inhalt = new Uint8Array(await datei.arrayBuffer());
    const r = await backoffice(session).uploadFile({ doctype, name, dateiname: dn, inhalt, privat: true, typ: datei.type });
    return { ok: true, datei: { name: r?.file_name || dn, url: r?.file_url || "" } };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Unterschrift einmalig setzen: prüft vorher, ob das Feld schon belegt ist (dann conflict), prüft den
 * Prüfwert (SHA-256 der PNG-Bytes), hängt das PNG privat an und schreibt die Datei-Adresse ins Feld.
 * @param {{doctype?:string, name?:string, feld?:string, png:string, pruefwert:string, zeit:string, art?:string, text?:string}} p
 */
export async function unterschriftSpeichernAction(p = {}) {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", fehler: T.nichtAngemeldet };
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(p.png || ""));
  if (!m && p.art === "unterschrift") return { ok: false, code: "invalid", fehler: T.ungueltig };
  const bytes = m ? Buffer.from(m[1], "base64") : null;
  if (bytes && bytes.length > 2 * 1024 * 1024) return { ok: false, code: "invalid", fehler: T.ungueltig };
  if (bytes && createHash("sha256").update(bytes).digest("hex") !== String(p.pruefwert || "")) return { ok: false, code: "invalid", fehler: T.pruefwertFalsch };
  const doctype = String(p.doctype || "");
  const name = String(p.name || "");
  const feld = String(p.feld || "");
  if (!doctype || !name || !feld) {
    if (backofficeMode() !== "mock") return { ok: false, code: "invalid", fehler: T.ungueltig };
    const schluessel = `${session.user}:${String(p.demo || "demo")}`;
    if (demoUnterschriften.has(schluessel)) return { ok: false, code: "conflict", fehler: TEXTE.unterschrift.bereitsGesetzt, gesetzt: demoUnterschriften.get(schluessel) };
    const gesetzt = { zeit: String(p.zeit || new Date().toISOString()), pruefwert: String(p.pruefwert || ""), art: String(p.art || "unterschrift") };
    demoUnterschriften.set(schluessel, gesetzt);
    return { ok: true, demo: true, gesetzt };
  }
  if (!DOCTYPE.test(doctype) || !FELD.test(feld)) return { ok: false, code: "invalid", fehler: T.ungueltig };
  try {
    const client = backoffice(session);
    const doc = await client.getDoc(doctype, name);
    if (doc?.[feld]) return { ok: false, code: "conflict", fehler: TEXTE.unterschrift.bereitsGesetzt };
    let wert = `${p.art || "unterschrift"}: ${String(p.text || "").slice(0, 140)}`.trim();
    if (bytes) {
      const datei = await client.uploadFile({ doctype, name, dateiname: `unterschrift-${feld}-${Date.now()}.png`, inhalt: new Uint8Array(bytes), privat: true, typ: "image/png" });
      wert = datei?.file_url || wert;
    }
    await client.setValue(doctype, name, feld, wert);
    return { ok: true, gesetzt: { zeit: String(p.zeit || ""), pruefwert: String(p.pruefwert || ""), art: String(p.art || "unterschrift"), url: bytes ? wert : "" } };
  } catch (err) {
    return fehler(err);
  }
}
