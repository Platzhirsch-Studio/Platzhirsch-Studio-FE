// PH Angebot – Buttons: Senden (PDF+Mail), Als AB übernehmen, Neue Version, Anzahlungslink, Annehmen/Ablehnen.
frappe.ui.form.on("PH Angebot", {
	setup(frm) {
		frm.set_query("produkt", "positionen", () => ({ filters: { status: "Aktiv" } }));
	},
	refresh(frm) {
		ph_faktura.indicator(frm);
		ph_faktura.summenblock(frm);
		if (frm.doc.gueltig_bis && frm.doc.status === "Gesendet" && frappe.datetime.get_diff(frm.doc.gueltig_bis, frappe.datetime.get_today()) < 0) {
			frm.dashboard.set_headline_alert(__("Angebot ist abgelaufen (gültig bis {0}).", [frappe.datetime.str_to_user(frm.doc.gueltig_bis)]), "orange");
		}
		if (frm.is_new()) return;
		const gesperrt = ["Angenommen", "Abgelehnt", "Abgelaufen", "Ersetzt"].includes(frm.doc.status);

		frm.add_custom_button(__("Als PDF senden"), () => ph_faktura.senden_dialog(frm), __("Aktionen"));
		if (!gesperrt) {
			frm.add_custom_button(__("Als AB übernehmen"), () => {
				frappe.confirm(__("Auftragsbestätigung aus diesem Angebot erzeugen? Das Angebot gilt dann als angenommen."), () => {
					frm.call({ method: "auftrag_erstellen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Auftragsbestaetigung", r.message));
				});
			}, __("Aktionen"));
			frm.add_custom_button(__("Annehmen"), () => frm.call({ method: "annehmen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
			frm.add_custom_button(__("Ablehnen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Angebot ablehnen"),
					fields: [{ fieldname: "grund", fieldtype: "Select", label: __("Grund"), options: ["Preis", "Mitbewerber", "Kein Bedarf", "Zeitplan", "Keine Rückmeldung", "Sonstiges"], reqd: 1 }],
					primary_action_label: __("Ablehnen"),
					primary_action: (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => { d.hide(); frm.reload_doc(); }),
				});
				d.show();
			}, __("Aktionen"));
			if (frm.doc.__onload && frm.doc.__onload.anzahlung_vorhanden !== false) {
				frm.add_custom_button(__("Anzahlungslink"), () => {
					frappe.prompt([{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: Math.round(frm.doc.brutto_cent * (frm.doc.anzahlung_prozent || 0) / 100), reqd: 1 }],
						(v) => frm.call({ method: "anzahlungslink", doc: frm.doc, args: v }).then((r) => r.message && frappe.set_route("Form", "PH Anzahlung", r.message)), __("Zahlungslink (Stripe) über PH Anzahlung"), __("Anlegen"));
				}, __("Aktionen"));
			}
		}
		frm.add_custom_button(__("Neue Version"), () => {
			frm.call({ method: "neue_version", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Angebot", r.message));
		}, __("Aktionen"));
		if (frm.doc.auftragsbestaetigung) frm.add_custom_button(__("AB öffnen"), () => frappe.set_route("Form", "PH Auftragsbestaetigung", frm.doc.auftragsbestaetigung));
		if (frm.doc.nachfolger) frm.add_custom_button(__("Neue Version öffnen"), () => frappe.set_route("Form", "PH Angebot", frm.doc.nachfolger));
		if (gesperrt) frm.set_intro(__("Dieses Angebot ist {0} – Änderungen nur über „Neue Version“.", [__(frm.doc.status)]), "blue");
	},
	zahlungsbedingung(frm) {
		if (!frm.doc.zahlungsbedingung) return;
		frappe.db.get_doc("PH Zahlungsbedingung", frm.doc.zahlungsbedingung).then((zb) => {
			frm.set_value("anzahlung_prozent", zb.anzahlung_prozent);
			frm.set_value("zahlungstext", zb.text);
		});
	},
	land(frm) { frm.dirty(); },
	uid_empfaenger(frm) { frm.dirty(); },
});

frappe.ui.form.on("PH Beleg Position", {
	produkt(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!row.produkt) return;
		// Feldnamen laut ph_sortiment PH Produkt (geprüft 04.11.): titel, marke, aktueller_preis_cent (Brutto), preisart, ust_klasse
		frappe.db.get_value("PH Produkt", row.produkt, ["titel", "marke", "aktueller_preis_cent", "preisart", "ust_klasse", "lieferzeit_text_de"]).then((r) => {
			const v = (r && r.message) || {};
			const satz = v.ust_klasse === "ermaessigt" ? 1000 : 2000; // Int ×100 (AT); das Zielland setzt der Server
			if (!row.bezeichnung && v.titel) frappe.model.set_value(cdt, cdn, "bezeichnung", v.titel);
			if (!row.marke && v.marke) frappe.model.set_value(cdt, cdn, "marke", v.marke);
			if (!row.ust_satz_promille) frappe.model.set_value(cdt, cdn, "ust_satz_promille", satz);
			if (!row.einzel_netto_cent && v.aktueller_preis_cent && ["Verkaufspreis", "UVP"].includes(v.preisart)) {
				frappe.model.set_value(cdt, cdn, "einzel_netto_cent", Math.round((v.aktueller_preis_cent * 10000) / (10000 + (row.ust_satz_promille || satz))));
			}
			if (!row.lieferzeit_text && v.lieferzeit_text_de) frappe.model.set_value(cdt, cdn, "lieferzeit_text", v.lieferzeit_text_de);
		}).catch(() => {});
	},
	menge: vorschau, einzel_netto_cent: vorschau, rabatt_promille: vorschau, ust_satz_promille: vorschau, alternativ: vorschau,
});

function vorschau(frm, cdt, cdn) {
	const r = locals[cdt][cdn];
	if (["Text", "Zwischensumme"].includes(r.art)) return;
	const netto = Math.round((r.menge || 0) * (r.einzel_netto_cent || 0) * (1 - (r.rabatt_promille || 0) / 1000));
	const ust = Math.round(netto * (r.ust_satz_promille || 0) / 10000);
	frappe.model.set_value(cdt, cdn, { netto_cent: netto, ust_cent: ust, brutto_cent: netto + ust });
}
