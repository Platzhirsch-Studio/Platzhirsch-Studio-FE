// PH Lagerbestand – Buttons: Umlagern, Reservieren, Freigeben, Ausbuchen, Als Ausstellungsstück verkaufen (→ Kassa), Lageretikett.
frappe.ui.form.on("PH Lagerbestand", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Verfuegbar: "green", Reserviert: "orange", Verkauft: "blue", Ausgeschieden: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			frm.set_df_property("menge", "read_only", 0);
			frm.set_df_property("menge", "description", __("Anfangsbestand – wird als Wareneingang gebucht."));
			return;
		}
		if (["Verkauft", "Ausgeschieden"].includes(frm.doc.status)) return;
		frm.add_custom_button(__("Umlagern"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Umlagern"),
				fields: [
					{ fieldname: "lagerort_nach", fieldtype: "Link", options: "PH Lagerort", label: __("Nach Lagerort"), reqd: 1 },
					{ fieldname: "platz_nach", fieldtype: "Data", label: __("Platz") },
					{ fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: frm.doc.verfuegbar || frm.doc.menge },
				],
				primary_action_label: __("Buchen"),
				primary_action(v) { d.hide(); frm.call({ method: "umlagern", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()); },
			});
			d.show();
		}, __("Aktionen"));
		if (frm.doc.verfuegbar > 0) {
			frm.add_custom_button(__("Reservieren"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Reservieren für"),
					fields: [
						{ fieldname: "bezug_doctype", fieldtype: "Link", options: "DocType", label: __("Beleg-Typ"), default: "PH Bestellung", reqd: 1, get_query: () => ({ filters: { name: ["in", ["PH Bestellung", "PH Auftragsbestaetigung", "PH Angebot", "PH Anfrage"]] } }) },
						{ fieldname: "bezug", fieldtype: "Dynamic Link", options: "bezug_doctype", label: __("Beleg"), reqd: 1 },
						{ fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: 1 },
					],
					primary_action_label: __("Reservieren"),
					primary_action(v) { d.hide(); frm.call({ method: "reservieren", doc: frm.doc, args: v }).then(() => frm.reload_doc()); },
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.reserviert > 0) {
			frm.add_custom_button(__("Reservierung freigeben"), () => frm.call({ method: "freigeben", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.ausstellungsstueck) {
			frm.add_custom_button(__("Als Ausstellungsstück verkaufen"), () => {
				frappe.prompt({ fieldname: "vk_cent", fieldtype: "Int", label: __("Verkaufspreis (Cent)"), default: frm.doc.vk_cent_ausstellung, reqd: 1 }, (v) => {
					frappe.confirm(__("Verkauf buchen? Der Kassenbeleg wird in PH Kassa erstellt."), () => frm.call({ method: "als_ausstellungsstueck_verkaufen", doc: frm.doc, args: v }).then((r) => {
						frm.reload_doc();
						if (frappe.boot.ph_kassa_route) frappe.set_route(frappe.boot.ph_kassa_route, { lagerbestand: frm.doc.name });
						else frappe.msgprint(__("Verkauf gebucht ({0}). Kassenbeleg in PH Kassa erfassen (Preis {1} €).", [r.message.bewegung, (r.message.vk_cent / 100).toFixed(2)]));
					}));
				}, __("Verkauf"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Ausbuchen"), () => frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, { fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: frm.doc.menge }], (v) => frappe.confirm(__("Bestand ausbuchen?"), () => frm.call({ method: "ausbuchen", doc: frm.doc, args: v }).then(() => frm.reload_doc())), __("Ausbuchung")), __("Aktionen"));
		frm.add_custom_button(__("Lageretikett (62×29)"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Lagerbestand Etikett", null, "de"), __("Drucken"));
	},
});
