// PH Abnahme – Unterschriften, Mängel erledigen / an Service, Protokoll-PDF.
frappe.ui.form.on("PH Abnahme", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Unterzeichnet: "blue", "Mit Maengeln": "orange", Abgeschlossen: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Unterschriften erfassen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Unterschriften"),
				fields: [
					{ fieldname: "name_kunde", fieldtype: "Data", label: __("Name Kunde"), default: frm.doc.unterschrift_kunde_name || frm.doc.anwesend_kunde },
					{ fieldname: "unterschrift_kunde", fieldtype: "Signature", label: __("Unterschrift Kunde") },
					{ fieldname: "unterschrift_studio", fieldtype: "Signature", label: __("Unterschrift Platzhirsch") },
				],
				primary_action_label: __("Speichern"),
				primary_action(values) {
					frm.call({ method: "unterschrift_erfassen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Aktionen"));

		const offen = (frm.doc.positionen || []).filter((p) => ["Mangel", "Nacharbeit"].includes(p.zustand) && !p.erledigt);
		if (offen.length) {
			frm.add_custom_button(__("Mangel erledigt"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Mangel als erledigt markieren"),
					fields: [{ fieldname: "zeile", fieldtype: "Select", label: __("Position"), reqd: 1, options: offen.map((p) => ({ value: p.name, label: `${p.bezeichnung}: ${p.beschreibung || ""}` })) }],
					primary_action_label: __("Erledigt"),
					primary_action(values) {
						frm.call({ method: "mangel_erledigt", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Mangel → Servicefall"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Servicefall aus Mangel"),
					fields: [{ fieldname: "zeile", fieldtype: "Select", label: __("Position"), reqd: 1, options: offen.filter((p) => !p.servicefall_ref).map((p) => ({ value: p.name, label: p.bezeichnung })) }],
					primary_action_label: __("Anlegen"),
					primary_action(values) {
						frm.call({ method: "mangel_an_service", doc: frm.doc, args: values, freeze: true }).then((r) => { d.hide(); if (r.message) frappe.set_route("Form", "PH Servicefall", r.message); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Protokoll PDF"), () => {
			window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Abnahmeprotokoll")}&no_letterhead=1&_lang=${frm.doc.sprache || "de"}`);
		}, __("Aktionen"));
		frm.add_custom_button(__("Protokoll in Auftragsmappe"), () => {
			frm.call({ method: "protokoll_als_dokument", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("Dokument {0} angelegt", [r.message]), indicator: "green" }));
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		if (frm.doc.maengel_offen) frm.dashboard.set_headline_alert(__("{0} offene Mängel", [frm.doc.maengel_offen]), "orange");
	},
});
