// PH Lagerbestand – Buttons: Umlagern, Reservieren, Freigeben, Ausbuchen, Als Ausstellungsstück verkaufen (→ Kassa), Lageretikett.
frappe.ui.form.on("PH Lagerbestand", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Verfuegbar: "green", Reserviert: "orange", Kommission: "purple", Gesperrt: "red", Verkauft: "blue", Ausgeschieden: "gray" };
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
					{ fieldname: "platz_code", fieldtype: "Data", label: __("Platzetikett scannen"), description: __("QR „Lagerort/Platz“ – ersetzt die Auswahl darunter") },
					{ fieldname: "lagerort_nach", fieldtype: "Link", options: "PH Lagerort", label: __("Nach Lagerort"), mandatory_depends_on: "eval:!doc.platz_code" },
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
						{ fieldname: "kontakt", fieldtype: "Link", options: "PH Kontakt", label: __("Kunde") },
						{ fieldname: "bis", fieldtype: "Date", label: __("Reserviert bis"), description: __("Leer = Standard aus den Logistik-Einstellungen") },
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
					// Integration Runde 3: mit ph_kassa → Kassa öffnen, Position „Ausstellungsstück“ mit Bezug; der Verkauf im Bestand
					// wird beim Buchen des Kassenbelegs gebucht (PH Kassenbeleg._ausstellungsstuecke_buchen). Ohne Kassa: wie bisher.
					if (frappe.model.can_read("PH Kassenbeleg")) {
						frappe.route_options = { lagerbestand: frm.doc.name, vk_cent: v.vk_cent };
						frappe.set_route("ph-kassa");
						return;
					}
					frappe.confirm(__("Verkauf buchen? Kassenbeleg danach in PH Kassa erfassen."), () => frm.call({ method: "als_ausstellungsstueck_verkaufen", doc: frm.doc, args: v }).then((r) => {
						frm.reload_doc();
						frappe.msgprint(__("Verkauf gebucht ({0}). Kassenbeleg in PH Kassa erfassen (Preis {1} €).", [r.message.bewegung, (r.message.vk_cent / 100).toFixed(2)]));
					}));
				}, __("Verkauf"));
			}, __("Aktionen"));
		}
		if (!frm.doc.gesperrt) {
			frm.add_custom_button(__("Sperren"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Sperrgrund"), reqd: 1 }, (v) => frm.call({ method: "sperren", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Bestand sperren")), __("Aktionen"));
		} else if (frappe.user.has_role(["PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"])) {
			frm.add_custom_button(__("Entsperren"), () => frm.call({ method: "entsperren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.kommission) {
			frm.add_custom_button(__("Kommissionsware ansehen"), () => frappe.set_route("query-report", "PH Kommissionsware", { kommission: frm.doc.kommission }), __("Aktionen"));
		}
		frm.add_custom_button(__("Ausbuchen"), () => frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, { fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: frm.doc.menge }], (v) => frappe.confirm(__("Bestand ausbuchen?"), () => frm.call({ method: "ausbuchen", doc: frm.doc, args: v }).then(() => frm.reload_doc())), __("Ausbuchung")), __("Aktionen"));
		frm.add_custom_button(__("Lageretikett (62×29)"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Lagerbestand Etikett", null, "de"), __("Drucken"));
	},
});
