frappe.ui.form.on("PH Lagerbewegung", {
	refresh(frm) {
		frm.page.clear_indicator();
		frm.page.set_indicator(__(frm.doc.status || "Gebucht"), frm.doc.status === "Storniert" ? "gray" : "green");
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Die Bewegung wird beim Speichern sofort auf den Bestand gebucht."), "blue");
			return;
		}
		if (frm.doc.status === "Gebucht" && !frm.doc.storno_von && frappe.user.has_role(["PH Logistik Leitung", "System Manager"])) {
			frm.add_custom_button(__("Stornieren (Gegenbuchung)"), () => frappe.confirm(__("Gegenbuchung erzeugen?"), () => frm.call({ method: "stornieren", doc: frm.doc }).then((r) => r.message && frappe.set_route("Form", "PH Lagerbewegung", r.message))), __("Aktionen"));
		}
	},
	art(frm) {
		const z = ["Wareneingang", "Retoure", "Inventur"].includes(frm.doc.art);
		const a = ["Verkauf", "Ausbuchung", "Reservierung", "Freigabe"].includes(frm.doc.art);
		frm.set_df_property("lagerort_nach", "reqd", z || frm.doc.art === "Umlagerung");
		frm.set_df_property("lagerort_von", "reqd", a || frm.doc.art === "Umlagerung");
	},
});
