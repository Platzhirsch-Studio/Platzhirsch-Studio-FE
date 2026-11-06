// PH Projekte Einstellungen – Kalkulation: Projektarten aus PH Projekt lesen, Hinweis „Kalkulation einrichten“, Protokoll.
frappe.ui.form.on("PH Projekte Einstellungen", {
	onload(frm) {
		frappe.model.with_doctype("PH Projekt", () => {
			const df = frappe.meta.get_docfield("PH Projekt", "projektart");
			const arten = ["Alle"].concat(((df && df.options) || "").split("\n").filter(Boolean));
			["ziel_db", "gemeinkosten_regeln"].forEach((t) => frm.fields_dict[t] && frm.fields_dict[t].grid.update_docfield_property("projektart", "options", arten));
		});
	},
	refresh(frm) {
		const w = frm.fields_dict.kalkulation_hinweis && frm.fields_dict.kalkulation_hinweis.$wrapper;
		if (w) {
			w.html(frm.doc.kalkulation_eingerichtet
				? `<p class="text-muted small">${__("Kalkulation eingerichtet. Jede Änderung wird im PH Kalkulation Protokoll festgehalten.")}</p>`
				: `<div class="alert alert-warning small">${__("Kalkulation einrichten: Kostensätze je Tätigkeit (€/h als Cent, gültig ab) und Ziel-DB je Projektart eintragen. Bis dahin werden Zeiten mit 0 € bewertet und es gibt keine DB-Ampel.")}</div>`);
		}
		frm.add_custom_button(__("Kalkulation: Protokoll"), () => frappe.set_route("List", "PH Kalkulation Protokoll", { bereich: "Einstellungen" }));
		frm.add_custom_button(__("Kostenarten"), () => frappe.set_route("List", "PH Kostenart"));
	},
});
