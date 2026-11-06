frappe.ui.form.on("PH Mail Vorlage", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Vorschau"), () => {
			frm.call({ method: "vorschau", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				const d = new frappe.ui.Dialog({ title: frappe.utils.escape_html(m.betreff || ""), size: "large" });
				d.$body.html(`<iframe style="width:100%;height:70vh;border:0" sandbox srcdoc="${frappe.utils.escape_html(m.html || "")}"></iframe>`);
				d.show();
			});
		});
	},
});

// Lücken 04.11.: Testmail direkt aus der Vorlage (L14)
frappe.ui.form.on("PH Mail Vorlage", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Testmail senden"), () => {
			frappe.prompt([{ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("An (leer = Testadresse)") }], (v) => {
				frm.call({ method: "testmail", doc: frm.doc, args: v }).then((r) => frappe.show_alert({ message: __("Testmail an {0}", [r.message]), indicator: "green" }));
			}, __("Testmail"), __("Senden"));
		}, __("Aktionen"));
	},
});
