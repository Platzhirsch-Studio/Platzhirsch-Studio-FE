frappe.ui.form.on("PH Ersatzteil", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.bestand_fuehren) {
			frm.add_custom_button(__("Bewegung buchen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Bestandsbewegung"),
					fields: [
						{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Zugang", "Verbrauch", "Retoure", "Korrektur", "Inventur"], default: "Zugang", reqd: 1 },
						{ fieldname: "menge", fieldtype: "Int", label: __("Menge (Inventur: Zählwert)"), default: 1, reqd: 1 },
						{ fieldname: "hinweis", fieldtype: "Data", label: __("Hinweis") },
					],
					primary_action_label: __("Buchen"),
					primary_action(v) {
						frm.call({ method: "bewegung_buchen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
			if (frm.doc.mindestbestand > 0 && frm.doc.verfuegbar < frm.doc.mindestbestand) frm.dashboard.set_headline_alert(__("Verfügbar {0} unter Mindestbestand {1}.", [frm.doc.verfuegbar, frm.doc.mindestbestand]), "orange");
		}
		frm.add_custom_button(__("Beim Hersteller bestellen"), () => {
			frappe.new_doc("PH Ersatzteilbestellung", { lieferant: frm.doc.lieferant, marke: frm.doc.marke }, (doc) => {
				const z = frappe.model.add_child(doc, "positionen");
				z.ersatzteil = frm.doc.name; z.bezeichnung = frm.doc.bezeichnung; z.hersteller_nr = frm.doc.hersteller_nr; z.menge = Math.max(1, (frm.doc.mindestbestand || 1) - (frm.doc.verfuegbar || 0));
			});
		}, __("Aktionen"));
	},
});
