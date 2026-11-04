// PH Tagebuch Foto – Vorschau, Phasenhinweis (nur Team / echt).
frappe.ui.form.on("PH Tagebuch Foto", {
	refresh(frm) {
		const feld = frm.get_field("vorschau_html");
		if (feld) feld.$wrapper.html(frm.doc.bild ? `<a href="${frappe.utils.escape_html(frm.doc.bild)}" target="_blank"><img src="${frappe.utils.escape_html(frm.doc.bild)}" style="max-width:100%;max-height:360px;border-radius:8px" alt=""></a>` : `<div class="text-muted">${__("Kein Bild.")}</div>`);
		if (["skizze", "modell"].includes(frm.doc.phase)) frm.dashboard.set_headline_alert(__("Handzeichnung/Modell: nur echtes Material, nicht als Referenz veröffentlichbar."), "orange");
		if (!frm.is_new() && frm.doc.projekt) frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
	},
	onload(frm) {
		if (frm.is_new()) {
			if (!frm.doc.hochgeladen_am) frm.set_value("hochgeladen_am", frappe.datetime.now_datetime());
			if (!frm.doc.von) frm.set_value("von", "team");
		}
	},
	phase(frm) {
		if (["skizze", "modell"].includes(frm.doc.phase)) frm.set_value("echt_bestaetigt", frm.doc.echt_bestaetigt || 0);
	},
});
