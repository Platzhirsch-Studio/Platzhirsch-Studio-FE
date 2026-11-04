// PH Projekt Dokument – Vorschau (Bild/PDF), Portal-Freigabe, neue Version.
frappe.ui.form.on("PH Projekt Dokument", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Freigegeben: "green", Archiviert: "orange" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status !== "Archiviert") {
			frm.add_custom_button(frm.doc.kunde_sichtbar ? __("Portal-Freigabe entziehen") : __("Für Portal freigeben"), () => {
				frm.call({ method: "portal_freigeben", doc: frm.doc, args: { freigeben: frm.doc.kunde_sichtbar ? 0 : 1 } }).then(() => frm.reload_doc());
			}, __("Aktionen"));
			frm.add_custom_button(__("Neue Version"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Neue Version hochladen"),
					fields: [{ fieldname: "datei", fieldtype: "Attach", label: __("Datei"), reqd: 1, options: { is_private: 1 } }],
					primary_action_label: __("Anlegen"),
					primary_action(values) {
						frm.call({ method: "neue_version", doc: frm.doc, args: values, freeze: true }).then((r) => { d.hide(); if (r.message) frappe.set_route("Form", "PH Projekt Dokument", r.message); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.referenz_name) frm.add_custom_button(__("Beleg öffnen"), () => frappe.set_route("Form", frm.doc.referenz_doctype, frm.doc.referenz_name));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		ph_dokument_vorschau(frm);
	},
	datei(frm) { ph_dokument_vorschau(frm); },
});

function ph_dokument_vorschau(frm) {
	const feld = frm.get_field("vorschau_html");
	if (!feld) return;
	const url = frm.doc.datei;
	if (!url) return feld.$wrapper.html("");
	const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
	if (["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(ext)) {
		feld.$wrapper.html(`<a href="${frappe.utils.escape_html(url)}" target="_blank"><img src="${frappe.utils.escape_html(url)}" style="max-width:100%;max-height:360px;border-radius:8px" alt=""></a>`);
	} else if (ext === "pdf") {
		feld.$wrapper.html(`<iframe src="${frappe.utils.escape_html(url)}#toolbar=0" style="width:100%;height:420px;border:1px solid #d9d4cc;border-radius:8px"></iframe>`);
	} else {
		feld.$wrapper.html(`<a href="${frappe.utils.escape_html(url)}" target="_blank" class="btn btn-default btn-sm">${__("Datei öffnen")}</a>`);
	}
}
