// PH Geraet – Buttons: Token erzeugen/erneuern (Klartext erscheint genau einmal), Sperren/Entsperren.
frappe.ui.form.on("PH Geraet", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (!frm.is_new()) frm.page.set_indicator(frm.doc.aktiv ? __("Aktiv") : __("Gesperrt"), frm.doc.aktiv ? "green" : "red");
		if (frm.is_new()) return;

		const zeige_token = (r) => {
			if (!r.message || !r.message.token) return;
			const d = new frappe.ui.Dialog({
				title: __("Geräte-Token – nur jetzt sichtbar"),
				fields: [
					{ fieldname: "token", fieldtype: "Data", label: __("Token"), default: r.message.token, read_only: 1 },
					{ fieldname: "hinweis", fieldtype: "HTML", options: `<p>${__("Im Backoffice unter /geraet auf diesem Gerät eintragen. Der Server speichert nur den Hash; ein verlorenes Token wird über „Token erneuern“ ersetzt.")}</p>` },
				],
				primary_action_label: __("Kopieren"),
				primary_action() {
					frappe.utils.copy_to_clipboard(r.message.token);
				},
			});
			d.show();
			frm.reload_doc();
		};

		if (!frm.doc.token_vorhanden) {
			frm.add_custom_button(__("Token erzeugen"), () => frm.call({ method: "registrieren", doc: frm.doc, freeze: true }).then(zeige_token), __("Aktionen"));
		} else {
			frm.add_custom_button(__("Token erneuern"), () => {
				frappe.confirm(__("Das bisherige Token wird sofort ungültig – das Gerät muss neu eingerichtet werden. Fortfahren?"), () =>
					frm.call({ method: "token_erneuern", doc: frm.doc, freeze: true }).then(zeige_token)
				);
			}, __("Aktionen"));
		}

		if (frm.doc.aktiv) {
			frm.add_custom_button(__("Sperren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 }, (v) => {
					frm.call({ method: "sperren", doc: frm.doc, args: { grund: v.grund }, freeze: true }).then(() => frm.reload_doc());
				}, __("Gerät sperren"), __("Sperren"));
			}, __("Aktionen"));
		} else {
			frm.add_custom_button(__("Entsperren"), () => frm.call({ method: "entsperren", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		}
	},
	typ(frm) {
		const map = { Kassa: "kassa", Packtisch: "packtisch", Mobil: "montage", Backoffice: "backoffice" };
		if (!frm.doc.arbeitsplatz || frm.doc.__arbeitsplatz_auto) {
			frm.set_value("arbeitsplatz", map[frm.doc.typ] || "backoffice");
			frm.doc.__arbeitsplatz_auto = 1;
		}
	},
});
