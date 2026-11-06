// PH Urlaubsanspruch – Stand aktualisieren, Ersatzleistung abgerechnet (Leitung).
frappe.ui.form.on("PH Urlaubsanspruch", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Stand aktualisieren"), () => frm.call({ method: "stand_aktualisieren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frappe.user.has_role("PH Personal Leitung") && frm.doc.status !== "Abgegolten") {
			frm.add_custom_button(__("Ersatzleistung abgerechnet"), () => {
				frappe.confirm(__("Resturlaub dieses Urlaubsjahres als abgegolten markieren (§ 10 UrlG)?"), () => frm.call({ method: "als_abgegolten_markieren", doc: frm.doc }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
		}
		if (frm.doc.verjaehrt_am) frm.dashboard.set_headline(__("Verjährt am {0} (§ 4 Abs 5 UrlG – kein Verfall zum Jahresende).", [frappe.datetime.str_to_user(frm.doc.verjaehrt_am)]));
	},
});
