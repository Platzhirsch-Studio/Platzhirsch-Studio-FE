frappe.ui.form.on("PH Kundenkarte Antrag", {
	refresh(frm) {
		const farben = { Neu: "blue", Bestaetigt: "cyan", Angenommen: "green", Abgelehnt: "red", Doppelt: "gray" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const offen = ["Neu", "Bestaetigt"].includes(frm.doc.status);
		if (offen) {
			frm.add_custom_button(__("Annehmen"), () => annehmen(frm), __("Aktionen"));
			frm.add_custom_button(__("Ablehnen"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Begründung"), reqd: 1 }], (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()), __("Antrag ablehnen"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Doppelt"), () => frappe.confirm(__("Antrag als doppelt markieren (Karte bereits vorhanden)?"), () => frm.call({ method: "als_doppelt", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		frm.add_custom_button(__("Kontakt suchen"), () => {
			frm.call({ method: "kontakt_suchen", doc: frm.doc }).then((r) => {
				const treffer = r.message || [];
				if (!treffer.length) {
					frappe.msgprint(__("Kein passender Kontakt gefunden – bei Annahme wird ein neuer PH Kontakt angelegt."));
					return;
				}
				const zeilen = treffer.map((t) => `<tr><td><a href="/app/ph-kontakt/${encodeURIComponent(t.name)}">${frappe.utils.escape_html(t.name)}</a></td><td>${frappe.utils.escape_html(t.titel || "")}</td><td>${frappe.utils.escape_html(t.plz || "")} ${frappe.utils.escape_html(t.ort || "")}</td><td><button class="btn btn-xs btn-default" data-name="${frappe.utils.escape_html(t.name)}">${__("Verknüpfen")}</button></td></tr>`).join("");
				const d = new frappe.ui.Dialog({ title: __("Mögliche Kontakte"), fields: [{ fieldname: "html", fieldtype: "HTML", options: `<table class="table table-sm"><tbody>${zeilen}</tbody></table>` }] });
				d.show();
				d.$wrapper.on("click", "button[data-name]", (ev) => {
					frm.set_value("kontakt", $(ev.currentTarget).data("name"));
					frm.save().then(() => d.hide());
				});
			});
		}, __("Aktionen"));
		if (frm.doc.status === "Neu" && frm.doc.doi_noetig) frm.dashboard.set_headline_alert(__("Double-Opt-in noch nicht bestätigt – Annahme nur durch die Leitung."), "orange");
		if (frm.doc.kundenkarte) frm.dashboard.add_comment(__("Karte: {0}", [frappe.utils.escape_html(frm.doc.kundenkarte)]), "green", true);
	},
});

function annehmen(frm) {
	frappe.prompt(
		[
			{ fieldname: "kontakt", fieldtype: "Link", options: "PH Kontakt", label: __("Kontakt (leer = per E-Mail suchen oder neu anlegen)"), default: frm.doc.kontakt },
			{ fieldname: "stufe", fieldtype: "Link", options: "PH Kundenkarte Stufe", label: __("Stufe (leer = Startstufe)"), default: frm.doc.startstufe },
			{ fieldname: "sofort_aktiv", fieldtype: "Check", label: __("Sofort aktiv (aus = aktiv erst bei Übergabe der Karte)"), default: 1, hidden: frm.doc.quelle === "website" ? 1 : 0 },
		],
		(v) => frm.call({ method: "annehmen", doc: frm.doc, args: v, freeze: true }).then((r) => {
			frm.reload_doc();
			if (r.message && r.message.startsWith("KK-")) frappe.set_route("Form", "PH Kundenkarte", r.message);
		}),
		__("Antrag annehmen"),
		__("Karte anlegen")
	);
}
