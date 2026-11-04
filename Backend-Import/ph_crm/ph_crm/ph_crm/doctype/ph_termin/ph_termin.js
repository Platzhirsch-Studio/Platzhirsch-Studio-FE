// PH Termin – Buttons: Bestätigen, Absagen (Mail), Umbuchen (Dialog mit freien Zeiten), Meet-Link erzeugen,
// Erledigt + Gesprächsprotokoll, Nicht erschienen, Kontakt anlegen; Kopfzeile mit Reservierungsstand.
const FARBEN = { Unbestaetigt: "orange", Bestaetigt: "green", Erledigt: "blue", Storniert: "gray", Abgelehnt: "red", "Nicht erschienen": "purple" };

frappe.ui.form.on("PH Termin", {
	setup(frm) {
		frm.set_query("berater", () => ({ filters: { enabled: 1, user_type: "System User" } }));
		frm.set_query("terminart", () => ({ filters: { aktiv: 1 } }));
	},

	onload(frm) {
		if (frm.is_new() && !frm.doc.quelle) {
			frm.set_value("quelle", "backoffice");
			frm.set_value("kundenmail", "backoffice");
		}
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN[frm.doc.status] || "gray");

		if (frm.doc.status === "Unbestaetigt" && !frm.doc.email_verifiziert && frm.doc.reserviert_bis) {
			const abgelaufen = frappe.datetime.now_datetime() > frm.doc.reserviert_bis;
			frm.dashboard.set_headline_alert(abgelaufen ? __("Reservierung abgelaufen – Kunde hat die E-Mail nicht bestätigt.") : __("Website-Buchung: Uhrzeit bis {0} reserviert (E-Mail-Bestätigung ausstehend).", [frappe.datetime.str_to_user(frm.doc.reserviert_bis)]), abgelaufen ? "red" : "orange");
		} else if (frm.doc.status === "Unbestaetigt" && frm.doc.email_verifiziert) {
			frm.dashboard.set_headline_alert(__("Anfrage mit bestätigter E-Mail – bitte Termin bestätigen oder absagen."), "orange");
		}
		if (frm.doc.kundenmail === "website") {
			frm.dashboard.add_comment(__("Kundenmails (Bestätigung, Absage, Verwaltungslink) sendet die Website. Erinnerung sendet das Backoffice."), "blue", true);
		}
		if (frm.is_new()) return;

		const offen = ["Unbestaetigt", "Bestaetigt"].includes(frm.doc.status);

		if (frm.doc.status === "Unbestaetigt") {
			frm.add_custom_button(__("Bestätigen"), () => {
				frappe.confirm(frm.doc.kundenmail === "backoffice" && frm.doc.email ? __("Termin bestätigen und Bestätigungsmail senden?") : __("Termin bestätigen?"), () => {
					frm.call({ method: "bestaetigen", doc: frm.doc, args: { mail: 1 }, freeze: true }).then(() => frm.reload_doc());
				});
			}, __("Aktionen"));
		}

		if (offen) {
			frm.add_custom_button(__("Absagen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Termin absagen"),
					fields: [
						{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
						{ fieldname: "mail", fieldtype: "Check", label: __("Kunden per E-Mail informieren"), default: frm.doc.email ? 1 : 0 },
						{ fieldname: "abgelehnt", fieldtype: "Check", label: __("Als Anfrage ablehnen (Leitung)"), default: 0, depends_on: `eval:${frm.doc.status === "Unbestaetigt" ? 1 : 0}` },
					],
					primary_action_label: __("Absagen"),
					primary_action(v) {
						frm.call({ method: "absagen", doc: frm.doc, args: v, freeze: true }).then(() => {
							d.hide();
							frm.reload_doc();
						});
					},
				});
				d.show();
			}, __("Aktionen"));

			frm.add_custom_button(__("Umbuchen"), () => umbuchenDialog(frm), __("Aktionen"));
		}

		if (frm.doc.status === "Bestaetigt") {
			frm.add_custom_button(__("Erledigt + Gesprächsprotokoll"), () => {
				frm.call({ method: "erledigt_mit_protokoll", doc: frm.doc, args: { protokoll: 1 }, freeze: true }).then((r) => {
					if (r.message) frappe.set_route("Form", "PH Beratungsgespraech", r.message);
					else frm.reload_doc();
				});
			}, __("Aktionen"));
			frm.add_custom_button(__("Nicht erschienen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Hinweis") }, (v) => frm.call({ method: "nicht_erschienen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Nicht erschienen"));
			}, __("Aktionen"));
		}

		if (frm.doc.modus === "Video" && offen && !frm.doc.meet_url) {
			frm.add_custom_button(__("Meet-Link erzeugen"), () => {
				frm.call({ method: "meet_link_erzeugen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
			}, __("Aktionen"));
		}

		if (!frm.doc.kontakt) {
			frm.add_custom_button(__("Kontakt anlegen"), () => frm.call({ method: "kontakt_anlegen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		} else {
			frm.add_custom_button(__("Kontakt öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt), __("Aktionen"));
		}
		frm.add_custom_button(__("Aufgabe anlegen"), () => frappe.new_doc("PH Aufgabe", { referenz_doctype: "PH Termin", referenz_name: frm.doc.name, titel: __("Termin {0}: Nachfassen", [frm.doc.referenz]), zugewiesen_an: frm.doc.berater }), __("Aktionen"));

		if (frm.doc.meet_url) frm.add_custom_button(__("Videoraum öffnen"), () => window.open(frm.doc.meet_url));
		if (frm.doc.event) frm.add_custom_button(__("Kalender-Event"), () => frappe.set_route("Form", "Event", frm.doc.event));
		if (frm.doc.email) {
			frm.add_custom_button(__("E-Mail schreiben"), () => new frappe.views.CommunicationComposer({ doc: frm.doc, frm, subject: __("Ihr Termin {0} bei Platzhirsch", [frm.doc.referenz]), recipients: frm.doc.email }));
		}
	},

	terminart(frm) {
		if (!frm.doc.terminart) return;
		frappe.db.get_doc("PH Terminart", frm.doc.terminart).then((art) => {
			if (art.modus) frm.set_value("modus", art.modus);
			frm.set_value("dauer_min", art.dauer_min);
			frm.set_df_property("modus", "options", art.modus ? art.modus : (art.modi_erlaubt || "Showroom,Video").split(",").map((s) => s.trim()).join("\n"));
		});
	},

	start: aktualisiereEnde,
	dauer_min: aktualisiereEnde,
});

function aktualisiereEnde(frm) {
	if (frm.doc.start && frm.doc.dauer_min) {
		frm.set_value("ende", frappe.datetime.add_minutes(frm.doc.start, frm.doc.dauer_min));
	}
}

function umbuchenDialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Termin umbuchen"),
		fields: [
			{ fieldname: "tag", fieldtype: "Date", label: __("Tag"), reqd: 1, default: frappe.datetime.get_today() },
			{ fieldname: "berater", fieldtype: "Link", options: "User", label: __("Berater"), default: frm.doc.berater },
			{ fieldname: "laden", fieldtype: "Button", label: __("Freie Zeiten laden") },
			{ fieldname: "slot", fieldtype: "Select", label: __("Freie Zeit"), options: [] },
			{ fieldname: "neuer_start", fieldtype: "Datetime", label: __("Oder Zeitpunkt frei wählen") },
		],
		primary_action_label: __("Umbuchen"),
		primary_action(v) {
			const start = v.slot || v.neuer_start;
			if (!start) return frappe.msgprint(__("Bitte eine Zeit wählen."));
			frm.call({ method: "umbuchen", doc: frm.doc, args: { neuer_start: start, berater: v.berater }, freeze: true }).then(() => {
				d.hide();
				frm.reload_doc();
			});
		},
	});
	d.fields_dict.laden.input.onclick = () => {
		const v = d.get_values(true);
		frappe.call({
			method: "ph_crm.api.get_freie_slots",
			args: { terminart: frm.doc.terminart, modus: frm.doc.modus, von: v.tag, bis: v.tag, berater: v.berater, zeitzone: "Europe/Vienna", ausser: frm.doc.name },
		}).then((r) => {
			const slots = (r.message || []).map((s) => {
				const lokal = s.start.replace("T", " ").slice(0, 16);
				return { label: `${lokal.slice(11)} Uhr${s.berater && s.berater.length ? " · " + s.berater.join(", ") : ""}`, value: lokal + ":00" };
			});
			d.set_df_property("slot", "options", slots.length ? slots : [{ label: __("Keine freien Zeiten an diesem Tag"), value: "" }]);
		});
	};
	d.show();
}
