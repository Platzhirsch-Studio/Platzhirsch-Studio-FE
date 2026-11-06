// PH Projekt – Formular: Phasen-Indikator, Buttons, Galerie (Renderings, Tagebuch, Bild-Dokumente), Kennzahlen.
// Regeln CONVENTIONS 8: Buttons nur bei gespeichertem Dokument, Server-Logik als Dokument-Methoden.

const PH_PROJEKT_FARBEN = { Anfrage: "blue", Planung: "cyan", Angebot: "orange", Auftrag: "purple", Bestellung: "yellow", Lieferung: "light-blue", Montage: "pink", Uebergabe: "green", Abgeschlossen: "gray", Abgebrochen: "red" };

frappe.ui.form.on("PH Projekt", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.eingang) frm.set_value("eingang", frappe.datetime.now_datetime());
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), PH_PROJEKT_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Auftragsmappe öffnen"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.name }));

		frm.add_custom_button(__("Montageauftrag anlegen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Montageauftrag aus Projekt"),
				fields: [
					{ fieldname: "start", fieldtype: "Datetime", label: __("Beginn"), reqd: 1, default: frm.doc.montage_von ? `${frm.doc.montage_von} 08:00:00` : null },
					{ fieldname: "ende", fieldtype: "Datetime", label: __("Ende (geplant)") },
					{ fieldname: "montageleiter", fieldtype: "Link", options: "User", label: __("Montageleiter"), default: frm.doc.montageleiter },
				],
				primary_action_label: __("Anlegen"),
				primary_action(values) {
					frm.call({ method: "montageauftrag_anlegen", doc: frm.doc, args: values, freeze: true }).then((r) => {
						d.hide();
						if (r.message) frappe.set_route("Form", "PH Montageauftrag", r.message);
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(frm.doc.abnahme ? __("Abnahme öffnen") : __("Abnahme anlegen"), () => {
			if (frm.doc.abnahme) return frappe.set_route("Form", "PH Abnahme", frm.doc.abnahme);
			frm.call({ method: "abnahme_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Abnahme", r.message));
		}, __("Aktionen"));

		frm.add_custom_button(__("Produktpässe erzeugen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Produktpässe aus Positionen"),
				fields: [{ fieldname: "lieferdatum", fieldtype: "Date", label: __("Lieferdatum"), default: frm.doc.liefertermin_geplant }],
				primary_action_label: __("Erzeugen"),
				primary_action(values) {
					frm.call({ method: "produktpaesse_erzeugen", doc: frm.doc, args: values, freeze: true }).then((r) => {
						d.hide();
						frappe.show_alert({ message: __("{0} Produktpässe angelegt", [(r.message || []).length]), indicator: "green" });
						frm.reload_doc();
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(__("Portal-Status senden"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Nachricht an den Kunden"),
				fields: [{ fieldname: "text", fieldtype: "Small Text", label: __("Text"), default: __("Ihr Projekt „{0}“ ist jetzt in der Phase „{1}“.", [frm.doc.titel, __(frm.doc.status)]) }],
				primary_action_label: __("Senden"),
				primary_action(values) {
					frm.call({ method: "portal_status_senden", doc: frm.doc, args: values, freeze: true }).then(() => {
						d.hide();
						frappe.show_alert({ message: __("Nachricht gespeichert"), indicator: "green" });
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(__("Summen aktualisieren"), () => {
			frm.call({ method: "summen_aktualisieren", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
		}, __("Aktionen"));

		// Lieferung je Position: Herstellerbestellungen, Teil-/Nachlieferung
		const offen = (frm.doc.positionen || []).filter((p) => (p.lieferstatus || "offen") === "offen" && !p.herstellerbestellung);
		if (offen.length || (frm.doc.positionen || []).some((p) => p.nachlieferung_noetig)) {
			frm.add_custom_button(__("Herstellerbestellungen erzeugen"), () => {
				frappe.confirm(__("Offene Positionen und Nachlieferungen je Lieferant als Bestellentwurf sammeln?"), () =>
					frm.call({ method: "herstellerbestellungen_erzeugen", doc: frm.doc, freeze: true }).then((r) => {
						const e = r.message || {};
						const ohne = (e.ohne_lieferant || []).length;
						frappe.show_alert({ message: __("{0} Bestellentwürfe", [(e.bestellungen || []).length]) + (ohne ? " · " + __("{0} Positionen ohne Lieferant", [ohne]) : ""), indicator: ohne ? "orange" : "green" });
						frm.reload_doc();
					}));
			}, __("Lieferung"));
		}
		const zeilen = (frm.doc.positionen || []).map((p) => ({ value: p.name, label: `${p.raum ? p.raum + " · " : ""}${p.bezeichnung} (${p.menge_geliefert || 0}/${p.menge})` }));
		if (zeilen.length) {
			frm.add_custom_button(__("Lieferung/Montage buchen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Teillieferung oder Montage buchen"),
					fields: [
						{ fieldname: "zeile", fieldtype: "Select", label: __("Position"), options: zeilen, reqd: 1 },
						{ fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: 1, reqd: 1 },
						{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today() },
						{ fieldname: "montiert", fieldtype: "Check", label: __("montiert (statt geliefert)") },
					],
					primary_action_label: __("Buchen"),
					primary_action(v) { frm.call({ method: "lieferung_buchen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Lieferung"));
			frm.add_custom_button(__("Nachlieferung anlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Nachlieferung (fehlend/beschädigt)"),
					fields: [
						{ fieldname: "zeile", fieldtype: "Select", label: __("Position"), options: zeilen, reqd: 1 },
						{ fieldname: "menge", fieldtype: "Int", label: __("Menge"), default: 1, reqd: 1 },
						{ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 },
						{ fieldname: "termin", fieldtype: "Date", label: __("Benötigt bis") },
						{ fieldname: "bestellen", fieldtype: "Check", label: __("Sofort beim Lieferanten bestellen"), default: 1 },
					],
					primary_action_label: __("Anlegen"),
					primary_action(v) { frm.call({ method: "nachlieferung_anlegen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Lieferung"));
		}

		frm.add_custom_button(__("Kalkulation Soll/Ist"), () => {
			frm.call({ method: "kalkulation", doc: frm.doc }).then((r) => {
				const k = r.message;
				const eur = (c) => format_currency((c || 0) / 100, "EUR");
				const zeile = (l, f) => `<tr><td>${l}</td><td style="text-align:right">${f(k.soll)}</td><td style="text-align:right">${f(k.ist)}</td></tr>`;
				frappe.msgprint({
					title: __("Kalkulation Soll/Ist"),
					message: `<table class="table table-sm"><tr><th></th><th>${__("Soll")}</th><th>${__("Ist")}</th></tr>${zeile(__("Verkauf"), (x) => eur(x.vk_cent))}${zeile(__("Einkauf"), (x) => eur(x.ek_cent))}${zeile(__("Montage h"), (x) => x.montage_h)}${zeile(__("Montagekosten"), (x) => eur(x.montage_cent))}${zeile(__("Deckungsbeitrag"), (x) => eur(x.db_cent))}${zeile(__("Marge"), (x) => (x.marge_promille == null ? "–" : (x.marge_promille / 10).toFixed(1) + " %"))}</table>`,
				});
			});
		}, __("Aktionen"));
		if (frappe.user.has_role(["PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"])) ph_nachkalkulation_buttons(frm);
		frm.add_custom_button(__("Auftragsmappe als PDF"), () => {
			const teile = ["deckblatt", "statusbericht", "aufmass", "planung", "nachtrag", "montagebericht", "abnahme", "produktpass"];
			const d = new frappe.ui.Dialog({
				title: __("Auftragsmappe als PDF"),
				fields: teile.map((t) => ({ fieldname: t, fieldtype: "Check", label: __(t.charAt(0).toUpperCase() + t.slice(1)), default: 1 })),
				primary_action_label: __("Erzeugen"),
				primary_action(v) {
					const auswahl = teile.filter((t) => v[t]);
					frappe.call({ method: "ph_projekte.api.auftragsmappe_pdf", args: { projekt: frm.doc.name, teile: JSON.stringify(auswahl) }, freeze: true, freeze_message: __("PDF wird zusammengestellt …") }).then((r) => {
						d.hide();
						if (r.message && r.message.datei) window.open(r.message.datei);
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		// Schnellanlage verknüpfter Dokumente
		[["PH Aufmass", __("Aufmaß")], ["PH Nachtrag", __("Nachtrag")], ["PH Planung", __("Planung")], ["PH Rendering", __("Rendering")], ["PH Projekt Dokument", __("Dokument")], ["PH Fremdgewerk", __("Fremdgewerk")], ["PH Projekt Aufgabe", __("Aufgabe")], ["PH Projektzeit", __("Zeit buchen")]].forEach(([dt, label]) => {
			frm.add_custom_button(label, () => frappe.new_doc(dt, { projekt: frm.doc.name }), __("Neu"));
		});

		if (frm.doc.kontakt) frm.add_custom_button(__("Kunde öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt));

		if (!frm.doc.portal_sichtbar) frm.dashboard.set_headline_alert(__("Projekt ist im Kundenportal nicht sichtbar."), "orange");
		ph_projekt_galerie(frm);
	},

	kontakt(frm) {
		if (frm.doc.kontakt && !frm.doc.titel) frm.set_value("titel", "");
	},
});

function ph_projekt_galerie(frm) {
	const feld = frm.get_field("galerie_html");
	if (!feld) return;
	feld.$wrapper.html(`<div class="text-muted">${__("Galerie wird geladen …")}</div>`);
	frappe.call({ method: "ph_projekte.api.auftragsmappe", args: { projekt: frm.doc.name } }).then((r) => {
		const d = r.message || {};
		const bilder = [];
		(d.renderings || []).forEach((x) => x.bild && bilder.push({ src: x.bild, titel: `${x.titel}${x.ki_generiert ? " · KI" : ""}`, route: ["Form", "PH Rendering", x.name], tag: __("Rendering"), farbe: "#1d4ed8" }));
		(d.fotos || []).forEach((x) => x.bild && bilder.push({ src: x.bild, titel: `${x.phase}: ${x.titel || ""}`, route: ["Form", "PH Tagebuch Foto", x.name], tag: __("Tagebuch"), farbe: "#8a7a66" }));
		(d.dokumente || []).forEach((x) => x.mime && x.mime.startsWith("image/") && bilder.push({ src: x.datei, titel: x.titel, route: ["Form", "PH Projekt Dokument", x.name], tag: x.kategorie, farbe: "#15803d" }));
		if (!bilder.length) {
			feld.$wrapper.html(`<div class="text-muted">${__("Noch keine Bilder – Renderings, Tagebuch-Fotos und Bild-Dokumente erscheinen hier.")}</div>`);
			return;
		}
		const html = bilder.map((b, i) => `
			<a class="ph-galerie-kachel" data-i="${i}" href="#" style="display:block;position:relative;border-radius:8px;overflow:hidden;background:#f3f1ec;aspect-ratio:4/3">
				<img src="${frappe.utils.escape_html(b.src)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" alt="">
				<span style="position:absolute;left:6px;top:6px;background:${b.farbe};color:#fff;font-size:10px;letter-spacing:.06em;padding:2px 6px;border-radius:4px">${frappe.utils.escape_html(b.tag)}</span>
				<span style="position:absolute;left:0;right:0;bottom:0;background:rgba(48,55,62,.78);color:#fff;font-size:11px;padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${frappe.utils.escape_html(b.titel || "")}</span>
			</a>`).join("");
		feld.$wrapper.html(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">${html}</div>`);
		feld.$wrapper.find(".ph-galerie-kachel").on("click", function (e) {
			e.preventDefault();
			frappe.set_route(...bilder[Number(this.dataset.i)].route);
		});
	});
}


// ── Projektnachkalkulation (Leitung/GF): laufende Kalkulation, Budget, Snapshot ─────────────────────────
function ph_nachkalkulation_buttons(frm) {
	const eur = (c) => format_currency((c || 0) / 100, "EUR");
	const pz = (p) => (p === null || p === undefined ? "–" : `${Number(p).toFixed(1)} %`);
	const farbe = { gruen: "#15803d", gelb: "#b45309", rot: "#b91c1c" };
	const punkt = (a) => (a ? `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${farbe[a]}"></span>` : "");
	frm.add_custom_button(__("Laufende Kalkulation"), () => {
		frm.call({ method: "kalkulation_v2", doc: frm.doc, freeze: true }).then((r) => {
			const k = r.message, h = k.kopf, s = k.stufen_prognose, i = k.stufen_ist;
			const esc = frappe.utils.escape_html;
			const stufe = (n) => `<tr><td>${n.toUpperCase()}</td><td style="text-align:right">${eur(i[n + "_cent"])}</td><td style="text-align:right">${pz(i[n + "_prozent"])}</td><td style="text-align:right">${eur(s[n + "_cent"])}</td><td style="text-align:right">${pz(s[n + "_prozent"])}</td></tr>`;
			const zeilen = k.kostenarten.map((z) => `<tr><td>${punkt(z.ampel)} ${esc(z.bezeichnung)}</td><td style="text-align:right">${eur(z.budget_cent)}</td><td style="text-align:right">${eur(z.ist_cent)}</td><td style="text-align:right">${eur(z.obligo_cent)}</td><td style="text-align:right">${eur(z.rest_cent)}${z.rest_manuell ? " *" : ""}</td><td style="text-align:right">${eur(z.prognose_cent)}</td><td style="text-align:right">${eur(z.abweichung_cent)}</td></tr>`).join("");
			const stufen = ["db1", "db2", "db3"].concat(k.gemeinkosten_aktiv ? ["db4"] : []);
			frappe.msgprint({
				title: __("Laufende Kalkulation {0}", [esc(frm.doc.name)]),
				wide: true,
				message: `<p>${punkt(h.ampel)} ${__("Erlös")} <b>${eur(h.erloes_cent)}</b> (${esc(h.erloes_basis)}) · ${__("Fertigstellung")} <b>${h.fertigstellungsgrad} %</b> · ${__("DB laufend")} <b>${pz(h.db_laufend_prozent)}</b> · ${__("End-DB Prognose")} <b>${pz(h.db_prognose_prozent)}</b></p>
					<table class="table table-sm"><tr><th></th><th style="text-align:right">${__("Ist")}</th><th></th><th style="text-align:right">${__("Prognose")}</th><th></th></tr>${stufen.map(stufe).join("")}</table>
					<table class="table table-sm"><tr><th>${__("Kostenart")}</th><th style="text-align:right">${__("Budget")}</th><th style="text-align:right">${__("Ist")}</th><th style="text-align:right">${__("Obligo")}</th><th style="text-align:right">${__("Rest")}</th><th style="text-align:right">${__("Prognose")}</th><th style="text-align:right">${__("Abw.")}</th></tr>${zeilen}</table>
					${(k.hinweise || []).map((x) => `<p class="text-muted small">${esc(x)}</p>`).join("")}`,
			});
		});
	}, __("Kalkulation"));
	if (!frm.doc.kalk_budget_eingefroren_am) {
		frm.add_custom_button(__("Budget vorbelegen"), () => frm.call({ method: "budget_vorbelegen", doc: frm.doc, args: { ueberschreiben: 0 } }).then(() => frm.reload_doc()), __("Kalkulation"));
		frm.add_custom_button(__("Budget bei Auftrag einfrieren"), () => frappe.confirm(__("Budget bei Auftrag einfrieren? Danach nur noch Anpassungen (protokolliert)."), () => frm.call({ method: "budget_einfrieren", doc: frm.doc }).then(() => frm.reload_doc())), __("Kalkulation"));
	}
	frm.add_custom_button(frm.doc.nachkalkulation ? __("Nachkalkulation öffnen") : __("Nachkalkulation anlegen"), () => {
		if (frm.doc.nachkalkulation) return frappe.set_route("Form", "PH Projekt Nachkalkulation", frm.doc.nachkalkulation);
		frm.call({ method: "nachkalkulation_anlegen", doc: frm.doc, freeze: true }).then((r) => frappe.set_route("Form", "PH Projekt Nachkalkulation", r.message));
	}, __("Kalkulation"));
	frm.add_custom_button(__("Protokoll"), () => frappe.set_route("List", "PH Kalkulation Protokoll", { projekt: frm.doc.name }), __("Kalkulation"));
	if (frm.doc.kalk_ampel === "rot") frm.dashboard.set_headline(__("Kalkulation rot: Prognose über Budget oder End-DB unter Ziel."), "red");
}
