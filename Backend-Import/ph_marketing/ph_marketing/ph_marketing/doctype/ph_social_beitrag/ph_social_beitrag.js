// PH Social Beitrag – Buttons: Bild-Freigabe prüfen (PH Marke), Freigeben (Leitung), Als veröffentlicht, Kennzahlen.
frappe.ui.form.on("PH Social Beitrag", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Idee: "gray", Entwurf: "blue", Freigegeben: "cyan", Geplant: "purple", Veroeffentlicht: "green", Verworfen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		if (frm.doc.bildquelle_freigabe === "offen") frm.dashboard.set_headline_alert(__("Bildquelle offen: keine Freigabe möglich (Claim-Guard). Nur eigene Fotos oder schriftlich freigegebene Herstellerbilder."), "orange");
		if (frm.doc.bildfreigabe_status) frm.dashboard.add_indicator(__("PH Marke: {0}", [frappe.utils.escape_html(frm.doc.bildfreigabe_status)]), frm.doc.bildfreigabe_status === "schriftlich erteilt" ? "green" : "orange");

		frm.add_custom_button(__("Bild-Freigabe prüfen"), () => {
			frm.call({ method: "bild_freigabe_pruefen", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				frappe.show_alert({ message: __("Bildfreigabe: {0}", [frappe.utils.escape_html(m.status)]), indicator: m.ok ? "green" : "orange" });
				frm.reload_doc();
			});
		}, __("Aktionen"));
		if (["Idee", "Entwurf"].includes(frm.doc.status) && frappe.user.has_role("PH Marketing Leitung")) {
			frm.add_custom_button(__("Freigeben"), () => {
				frm.call({ method: "freigeben", doc: frm.doc }).then(() => { frappe.show_alert({ message: __("Freigegeben"), indicator: "green" }); frm.reload_doc(); });
			}, __("Aktionen"));
		}
		if (["Freigegeben", "Geplant"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Als veröffentlicht markieren"), () => {
				frappe.prompt({ fieldname: "url", fieldtype: "Data", label: __("URL des Beitrags"), options: "URL" }, (v) => frm.call({ method: "als_veroeffentlicht", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Veröffentlicht"));
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Veroeffentlicht") {
			frm.add_custom_button(__("Kennzahlen erfassen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Kennzahlen"),
					fields: ["reichweite", "likes", "saves", "klicks", "kommentare"].map((f) => ({ fieldname: f, fieldtype: "Int", label: __(frappe.meta.get_label(frm.doctype, f)), default: frm.doc[f] || 0 })),
					primary_action_label: __("Speichern"),
					primary_action(v) { frm.call({ method: "kennzahlen_erfassen", doc: frm.doc, args: v }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.bildfreigabe_referenz && frm.doc.bildfreigabe_doctype) frm.add_custom_button(__("Marke öffnen"), () => frappe.set_route("Form", frm.doc.bildfreigabe_doctype, frm.doc.bildfreigabe_referenz));
	},
	bildquelle_freigabe(frm) {
		if (frm.doc.bildquelle_freigabe === "eigen") frm.set_value("bild_credit", frm.doc.bild_credit || "Platzhirsch Home Living");
	},
});
