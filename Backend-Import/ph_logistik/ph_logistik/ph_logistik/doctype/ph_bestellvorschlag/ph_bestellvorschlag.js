// PH Bestellvorschlag – Buttons: Herstellerbestellung erstellen (Leitung), Verwerfen, Regel öffnen.
frappe.ui.form.on("PH Bestellvorschlag", {
	refresh(frm) {
		if (frm.is_new()) return;
		const farben = { Offen: "orange", Bestellt: "blue", Erledigt: "green", Verworfen: "gray" };
		frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.status === "Offen") {
			if (frappe.user.has_role(["PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"])) {
				frm.add_custom_button(__("Herstellerbestellung erstellen"), () => frm.call({ method: "herstellerbestellung_erstellen", doc: frm.doc, freeze: true }).then((r) => {
					const z = (r.message || {}).zugeordnet || [];
					if (z.length) frappe.set_route("Form", "PH Herstellerbestellung", z[0].herstellerbestellung);
					else { frappe.msgprint(__("Kein Lieferant gefunden – Lieferant am Vorschlag oder an der Marke eintragen.")); frm.reload_doc(); }
				}), __("Aktionen"));
			}
			frm.add_custom_button(__("Verwerfen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 }, (v) => frm.call({ method: "verwerfen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Vorschlag verwerfen")), __("Aktionen"));
		}
		if (frm.doc.meldebestand_regel) frm.add_custom_button(__("Regel öffnen"), () => frappe.set_route("Form", "PH Meldebestand", frm.doc.meldebestand_regel), __("Aktionen"));
	},
});
