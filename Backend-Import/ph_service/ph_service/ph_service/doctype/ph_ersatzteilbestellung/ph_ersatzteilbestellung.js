frappe.ui.form.on("PH Ersatzteilbestellung", {
	refresh(frm) {
		const f = { Entwurf: "gray", Gesendet: "blue", Bestaetigt: "cyan", Teilgeliefert: "orange", Geliefert: "green", Storniert: "red" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const reload = () => frm.reload_doc();
		if (frm.doc.status === "Entwurf") {
			frm.add_custom_button(__("Per E-Mail senden"), () => {
				frappe.prompt([
					{ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("E-Mail (leer = Bestell-E-Mail des Lieferanten)") },
					{ fieldname: "text", fieldtype: "Small Text", label: __("Zusatztext") },
				], (v) => frm.call({ method: "senden", doc: frm.doc, args: v, freeze: true }).then(reload), __("Bestellung senden"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Als gesendet markieren"), () => {
				frappe.prompt([
					{ fieldname: "bestellweg", fieldtype: "Select", label: __("Bestellweg"), options: ["Portal", "Telefon", "IWOfurn", "Fax"], default: "Portal" },
					{ fieldname: "referenz", fieldtype: "Data", label: __("Referenz") },
				], (v) => frm.call({ method: "als_gesendet", doc: frm.doc, args: v }).then(reload), __("Gesendet"));
			}, __("Aktionen"));
		}
		if (["Gesendet"].includes(frm.doc.status)) {
			frm.add_custom_button(__("AB erhalten"), () => {
				frappe.prompt([
					{ fieldname: "referenz", fieldtype: "Data", label: __("AB-Nummer"), default: frm.doc.lieferant_referenz },
					{ fieldname: "erwartet_am", fieldtype: "Date", label: __("Erwartete Lieferung"), default: frm.doc.erwartet_am },
				], (v) => frm.call({ method: "bestaetigen", doc: frm.doc, args: v }).then(reload), __("Bestätigen"));
			}, __("Aktionen"));
		}
		if (["Gesendet", "Bestaetigt", "Teilgeliefert"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Wareneingang buchen"), () => {
				const fields = (frm.doc.positionen || []).filter((p) => (p.menge_erhalten || 0) < p.menge).map((p) => ({ fieldname: p.name, fieldtype: "Int", label: `${p.bezeichnung || p.ersatzteil} (${__("offen")}: ${p.menge - (p.menge_erhalten || 0)})`, default: p.menge - (p.menge_erhalten || 0) }));
				if (!fields.length) return frappe.msgprint(__("Alle Positionen sind geliefert."));
				frappe.prompt(fields, (v) => frm.call({ method: "wareneingang", doc: frm.doc, args: { mengen: v }, freeze: true }).then(reload), __("Erhaltene Mengen"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Stornieren"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => frappe.confirm(__("Bestellung stornieren?"), () => frm.call({ method: "stornieren", doc: frm.doc, args: v }).then(reload)), __("Stornieren")), __("Aktionen"));
		}
		if (frm.doc.servicefall) frm.add_custom_button(__("Servicefall öffnen"), () => frappe.set_route("Form", "PH Servicefall", frm.doc.servicefall));
	},
});
