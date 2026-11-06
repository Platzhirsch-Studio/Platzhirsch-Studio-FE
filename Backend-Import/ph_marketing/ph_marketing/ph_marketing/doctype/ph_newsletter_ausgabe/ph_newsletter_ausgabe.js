// PH Newsletter Ausgabe – Buttons: Vorschau, Testmail, Jetzt versenden (Leitung), Abbrechen, Protokoll.
frappe.ui.form.on("PH Newsletter Ausgabe", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Freigabe: "orange", Geplant: "blue", "Wird versendet": "purple", Versendet: "green", Abgebrochen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		if (!frm.doc.versandbereit) frm.dashboard.set_headline_alert(__("Nicht versandbereit. Offene Slots: {0}", [frappe.utils.escape_html(frm.doc.offene_slots || "–")]), "orange");
		else if (["Entwurf", "Freigabe"].includes(frm.doc.status)) frm.dashboard.set_headline_alert(__("Versandbereit – Workflow: Zur Freigabe → Freigeben → Planen."), "blue");

		frm.add_custom_button(__("Vorschau"), () => {
			frm.call({ method: "vorschau", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				const d = new frappe.ui.Dialog({ title: `${frappe.utils.escape_html(m.betreff || "")} · ${__("{0} Empfänger", [m.empfaenger])}`, size: "large" });
				d.$body.html(`<iframe style="width:100%;height:70vh;border:0" sandbox srcdoc="${frappe.utils.escape_html(m.html || "")}"></iframe>`);
				d.show();
				frm.set_df_property("html_vorschau", "options", m.html || "");
			});
		}, __("Aktionen"));
		if (!["Versendet", "Abgebrochen"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Testmail"), () => {
				frappe.prompt({ fieldname: "empfaenger", fieldtype: "Data", label: __("Empfänger (leer = Testadresse)"), options: "Email" }, (v) => {
					frm.call({ method: "testmail", doc: frm.doc, args: v, freeze: true }).then((r) => frappe.show_alert({ message: __("Testmail an {0}", [r.message]), indicator: "green" }));
				}, __("Testmail senden"));
			}, __("Aktionen"));
		}
		if (["Geplant", "Wird versendet"].includes(frm.doc.status) && frappe.user.has_role("PH Marketing Leitung")) {
			frm.add_custom_button(__("Jetzt versenden"), () => {
				frappe.confirm(__("Versand an {0} Empfänger jetzt starten? Im Testmodus gehen alle Mails an die Testadresse.", [frm.doc.empfaenger_anzahl || "?"]), () => {
					frm.call({ method: "jetzt_versenden", doc: frm.doc, freeze: true, freeze_message: __("Versand läuft …") }).then((r) => {
						frappe.show_alert({ message: __("{0} Mails gesendet", [r.message]), indicator: "green" });
						frm.reload_doc();
					});
				});
			}, __("Aktionen"));
		}
		if (!["Versendet", "Abgebrochen"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Abbrechen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund") }, (v) => frm.call({ method: "abbrechen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ausgabe abbrechen"));
			}, __("Aktionen"));
		}
		if (frm.doc.gesendet || frm.doc.fehler) frm.add_custom_button(__("Versandprotokoll"), () => frappe.set_route("List", "PH Newsletter Versand", { ausgabe: frm.doc.name }));
	},
});

// Lücken 04.11.: Empfängerliste (L2) und Zustellstatistik
frappe.ui.form.on("PH Newsletter Ausgabe", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Empfänger anzeigen"), () => frm.call({ method: "empfaenger_liste", doc: frm.doc, args: { limit: 200 } }).then((r) => {
			const m = r.message || {};
			frappe.msgprint({ title: __("{0} Empfänger", [m.gesamt]), message: (m.zeilen || []).map((z) => frappe.utils.escape_html(z.email)).join("<br>") });
		}), __("Aktionen"));
		if (["Wird versendet", "Versendet"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Zustellung"), () => frm.call({ method: "zustellung", doc: frm.doc }).then((r) => {
				const z = r.message || {};
				frappe.msgprint({ title: __("Zustellung"), message: Object.keys(z).map((k) => `${frappe.utils.escape_html(k)}: ${z[k]}`).join("<br>") });
			}), __("Aktionen"));
		}
	},
});
