// PH Stelle – Client-Script: Statusfarbe, GlBG-Hinweis, Buttons (Website prüfen, Cache erneuern,
// Duplizieren, Als besetzt schließen, Bewerbungen).
const STELLE_FARBEN = { Entwurf: "gray", Aktiv: "green", Pausiert: "orange", Besetzt: "blue", Archiviert: "purple" };

frappe.ui.form.on("PH Stelle", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), STELLE_FARBEN[frm.doc.status] || "gray");

		if (!frm.doc.entgelt_vollstaendig) {
			frm.dashboard.set_headline_alert(
				__("Entgeltangabe fehlt – nicht veröffentlichbar (§ 9 Abs 2 GlBG). Reiter „Entgelt (GlBG)“ ausfüllen."),
				"red"
			);
		} else if (frm.doc.status === "Aktiv" && frm.doc.gueltig_bis && frappe.datetime.get_diff(frm.doc.gueltig_bis, frappe.datetime.get_today()) < 7) {
			frm.dashboard.set_headline_alert(__("Gültigkeit endet am {0} – verlängern oder pausieren.", [frappe.datetime.str_to_user(frm.doc.gueltig_bis)]), "orange");
		}

		if (frm.is_new()) return;

		frm.add_custom_button(__("Auf Website prüfen"), () => {
			if (frm.doc.website_url) window.open(frm.doc.website_url, "_blank");
		}, __("Aktionen"));

		frm.add_custom_button(__("Veröffentlichung prüfen"), () => {
			frm.call({ method: "pruefen", doc: frm.doc }).then((r) => {
				const fehlt = r.message || [];
				if (!fehlt.length) frappe.msgprint({ title: __("Bereit"), message: __("Alle Pflichtangaben für die Veröffentlichung sind vorhanden."), indicator: "green" });
				else frappe.msgprint({ title: __("Es fehlt"), message: "<ul><li>" + fehlt.map(frappe.utils.escape_html).join("</li><li>") + "</li></ul>", indicator: "orange" });
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Website-Cache erneuern"), () => {
			frm.call({ method: "website_cache_erneuern", doc: frm.doc, freeze: true }).then((r) => {
				const m = r.message || {};
				frappe.show_alert({ message: m.ok ? __("Website-Cache wird erneuert.") : __("Nicht gesendet: {0}", [m.grund || m.status]), indicator: m.ok ? "green" : "orange" });
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Duplizieren"), () => {
			frm.call({ method: "duplizieren", doc: frm.doc, freeze: true }).then((r) => {
				if (r.message) frappe.set_route("Form", "PH Stelle", r.message);
			});
		}, __("Aktionen"));

		if (["Aktiv", "Pausiert"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Als besetzt schließen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Stelle als besetzt schließen"),
					fields: [
						{
							fieldname: "bewerbung", fieldtype: "Link", label: __("Eingestellte Bewerbung (optional)"), options: "PH Bewerbung",
							get_query: () => ({ filters: { stelle: frm.doc.name, status: ["in", ["Angebot", "Eingestellt"]] } }),
						},
					],
					primary_action_label: __("Schließen"),
					primary_action(values) {
						frm.call({ method: "als_besetzt", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Bewerbungen"), () => {
			frappe.route_options = { stelle: frm.doc.name };
			frappe.set_route("List", "PH Bewerbung", "Kanban", "PH Bewerbungen");
		});
		frm.add_custom_button(__("Neue Bewerbung"), () => {
			frappe.new_doc("PH Bewerbung", { stelle: frm.doc.name, quelle: "E-Mail" });
		});
	},

	titel(frm) {
		if (frm.is_new() && frm.doc.titel) frm.set_value("slug", slugWieWebsite(frm.doc.titel));
	},
	kv_mindest_brutto_cent: entgeltVorschau,
	entgelt_zeitraum: entgeltVorschau,
	kollektivvertrag: entgeltVorschau,
	ueberzahlung: entgeltVorschau,
	ueberzahlung_text: entgeltVorschau,
});

function entgeltVorschau(frm) {
	const d = frm.doc;
	const ok = (d.kv_mindest_brutto_cent || 0) > 0 && ["Monat", "Jahr"].includes(d.entgelt_zeitraum) && (d.kollektivvertrag || "").trim() &&
		(["ja", "nein"].includes(d.ueberzahlung) || (d.ueberzahlung_text || "").trim());
	frm.set_value("entgelt_vollstaendig", ok ? 1 : 0);
	if (d.kv_mindest_brutto_cent) frm.set_value("kv_mindest_brutto_anzeige", format_currency(d.kv_mindest_brutto_cent / 100, "EUR"));
}

// Entspricht src/lib/slugify.js generateSlug; der Server rechnet verbindlich nach.
function slugWieWebsite(titel) {
	return (titel || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
		.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s–—]+/g, "-").replace(/\//g, "-")
		.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
