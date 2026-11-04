// ph_faktura – gemeinsame Desk-Hilfen für alle Faktura-Formulare (Summenblock, Beträge, Statusfarben).
// Eingebunden über hooks.app_include_js. Keine Framework-Farbänderungen (CONVENTIONS 12).
window.ph_faktura = {
	farben: {
		Entwurf: "gray", Gesendet: "blue", Angenommen: "green", Abgelehnt: "red", Abgelaufen: "orange", Ersetzt: "gray",
		Offen: "blue", "In Bestellung": "purple", Teilgeliefert: "cyan", Geliefert: "orange", Abgerechnet: "green", Storniert: "red",
		Gestellt: "blue", Teilbezahlt: "cyan", Bezahlt: "green", Ueberfaellig: "orange", Gemahnt: "red", Uneinbringlich: "red",
		Verrechnet: "green", Erstattet: "green", Erledigt: "green",
		Erfasst: "blue", "Sachlich geprueft": "cyan", Freigegeben: "orange",
		Zugeordnet: "green", Teilweise: "cyan", Ignoriert: "gray", Neu: "blue", Importiert: "green", Fehler: "red",
		Erzeugt: "blue", Uebergeben: "orange", Bestaetigt: "green", Berechnet: "blue",
	},
	status_label: { Ueberfaellig: "Überfällig", "Sachlich geprueft": "Sachlich geprüft", Uebergeben: "Übergeben", Bestaetigt: "Bestätigt" },

	betrag(cent, waehrung = "EUR") {
		const n = (Number(cent || 0) / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		return waehrung === "EUR" ? `${n} €` : `${n} ${waehrung}`;
	},
	satz(promille) {
		const p = Number(promille || 0) / 100;
		return `${p.toLocaleString("de-AT", { maximumFractionDigits: 2 })} %`;
	},
	indicator(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(this.status_label[frm.doc.status] || frm.doc.status), this.farben[frm.doc.status] || "gray");
	},

	// Summenblock (Netto, USt je Satz, Brutto, Anzahlungen, zahlbar/offen) in ein HTML-Feld rendern
	summenblock(frm, feld = "summen_html") {
		const d = frm.doc;
		const esc = frappe.utils.escape_html;
		const zeilen = [];
		const z = (label, cent, cls = "") => zeilen.push(`<tr class="${cls}"><td>${esc(label)}</td><td class="text-right">${esc(this.betrag(cent, d.waehrung))}</td></tr>`);
		z(__("Netto"), d.netto_cent);
		if (Number(d.rabatt_gesamt_cent)) z(__("davon Rabatt"), -Number(d.rabatt_gesamt_cent), "text-muted");
		(d.ust_aufteilung || []).forEach((a) => z(`${__("USt")} ${this.satz(a.ust_satz_promille)} ${__("auf")} ${this.betrag(a.netto_cent, d.waehrung)}`, a.ust_cent));
		z(__("Brutto"), d.brutto_cent, "ph-sum-brutto");
		if ((d.anzahlungen_verrechnet || []).length) {
			z(__("abzüglich Anzahlungen (brutto)"), -Number(d.anzahlung_brutto_cent || 0));
			z(__("Zahlbar"), d.zahlbar_cent, "ph-sum-brutto");
		}
		if (d.doctype === "PH Rechnung" && d.docstatus === 1) {
			z(__("Bezahlt"), d.bezahlt_cent);
			z(__("Offen"), d.offen_cent, Number(d.offen_cent) > 0 ? "ph-sum-offen" : "ph-sum-ok");
		}
		if (Number(d.alternativ_cent)) z(__("Alternativpositionen (nicht enthalten)"), d.alternativ_cent, "text-muted");
		const html = `<style>
			.ph-summen{max-width:420px;margin-left:auto;font-size:13px}.ph-summen td{padding:3px 6px;border-bottom:1px solid var(--border-color)}
			.ph-summen .ph-sum-brutto td{font-weight:600;border-top:2px solid var(--text-color);font-size:14px}
			.ph-summen .ph-sum-offen td{color:#b45309;font-weight:600}.ph-summen .ph-sum-ok td{color:#15803d;font-weight:600}
			</style><table class="ph-summen">${zeilen.join("")}</table>`;
		if (frm.fields_dict[feld]) frm.fields_dict[feld].$wrapper.html(html);
	},

	// Dialog „Zahlung erfassen“ (Rechnung) – ruft Dokument-Methode zahlung_erfassen
	zahlung_dialog(frm) {
		const d = new frappe.ui.Dialog({
			title: __("Zahlung erfassen"),
			fields: [
				{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: frm.doc.offen_cent, reqd: 1, description: this.betrag(frm.doc.offen_cent) + " " + __("offen") },
				{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Ueberweisung", "Bar", "Karte extern", "Stripe Link", "Gutschein", "Verrechnung"], default: "Ueberweisung", reqd: 1 },
				{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today(), reqd: 1 },
				{ fieldname: "hinweis", fieldtype: "Data", label: __("Hinweis") },
			],
			primary_action_label: __("Buchen"),
			primary_action: (v) => {
				frm.call({ method: "zahlung_erfassen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
			},
		});
		d.show();
	},

	// „Als PDF senden“ – Dokument-Methode senden(empfaenger, betreff, nachricht)
	senden_dialog(frm, methode = "senden") {
		const d = new frappe.ui.Dialog({
			title: __("Als PDF senden"),
			fields: [
				{ fieldname: "empfaenger", fieldtype: "Data", label: __("E-Mail an"), options: "Email", reqd: 1, default: frm.doc.__onload && frm.doc.__onload.kontakt_email },
				{ fieldname: "betreff", fieldtype: "Data", label: __("Betreff"), default: `${__(frm.doc.doctype.replace("PH ", ""))} ${frm.doc.name} – Platzhirsch` },
				{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht") },
			],
			primary_action_label: __("Senden"),
			primary_action: (v) => {
				frm.call({ method: methode, doc: frm.doc, args: v, freeze: true, freeze_message: __("PDF wird erzeugt …") }).then(() => { d.hide(); frm.reload_doc(); });
			},
		});
		d.show();
	},

	position_hilfe(frm) {
		// Beim Produktwechsel: Server füllt Bezeichnung/Preis (validate); hier nur Zeilen-Vorschau
		frm.fields_dict.positionen && frm.fields_dict.positionen.grid.wrapper.on("change", 'input[data-fieldname="menge"],input[data-fieldname="einzel_netto_cent"],input[data-fieldname="rabatt_promille"]', () => {
			frm.dirty();
		});
	},
};
