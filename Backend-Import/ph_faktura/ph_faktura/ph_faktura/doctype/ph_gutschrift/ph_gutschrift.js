frappe.ui.form.on("PH Gutschrift", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		ph_faktura.summenblock(frm);
		if (frm.is_new()) return;
		frm.page.clear_primary_action();
		if (frm.doc.docstatus === 0) {
			frm.page.set_primary_action(__("Gutschrift stellen"), () => {
				frappe.confirm(__("Gutschrift stellen? Danach wird die fortlaufende Nummer vergeben.") + (frm.doc.art === "Storno" ? " " + __("Die Rechnung {0} gilt dann als storniert.", [frm.doc.rechnung]) : ""), () => {
					frm.call({ method: "stellen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Gutschrift", r.message));
				});
			});
		}
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("Als PDF senden"), () => ph_faktura.senden_dialog(frm), __("Aktionen"));
			if (frm.doc.erstattung_art === "Rückzahlung" && Number(frm.doc.erstattet_cent) < Number(frm.doc.brutto_cent)) {
				frm.add_custom_button(__("Erstatten"), () => {
					const d = new frappe.ui.Dialog({
						title: __("Rückzahlung buchen"),
						fields: [
							{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: frm.doc.brutto_cent - (frm.doc.erstattet_cent || 0), reqd: 1 },
							{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Ueberweisung", "Bar", "Stripe Link", "Karte extern"], default: "Ueberweisung", reqd: 1 },
							{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today() },
						],
						primary_action_label: __("Buchen"),
						primary_action: (v) => frm.call({ method: "erstatten", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }),
					});
					d.show();
				}, __("Aktionen"));
			}
		}
		frm.add_custom_button(__("Rechnung öffnen"), () => frappe.set_route("Form", "PH Rechnung", frm.doc.rechnung));
	},
});
