// PH Projekt Nachkalkulation – Buttons: Neu berechnen (Entwurf), Abschließen, Lernwerte übernehmen, Projekt öffnen.
frappe.ui.form.on("PH Projekt Nachkalkulation", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.status === "Entwurf") {
			frm.add_custom_button(__("Neu berechnen"), () => frm.call({ method: "neu_berechnen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
			frm.add_custom_button(__("Abschließen"), () => frappe.confirm(__("Nachkalkulation einfrieren? Danach ist nur noch das Fazit änderbar."), () => frm.save().then(() => frm.call({ method: "abschliessen", doc: frm.doc }).then(() => frm.reload_doc()))), __("Aktionen"));
			const fehlt = (frm.doc.kostenarten || []).filter((z) => z.kommentar_pflicht && !(z.kommentar || "").trim()).map((z) => frappe.utils.escape_html(z.kostenart));
			if (fehlt.length) frm.dashboard.set_headline(__("Kommentar fehlt (Abweichung über {0} %): {1}", [frm.doc.schwelle_prozent, fehlt.join(", ")]), "orange");
		}
		if ((frm.doc.lernwerte || []).length && !frm.doc.richtwerte_uebernommen) {
			frm.add_custom_button(__("Lernwerte in Montage-Richtwerte übernehmen"), () => frm.save().then(() => frm.call({ method: "richtwerte_uebernehmen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		frm.add_custom_button(__("Projekt öffnen"), () => frappe.set_route("Form", "PH Projekt", frm.doc.projekt));
		frm.set_df_property("kostenarten", "cannot_add_rows", 1);
		frm.set_df_property("lernwerte", "cannot_add_rows", 1);
	},
});
