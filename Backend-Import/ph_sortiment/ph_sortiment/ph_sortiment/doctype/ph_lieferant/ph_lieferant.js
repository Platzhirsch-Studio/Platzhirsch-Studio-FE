frappe.ui.form.on("PH Lieferant", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Neue Bestellung"), () => frappe.new_doc("PH Herstellerbestellung", { lieferant: frm.doc.name, marke: frm.doc.marke }), __("Aktionen"));
		frm.add_custom_button(__("Offene Bestellungen"), () => frappe.set_route("List", "PH Herstellerbestellung", { lieferant: frm.doc.name, status: ["in", ["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"]] }), __("Ansehen"));
		frm.add_custom_button(__("Liefertermintreue"), () => frappe.set_route("query-report", "PH Liefertermintreue je Lieferant", { lieferant: frm.doc.name }), __("Ansehen"));
		frm.call({ method: "offene_bestellungen", doc: frm.doc }).then((r) => {
			const n = (r.message || []).length;
			frm.dashboard.add_indicator(__("{0} offene Bestellungen", [n]), n ? "blue" : "gray");
			const offen = (r.message || []).filter((b) => b.abweichungen_offen).length;
			if (offen) frm.dashboard.add_indicator(__("{0} mit offenen AB-Abweichungen", [offen]), "orange");
		});
	},
});
