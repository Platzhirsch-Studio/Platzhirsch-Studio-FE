// PH Rechnung – Buttons: Rechnung stellen, Zahlung erfassen, Gutschrift/Storno, Mahnen, Zahlungslink, Als PDF senden, Kontoauszug.
frappe.ui.form.on("PH Rechnung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		ph_faktura.summenblock(frm);
		if (frm.is_new()) {
			frm.set_intro(__("Entwürfe heißen ENTW-…; die fortlaufende Rechnungsnummer wird erst beim Stellen vergeben."), "blue");
			return;
		}
		// Standard-Submit ausblenden: Stellen läuft über den Button (Nummer, Pflichtangaben, PDF)
		frm.page.clear_primary_action();
		if (frm.doc.docstatus === 0) {
			frm.page.set_primary_action(__("Rechnung stellen"), () => {
				frappe.confirm(__("Rechnung stellen? Danach wird die fortlaufende Nummer vergeben; Änderungen sind nur noch per Gutschrift möglich."), () => {
					frm.call({ method: "stellen", doc: frm.doc, freeze: true, freeze_message: __("Rechnung wird gestellt …") }).then((r) => r.message && frappe.set_route("Form", "PH Rechnung", r.message));
				});
			});
			if (["Teilrechnung", "Schlussrechnung"].includes(frm.doc.art) && frm.doc.auftrag) {
				frm.add_custom_button(__("Anzahlungen verrechnen"), () => frm.call({ method: "anzahlungen_verrechnen", doc: frm.doc, args: { speichern: 1 } }).then(() => frm.reload_doc()), __("Aktionen"));
				const offen = (frm.doc.__onload && frm.doc.__onload.offene_anzahlungen) || [];
				if (offen.length && !(frm.doc.anzahlungen_verrechnet || []).length) frm.dashboard.set_headline_alert(__("{0} offene Anzahlungsbeträge – bitte „Anzahlungen verrechnen“.", [offen.length]), "orange");
			}
		}
		if (frm.doc.docstatus === 1) {
			const offen = Number(frm.doc.offen_cent) > 0 && !["Storniert", "Uneinbringlich"].includes(frm.doc.status);
			frm.add_custom_button(__("Als PDF senden"), () => ph_faktura.senden_dialog(frm), __("Aktionen"));
			if (offen) {
				frm.add_custom_button(__("Zahlung erfassen"), () => ph_faktura.zahlung_dialog(frm), __("Aktionen"));
				frm.add_custom_button(__("Zahlungslink senden"), () => frm.call({ method: "zahlungslink", doc: frm.doc }).then((r) => r.message && frappe.set_route("Form", "PH Anzahlung", r.message)), __("Aktionen"));
				if (!frm.doc.mahnsperre) {
					frm.add_custom_button(__("Mahnen"), () => frm.call({ method: "mahnen", doc: frm.doc }).then((r) => r.message && frappe.set_route("Form", "PH Mahnung", r.message)), __("Aktionen"));
				}
				frm.add_custom_button(__("Als uneinbringlich buchen"), () => {
					frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }], (v) => frm.call({ method: "uneinbringlich", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Uneinbringlich"), __("Buchen"));
				}, __("Aktionen"));
			}
			if (frm.doc.status !== "Storniert") {
				frm.add_custom_button(__("Gutschrift"), () => gutschrift_dialog(frm), __("Aktionen"));
			}
			frm.add_custom_button(__("Kontoauszug Kunde"), () => {
				if (frm.doc.kontakt) window.open(`/printview?doctype=PH%20Kontakt&name=${encodeURIComponent(frm.doc.kontakt)}&format=PH%20Kontoauszug%20Kunde&no_letterhead=1`);
			}, __("Aktionen"));
			if (frm.doc.storno_durch) frm.dashboard.set_headline_alert(__("Storniert durch Gutschrift {0}", [frm.doc.storno_durch]), "red");
			if (frm.doc.export_status === "exportiert") frm.set_intro(__("An Steuerberater übergeben ({0}) – nur noch per Gutschrift korrigierbar.", [frm.doc.export_lauf]), "blue");
		}
		if (frm.doc.auftrag) frm.add_custom_button(__("AB öffnen"), () => frappe.set_route("Form", "PH Auftragsbestaetigung", frm.doc.auftrag));
	},
	art(frm) {
		if (frm.doc.art === "Anzahlungsrechnung") frm.set_df_property("leistungszeitraum_von", "reqd", 1);
	},
});

function gutschrift_dialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Gutschrift zu {0}", [frm.doc.name]),
		fields: [
			{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Storno", "Teilgutschrift", "Wertminderung", "Kulanz"], default: "Storno", reqd: 1 },
			{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
			{ fieldname: "erstattung_art", fieldtype: "Select", label: __("Erstattung"), options: ["Verrechnung mit offener Rechnung", "Rückzahlung", "Keine (Kulanz ohne Zahlung)"], default: Number(frm.doc.bezahlt_cent) ? "Rückzahlung" : "Verrechnung mit offener Rechnung" },
			{ fieldtype: "HTML", options: `<p class="text-muted small">${__("Storno übernimmt alle Positionen (und verrechnete Anzahlungen). Teilgutschrift: Positionen im Entwurf anpassen.")}</p>` },
		],
		primary_action_label: __("Entwurf anlegen"),
		primary_action: (v) => frm.call({ method: "gutschrift_erstellen", doc: frm.doc, args: v, freeze: true }).then((r) => { d.hide(); r.message && frappe.set_route("Form", "PH Gutschrift", r.message); }),
	});
	d.show();
}

frappe.ui.form.on("PH Beleg Position", {
	menge: vorschau, einzel_netto_cent: vorschau, rabatt_promille: vorschau, ust_satz_promille: vorschau,
});
function vorschau(frm, cdt, cdn) {
	const r = locals[cdt][cdn];
	if (["Text", "Zwischensumme"].includes(r.art)) return;
	const netto = Math.round((r.menge || 0) * (r.einzel_netto_cent || 0) * (1 - (r.rabatt_promille || 0) / 1000));
	const ust = Math.round(netto * (r.ust_satz_promille || 0) / 10000);
	frappe.model.set_value(cdt, cdn, { netto_cent: netto, ust_cent: ust, brutto_cent: netto + ust });
}
