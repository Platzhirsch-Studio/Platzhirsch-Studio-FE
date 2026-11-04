// PH Produktpass – QR-Code auf den Portal-Link, Druck A5, Status.
frappe.ui.form.on("PH Produktpass", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Aktiv: "green", "Garantie abgelaufen": "orange", Verkauft: "gray", Entsorgt: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		frm.add_custom_button(__("Produktpass drucken (A5)"), () => {
			window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Produktpass")}&no_letterhead=1`);
		}, __("Aktionen"));
		["Aktiv", "Verkauft", "Entsorgt"].filter((s) => s !== frm.doc.status).forEach((s) => {
			frm.add_custom_button(__(s), () => frm.call({ method: "status_setzen", doc: frm.doc, args: { status: s } }).then(() => frm.reload_doc()), __("Status setzen"));
		});
		if (frm.doc.projekt) frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		frm.call({ method: "portal_link", doc: frm.doc }).then((r) => {
			const url = r.message;
			const feld = frm.get_field("qr_html");
			if (!feld || !url) return;
			const qr = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;
			feld.$wrapper.html(`<div style="display:flex;gap:14px;align-items:center"><img src="${qr}" width="120" height="120" alt="QR" style="border:1px solid #d9d4cc;border-radius:6px"><div style="font-size:12px"><div style="color:#6b7280">${__("Portal-Link")}</div><a href="${frappe.utils.escape_html(url)}" target="_blank">${frappe.utils.escape_html(url)}</a><div class="text-muted" style="margin-top:4px">${__("Der Druck erzeugt den QR-Code lokal (kein externer Dienst).")}</div></div></div>`);
		});
	},
	lieferdatum(frm) { ph_pass_garantie(frm); },
	garantie_monate(frm) { ph_pass_garantie(frm); },
});

function ph_pass_garantie(frm) {
	if (frm.doc.lieferdatum && frm.doc.garantie_monate) frm.set_value("garantie_bis", frappe.datetime.add_months(frm.doc.lieferdatum, frm.doc.garantie_monate));
}
