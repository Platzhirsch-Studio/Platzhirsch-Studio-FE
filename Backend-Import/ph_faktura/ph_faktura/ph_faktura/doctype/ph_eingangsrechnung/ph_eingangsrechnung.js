// PH Eingangsrechnung – Buttons: Prüfen, Freigeben (Leitung), Ablehnen, Als bezahlt buchen, Zurück an Erfassung.
frappe.ui.form.on("PH Eingangsrechnung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new()) return;
		const leitung = frappe.user.has_role(["PH Faktura Leitung", "PH Geschäftsführung", "System Manager"]);
		if (frm.doc.status === "Erfasst") {
			frm.add_custom_button(__("Sachlich prüfen"), () => {
				frappe.prompt([{ fieldname: "vermerk", fieldtype: "Small Text", label: __("Prüfvermerk (Menge/Preis gegen Bestellung)") }], (v) => frm.call({ method: "pruefen", doc: frm.doc, args: v }).then((r) => { if (r.message) frappe.msgprint(__("Abweichung: {0}", [r.message])); frm.reload_doc(); }), __("Sachliche Prüfung"), __("Geprüft"));
			}, __("Aktionen"));
		}
		if (["Erfasst", "Sachlich geprueft"].includes(frm.doc.status) && leitung) {
			frm.add_custom_button(__("Freigeben"), () => frm.call({ method: "freigeben", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (["Erfasst", "Sachlich geprueft", "Freigegeben"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Ablehnen"), () => frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }], (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ablehnen"), __("Ablehnen")), __("Aktionen"));
		}
		if (frm.doc.status === "Freigegeben") {
			frm.add_custom_button(__("Als bezahlt buchen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Zahlung an Lieferant"),
					fields: [
						{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: frm.doc.zahlbetrag_cent || frm.doc.brutto_cent, reqd: 1, description: frm.doc.skonto_cent ? __("Skonto {0} bis {1}", [ph_faktura.betrag(frm.doc.skonto_cent), frappe.datetime.str_to_user(frm.doc.skonto_bis)]) : "" },
						{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Ueberweisung", "Bar", "Karte extern"], default: "Ueberweisung", reqd: 1 },
						{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today(), reqd: 1 },
					],
					primary_action_label: __("Buchen"),
					primary_action: (v) => frm.call({ method: "als_bezahlt_buchen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }),
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Zurück an Erfassung"), () => frm.call({ method: "zurueck_an_erfassung", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		frm.add_custom_button(__("Zahllauf-Vorschlag"), () => frappe.set_route("query-report", "PH Zahllauf Vorschlag"));
		if (frm.doc.herstellerbestellung) frm.add_custom_button(__("Herstellerbestellung öffnen"), () => frappe.set_route("Form", "PH Herstellerbestellung", frm.doc.herstellerbestellung));
	},
	netto_cent: brutto, ust_cent: brutto, ust_fall: brutto,
});
function brutto(frm) {
	if (frm.doc.ust_fall !== "Vorsteuer AT" && frm.doc.ust_fall !== "Einfuhr Drittland") frm.set_value("ust_cent", 0);
	frm.set_value("brutto_cent", (frm.doc.netto_cent || 0) + (frm.doc.ust_cent || 0));
}
