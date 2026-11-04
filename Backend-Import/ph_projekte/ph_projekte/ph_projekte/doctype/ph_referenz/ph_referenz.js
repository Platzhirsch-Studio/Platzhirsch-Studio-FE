// PH Referenz – Veröffentlichen (Leitung), Ablehnen, Zurückziehen, Widerruf erfassen; Bildvorschau.
frappe.ui.form.on("PH Referenz", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Eingereicht: "orange", Veroeffentlicht: "green", Abgelehnt: "gray", Widerrufen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const leitung = frappe.user.has_role("PH Projekte Leitung") || frappe.user.has_role("System Manager");
		if (frm.doc.status === "Eingereicht") {
			if (leitung) frm.add_custom_button(__("Veröffentlichen"), () => frappe.confirm(__("Referenz auf platzhirsch.studio/projekte veröffentlichen? Pflichtfelder werden geprüft."), () => frm.call({ method: "veroeffentlichen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
			frm.add_custom_button(__("Ablehnen"), () => ph_referenz_notiz(frm, "ablehnen", __("Ablehnen (Notiz an die Bauherren)")), __("Aktionen"));
		}
		if (frm.doc.status === "Veroeffentlicht") frm.add_custom_button(__("Zurückziehen"), () => ph_referenz_notiz(frm, "zurueckziehen", __("Zurückziehen (Notiz)")), __("Aktionen"));
		if (["Eingereicht", "Veroeffentlicht"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Widerruf erfassen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Widerruf des Kunden erfassen"),
					fields: [{ fieldname: "kanal", fieldtype: "Select", options: ["E-Mail", "Telefon", "Persönlich", "Brief"], default: "E-Mail", label: __("Kanal"), reqd: 1 }],
					primary_action_label: __("Widerrufen (Bilder werden gelöscht)"),
					primary_action(values) {
						frappe.confirm(__("Widerruf ist endgültig; die Bildkopien der Referenz werden gelöscht. Fortfahren?"), () => {
							frm.call({ method: "widerruf_erfassen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.slug && frm.doc.status === "Veroeffentlicht") frm.add_custom_button(__("Öffentliche Seite"), () => window.open(`https://platzhirsch.studio/de/projekte/${encodeURIComponent(frm.doc.slug)}`));
		if (frm.doc.beispiel) frm.dashboard.set_headline_alert(__("Beispiel-/Demo-Freigabe – darf nie veröffentlicht werden."), "red");
		ph_referenz_galerie(frm);
	},
});

function ph_referenz_notiz(frm, methode, titel) {
	const d = new frappe.ui.Dialog({
		title: titel,
		fields: [{ fieldname: "notiz", fieldtype: "Small Text", label: __("Notiz") }],
		primary_action_label: __("Bestätigen"),
		primary_action(values) {
			frm.call({ method: methode, doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
		},
	});
	d.show();
}

function ph_referenz_galerie(frm) {
	const bilder = (frm.doc.bilder || []).filter((b) => b.datei);
	if (!bilder.length) return;
	frm.dashboard.add_section(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">${bilder.map((b) => `<figure style="margin:0"><img src="${frappe.utils.escape_html(b.datei)}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px" alt=""><figcaption style="font-size:11px;color:#6b7280">${frappe.utils.escape_html(b.phase || "")} · ${frappe.utils.escape_html(b.alt || b.titel || "")}</figcaption></figure>`).join("")}</div>`, __("Bilder (Kopien)"));
}
