// PH Zeiterfassung – Netto-Vorschau, Button „Gehen (jetzt)“, Mitarbeiter-Vorbelegung im Selbstservice.
frappe.ui.form.on("PH Zeiterfassung", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.mitarbeiter) {
			frappe.db.get_value("PH Mitarbeiter", { user: frappe.session.user }, "name").then((r) => {
				if (r.message && r.message.name) frm.set_value("mitarbeiter", r.message.name);
			});
		}
		if (frm.is_new() && !frm.doc.datum) frm.set_value("datum", frappe.datetime.get_today());
	},
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", Erfasst: "green", Korrigiert: "blue" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (!frm.doc.gehen) {
			frm.add_custom_button(__("Gehen (jetzt)"), () => {
				frm.call({ method: "gehen_jetzt", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
			}).addClass("btn-primary");
		}
		if (frm.doc.gehen && !frm.doc.pause_bestaetigt && frm.doc.pause_min) {
			frm.dashboard.set_headline_alert(__("Pause {0} min vorgeschlagen – bitte bestätigen.", [frm.doc.pause_min]), "blue");
			frm.add_custom_button(__("Pause bestätigen"), () => {
				frappe.prompt({ fieldname: "pause_min", fieldtype: "Int", label: __("Pause genommen (Minuten)"), default: frm.doc.pause_min, reqd: 1 },
					(v) => frm.call({ method: "pause_bestaetigen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Pause bestätigen"));
			}, __("Aktionen"));
		}
		if (frm.doc.korrektur_status !== "Beantragt") {
			frm.add_custom_button(__("Korrektur beantragen"), () => {
				new frappe.ui.Dialog({
					title: __("Korrektur beantragen"),
					fields: [
						{ fieldname: "kommen", fieldtype: "Time", label: __("Kommen"), default: frm.doc.kommen },
						{ fieldname: "gehen", fieldtype: "Time", label: __("Gehen"), default: frm.doc.gehen },
						{ fieldname: "pause_min", fieldtype: "Int", label: __("Pause (min)"), default: frm.doc.pause_min },
						{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
					],
					primary_action_label: __("Beantragen"),
					primary_action(v) { this.hide(); frm.call({ method: "korrektur_beantragen", doc: frm.doc, args: v }).then(() => frm.reload_doc()); },
				}).show();
			}, __("Aktionen"));
		} else if (frappe.user.has_role("PH Personal Leitung")) {
			frm.dashboard.set_headline_alert(__("Korrektur beantragt: {0}–{1}, Pause {2} min – {3}", [frm.doc.korrektur_kommen || "", frm.doc.korrektur_gehen || "", frm.doc.korrektur_pause_min || 0, frappe.utils.escape_html(frm.doc.korrektur_grund || "")]), "orange");
			frm.add_custom_button(__("Korrektur bestätigen"), () => frm.call({ method: "korrektur_entscheiden", doc: frm.doc, args: { bestaetigen: 1 } }).then(() => frm.reload_doc()), __("Aktionen"));
			frm.add_custom_button(__("Korrektur ablehnen"), () => {
				frappe.prompt({ fieldname: "notiz", fieldtype: "Small Text", label: __("Begründung"), reqd: 1 },
					(v) => frm.call({ method: "korrektur_entscheiden", doc: frm.doc, args: { bestaetigen: 0, notiz: v.notiz } }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Mitarbeiter öffnen"), () => frappe.set_route("Form", "PH Mitarbeiter", frm.doc.mitarbeiter));
	},
	kommen: vorschau,
	gehen: vorschau,
	pause_min: vorschau,
});

function vorschau(frm) {
	if (!frm.doc.kommen || !frm.doc.gehen) { frm.set_value("dauer_text", ""); return; }
	const min = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
	const netto = Math.max(0, min(frm.doc.gehen) - min(frm.doc.kommen) - (frm.doc.pause_min || 0));
	frm.set_value("dauer_text", `${Math.floor(netto / 60)}:${String(netto % 60).padStart(2, "0")}`);
	if (netto > 600) frm.dashboard.set_headline_alert(__("Mehr als 10 Stunden netto – Arbeitszeitgesetz prüfen."), "orange");
}
