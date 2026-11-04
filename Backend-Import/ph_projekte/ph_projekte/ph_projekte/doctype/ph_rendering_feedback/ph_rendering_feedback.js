// PH Rendering Feedback – Antworten, Erledigt, Audio-Player, Pin-Anzeige.
frappe.ui.form.on("PH Rendering Feedback", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", Beantwortet: "blue", Erledigt: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status !== "Erledigt") {
			frm.add_custom_button(__("Antworten"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Antwort an den Kunden"),
					fields: [{ fieldname: "text", fieldtype: "Small Text", label: __("Text"), reqd: 1 }],
					primary_action_label: __("Senden"),
					primary_action(values) {
						frm.call({ method: "antworten", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Erledigt"), () => frm.call({ method: "erledigt", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.rendering) frm.add_custom_button(__("Rendering öffnen"), () => frappe.set_route("Form", "PH Rendering", frm.doc.rendering));
		if (frm.doc.art === "sprachnachricht" && frm.doc.audio) {
			frm.dashboard.add_section(`<audio controls src="${frappe.utils.escape_html(frm.doc.audio)}" style="width:100%"></audio>`, __("Sprachnotiz"));
		}
		if (frm.doc.art === "freigabe") frm.dashboard.set_headline_alert(__("Kunde hat diese Variante freigegeben – bitte Angebot erstellen."), "green");
	},
});
