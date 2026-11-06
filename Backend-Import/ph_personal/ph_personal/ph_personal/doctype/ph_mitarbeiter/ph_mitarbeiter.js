// PH Mitarbeiter – Buttons: Monatsübersicht, Urlaubskonto, Kommen/Gehen, Abwesenheit, Zeitnachweis drucken, Austritt.
frappe.ui.form.on("PH Mitarbeiter", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Aktiv: "green", Karenz: "orange", Ausgetreten: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Monatsübersicht"), () => zeigeMonat(frm), __("Zeit"));
		frm.add_custom_button(__("Urlaubskonto"), () => {
			frm.call({ method: "urlaubskonto_uebersicht", doc: frm.doc }).then((r) => {
				const k = r.message || {};
				const zeilen = (k.jahre || []).map((j) => `<tr><td>${frappe.datetime.str_to_user(j.von)} – ${frappe.datetime.str_to_user(j.bis)}</td><td class="text-right">${j.anspruch}</td><td class="text-right">${j.verbraucht}</td><td class="text-right">${j.rest}</td><td>${j.verjaehrt_am ? frappe.datetime.str_to_user(j.verjaehrt_am) : ""}</td></tr>`).join("");
				frappe.msgprint({
					title: __("Urlaubskonto (Stand {0})", [frappe.datetime.str_to_user(k.stichtag)]),
					message: `<table class="table table-sm"><thead><tr><th>${__("Urlaubsjahr")}</th><th class="text-right">${__("Anspruch")}</th><th class="text-right">${__("Verbraucht")}</th><th class="text-right">${__("Rest")}</th><th>${__("Verjährt am")}</th></tr></thead><tbody>${zeilen}</tbody></table>
						<p>${__("Rest gesamt")}: <b>${k.rest}</b> · ${__("nach offenen Anträgen")}: ${k.rest_nach_antraegen} · ${__("Beantragt")}: ${k.beantragt}${k.vorgriff ? " · " + __("Vorgriff") + ": " + k.vorgriff : ""}</p><p class="text-muted small">${frappe.utils.escape_html(k.hinweis || "")}</p>`,
				});
			});
		}, __("Zeit"));
		frm.add_custom_button(__("Monat abschließen"), () => {
			const heute = frappe.datetime.str_to_obj(frappe.datetime.get_today());
			const vm = new Date(heute.getFullYear(), heute.getMonth() - 1, 1);
			frappe.prompt([{ fieldname: "jahr", fieldtype: "Int", label: __("Jahr"), default: vm.getFullYear(), reqd: 1 }, { fieldname: "monat", fieldtype: "Int", label: __("Monat"), default: vm.getMonth() + 1, reqd: 1 }],
				(v) => frappe.call({ method: "ph_personal.api.monat_abschliessen", args: { mitarbeiter: frm.doc.name, jahr: v.jahr, monat: v.monat } }).then((r) => r.message && frappe.set_route("Form", "PH Zeitabschluss", r.message.name)),
				__("Monat abschließen"));
		}, __("Zeit"));
		frm.add_custom_button(__("Zeiterfassung"), () => { frappe.route_options = { mitarbeiter: frm.doc.name }; frappe.set_route("List", "PH Zeiterfassung"); }, __("Zeit"));
		frm.add_custom_button(__("Abwesenheit beantragen"), () => frappe.new_doc("PH Abwesenheit", { mitarbeiter: frm.doc.name }), __("Zeit"));
		frm.add_custom_button(__("Zeitnachweis (PDF)"), () => {
			const heute = frappe.datetime.str_to_obj(frappe.datetime.get_today());
			frappe.prompt([{ fieldname: "jahr", fieldtype: "Int", label: __("Jahr"), default: heute.getFullYear(), reqd: 1 }, { fieldname: "monat", fieldtype: "Int", label: __("Monat"), default: heute.getMonth() + 1, reqd: 1 }],
				(v) => window.open(`/api/method/ph_personal.api.zeitnachweis_pdf?mitarbeiter=${encodeURIComponent(frm.doc.name)}&jahr=${v.jahr}&monat=${v.monat}`), __("Zeitnachweis"));
		}, __("Zeit"));
		frm.add_custom_button(__("Krank melden"), () => frappe.new_doc("PH Krankmeldung", { mitarbeiter: frm.doc.name }), __("Zeit"));
		if (frappe.user.has_role("PH Personal Leitung")) {
			frm.add_custom_button(__("Checkliste aus Vorlage"), () => {
				frappe.prompt({ fieldname: "vorlage", fieldtype: "Link", options: "PH Onboarding Vorlage", label: __("Vorlage"), reqd: 1 },
					(v) => frm.call({ method: "checkliste_anlegen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Checkliste"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Austritt: Konto"), () => {
				frappe.prompt({ fieldname: "datum", fieldtype: "Date", label: __("Austrittsdatum"), default: frm.doc.austritt, reqd: 1 }, (v) => {
					frm.call({ method: "austritt_konto", doc: frm.doc, args: v }).then((r) => {
						const k = r.message || {};
						frappe.msgprint({ title: __("Stand zum Austritt"), message: `<p>${__("Urlaubsersatzleistung (Tage)")}: <b>${k.ersatzleistung_tage}</b></p><p>${__("Stundensaldo kumuliert")}: <b>${k.saldo_kumuliert_text}</b></p><p>${__("Offene Buchungen")}: ${k.offene_buchungen} · ${__("Offene Arbeitsmittel")}: ${(k.offene_arbeitsmittel || []).length}</p><p class="text-muted small">${__("Berechnung der Ersatzleistung und Zuschläge durch die Lohnverrechnung (§ 10 UrlG, § 19e AZG).")}</p>` });
					});
				}, __("Austritt"));
			}, __("Aktionen"));
		}

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

frappe.ui.form.on("PH Mitarbeiter Checkliste", {
	erledigt(frm, cdt, cdn) {
		const z = locals[cdt][cdn];
		frappe.model.set_value(cdt, cdn, { erledigt_am: z.erledigt ? frappe.datetime.get_today() : null, erledigt_von: z.erledigt ? frappe.session.user : null });
	},
});
