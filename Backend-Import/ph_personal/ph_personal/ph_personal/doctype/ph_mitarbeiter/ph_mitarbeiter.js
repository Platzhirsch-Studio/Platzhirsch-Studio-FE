// PH Mitarbeiter – Buttons: Monatsübersicht, Urlaubskonto, Kommen/Gehen, Abwesenheit, Zeitnachweis drucken, Austritt.
frappe.ui.form.on("PH Mitarbeiter", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Aktiv: "green", Karenz: "orange", Ausgetreten: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Monatsübersicht"), () => zeigeMonat(frm), __("Zeit"));
		frm.add_custom_button(__("Urlaubskonto"), () => {
			frm.call({ method: "urlaubskonto", doc: frm.doc }).then((r) => {
				const k = r.message || {};
				frappe.msgprint({
					title: __("Urlaubskonto {0}", [k.jahr]),
					message: `<table class="table table-sm"><tr><td>${__("Anspruch")}</td><td class="text-right">${k.anspruch}</td></tr><tr><td>${__("Genommen")}</td><td class="text-right">${k.genommen}</td></tr><tr><td>${__("Beantragt")}</td><td class="text-right">${k.beantragt}</td></tr><tr><th>${__("Rest")}</th><th class="text-right">${k.rest}</th></tr></table>`,
				});
			});
		}, __("Zeit"));
		frm.add_custom_button(__("Zeiterfassung"), () => { frappe.route_options = { mitarbeiter: frm.doc.name }; frappe.set_route("List", "PH Zeiterfassung"); }, __("Zeit"));
		frm.add_custom_button(__("Abwesenheit beantragen"), () => frappe.new_doc("PH Abwesenheit", { mitarbeiter: frm.doc.name }), __("Zeit"));
		frm.add_custom_button(__("Zeitnachweis drucken"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Mitarbeiter Zeitnachweis", frm.doc.letter_head, "de"), __("Zeit"));

		if (frm.doc.status !== "Ausgetreten") {
			frm.add_custom_button(__("Austritt erfassen"), () => {
				frappe.prompt([{ fieldname: "datum", fieldtype: "Date", label: __("Austrittsdatum"), reqd: 1 }], (v) => {
					frappe.confirm(__("Austritt zum {0} erfassen? Selbstservice-Rechte werden entzogen.", [frappe.datetime.str_to_user(v.datum)]), () => {
						frm.call({ method: "austritt_erfassen", doc: frm.doc, args: v }).then(() => frm.reload_doc());
					});
				}, __("Austritt"), __("Erfassen"));
			}, __("Aktionen"));
		}
		if (frm.doc.bewerbung) frm.add_custom_button(__("Bewerbung öffnen"), () => frappe.set_route("Form", "PH Bewerbung", frm.doc.bewerbung), __("Aktionen"));
		if (frm.doc.user) frm.add_custom_button(__("Benutzer öffnen"), () => frappe.set_route("Form", "User", frm.doc.user), __("Aktionen"));
	},
	vorname: titelSetzen,
	nachname: titelSetzen,
	rolle_intern(frm) {
		const map = { Verkauf: "team_verkauf", Planung: "team_planung", Montage: "team_montage" };
		if (map[frm.doc.rolle_intern]) frm.set_value(map[frm.doc.rolle_intern], 1);
	},
});

function titelSetzen(frm) {
	frm.set_value("titel", [frm.doc.vorname, frm.doc.nachname].filter(Boolean).join(" "));
}

function zeigeMonat(frm) {
	const heute = frappe.datetime.str_to_obj(frappe.datetime.get_today());
	const d = new frappe.ui.Dialog({
		title: __("Monatsübersicht"),
		fields: [
			{ fieldname: "jahr", fieldtype: "Int", label: __("Jahr"), default: heute.getFullYear(), reqd: 1 },
			{ fieldname: "monat", fieldtype: "Int", label: __("Monat"), default: heute.getMonth() + 1, reqd: 1 },
			{ fieldname: "ausgabe", fieldtype: "HTML" },
		],
		primary_action_label: __("Anzeigen"),
		primary_action(values) {
			frm.call({ method: "monatsuebersicht", doc: frm.doc, args: { jahr: values.jahr, monat: values.monat } }).then((r) => {
				const m = r.message || {};
				const zeilen = (m.tage || []).map((t) => `<tr><td>${frappe.datetime.str_to_user(t.datum)}</td><td>${frappe.utils.escape_html(t.art || "")}</td><td>${t.kommen || ""}</td><td>${t.gehen || ""}</td><td class="text-right">${t.dauer_text || ""}</td></tr>`).join("");
				d.fields_dict.ausgabe.$wrapper.html(`
					<div class="row"><div class="col-sm-4"><b>${__("Soll")}</b><br>${m.soll_text}</div><div class="col-sm-4"><b>${__("Ist")}</b><br>${m.ist_text}</div><div class="col-sm-4"><b>${__("Saldo")}</b><br><span class="indicator-pill ${m.saldo_min >= 0 ? "green" : "red"}">${m.saldo_text}</span></div></div>
					<p class="text-muted small mt-2">${__("Abwesenheiten (Arbeitstage)")}: ${__("Urlaub")} ${m.urlaub_tage} · ${__("Krank")} ${m.krank_tage} · ${__("Sonstige")} ${m.sonstige_tage} · ${__("Offene Buchungen")}: ${m.offen}</p>
					<table class="table table-sm"><thead><tr><th>${__("Datum")}</th><th>${__("Art")}</th><th>${__("Kommen")}</th><th>${__("Gehen")}</th><th class="text-right">${__("Netto")}</th></tr></thead><tbody>${zeilen}</tbody></table>`);
			});
		},
	});
	d.show();
}
