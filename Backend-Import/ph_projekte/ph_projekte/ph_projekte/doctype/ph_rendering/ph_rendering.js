// PH Rendering – Vorschau mit Pins, Feedback-Liste, Buttons „Kunden vorlegen“, „Antworten“.
const PH_RENDERING_FARBEN = { Entwurf: "gray", Vorgelegt: "blue", "Feedback offen": "orange", Freigegeben: "green", Verworfen: "red" };

frappe.ui.form.on("PH Rendering", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), PH_RENDERING_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		if (["Entwurf", "Vorgelegt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Kunden vorlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Rendering dem Kunden vorlegen"),
					fields: [{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht (Portal + Mail)"), default: __("Ein neues Rendering „{0}“ wartet im Kundenportal auf Ihre Rückmeldung.", [frm.doc.bezeichnung]) }],
					primary_action_label: __("Vorlegen"),
					primary_action(values) {
						frm.call({ method: "kunden_vorlegen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Antworten"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Antwort an den Kunden"),
				fields: [{ fieldname: "text", fieldtype: "Small Text", label: __("Text"), reqd: 1 }],
				primary_action_label: __("Senden"),
				primary_action(values) {
					frm.call({ method: "antworten", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Aktionen"));
		frm.add_custom_button(__("Feedback-Übersicht"), () => frappe.set_route("List", "PH Rendering Feedback", { rendering: frm.doc.name }), __("Aktionen"));
		if (frm.doc.ki_generiert) frm.dashboard.set_headline_alert(__("KI-generiert – wird im Portal gekennzeichnet (AI Act Art. 50)."), "blue");
		ph_rendering_vorschau(frm);
	},
	bezeichnung(frm) { ph_rendering_titel(frm); },
	variante(frm) { ph_rendering_titel(frm); },
	version(frm) { ph_rendering_titel(frm); },
});

function ph_rendering_titel(frm) {
	frm.set_value("titel", `${frm.doc.bezeichnung || ""} · Variante ${frm.doc.variante || "A"} V${frm.doc.version || 1}`);
}

function ph_rendering_vorschau(frm) {
	const feld = frm.get_field("vorschau_html");
	if (!feld) return;
	if (!frm.doc.bild) {
		feld.$wrapper.html(`<div class="text-muted">${__("Noch kein Bild hochgeladen.")}</div>`);
		return;
	}
	frm.call({ method: "feedback_uebersicht", doc: frm.doc }).then((r) => {
		const daten = r.message || { eintraege: [] };
		const pins = daten.eintraege.filter((e) => e.art === "annotation" && e.punkt_x != null);
		const pinsHtml = pins.map((p, i) => `<span title="${frappe.utils.escape_html(p.text || "")}" style="position:absolute;left:${p.punkt_x}%;top:${p.punkt_y}%;transform:translate(-50%,-100%);background:${p.status === "Offen" ? "#b45309" : "#15803d"};color:#fff;font-size:11px;font-weight:600;width:22px;height:22px;border-radius:11px 11px 11px 0;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.4)">${i + 1}</span>`).join("");
		const liste = daten.eintraege.filter((e) => e.art !== "vote").map((e) => {
			const nr = e.art === "annotation" ? `<b>#${pins.indexOf(e) + 1}</b> ` : "";
			const audio = e.audio ? `<audio controls preload="none" src="${frappe.utils.escape_html(e.audio)}" style="height:28px;max-width:100%"></audio>` : "";
			const farbe = e.von === "studio" ? "#eef2ff" : "#faf8f4";
			return `<div style="background:${farbe};border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px"><div style="color:#6b7280;margin-bottom:2px">${nr}${frappe.utils.escape_html(e.autor || e.von)} · ${__(e.art)} · ${frappe.datetime.str_to_user(e.erstellt_am)} · <span style="color:${e.status === "Offen" ? "#b45309" : "#15803d"}">${__(e.status)}</span></div>${frappe.utils.escape_html(e.text || "")}${audio}</div>`;
		}).join("") || `<div class="text-muted">${__("Noch keine Rückmeldungen.")}</div>`;
		feld.$wrapper.html(`
			<div style="display:grid;grid-template-columns:minmax(0,3fr) minmax(260px,2fr);gap:14px">
				<div style="position:relative;border-radius:8px;overflow:hidden;background:#f3f1ec"><img src="${frappe.utils.escape_html(frm.doc.bild)}" style="width:100%;display:block" alt="">${pinsHtml}</div>
				<div style="max-height:420px;overflow:auto"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin-bottom:6px">${__("Rückmeldungen")} · 👍 ${frm.doc.votes_up || 0} · 👎 ${frm.doc.votes_down || 0}</div>${liste}</div>
			</div>`);
	});
}
