// PH Sendung – Buttons: Buchen (Etikett), Tracking aktualisieren, Etikett drucken, Stornieren, Retourenlabel, Problem melden, manuell zugestellt.
const SND_FARBEN = { Angelegt: "blue", Etikett: "cyan", Unterwegs: "orange", Zugestellt: "green", Problem: "red", Storniert: "gray" };

frappe.ui.form.on("PH Sendung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), SND_FARBEN[frm.doc.status] || "gray");
		if (frm.doc.env === "mock") frm.dashboard.set_headline_alert(__("MOCK – Testmodus, keine echte Buchung bei LetMeShip."), "orange");
		if (frm.is_new()) return;
		const st = frm.doc.status;
		if (["Angelegt", "Problem"].includes(st) && frm.doc.dienstleister === "LetMeShip" && !frm.doc.shipment_id) {
			frm.add_custom_button(__("Buchen und Etikett abrufen"), () => frm.call({ method: "buchen", doc: frm.doc, freeze: true, freeze_message: __("Buchung läuft …") }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.shipment_id && !["Zugestellt", "Storniert"].includes(st)) {
			frm.add_custom_button(__("Tracking aktualisieren"), () => frm.call({ method: "tracking_aktualisieren", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("Status: {0}", [__(r.message)]), indicator: SND_FARBEN[r.message] || "blue" }); frm.reload_doc(); }), __("Aktionen"));
		}
		if (frm.doc.etikett) {
			frm.add_custom_button(__("Etikett drucken"), () => window.open(frm.doc.etikett, "_blank"), __("Aktionen"));
		}
		if (frm.doc.tracking_url) {
			frm.add_custom_button(__("Sendung verfolgen"), () => window.open(frm.doc.tracking_url, "_blank"), __("Aktionen"));
		}
		if (frm.doc.richtung === "Ausgang" && ["Etikett", "Unterwegs", "Zugestellt"].includes(st)) {
			frm.add_custom_button(__("Retourenlabel erzeugen"), () => frappe.confirm(__("Retourenlabel mit getauschten Adressen buchen?"), () => frm.call({ method: "retourenlabel", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Sendung", r.message))), __("Aktionen"));
		}
		if (!["Zugestellt", "Storniert"].includes(st)) {
			frm.add_custom_button(__("Problem melden"), () => frappe.prompt({ fieldname: "text", fieldtype: "Small Text", label: __("Was ist passiert?"), reqd: 1 }, (v) => frm.call({ method: "problem_melden", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Problem")), __("Aktionen"));
			frm.add_custom_button(__("Manuell als zugestellt"), () => frappe.confirm(__("Sendung als zugestellt buchen?"), () => frm.call({ method: "manuell_zugestellt", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
			frm.add_custom_button(__("Stornieren"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund") }, (v) => frappe.confirm(__("Sendung beim Dienstleister stornieren?"), () => frm.call({ method: "stornieren", doc: frm.doc, args: v }).then(() => frm.reload_doc())), __("Storno")), __("Aktionen"));
		}
		if (frm.doc.preis_brutto_cent != null && frm.doc.berechnet_cent != null) {
			const diff = frm.doc.berechnet_cent - frm.doc.preis_brutto_cent;
			frm.dashboard.add_indicator(__("Kosten {0} € / berechnet {1} €", [(frm.doc.preis_brutto_cent / 100).toFixed(2), (frm.doc.berechnet_cent / 100).toFixed(2)]), diff >= 0 ? "green" : "red");
		}
	},
});
