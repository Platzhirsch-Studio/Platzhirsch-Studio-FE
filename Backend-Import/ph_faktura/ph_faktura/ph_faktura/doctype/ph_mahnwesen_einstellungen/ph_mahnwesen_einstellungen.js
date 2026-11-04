frappe.ui.form.on("PH Mahnwesen Einstellungen", {
	refresh(frm) {
		const lauf = (nur_vorschlag) => frappe.call({ method: "ph_faktura.ph_faktura.doctype.ph_mahnwesen_einstellungen.ph_mahnwesen_einstellungen.mahnlauf_starten", args: { nur_vorschlag }, freeze: true }).then((r) => {
			const rows = r.message || [];
			frappe.msgprint({ title: nur_vorschlag ? __("Mahnvorschlag") : __("Mahnlauf"), message: rows.length ? "<ul>" + rows.map((x) => `<li>${x.rechnung}: ${__("Stufe")} ${x.stufe}, ${ph_faktura.betrag(x.offen_cent)}${x.mahnung ? " → " + x.mahnung : ""}</li>`).join("") + "</ul>" : __("Nichts zu mahnen.") });
		});
		frm.add_custom_button(__("Mahnlauf – Vorschlag"), () => lauf(1), __("Aktionen"));
		frm.add_custom_button(__("Mahnlauf starten"), () => frappe.confirm(__("Mahnlauf jetzt ausführen? Es werden Mahnungen angelegt (Entwurf oder Versand laut Einstellung)."), () => lauf(0)), __("Aktionen"));
	},
});
