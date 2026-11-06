frappe.ui.form.on("PH Kundenkarte", {
	refresh(frm) {
		const farben = { Beantragt: "orange", Aktiv: "green", Gesperrt: "red", Gekuendigt: "gray" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		if (frm.doc.status === "Aktiv") {
			frm.add_custom_button(__("Vorteil einlösen"), () => vorteil_einloesen(frm), __("Aktionen"));
		}
		frm.add_custom_button(__("Umsatz neu berechnen"), () => {
			if (!frm.doc.einwilligung_auswertung) {
				frappe.msgprint(__("Ohne Einwilligung zur Auswertung der Kaufhistorie wird kein Umsatz berechnet."));
				return;
			}
			frm.call({ method: "umsatz_neu_berechnen", doc: frm.doc, freeze: true }).then((r) => {
				if (r.message) frappe.show_alert({ message: __("Berechnet: {0} Belege, Stufe {1}", [r.message.belege || 0, r.message.stufe || "–"]), indicator: "green" });
				frm.reload_doc();
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Wallet-Pass erneuern"), () => frm.call({ method: "wallet_pass_erneuern", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		if (["Aktiv", "Beantragt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Karte sperren"), () => karte_sperren(frm), __("Aktionen"));
		}
		if (frm.doc.status === "Gesperrt") {
			frm.add_custom_button(__("Karte entsperren"), () => frappe.confirm(__("Karte {0} wieder aktivieren?", [frm.doc.name]), () => frm.call({ method: "entsperren", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.status === "Aktiv" || (frm.doc.status === "Gesperrt" && ["Verlust", "Diebstahl", "Beschaedigt"].includes(frm.doc.sperrgrund_art))) {
			frm.add_custom_button(__("Ersatzkarte ausstellen"), () => ersatzkarte(frm), __("Aktionen"));
		}
		if (frm.doc.status === "Beantragt") {
			frm.add_custom_button(__("Karte übergeben (aktivieren)"), () => frm.call({ method: "karte_uebergeben", doc: frm.doc, args: { ort: "Showroom" }, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (["Aktiv", "Gesperrt"].includes(frm.doc.status) && frappe.user.has_role(["PH Kundenkarte Leitung", "System Manager"])) {
			frm.add_custom_button(__("Karte übertragen"), () => uebertragen(frm), __("Aktionen"));
			frm.add_custom_button(__("Dublette zusammenführen"), () => zusammenfuehren(frm), __("Aktionen"));
		}
		if (["Aktiv", "Gesperrt", "Beantragt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Karte kündigen"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Data", label: __("Grund") }], (v) => frappe.confirm(__("Karte {0} endgültig kündigen? Eine neue Karte kann später ausgestellt werden.", [frm.doc.name]), () => frm.call({ method: "kuendigen", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc())), __("Karte kündigen"));
			}, __("Aktionen"));
		}
		const nachfolger = frm.doc.nachfolger_karte || frm.doc.zusammengefuehrt_in;
		if (nachfolger) {
			const link = '<a href="/app/ph-kundenkarte/' + encodeURIComponent(nachfolger) + '">' + frappe.utils.escape_html(nachfolger) + "</a>";
			frm.dashboard.set_headline_alert(__("Karte beendet ({0}) – weiter: {1}", [__(frm.doc.status), link]), "gray");
		}
		frm.add_custom_button(__("Karte drucken"), () => frm.print_doc("PH Kundenkarte Karte"), __("Drucken"));
		frm.add_custom_button(__("Begrüßungsschreiben"), () => frm.print_doc("PH Kundenkarte Begruessung"), __("Drucken"));

		if (frm.doc.status === "Gesperrt") frm.dashboard.set_headline_alert(__("Karte gesperrt: {0}", [frappe.utils.escape_html([__(frm.doc.sperrgrund_art || ""), frm.doc.sperrgrund || ""].filter(Boolean).join(" – ") || "–")]), "red");
		if (!frm.doc.einwilligung_auswertung) frm.dashboard.add_indicator(__("Keine Auswertung der Kaufhistorie (ohne Einwilligung)"), "orange");
		if (frm.doc.stufe_manuell) frm.dashboard.add_indicator(__("Stufe manuell festgelegt"), "blue");

		frm.call({ method: "portal_daten", doc: frm.doc }).then((r) => {
			const d = r.message;
			if (!d) return;
			if (d.naechste_stufe && d.fehlt_noch_cent !== null && d.fehlt_noch_cent !== undefined) {
				frm.dashboard.add_comment(__("Nächste Stufe {0}: es fehlen noch {1} im Bewertungszeitraum ({2} Monate).", [frappe.utils.escape_html(d.naechste_stufe), format_currency(d.fehlt_noch_cent / 100, "EUR"), d.bewertungszeitraum_monate]), "blue", true);
			}
			const verfuegbar = (d.vorteile || []).filter((v) => v.verfuegbar).map((v) => frappe.utils.escape_html(v.titel));
			if (verfuegbar.length) frm.dashboard.add_comment(__("Verfügbare Vorteile: {0}", [verfuegbar.join(" · ")]), "green", true);
		});
	},
	kontakt(frm) {
		if (!frm.doc.kontakt) return;
		frappe.db.get_value("PH Kontakt", frm.doc.kontakt, ["berater"]).then((r) => {
			if (r.message && r.message.berater && !frm.doc.persoenlicher_berater) frm.set_value("persoenlicher_berater", r.message.berater);
		});
	},
});

function vorteil_einloesen(frm) {
	frm.call({ method: "portal_daten", doc: frm.doc }).then((r) => {
		const vorteile = ((r.message && r.message.vorteile) || []).filter((v) => v.verfuegbar);
		if (!vorteile.length) {
			frappe.msgprint(__("Für diese Karte sind derzeit keine Vorteile einlösbar."));
			return;
		}
		const d = new frappe.ui.Dialog({
			title: __("Vorteil einlösen"),
			fields: [
				{ fieldname: "vorteil", fieldtype: "Select", label: __("Vorteil"), reqd: 1, options: vorteile.map((v) => ({ value: v.vorteil, label: v.verbleibend === null ? v.titel : `${v.titel} (${v.verbleibend} ${__("verbleibend")})` })) },
				{ fieldname: "ort", fieldtype: "Select", label: __("Ort"), options: ["Backoffice", "Showroom", "Kassa", "Packtisch", "Service", "Event"], default: "Showroom" },
				{ fieldname: "bezug_doctype", fieldtype: "Link", options: "DocType", label: __("Bezug (Typ)"), get_query: () => ({ filters: { name: ["in", ["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event"]] } }) },
				{ fieldname: "bezug", fieldtype: "Dynamic Link", options: "bezug_doctype", label: __("Bezug") },
				{ fieldname: "kommentar", fieldtype: "Small Text", label: __("Kommentar") },
			],
			primary_action_label: __("Einlösen"),
			primary_action(v) {
				frm.call({ method: "vorteil_einloesen", doc: frm.doc, args: v, freeze: true }).then((res) => {
					d.hide();
					if (res.message) frappe.show_alert({ message: __("Einlösung {0} angelegt", [res.message]), indicator: "green" });
					frm.reload_doc();
				});
			},
		});
		d.show();
	});
}

function karte_sperren(frm) {
	frappe.call({ method: "ph_kundenkarte.api.backoffice.sperrgruende" }).then((r) => {
		const gruende = r.message || [];
		const d = new frappe.ui.Dialog({
			title: __("Karte sperren"),
			fields: [
				{ fieldname: "sperrgrund_art", fieldtype: "Select", label: __("Sperrgrund"), reqd: 1, options: gruende.map((g) => ({ value: g.wert, label: g.label })) },
				{ fieldname: "grund", fieldtype: "Data", label: __("Beschreibung (bei „Sonstiges“ Pflicht)") },
				{ fieldname: "ersatz", fieldtype: "Check", label: __("Gleich Ersatzkarte ausstellen"), depends_on: "eval:['Verlust','Diebstahl','Beschaedigt'].includes(doc.sperrgrund_art)" },
				{ fieldname: "hinweis", fieldtype: "HTML", options: '<p class="text-muted small">' + __("Die Karte wird am Kiosk abgelehnt. Entsperren kann nur die Leitung.") + "</p>" },
			],
			primary_action_label: __("Sperren"),
			primary_action(v) {
				d.hide();
				const methode = v.ersatz ? "ersatzkarte_ausstellen" : "sperren";
				frm.call({ method: methode, doc: frm.doc, args: { sperrgrund_art: v.sperrgrund_art, grund: v.grund }, freeze: true }).then((res) => {
					if (v.ersatz && res.message) frappe.set_route("Form", "PH Kundenkarte", res.message);
					else frm.reload_doc();
				});
			},
		});
		d.show();
	});
}

function ersatzkarte(frm) {
	const fields = frm.doc.status === "Gesperrt" ? [] : [{ fieldname: "sperrgrund_art", fieldtype: "Select", label: __("Grund"), reqd: 1, options: [{ value: "Verlust", label: __("Verlust") }, { value: "Diebstahl", label: __("Diebstahl") }, { value: "Beschaedigt", label: __("Beschädigt / unlesbar") }], default: "Verlust" }];
	fields.push({ fieldname: "grund", fieldtype: "Data", label: __("Beschreibung") });
	frappe.prompt(fields, (v) => frappe.confirm(__("Neue Kartennummer ausstellen? Die Karte {0} wird endgültig ungültig.", [frm.doc.name]), () => frm.call({ method: "ersatzkarte_ausstellen", doc: frm.doc, args: v, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Kundenkarte", r.message))), __("Ersatzkarte ausstellen"), __("Ausstellen"));
}

function uebertragen(frm) {
	frappe.prompt(
		[
			{ fieldname: "ziel_kontakt", fieldtype: "Link", options: "PH Kontakt", label: __("Neuer Inhaber (Kontakt)"), reqd: 1 },
			{ fieldname: "grund_art", fieldtype: "Select", label: __("Grund"), reqd: 1, options: ["Partner/Haushalt", "Erbe", "Firmennachfolge", "Sonstiges"] },
			{ fieldname: "grund", fieldtype: "Data", label: __("Beschreibung") },
			{ fieldname: "einwilligung_auswertung", fieldtype: "Check", label: __("Neuer Inhaber willigt in die Auswertung der Kaufhistorie ein (Nachweis!)") },
			{ fieldname: "einwilligung_textversion", fieldtype: "Data", label: __("Textversion der Einwilligung"), depends_on: "einwilligung_auswertung", default: "kundenkarte-auswertung-v1" },
		],
		(v) => frappe.confirm(__("Karte übertragen? Der neue Inhaber erhält eine neue Kartennummer, die Stufe bleibt; die Karte {0} wird ungültig.", [frm.doc.name]), () => frm.call({ method: "uebertragen", doc: frm.doc, args: v, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Kundenkarte", r.message))),
		__("Karte übertragen"),
		__("Übertragen")
	);
}

function zusammenfuehren(frm) {
	frappe.prompt([{ fieldname: "andere_karte", fieldtype: "Link", options: "PH Kundenkarte", label: __("Zweite Karte derselben Person"), reqd: 1, get_query: () => ({ filters: { status: ["in", ["Aktiv", "Gesperrt", "Beantragt"]], name: ["!=", frm.doc.name] } }) }], (v) => {
		frm.call({ method: "zusammenfuehren_mit", doc: frm.doc, args: { andere_karte: v.andere_karte, nur_plan: 1 } }).then((r) => {
			const p = r.message || {};
			const zeilen = [__("Hauptkarte: {0}", [p.ziel]), __("wird beendet: {0}", [(p.quellen || []).join(", ")])].concat(p.warnungen || []);
			frappe.confirm(zeilen.map(frappe.utils.escape_html).join("<br>"), () => frm.call({ method: "zusammenfuehren_mit", doc: frm.doc, args: { andere_karte: v.andere_karte }, freeze: true }).then((res) => frappe.set_route("Form", "PH Kundenkarte", res.message.ziel)));
		});
	}, __("Dublette zusammenführen"), __("Vorschau"));
}
