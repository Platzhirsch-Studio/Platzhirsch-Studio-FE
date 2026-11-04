// PH Servicefall – Client-Script: Statusfarben, Fristen-Ampel, Fotogalerie, Buttons (CONVENTIONS 8).
// Server-Logik ausschließlich als Dokument-Methoden (frm.call), Eingaben über Dialoge.

const SF_FARBEN = { Gemeldet: "blue", Geprueft: "cyan", Entscheidung: "purple", "In Bearbeitung": "orange", "Einsatz geplant": "yellow", Erledigt: "green", Geschlossen: "gray", Abgelehnt: "red" };
const AMPEL = {
	gruen: { farbe: "#15803d", hell: "#dcfce7", text: __("Gewährleistung – Vermutungsfrist läuft") },
	gelb: { farbe: "#b45309", hell: "#fef3c7", text: __("Gewährleistung – Beweislast beim Kunden") },
	orange: { farbe: "#c2410c", hell: "#ffedd5", text: __("Nur Verjährung/Garantie") },
	rot: { farbe: "#b91c1c", hell: "#fee2e2", text: __("Fristen abgelaufen – Kulanz") },
	grau: { farbe: "#6b7280", hell: "#f3f4f6", text: __("Keine Fristen (Datum fehlt)") },
};

frappe.ui.form.on("PH Servicefall", {
	setup(frm) {
		frm.set_query("fehlercode", () => ({ filters: frm.doc.fehlerbereich ? { bereich: frm.doc.fehlerbereich, aktiv: 1 } : { aktiv: 1 } }));
		frm.set_query("ausfuehrung", () => ({ filters: frm.doc.produkt ? { produkt: frm.doc.produkt } : {} }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), SF_FARBEN[frm.doc.status] || "gray");
		fristenAmpel(frm);
		fotoGalerie(frm);
		if (frm.is_new()) return;

		const offen = ["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant"].includes(frm.doc.status);
		const leitung = frappe.user.has_role(["PH Service Leitung", "PH Geschäftsführung", "System Manager"]);

		// Einsatz planen
		if (offen) {
			frm.add_custom_button(__("Einsatz planen"), () => dialogEinsatz(frm), __("Aktionen"));
		}
		// Ersatzteile bestellen
		if (offen && (frm.doc.ersatzteile || []).some((z) => z.status === "Benoetigt" && !z.bestellung)) {
			frm.add_custom_button(__("Ersatzteile bestellen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Ersatzteilbestellung beim Hersteller"),
					fields: [{ fieldname: "lieferant", fieldtype: "Link", options: "PH Lieferant", label: __("Lieferant"), default: frm.doc.lieferant, reqd: 1 }],
					primary_action_label: __("Bestellung anlegen"),
					primary_action(v) {
						frm.call({ method: "ersatzteile_bestellen", doc: frm.doc, args: v, freeze: true }).then((r) => {
							d.hide();
							if (r.message) frappe.set_route("Form", "PH Ersatzteilbestellung", r.message);
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		// Kunde informieren
		if (frm.doc.kunde_email) {
			frm.add_custom_button(__("Kunde informieren"), () => dialogKunde(frm), __("Aktionen"));
		}
		// Lieferant informieren / Regress
		if (frm.doc.lieferant) {
			frm.add_custom_button(__("Lieferant informieren"), () => dialogLieferant(frm), __("Aktionen"));
			if (["Kein Regress", "Abgelehnt", "Verrechnet"].includes(frm.doc.regress_status || "Kein Regress")) {
				frm.add_custom_button(__("Regress anlegen"), () => {
					frm.call({ method: "regress_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Lieferantenregress", r.message));
				}, __("Aktionen"));
			}
		}
		// Gutschrift
		if (["Preisminderung", "Kulanz"].includes(frm.doc.entscheidung) && frm.doc.rechnung && !frm.doc.gutschrift) {
			frm.add_custom_button(__("Gutschrift/Kulanz erstellen"), () => {
				frappe.confirm(__("Gutschrift-Entwurf in ph_faktura anlegen?"), () => frm.call({ method: "gutschrift_erstellen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Gutschrift", r.message)));
			}, __("Aktionen"));
		}
		// Erledigt + Bericht
		if (["In Bearbeitung", "Einsatz geplant", "Entscheidung"].includes(frm.doc.status) && frm.doc.entscheidung) {
			frm.add_custom_button(__("Erledigt + Bericht"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Servicefall erledigt melden"),
					fields: [{ fieldname: "abschlussbericht", fieldtype: "Text Editor", label: __("Abschlussbericht"), default: frm.doc.abschlussbericht, reqd: 1 }],
					primary_action_label: __("Erledigt"),
					primary_action(v) {
						frm.call({ method: "erledigt_melden", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		// Abnahme (Unterschrift)
		if (["Erledigt", "Geschlossen"].includes(frm.doc.status) && !frm.doc.abnahme_bestaetigt) {
			frm.add_custom_button(__("Abnahme erfassen"), () => dialogAbnahme(frm), __("Aktionen"));
		}
		// Ablehnen / Wieder öffnen (Leitung)
		if (leitung && ["Geprueft", "Entscheidung"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Ablehnen"), () => dialogAblehnen(frm), __("Aktionen"));
		}
		if (leitung && ["Erledigt", "Geschlossen", "Abgelehnt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Wieder öffnen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => frm.call({ method: "neu_oeffnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Wieder öffnen"));
			}, __("Aktionen"));
		}
		// Druck-Schnellzugriff
		frm.add_custom_button(__("Reklamationsmeldung (PDF)"), () => frm.print_doc("PH Servicefall Reklamationsmeldung"), __("Drucken"));
		frm.add_custom_button(__("Abnahmebestätigung (PDF)"), () => frm.print_doc("PH Servicefall Abnahmebestätigung"), __("Drucken"));

		// Hinweise im Kopf
		if (frm.doc.kulanz_freigabe_noetig && !frm.doc.kulanz_freigegeben_von) frm.dashboard.set_headline_alert(__("Kulanz über Schwelle – Freigabe der Leitung nötig."), "orange");
		if (frm.doc.status === "Gemeldet" && frm.doc.frist_reaktion && frappe.datetime.get_diff(frm.doc.frist_reaktion, frappe.datetime.get_today()) < 0) frm.dashboard.set_headline_alert(__("Reaktionsfrist überschritten."), "red");
		if (frm.doc.eskalationsstufe > 0) frm.dashboard.add_indicator(__("Eskalationsstufe {0}", [frm.doc.eskalationsstufe]), "red");
		if (frm.doc.lieferantenrelevant) frm.dashboard.add_indicator(__("Lieferantenrelevant"), "orange");
	},

	kaufdatum: fristenAmpel,
	uebergabe_datum: fristenAmpel,
	kundentyp: fristenAmpel,
	garantie_monate: fristenAmpel,
	fehlerbereich(frm) {
		if (frm.doc.fehlercode) {
			frappe.db.get_value("PH Fehlercode", frm.doc.fehlercode, "bereich").then((r) => {
				if (r.message && r.message.bereich !== frm.doc.fehlerbereich) frm.set_value("fehlercode", null);
			});
		}
	},
	fehlercode(frm) {
		if (!frm.doc.fehlercode) return;
		frappe.db.get_value("PH Fehlercode", frm.doc.fehlercode, ["bereich", "standard_entscheidung"]).then((r) => {
			if (!r.message) return;
			if (!frm.doc.fehlerbereich) frm.set_value("fehlerbereich", r.message.bereich);
			if (!frm.doc.entscheidung && r.message.standard_entscheidung) frappe.show_alert({ message: __("Übliche Entscheidung laut Katalog: {0}", [__(r.message.standard_entscheidung)]), indicator: "blue" });
		});
	},
	entscheidung(frm) {
		if (["Preisminderung", "Wandlung"].includes(frm.doc.entscheidung) && frm.doc.kundentyp === "Verbraucher") {
			frappe.show_alert({ message: __("VGG § 12: Vorrang Verbesserung/Austausch – Begründung festhalten."), indicator: "orange" }, 8);
		}
	},
});

frappe.ui.form.on("PH Servicefall Foto", {
	bild: fotoGalerie,
	fotos_remove: fotoGalerie,
});

// ── Fristen-Ampel (HTML-Feld) ──────────────────────────────────────────────
function fristenAmpel(frm) {
	const w = frm.get_field("fristen_ampel");
	if (!w || !w.$wrapper) return;
	const basis = frm.doc.uebergabe_datum || frm.doc.kaufdatum;
	if (!basis) { w.$wrapper.html(ampelHtml("grau", null, [])); return; }
	// Berechnung im Client spiegelt ph_service/fristen.py (Server bleibt maßgeblich beim Speichern).
	const heute = frappe.datetime.str_to_obj(frappe.datetime.get_today());
	const vermutung = frm.doc.kundentyp === "Unternehmer" ? 6 : 12;
	const plus = (d, m) => { const x = frappe.datetime.str_to_obj(d); const t = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + m); const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(t, last)); return x; };
	const gwl = plus(basis, 24), verm = plus(basis, vermutung), verj = plus(frappe.datetime.obj_to_str(gwl), 3);
	const gar = frm.doc.garantie_monate > 0 ? plus(basis, frm.doc.garantie_monate) : null;
	let stufe = "rot";
	if (heute <= verm) stufe = "gruen"; else if (heute <= gwl) stufe = "gelb"; else if (heute <= verj || (gar && heute <= gar)) stufe = "orange";
	const rest = Math.round((gwl - heute) / 86400000);
	const zeilen = [
		[__("Vermutung bis"), verm, heute <= verm],
		[__("Gewährleistung bis"), gwl, heute <= gwl],
		[__("Verjährung bis"), verj, heute <= verj],
	];
	if (gar) zeilen.push([__("Garantie bis"), gar, heute <= gar]);
	w.$wrapper.html(ampelHtml(stufe, rest, zeilen));
}

function ampelHtml(stufe, rest, zeilen) {
	const a = AMPEL[stufe];
	const punkte = ["gruen", "gelb", "orange", "rot"].map((s) => `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:4px;background:${s === stufe ? AMPEL[s].farbe : "#e5e7eb"};box-shadow:${s === stufe ? "0 0 0 3px " + AMPEL[s].hell : "none"}"></span>`).join("");
	const liste = zeilen.map(([l, d, ok]) => `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:2px 0;border-bottom:1px solid #f1f5f9"><span class="text-muted">${l}</span><span style="font-weight:600;color:${ok ? "#111827" : "#9ca3af"}">${frappe.datetime.obj_to_user(d)}</span></div>`).join("");
	const restText = rest === null ? "" : rest >= 0 ? __("noch {0} Tage Gewährleistung", [rest]) : __("Gewährleistung seit {0} Tagen abgelaufen", [-rest]);
	return `<div style="border:1px solid ${a.hell};border-left:4px solid ${a.farbe};border-radius:6px;padding:10px 12px;background:#fff">
		<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div>${punkte}</div><span style="font-size:11px;color:${a.farbe};font-weight:600;text-transform:uppercase;letter-spacing:.05em">${a.text}</span></div>
		${liste}<div style="font-size:11px;color:#6b7280;margin-top:6px">${restText}</div></div>`;
}

// ── Fotogalerie (HTML-Feld) ────────────────────────────────────────────────
function fotoGalerie(frm) {
	const w = frm.get_field("fotogalerie");
	if (!w || !w.$wrapper) return;
	const fotos = (frm.doc.fotos || []).filter((z) => z.bild);
	if (!fotos.length) { w.$wrapper.html(`<div class="text-muted" style="font-size:12px">${__("Noch keine Fotos. Zeilen unten hinzufügen oder per Portal/Website melden.")}</div>`); return; }
	const kacheln = fotos.map((z) => {
		const url = frappe.utils.escape_html(z.bild);
		const hinweis = frappe.utils.escape_html(z.hinweis || "");
		const quelle = frappe.utils.escape_html(z.quelle || "");
		const istBild = /\.(jpe?g|png|webp|gif|heic)$/i.test(url);
		const inhalt = istBild ? `<img src="${url}" style="width:100%;height:120px;object-fit:cover;border-radius:6px 6px 0 0" loading="lazy">` : `<div style="height:120px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:6px 6px 0 0">${frappe.utils.icon("file", "lg")}</div>`;
		return `<a href="${url}" target="_blank" rel="noopener" style="display:block;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;color:inherit;overflow:hidden">${inhalt}<div style="padding:6px 8px;font-size:11px"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${hinweis || "–"}</div><div class="text-muted">${quelle}${z.datum ? " · " + frappe.datetime.str_to_user(z.datum) : ""}${z.an_lieferant ? " · " + __("Lieferant") : ""}</div></div></a>`;
	}).join("");
	w.$wrapper.html(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${kacheln}</div>`);
}

// ── Dialoge ────────────────────────────────────────────────────────────────
function dialogEinsatz(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Serviceeinsatz planen"),
		fields: [
			{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), reqd: 1, default: frappe.datetime.add_days(frappe.datetime.get_today(), 3) },
			{ fieldname: "zeit_von", fieldtype: "Time", label: __("Zeitfenster von"), default: "08:00:00" },
			{ fieldname: "zeit_bis", fieldtype: "Time", label: __("bis"), default: "12:00:00" },
			{ fieldname: "techniker", fieldtype: "Link", options: "User", label: __("Techniker"), reqd: 1 },
			{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Besichtigung", "Reparatur", "Austausch", "Nacharbeit", "Wartung", "Pflege"], default: "Reparatur" },
			{ fieldname: "hinweis", fieldtype: "Small Text", label: __("Hinweis für den Techniker") },
		],
		primary_action_label: __("Einsatz anlegen"),
		primary_action(v) {
			frm.call({ method: "einsatz_anlegen", doc: frm.doc, args: v, freeze: true }).then((r) => {
				d.hide();
				if (r.message) frappe.set_route("Form", "PH Serviceeinsatz", r.message);
			});
		},
	});
	d.show();
}

function dialogKunde(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Kunde informieren"),
		fields: [
			{ fieldname: "vorlage", fieldtype: "Select", label: __("Vorlage"), options: [{ value: "eingang", label: __("Eingangsbestätigung") }, { value: "termin", label: __("Terminvorschlag") }, { value: "abschluss", label: __("Abschluss / Abnahmebestätigung") }], default: frm.doc.status === "Gemeldet" ? "eingang" : frm.doc.status === "Erledigt" ? "abschluss" : "termin", reqd: 1 },
			{ fieldname: "zusatz", fieldtype: "Small Text", label: __("Persönlicher Zusatz (optional)") },
			{ fieldtype: "HTML", options: `<p class="text-muted" style="font-size:12px">${__("Empfänger")}: ${frappe.utils.escape_html(frm.doc.kunde_email || "")}. ${__("Im Testmodus geht die Mail an das Team-Postfach.")}</p>` },
		],
		primary_action_label: __("Senden"),
		primary_action(v) {
			frm.call({ method: "kunde_informieren", doc: frm.doc, args: v, freeze: true }).then((r) => {
				d.hide();
				frappe.show_alert({ message: __("Gesendet: {0}", [r.message]), indicator: "green" });
				frm.reload_doc();
			});
		},
	});
	d.show();
}

function dialogLieferant(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Reklamation an Lieferanten melden"),
		fields: [
			{ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("E-Mail Lieferant (leer = Bestell-E-Mail aus PH Lieferant)") },
			{ fieldname: "zusatz", fieldtype: "Small Text", label: __("Zusatztext") },
			{ fieldtype: "HTML", options: `<p class="text-muted" style="font-size:12px">${__("Anhang: Reklamationsmeldung (PDF) und alle Fotos mit Häkchen „An Lieferant senden“. Bei lieferantenrelevantem Fehlercode wird ein Regress (§ 933b ABGB) angelegt.")}</p>` },
		],
		primary_action_label: __("Senden"),
		primary_action(v) {
			frm.call({ method: "lieferant_informieren", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
		},
	});
	d.show();
}

function dialogAbnahme(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Abnahme durch Kunden"),
		size: "large",
		fields: [
			{ fieldname: "name", fieldtype: "Data", label: __("Name"), default: frm.doc.kunde_name, reqd: 1 },
			{ fieldname: "zufriedenheit", fieldtype: "Rating", label: __("Zufriedenheit") },
			{ fieldname: "kommentar", fieldtype: "Small Text", label: __("Kommentar") },
			{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift"), reqd: 1 },
		],
		primary_action_label: __("Abnahme speichern"),
		primary_action(v) {
			frm.call({ method: "abnahme_erfassen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
		},
	});
	d.show();
}

function dialogAblehnen(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Servicefall ablehnen"),
		fields: [
			{ fieldname: "grund", fieldtype: "Select", label: __("Grund"), options: ["Kein Mangel (Gebrauchsspur)", "Bedienungsfehler", "Frist abgelaufen", "Fremdeinwirkung", "Nicht reproduzierbar", "Sonstiges"], reqd: 1 },
			{ fieldname: "begruendung", fieldtype: "Text", label: __("Begründung (geht an den Kunden)"), reqd: 1 },
		],
		primary_action_label: __("Ablehnen"),
		primary_action(v) {
			frappe.confirm(__("Servicefall endgültig ablehnen?"), () => frm.call({ method: "ablehnen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }));
		},
	});
	d.show();
}
