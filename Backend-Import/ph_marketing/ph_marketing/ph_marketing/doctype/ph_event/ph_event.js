// PH Event – Buttons: Anmeldung erfassen, Erinnerung senden, Teilnehmerliste/Namensschilder drucken, Check-in, Als durchgeführt.
frappe.ui.form.on("PH Event", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Geplant: "gray", Offen: "green", Ausgebucht: "orange", Durchgefuehrt: "blue", Abgesagt: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		if (frm.doc.status === "Geplant" && !frm.doc.uhrzeit_von) frm.dashboard.set_headline_alert(__("Uhrzeit offen beim Inhaber – erst dann veröffentlichen (Website event.js startTime)."), "orange");
		if (frm.doc.kapazitaet) frm.dashboard.add_indicator(__("{0} von {1} Plätzen belegt", [frm.doc.plaetze_belegt || 0, frm.doc.kapazitaet]), frm.doc.plaetze_frei === 0 ? "orange" : "green");

		if (["Offen", "Ausgebucht", "Geplant"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Anmeldung erfassen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Anmeldung (Telefon/Showroom)"),
					fields: [
						{ fieldname: "name_person", fieldtype: "Data", label: __("Name"), reqd: 1 },
						{ fieldname: "email", fieldtype: "Data", label: __("E-Mail"), options: "Email", reqd: 1 },
						{ fieldname: "telefon", fieldtype: "Data", label: __("Telefon") },
						{ fieldname: "personen", fieldtype: "Int", label: __("Personen"), default: 1, reqd: 1 },
						{ fieldname: "quelle", fieldtype: "Select", label: __("Quelle"), options: ["telefon", "showroom", "email", "backoffice"], default: "telefon" },
						{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht") },
					],
					primary_action_label: __("Anmelden"),
					primary_action(v) {
						frm.call({ method: "anmeldung_hinzufuegen", doc: frm.doc, args: v, freeze: true }).then((r) => {
							d.hide();
							const m = r.message || {};
							frappe.show_alert({ message: m.status === "warteliste" ? __("Auf Warteliste gesetzt") : __("Angemeldet"), indicator: "green" });
							frm.reload_doc();
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (["Offen", "Ausgebucht"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Erinnerung senden"), () => {
				frappe.confirm(__("Erinnerung an alle angemeldeten Teilnehmer ohne Erinnerung senden?"), () => {
					frm.call({ method: "erinnerung_senden", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("{0} Erinnerungen", [r.message]), indicator: "green" }); frm.reload_doc(); });
				});
			}, __("Aktionen"));
			frm.add_custom_button(__("Als durchgeführt schließen"), () => frm.call({ method: "als_durchgefuehrt", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		frm.add_custom_button(__("Teilnehmerliste"), () => frappe.set_route("print", frm.doctype, frm.doc.name, { format: "PH Event Teilnehmerliste" }), __("Drucken"));
		frm.add_custom_button(__("Namensschilder"), () => frappe.set_route("print", frm.doctype, frm.doc.name, { format: "PH Event Namensschilder" }), __("Drucken"));
		if (frm.doc.einladungs_reise) frm.add_custom_button(__("Einladungs-Reise"), () => frappe.set_route("Form", "PH Kundenreise", frm.doc.einladungs_reise));
	},
});

// Check-in direkt in der Kindtabelle (Status-Änderung speichert über Dokument-Methode)
frappe.ui.form.on("PH Event Anmeldung", {
	status(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!frm.is_new() && !row.__islocal && ["erschienen", "nicht erschienen"].includes(row.status)) {
			frm.call({ method: "teilnehmer_status", doc: frm.doc, args: { zeile: row.name, status: row.status } }).then(() => frm.reload_doc());
		}
	},
});
