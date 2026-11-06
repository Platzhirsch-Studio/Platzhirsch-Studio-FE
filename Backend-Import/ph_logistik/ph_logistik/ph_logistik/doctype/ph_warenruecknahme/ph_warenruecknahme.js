// PH Warenruecknahme – Buttons (CONVENTIONS 8)
frappe.ui.form.on("PH Warenruecknahme", {
	refresh(frm) {
		if (frm.is_new()) return;
		const st = frm.doc.status;
		const g = __("Aktionen");
		if (st === "Angemeldet") {
			frm.add_custom_button(__("Ware angenommen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Rücknahme annehmen"),
					fields: [
						{ fieldname: "unterschrift_name", fieldtype: "Data", label: __("Name Kunde (bei Abholung)") },
						{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
					],
					primary_action_label: __("Annehmen"),
					primary_action(v) {
						d.hide();
						frm.call({ method: "annehmen", doc: frm.doc, args: v }).then(() => frm.reload_doc());
					},
				});
				d.show();
			}, g);
		}
		if (st === "Angenommen") {
			frm.add_custom_button(__("Prüfung buchen"), () => {
				frappe.confirm(__("Bestand gemäß Entscheidung je Position buchen?"), () =>
					frm.call({ method: "pruefung_buchen", doc: frm.doc }).then(() => frm.reload_doc()));
			}, g);
		}
		if (["Angenommen", "Geprueft"].includes(st) && !frm.doc.servicefall_ref) {
			frm.add_custom_button(__("Servicefall/Regress"), () => frm.call({ method: "servicefall_anlegen", doc: frm.doc }).then((r) => {
				frm.reload_doc();
				if (r.message) frappe.set_route("Form", "PH Servicefall", r.message);
			}), g);
		}
		if (["Angemeldet", "Angenommen"].includes(st) && frm.doc.lieferschein && !frm.doc.retourenlabel) {
			frm.add_custom_button(__("Retourenetikett"), () => frappe.confirm(__("Retourenetikett (Abholung beim Kunden) buchen?"), () =>
				frm.call({ method: "retourenetikett", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), g);
		}
		if (frm.doc.retourenlabel) frm.add_custom_button(__("Retourenetikett öffnen"), () => frappe.set_route("Form", "PH Sendung", frm.doc.retourenlabel), g);
		if (["Angenommen", "Geprueft", "Abgeschlossen"].includes(st) && frappe.user.has_role(["PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"])) {
			if (frm.doc.gutschrift) frm.add_custom_button(__("Gutschrift öffnen"), () => frappe.set_route("Form", "PH Gutschrift", frm.doc.gutschrift), g);
			else frm.add_custom_button(__("Gutschrift erstellen"), () => frappe.confirm(__("Gutschrift-Entwurf zur Rechnung erstellen?"), () =>
				frm.call({ method: "gutschrift_erstellen", doc: frm.doc, freeze: true }).then((r) => { frm.reload_doc(); if (r.message) frappe.set_route("Form", "PH Gutschrift", r.message); })), g);
		}
		if (st === "Geprueft") {
			frm.add_custom_button(__("Abschließen"), () => frm.call({ method: "abschliessen", doc: frm.doc }).then(() => frm.reload_doc()), g);
		}
		if (["Angemeldet", "Angenommen"].includes(st)) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) =>
					frm.call({ method: "stornieren", doc: frm.doc, args: { grund: v.grund } }).then(() => frm.reload_doc()), __("Rücknahme stornieren"));
			}, g);
		}
	},
});
