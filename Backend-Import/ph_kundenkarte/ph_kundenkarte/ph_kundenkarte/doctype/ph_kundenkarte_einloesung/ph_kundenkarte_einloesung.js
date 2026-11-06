frappe.ui.form.on("PH Kundenkarte Einloesung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), frm.doc.status === "Eingeloest" ? "green" : "red");
		if (frm.is_new()) {
			frm.set_query("bezug_doctype", () => ({ filters: { name: ["in", ["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event"]] } }));
			return;
		}
		if (frm.doc.status === "Eingeloest") {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Data", label: __("Stornogrund"), reqd: 1 }], (v) => frm.call({ method: "stornieren", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()), __("Einlösung stornieren"));
			}, __("Aktionen"));
		}
	},
});
