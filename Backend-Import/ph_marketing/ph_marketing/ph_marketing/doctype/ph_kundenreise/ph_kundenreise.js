// PH Kundenreise – Buttons: Regeln prüfen, Aktivieren/Pausieren (Leitung), Testmail, Vorschau, Fällige heute planen.
frappe.ui.form.on("PH Kundenreise", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Aktiv: "green", Pausiert: "orange" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.call({ method: "pruefen", doc: frm.doc }).then((r) => {
			const f = r.message || [];
			if (f.length) frm.dashboard.set_headline_alert(__("Regelfehler: {0}", [f.map(frappe.utils.escape_html).join(" · ")]), "red");
			else if (!frm.doc.aktiv) frm.dashboard.set_headline_alert(__("Regeln erfüllt – Aktivierung durch die Leitung möglich."), "blue");
		});

		if (!frm.doc.aktiv && frappe.user.has_role("PH Marketing Leitung")) {
			frm.add_custom_button(__("Aktivieren"), () => {
				frappe.confirm(__("Kundenreise aktivieren? Mails gehen erst, wenn „Kundenreisen aktiv“ in den Einstellungen gesetzt ist."), () => {
					frm.call({ method: "aktivieren", doc: frm.doc }).then(() => frm.reload_doc());
				});
			}, __("Aktionen"));
		}
		if (frm.doc.aktiv) {
			frm.add_custom_button(__("Pausieren"), () => frm.call({ method: "pausieren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		frm.add_custom_button(__("Testmail"), () => {
			frappe.prompt({ fieldname: "empfaenger", fieldtype: "Data", label: __("Empfänger (leer = Testadresse)"), options: "Email" }, (v) => {
				frm.call({ method: "testmail", doc: frm.doc, args: v, freeze: true }).then((r) => frappe.show_alert({ message: __("Testmail an {0}", [r.message]), indicator: "green" }));
			}, __("Testmail senden"));
		}, __("Aktionen"));
		frm.add_custom_button(__("Vorschau"), () => {
			frm.call({ method: "vorschau", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				const d = new frappe.ui.Dialog({ title: `${__("Vorschau")} · ${frappe.utils.escape_html(m.betreff || "")} (${m.grundlage})`, size: "large" });
				d.$body.html(`<iframe style="width:100%;height:70vh;border:0" sandbox srcdoc="${frappe.utils.escape_html(m.html || "")}"></iframe>`);
				d.show();
			});
		}, __("Aktionen"));
		if (frappe.user.has_role("PH Marketing Leitung")) {
			frm.add_custom_button(__("Fällige heute planen"), () => {
				frm.call({ method: "heute_planen", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("{0} Versand-Einträge geplant", [r.message]), indicator: "blue" }));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Protokoll"), () => frappe.set_route("List", "PH Reise Versand", { reise: frm.doc.name }));
	},
});
