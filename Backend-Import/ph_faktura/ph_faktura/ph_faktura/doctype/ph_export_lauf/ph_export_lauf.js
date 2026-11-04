frappe.ui.form.on("PH Export Lauf", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new()) return;
		if (["Entwurf", "Erzeugt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Erzeugen"), () => {
				frm.call({ method: "erzeugen", doc: frm.doc, freeze: true, freeze_message: __("Export wird erzeugt …") }).then((r) => { frappe.show_alert({ message: __("{0} Belege exportiert", [(r.message || {}).anzahl]), indicator: "green" }); frm.reload_doc(); });
			}, __("Aktionen"));
		}
		if (frm.doc.datei) {
			frm.add_custom_button(__("Herunterladen"), () => window.open(frm.doc.datei), __("Aktionen"));
			frm.add_custom_button(__("Übergabeprotokoll (PDF)"), () => window.open(`/printview?doctype=PH%20Export%20Lauf&name=${encodeURIComponent(frm.doc.name)}&format=PH%20Export%20Uebergabeprotokoll&no_letterhead=1`), __("Aktionen"));
		}
		if (frm.doc.status === "Erzeugt") {
			frm.add_custom_button(__("Als übergeben markieren"), () => frappe.prompt([{ fieldname: "an", fieldtype: "Data", label: __("Übergeben an"), default: frm.doc.uebergeben_an }], (v) => frm.call({ method: "als_uebergeben", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Übergabe"), __("Markieren")), __("Aktionen"));
			frm.add_custom_button(__("Verwerfen (Belege freigeben)"), () => frappe.confirm(__("Export verwerfen? Die Belege werden wieder als „offen“ markiert."), () => frm.call({ method: "verwerfen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.status === "Uebergeben") frm.add_custom_button(__("Von Kanzlei bestätigt"), () => frm.call({ method: "bestaetigen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
	},
});
