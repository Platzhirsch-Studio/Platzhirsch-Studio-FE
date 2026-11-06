// PH Segment – Vorschau-Knopf (Konventionen §8)
frappe.ui.form.on("PH Segment", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Vorschau berechnen"), () => {
			frm.call({ method: "vorschau", doc: frm.doc, args: { speichern: 1 } }).then((r) => {
				const d = r.message || {};
				const zeilen = (d.beispiele || []).map((b) => frappe.utils.escape_html(b.email)).join("<br>");
				frappe.msgprint({
					title: __("Vorschau"),
					message: __("{0} Treffer, {1} zulässige Empfänger.", [d.treffer, d.empfaenger]) + "<br><br>" + zeilen,
				});
				frm.reload_doc();
			});
		}, __("Aktionen"));
	},
});
