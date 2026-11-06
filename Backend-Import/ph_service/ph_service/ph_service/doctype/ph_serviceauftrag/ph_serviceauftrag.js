frappe.ui.form.on("PH Serviceauftrag", {
	refresh(frm) {
		const f = { Angefragt: "blue", Angeboten: "orange", Beauftragt: "cyan", Abgeholt: "purple", Eingelagert: "yellow", "In Arbeit": "orange", Zurueckgebracht: "green", Abgerechnet: "gray", Storniert: "red" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		frm.add_custom_button(__("Übernahmeliste (PDF)"), () => frm.print_doc("PH Serviceauftrag Übernahmeliste"), __("Drucken"));
		const erfassen = (methode, titel, zustandFeld) => {
			const d = new frappe.ui.Dialog({
				title: titel,
				fields: [
					{ fieldname: "info", fieldtype: "HTML", options: `<p class="text-muted">${__("Zustand je Stück in der Tabelle „Positionen“ eintragen und speichern; hier wird bestätigt.")}</p>` },
					{ fieldname: "name_bestaetigt", fieldtype: "Data", label: __("Name des Kunden (statt Unterschrift)") },
					{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
				],
				primary_action_label: __("Bestätigen"),
				primary_action(v) {
					delete v.info;
					const positionen = (frm.doc.positionen || []).map((p) => ({ name: p.name, zustand: p[zustandFeld] }));
					frm.call({ method: methode, doc: frm.doc, args: { ...v, positionen }, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		};
		if (["Beauftragt", "Angeboten"].includes(frm.doc.status)) frm.add_custom_button(__("Übernahme erfassen"), () => erfassen("uebernahme_erfassen", __("Übernahme beim Kunden"), "zustand_uebernahme"), __("Aktionen"));
		if (["Eingelagert", "In Arbeit", "Abgeholt"].includes(frm.doc.status)) frm.add_custom_button(__("Rückgabe erfassen"), () => erfassen("rueckgabe_erfassen", __("Rückgabe an den Kunden"), "zustand_rueckgabe"), __("Aktionen"));
		if (!frm.doc.preis_cent)
 frm.dashboard.add_indicator(__("Preis auf Anfrage"), "orange");
	},
});
