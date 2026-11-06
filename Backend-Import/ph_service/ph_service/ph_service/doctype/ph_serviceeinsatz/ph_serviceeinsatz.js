// PH Serviceeinsatz – Client-Script: Statusbuttons für Techniker (auch mobil), Fotogalerie, Servicebericht.
const SE_FARBEN = { Geplant: "blue", Bestaetigt: "cyan", Unterwegs: "purple", "In Arbeit": "orange", Erledigt: "green", "Nicht angetroffen": "red", Abgebrochen: "gray" };

frappe.ui.form.on("PH Serviceeinsatz", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), SE_FARBEN[frm.doc.status] || "gray");
		galerie(frm);
		if (frm.is_new()) return;
		const s = frm.doc.status;
		const call = (method, args) => frm.call({ method, doc: frm.doc, args, freeze: true }).then(() => frm.reload_doc());

		if (s === "Geplant") frm.add_custom_button(__("Kunde hat bestätigt"), () => call("bestaetigen"), __("Aktionen"));
		if (["Geplant", "Bestaetigt"].includes(s)) frm.add_custom_button(__("Unterwegs"), () => call("unterwegs"), __("Aktionen"));
		if (["Geplant", "Bestaetigt", "Unterwegs"].includes(s)) {
			frm.add_custom_button(__("Einsatz starten"), () => call("starten"), __("Aktionen"));
			frm.add_custom_button(__("Nicht angetroffen"), () => frappe.prompt({ fieldname: "hinweis", fieldtype: "Small Text", label: __("Hinweis") }, (v) => call("nicht_angetroffen", v), __("Nicht angetroffen")), __("Aktionen"));
		}
		if (["Unterwegs", "In Arbeit", "Bestaetigt", "Geplant"].includes(s)) frm.add_custom_button(__("Einsatz abschließen"), () => dialogAbschluss(frm), __("Aktionen"));
		if (["Geplant", "Bestaetigt"].includes(s)) {
			frm.add_custom_button(__("Umplanen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Einsatz umplanen"),
					fields: [
						{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), reqd: 1, default: frm.doc.datum },
						{ fieldname: "zeit_von", fieldtype: "Time", label: __("von"), default: frm.doc.zeit_von },
						{ fieldname: "zeit_bis", fieldtype: "Time", label: __("bis"), default: frm.doc.zeit_bis },
						{ fieldname: "techniker", fieldtype: "Link", options: "User", label: __("Techniker"), default: frm.doc.techniker },
						{ fieldname: "grund", fieldtype: "Data", label: __("Grund") },
						{ fieldname: "frei", fieldtype: "HTML" },
					],
					primary_action_label: __("Umplanen"),
					primary_action(v) {
						delete v.frei;
						frm.call({ method: "umplanen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); frappe.show_alert(__("Umgeplant – Kundenbestätigung neu einholen")); });
					},
				});
				const freie = () => frappe.call({ method: "ph_service.api.get_technician_slots", args: { datum: d.get_value("datum"), techniker: d.get_value("techniker") || undefined, dauer_min: 60 } }).then((r) => {
					const t = (r.message && r.message.techniker) || {};
					d.fields_dict.frei.$wrapper.html(Object.keys(t).map((u) => `<div style="font-size:12px"><b>${frappe.utils.escape_html(u)}</b>: ${(t[u] || []).map((f) => f.von).join(", ") || __("kein freies Fenster")}</div>`).join(""));
				});
				d.fields_dict.datum.df.onchange = freie;
				d.fields_dict.techniker.df.onchange = freie;
				d.show();
				freie();
			}, __("Aktionen"));
		}
		if (!["Erledigt", "Abgebrochen"].includes(s)) frm.add_custom_button(__("Abbrechen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => frappe.confirm(__("Einsatz absagen? Der Kalendertermin wird storniert."), () => call("abbrechen", v)), __("Einsatz abbrechen")), __("Aktionen"));
		if (s === "Erledigt") frm.add_custom_button(frm.doc.bericht_gesendet_am ? __("Bericht erneut senden") : __("Bericht an Kunden senden"), () => call("bericht_senden"), __("Aktionen"));
		if (!frm.doc.termin && ["Geplant", "Bestaetigt"].includes(s)) frm.add_custom_button(__("Kalendertermin anlegen"), () => frm.call({ method: "termin_anlegen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frm.doc.folgeeinsatz_noetig && !frm.doc.folgeeinsatz) {
			frm.add_custom_button(__("Folgeeinsatz anlegen"), () => {
				frappe.prompt([
					{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), reqd: 1, default: frappe.datetime.add_days(frappe.datetime.get_today(), 7) },
					{ fieldname: "zeit_von", fieldtype: "Time", label: __("von"), default: frm.doc.zeit_von },
					{ fieldname: "zeit_bis", fieldtype: "Time", label: __("bis"), default: frm.doc.zeit_bis },
				], (v) => frm.call({ method: "folgeeinsatz_anlegen", doc: frm.doc, args: v }).then((r) => r.message && frappe.set_route("Form", "PH Serviceeinsatz", r.message)), __("Folgeeinsatz"));
			}, __("Aktionen"));
		}
		if (frm.doc.servicefall) frm.add_custom_button(__("Servicefall öffnen"), () => frappe.set_route("Form", "PH Servicefall", frm.doc.servicefall));
		if (frm.doc.pflege_abo) frm.add_custom_button(__("Vertrag öffnen"), () => frappe.set_route("Form", "PH Pflege Abo", frm.doc.pflege_abo));
		frm.add_custom_button(__("Servicebericht (PDF)"), () => frm.print_doc("PH Servicebericht"), __("Drucken"));
		if (frm.doc.strasse || frm.doc.ort) {
			const q = encodeURIComponent([frm.doc.strasse, frm.doc.plz, frm.doc.ort, frm.doc.land].filter(Boolean).join(", "));
			frm.add_custom_button(__("Route (Karte)"), () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank"));
		}
		if (s === "Erledigt" && !frm.doc.unterschrift_kunde) frm.dashboard.set_headline_alert(__("Keine Kundenunterschrift erfasst."), "orange");
	},
	ankunft(frm) { zeit(frm); },
	abfahrt(frm) { zeit(frm); },
});

frappe.ui.form.on("PH Serviceeinsatz Foto", { bild: galerie, fotos_remove: galerie });

function zeit(frm) {
	if (frm.doc.ankunft && frm.doc.abfahrt) {
		const min = Math.round(frappe.datetime.get_minute_diff(frm.doc.abfahrt, frm.doc.ankunft));
		if (min >= 0) frm.set_value("zeit_arbeit_min", min);
	}
}

function galerie(frm) {
	const w = frm.get_field("fotogalerie");
	if (!w || !w.$wrapper) return;
	const fotos = (frm.doc.fotos || []).filter((z) => z.bild);
	if (!fotos.length) { w.$wrapper.html(`<div class="text-muted" style="font-size:12px">${__("Fotos vorher/nachher hier erfassen (Kamera-Upload am Tablet).")}</div>`); return; }
	const farbe = { Vorher: "#b45309", Waehrend: "#1d4ed8", Nachher: "#15803d" };
	const html = fotos.map((z) => {
		const url = frappe.utils.escape_html(z.bild);
		return `<a href="${url}" target="_blank" rel="noopener" style="display:block;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;text-decoration:none;color:inherit"><img src="${url}" style="width:100%;height:110px;object-fit:cover" loading="lazy"><div style="padding:5px 8px;font-size:11px"><span style="color:${farbe[z.phase] || "#6b7280"};font-weight:600">${__(z.phase || "")}</span> ${frappe.utils.escape_html(z.hinweis || "")}</div></a>`;
	}).join("");
	w.$wrapper.html(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">${html}</div>`);
}

function dialogAbschluss(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Einsatz abschließen"),
		size: "large",
		fields: [
			{ fieldname: "ergebnis", fieldtype: "Select", label: __("Ergebnis"), options: ["Behoben", "Teilweise behoben", "Nicht behoben", "Weiterer Einsatz noetig", "Ersatzteil noetig", "Kein Mangel festgestellt"], reqd: 1, default: frm.doc.ergebnis || "Behoben" },
			{ fieldname: "bericht", fieldtype: "Text Editor", label: __("Servicebericht (an den Kunden)"), default: frm.doc.bericht, reqd: 1 },
			{ fieldname: "sb", fieldtype: "Section Break", label: __("Unterschrift des Kunden") },
			{ fieldname: "pause_min", fieldtype: "Int", label: __("Pause (Minuten)"), default: frm.doc.zeit_pause_min || 0 },
			{ fieldname: "unterschrift_art", fieldtype: "Select", label: __("Bestätigung"), options: ["Unterschrift", "Name bestätigt", "Verweigert", "Kunde abwesend"], default: "Unterschrift", description: __("„Name bestätigt“ = Alternative ohne Zeichnen (Tastatur).") },
			{ fieldname: "unterschrift_name", fieldtype: "Data", label: __("Name"), default: frm.doc.kunde_name },
			{ fieldname: "zufriedenheit", fieldtype: "Rating", label: __("Zufriedenheit") },
			{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift"), depends_on: "eval:doc.unterschrift_art=='Unterschrift'" },
			{ fieldname: "bericht_senden", fieldtype: "Check", label: __("Servicebericht per Mail an den Kunden"), default: 1 },

		],
		primary_action_label: __("Abschließen"),
		primary_action(v) {
			frm.call({ method: "abschliessen", doc: frm.doc, args: v, freeze: true, freeze_message: __("Einsatz wird abgeschlossen …") }).then(() => { d.hide(); frm.reload_doc(); });
		},
	});
	d.show();
}
