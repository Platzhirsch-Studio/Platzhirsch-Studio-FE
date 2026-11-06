frappe.ui.form.on("PH Lieferant", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Neue Bestellung"), () => frappe.new_doc("PH Herstellerbestellung", { lieferant: frm.doc.name, marke: frm.doc.marke }), __("Aktionen"));
		frm.add_custom_button(__("Offene Bestellungen"), () => frappe.set_route("List", "PH Herstellerbestellung", { lieferant: frm.doc.name, status: ["in", ["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"]] }), __("Ansehen"));
		frm.add_custom_button(__("Liefertermintreue"), () => frappe.set_route("query-report", "PH Liefertermintreue je Lieferant", { lieferant: frm.doc.name }), __("Ansehen"));
		frm.call({ method: "offene_bestellungen", doc: frm.doc }).then((r) => {
			const n = (r.message || []).length;
			frm.dashboard.add_indicator(__("{0} offene Bestellungen", [n]), n ? "blue" : "gray");
			const offen = (r.message || []).filter((b) => b.abweichungen_offen).length;
			if (offen) frm.dashboard.add_indicator(__("{0} mit offenen AB-Abweichungen", [offen]), "orange");
		});
	},
});

// ── Ergänzung 04.11. (Backend-Lücken 51)
frappe.ui.form.on("PH Lieferant", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Liefertermin schätzen"), () => {
			frappe.prompt([
				{ fieldname: "marke", fieldtype: "Link", options: "PH Marke", label: __("Marke"), default: frm.doc.marke },
				{ fieldname: "kategorie", fieldtype: "Link", options: "PH Kategorie", label: __("Kategorie") },
				{ fieldname: "bestelldatum", fieldtype: "Date", label: __("Bestelldatum"), default: frappe.datetime.get_today() },
			], (v) => {
				frm.call({ method: "liefertermin", doc: frm.doc, args: v }).then((r) => {
					const t = r.message || {};
					frappe.msgprint(t.wochen_von ? __("{0}–{1} Wochen → {2} bis {3} (Betriebsurlaub berücksichtigt)", [t.wochen_von, t.wochen_bis, frappe.datetime.str_to_user(t.termin_frueh), frappe.datetime.str_to_user(t.termin_spaet)]) : __("Keine Lieferzeit hinterlegt."));
				});
			}, __("Liefertermin schätzen"), __("Schätzen"));
		});
	},
});
