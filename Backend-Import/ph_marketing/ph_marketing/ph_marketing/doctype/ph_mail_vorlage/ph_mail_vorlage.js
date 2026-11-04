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
