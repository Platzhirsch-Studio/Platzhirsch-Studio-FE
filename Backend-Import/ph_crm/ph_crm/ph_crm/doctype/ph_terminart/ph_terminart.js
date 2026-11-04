// PH Terminart – Vorschau der freien Zeiten und Website-Antwort.
frappe.ui.form.on("PH Terminart", {
	refresh(frm) {
		frm.page.clear_indicator();
		frm.page.set_indicator(frm.doc.aktiv ? __("Aktiv") : __("Inaktiv"), frm.doc.aktiv ? "green" : "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Freie Zeiten (7 Tage)"), () => {
			const von = frappe.datetime.get_today();
			const bis = frappe.datetime.add_days(von, 7);
			frappe.call({
				method: "ph_crm.api.get_freie_slots",
				args: { terminart: frm.doc.key, modus: frm.doc.modus ? null : (frm.doc.modi_erlaubt || "").split(",")[0], von, bis, zeitzone: "Europe/Vienna" },
				freeze: true,
			}).then((r) => {
				const slots = Array.isArray(r.message) ? r.message : [];
				const zeilen = slots.map((s) => `<tr><td>${frappe.datetime.str_to_user(frappe.datetime.convert_to_user_tz(s.start.replace("T", " ").slice(0, 19)))}</td><td>${(s.berater || []).map(frappe.utils.escape_html).join(", ") || "–"}</td></tr>`).join("");
				frappe.msgprint({ title: __("Freie Zeiten {0} – {1}", [frappe.datetime.str_to_user(von), frappe.datetime.str_to_user(bis)]), message: slots.length ? `<table class="table table-bordered table-sm"><thead><tr><th>${__("Beginn")}</th><th>${__("Berater")}</th></tr></thead><tbody>${zeilen}</tbody></table>` : __("Keine freien Zeiten – Verfügbarkeiten der Berater prüfen."), wide: true });
			});
		}, __("Prüfen"));

		frm.add_custom_button(__("Website-Antwort anzeigen"), () => {
			frappe.call({ method: "ph_crm.api.get_terminarten", args: { sprache: "de" } }).then((r) => {
				const eintrag = (r.message || []).find((t) => t.key === frm.doc.key);
				frappe.msgprint({ title: __("get_terminarten"), message: `<pre>${frappe.utils.escape_html(JSON.stringify(eintrag || {}, null, 2))}</pre>`, wide: true });
			});
		}, __("Prüfen"));

		frm.add_custom_button(__("Verfügbarkeiten"), () => frappe.set_route("List", "PH Verfuegbarkeit"), __("Prüfen"));
	},
});
