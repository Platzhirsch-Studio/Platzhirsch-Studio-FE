// PH Anfrage – Client-Script (Muster: Buttons, Statusfarbe, Schnellaktionen).
// Datei liegt im DocType-Ordner und wird von Frappe automatisch geladen (kein hooks-Eintrag nötig).
// Regeln (CONVENTIONS.md, Abschnitt 8): Buttons nur bei gespeichertem Dokument, Server-Logik immer
// als Dokument-Methode (frm.call), Texte mit __() für Übersetzung, Dialoge für Eingaben.

frappe.ui.form.on("PH Anfrage", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Neu: "blue", Qualifiziert: "cyan", "Termin vereinbart": "purple", Angebot: "orange", Gewonnen: "green", Verloren: "gray", Spam: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");

		if (frm.is_new()) return;

		// Button 1: Kontakt anlegen / öffnen
		if (!frm.doc.kontakt) {
			frm.add_custom_button(__("Kontakt anlegen"), () => {
				frm.call({ method: "kontakt_anlegen", doc: frm.doc, freeze: true, freeze_message: __("Kontakt wird angelegt …") }).then((r) => {
					if (r.message) {
						frappe.show_alert({ message: __("Kontakt {0} verknüpft", [r.message]), indicator: "green" });
						frm.reload_doc();
					}
				});
			}, __("Aktionen"));
		} else {
			frm.add_custom_button(__("Kontakt öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt), __("Aktionen"));
		}

		// Button 2: Termin anlegen (Dialog → Dokument-Methode)
		if (["Neu", "Qualifiziert"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Termin anlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Termin aus Anfrage"),
					fields: [
						{ fieldname: "start", fieldtype: "Datetime", label: __("Beginn"), reqd: 1 },
						{ fieldname: "dauer_min", fieldtype: "Int", label: __("Dauer (Minuten)"), default: 60 },
						{ fieldname: "modus", fieldtype: "Select", label: __("Modus"), options: ["Showroom", "Vor Ort", "Video"], default: frm.doc.ort_der_beratung === "Video" ? "Video" : "Showroom" },
					],
					primary_action_label: __("Anlegen"),
					primary_action(values) {
						frm.call({ method: "termin_vorschlagen", doc: frm.doc, args: values, freeze: true }).then((r) => {
							d.hide();
							if (r.message) frappe.set_route("Form", "PH Termin", r.message);
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		// Schnellaktion: Spam (mit Rückfrage)
		if (frm.doc.status !== "Spam") {
			frm.add_custom_button(__("Als Spam markieren"), () => {
				frappe.confirm(__("Diese Anfrage als Spam markieren? Sie verschwindet aus dem Kanban."), () => {
					frm.call({ method: "als_spam", doc: frm.doc }).then(() => frm.reload_doc());
				});
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Aufgabe anlegen"), () => {
			frappe.prompt(
				[
					{ fieldname: "titel", fieldtype: "Data", label: __("Aufgabe"), default: __("Anfrage {0} nachfassen", [frm.doc.name]), reqd: 1 },
					{ fieldname: "faellig", fieldtype: "Date", label: __("Fällig"), default: frappe.datetime.add_days(frappe.datetime.get_today(), 2), reqd: 1 },
				],
				(v) => frm.call({ method: "aufgabe_anlegen", doc: frm.doc, args: v }).then((r) => r.message && frappe.show_alert({ message: __("Aufgabe {0} angelegt", [r.message]), indicator: "green" })),
				__("Aufgabe anlegen")
			);
		}, __("Aktionen"));

		if (frm.doc.upload_status === "offen") frm.dashboard.add_comment(__("Kunde hat ein Upload-Ticket – Dateien noch nicht eingegangen."), "orange", true);
		if (frm.doc.upload_anzahl) frm.dashboard.add_comment(__("{0} Datei(en) der Website angehängt (Seitenleiste → Anhänge).", [frm.doc.upload_anzahl]), "blue", true);

		// Verknüpfungen
		if (frm.doc.folgedokument) {
			frm.add_custom_button(__("Folgedokument öffnen"), () => frappe.set_route("Form", frm.doc.folgedokument_doctype, frm.doc.folgedokument));
		}
		if (frm.doc.email) {
			frm.add_custom_button(__("E-Mail schreiben"), () => {
				new frappe.views.CommunicationComposer({ doc: frm.doc, frm, subject: __("Ihre Anfrage bei Platzhirsch ({0})", [frm.doc.name]), recipients: frm.doc.email });
			});
		}

		// Hinweis bei Spam-Verdacht (keine Mail, kein Telefon)
		if (!frm.doc.email && !frm.doc.telefon) frm.dashboard.set_headline_alert(__("Keine Kontaktmöglichkeit hinterlegt."), "orange");
	},

	vorname: aktualisiereTitel,
	nachname: aktualisiereTitel,
	art: aktualisiereTitel,
});

function aktualisiereTitel(frm) {
	const name = [frm.doc.vorname, frm.doc.nachname].filter(Boolean).join(" ") || frm.doc.firma || frm.doc.email || "ohne Namen";
	frm.set_value("titel", `${frm.doc.art || "Anfrage"}: ${name}`);
}
