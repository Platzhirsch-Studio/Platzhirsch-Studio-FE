// Desk-Page „Auftragsmappe“ (ph-auftragsmappe): Infocenter je Projekt – Kopf, Phasen, Belege (ph_faktura/ph_shop,
// soweit installiert), Dokumente/Pläne, Galerie, Termine (Montagen, Gewerke, PH Termin), Zahlungsstand (Leitung),
// Aufgaben, Zeiten, Nachrichten. Daten: ph_projekte.api.auftragsmappe(projekt). Aufruf: /app/ph-auftragsmappe?projekt=PH-PRJ-…

frappe.pages["ph-auftragsmappe"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Auftragsmappe"), single_column: true });
	const state = { projekt: null };

	const feld = page.add_field({
		fieldname: "projekt",
		fieldtype: "Link",
		options: "PH Projekt",
		label: __("Projekt"),
		change() {
			const v = feld.get_value();
			if (v && v !== state.projekt) frappe.set_route("ph-auftragsmappe", { projekt: v });
		},
	});
	page.set_primary_action(__("Projekt öffnen"), () => state.projekt && frappe.set_route("Form", "PH Projekt", state.projekt));
	page.add_menu_item(__("Statusbericht drucken"), () => state.projekt && window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=PH%20Projekt&name=${encodeURIComponent(state.projekt)}&format=${encodeURIComponent("PH Projekt Statusbericht")}&no_letterhead=1`));
	page.add_menu_item(__("Aktualisieren"), () => laden());
	page.add_action_icon("refresh", () => laden());

	const $body = $(`<div class="ph-mappe-wrap" style="padding:0 4px 24px"></div>`).appendTo(page.body);

	function laden() {
		const r = frappe.route_options || {};
		state.projekt = r.projekt || state.projekt || feld.get_value();
		frappe.route_options = null;
		if (!state.projekt) {
			$body.html(`<div class="ph-leer" style="padding:30px 0">${__("Bitte oben ein Projekt wählen.")}</div>`);
			return;
		}
		if (feld.get_value() !== state.projekt) feld.set_value(state.projekt);
		$body.html(`<div class="text-muted" style="padding:20px 0">${__("Auftragsmappe wird geladen …")}</div>`);
		frappe.call({ method: "ph_projekte.api.auftragsmappe", args: { projekt: state.projekt } }).then((res) => render(res.message || {}));
	}

	function render(d) {
		const p = d.projekt || {};
		const esc = frappe.utils.escape_html;
		const datum = (v) => (v ? frappe.datetime.str_to_user(String(v).slice(0, 10)) : "–");
		const dt = (v) => (v ? frappe.datetime.str_to_user(String(v).slice(0, 16)) : "–");
		const eur = (c) => (c == null ? "–" : format_currency(c / 100, "EUR"));
		const link = (doctype, name, label) => `<a href="/app/${frappe.router.slug(doctype)}/${encodeURIComponent(name)}">${esc(label || name)}</a>`;
		const pill = (text, klasse) => `<span class="ph-pill ${klasse || ""}">${esc(text || "")}</span>`;
		const statusKlasse = (s) => (["Abgeschlossen", "Erledigt", "Abgenommen", "Freigegeben", "Bezahlt", "Geliefert"].includes(s) ? "gruen" : ["Abgebrochen", "Storniert", "Ueberfaellig"].includes(s) ? "rot" : ["Feedback offen", "Mit Maengeln", "In Arbeit", "Offen"].includes(s) ? "orange" : "blau");
		const phasen = ["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe"];
		const aktiv = phasen.indexOf(p.status);
		const phasenHtml = phasen.map((ph, i) => `<div class="ph-phase ${i < aktiv || p.status === "Abgeschlossen" ? "erledigt" : i === aktiv ? "aktiv" : ""}">${esc(ph === "Uebergabe" ? "Übergabe" : ph)}</div>`).join("");
		const k = d.kontakt || {};
		const kontaktZeile = [k.email, k.telefon || k.mobil].filter(Boolean).map(esc).join(" · ");
		const adresse = [p.objekt_strasse, [p.objekt_plz, p.objekt_ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");

		const karte = (titel, inhalt, klasse = "", zahl = null) => `<section class="ph-mappe-karte ${klasse}"><h4>${esc(titel)}${zahl != null ? `<span class="ph-zahl">${zahl}</span>` : ""}</h4>${inhalt}</section>`;
		const tabelle = (kopf, zeilen) => (zeilen.length ? `<table class="ph-tabelle"><thead><tr>${kopf.map((h) => `<th class="${h.zahl ? "zahl" : ""}">${esc(h.label)}</th>`).join("")}</tr></thead><tbody>${zeilen.join("")}</tbody></table>` : `<div class="ph-leer">${__("Keine Einträge")}</div>`);
		const leer = `<div class="ph-leer">${__("Keine Einträge")}</div>`;

		// Belege (ph_faktura / ph_shop) – nur wenn App installiert; Beträge nur, wenn geliefert (Leitung)
		const belege = [];
		(d.angebote || []).forEach((x) => belege.push(`<tr><td>${pill("Angebot", "blau")}</td><td>${link("PH Angebot", x.name)}</td><td>${datum(x.datum)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td class="zahl">${x.brutto_cent != null ? eur(x.brutto_cent) : ""}</td></tr>`));
		(d.auftraege || []).forEach((x) => belege.push(`<tr><td>${pill("AB", "gruen")}</td><td>${link("PH Auftragsbestaetigung", x.name)}</td><td>${datum(x.datum)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td class="zahl">${x.auftragswert_cent != null ? eur(x.auftragswert_cent) : ""}</td></tr>`));
		(d.rechnungen || []).forEach((x) => belege.push(`<tr><td>${pill(x.art || "Rechnung", "orange")}</td><td>${link("PH Rechnung", x.name)}</td><td>${datum(x.datum)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td class="zahl">${x.brutto_cent != null ? `${eur(x.brutto_cent)}${x.offen_cent ? ` <span style="color:#b91c1c">(${__("offen")} ${eur(x.offen_cent)})</span>` : ""}` : ""}</td></tr>`));
		(d.lieferscheine || []).forEach((x) => belege.push(`<tr><td>${pill("Lieferschein")}</td><td>${link("PH Lieferschein", x.name)}</td><td>${datum(x.datum)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td></td></tr>`));
		(d.zahlungen || []).forEach((x) => belege.push(`<tr><td>${pill("Zahlung", "gruen")}</td><td>${link("PH Zahlung", x.name)}</td><td>${datum(x.bezahlt_am)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td class="zahl">${x.betrag_cent != null ? eur(x.betrag_cent) : ""}</td></tr>`));
		const apps = d.apps || {};
		const belegeHinweis = !apps["PH Angebot"] ? `<div class="ph-leer">${__("ph_faktura ist noch nicht installiert – Angebote, Aufträge und Rechnungen erscheinen hier nach der Installation.")}</div>` : "";
		const belegeHtml = belegeHinweis + (belege.length ? tabelle([{ label: "Art" }, { label: "Nr." }, { label: "Datum" }, { label: "Status" }, { label: "Betrag", zahl: 1 }], belege) : apps["PH Angebot"] ? leer : "");

		// Zahlungsstand (Leitung)
		const s = d.summen;
		const summenHtml = s
			? `<div class="ph-summen">${[["Budget", s.budget_cent], ["Auftragswert", s.auftragswert_cent], ["Anzahlung", s.anzahlung_cent], ["Bezahlt", s.bezahlt_cent], ["Offen", s.offen_cent]].map(([l, v]) => `<div class="ph-summe"><div class="l">${esc(l)}</div><div class="w">${eur(v || 0)}</div></div>`).join("")}<div class="ph-summe"><div class="l">${__("Zeit erfasst")}</div><div class="w">${((s.zeit_min_gesamt || 0) / 60).toFixed(1)} h</div></div></div><div class="text-muted" style="font-size:11px;margin-top:6px">${__("Summen aus ph_faktura (nächtlich oder über „Summen aktualisieren“ im Projekt).")}</div>`
			: `<div class="ph-leer">${__("Beträge sind der Leitung vorbehalten.")}</div>`;

		// Dokumente, Pläne, Renderings
		const dokHtml = tabelle([{ label: "Titel" }, { label: "Kategorie" }, { label: "Datum" }, { label: "Version" }, { label: "Portal" }], (d.dokumente || []).map((x) => `<tr><td>${link("PH Projekt Dokument", x.name, x.titel)} ${x.datei ? `<a href="${esc(x.datei)}" target="_blank" title="${__("Datei öffnen")}">↗</a>` : ""}</td><td>${pill(x.kategorie)}</td><td>${datum(x.datum)}</td><td>V${x.version || 1}</td><td>${x.kunde_sichtbar ? pill(__("sichtbar"), "gruen") : pill(__("intern"))}</td></tr>`));
		const planHtml = tabelle([{ label: "Planung" }, { label: "Quelle" }, { label: "Status" }, { label: "Datei" }], (d.planungen || []).map((x) => `<tr><td>${link("PH Planung", x.name, x.titel)}</td><td>${esc(x.quelle_planung || "")}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td>${x.datei ? `<a href="${esc(x.datei)}" target="_blank">${__("öffnen")}</a>` : "–"}</td></tr>`));
		const renHtml = tabelle([{ label: "Rendering" }, { label: "Status" }, { label: "Feedback" }, { label: "Votes" }], (d.renderings || []).map((x) => `<tr><td>${link("PH Rendering", x.name, x.titel)}${x.ki_generiert ? ` ${pill("KI", "orange")}` : ""}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td>${x.feedback_offen ? `<b style="color:#b45309">${x.feedback_offen} ${__("offen")}</b> / ` : ""}${x.feedback_anzahl || 0}</td><td>👍 ${x.votes_up || 0} 👎 ${x.votes_down || 0}</td></tr>`));

		// Galerie
		const bilder = [];
		(d.renderings || []).forEach((x) => x.bild && bilder.push({ src: x.bild, tag: "Rendering", href: `/app/ph-rendering/${encodeURIComponent(x.name)}` }));
		(d.fotos || []).forEach((x) => x.bild && bilder.push({ src: x.bild, tag: x.phase, href: `/app/ph-tagebuch-foto/${encodeURIComponent(x.name)}` }));
		(d.dokumente || []).forEach((x) => x.mime && x.mime.startsWith("image/") && bilder.push({ src: x.datei, tag: x.kategorie, href: `/app/ph-projekt-dokument/${encodeURIComponent(x.name)}` }));
		const galerieHtml = bilder.length ? `<div class="ph-galerie">${bilder.slice(0, 40).map((b) => `<a href="${b.href}"><img src="${esc(b.src)}" loading="lazy" alt=""><span class="ph-tag">${esc(b.tag)}</span></a>`).join("")}</div>` : leer;

		// Termine
		const termine = [];
		(d.montagen || []).forEach((x) => termine.push({ wann: x.start, art: "Montage", was: link("PH Montageauftrag", x.name, x.titel), status: x.status, wer: x.montageleiter || "" }));
		(d.gewerke || []).forEach((x) => x.termin_von && termine.push({ wann: x.termin_von, art: x.gewerk, was: link("PH Fremdgewerk", x.name, x.partner_text || "Partnerbetrieb (Name folgt)"), status: x.status, wer: x.leistung || "" }));
		(d.termine || []).forEach((x) => termine.push({ wann: x.start, art: x.terminart || "Termin", was: link("PH Termin", x.name), status: x.status, wer: x.modus || "" }));
		if (p.liefertermin_geplant) termine.push({ wann: p.liefertermin_geplant, art: "Lieferung (geplant)", was: esc(p.titel), status: p.status, wer: "" });
		termine.sort((a, b) => String(a.wann).localeCompare(String(b.wann)));
		const termineHtml = tabelle([{ label: "Wann" }, { label: "Art" }, { label: "Was" }, { label: "Status" }, { label: "Wer / Umfang" }], termine.map((t) => `<tr><td>${dt(t.wann)}</td><td>${pill(t.art)}</td><td>${t.was}</td><td>${pill(t.status, statusKlasse(t.status))}</td><td>${esc(t.wer)}</td></tr>`));

		// Bestellung/Lieferung (ph_sortiment/ph_logistik), Service
		const hbHtml = apps["PH Herstellerbestellung"] ? tabelle([{ label: "Bestellung" }, { label: "Lieferant" }, { label: "Status" }, { label: "Liefertermin" }], (d.herstellerbestellungen || []).map((x) => `<tr><td>${link("PH Herstellerbestellung", x.name)}</td><td>${esc(x.lieferant || "")}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td>${datum(x.liefertermin_bestaetigt)}</td></tr>`)) : `<div class="ph-leer">${__("ph_sortiment-Bestellungen erscheinen hier, sobald die DocType PH Herstellerbestellung installiert ist.")}</div>`;
		const svHtml = apps["PH Servicefall"] ? tabelle([{ label: "Servicefall" }, { label: "Status" }], (d.servicefaelle || []).map((x) => `<tr><td>${link("PH Servicefall", x.name, x.titel)}</td><td>${pill(x.status, statusKlasse(x.status))}</td></tr>`)) : `<div class="ph-leer">${__("ph_service ist noch nicht installiert.")}</div>`;

		// Abnahmen, Produktpässe, Aufgaben, Zeiten, Nachrichten, Feedback
		const abnHtml = tabelle([{ label: "Abnahme" }, { label: "Datum" }, { label: "Status" }, { label: "Mängel offen", zahl: 1 }], (d.abnahmen || []).map((x) => `<tr><td>${link("PH Abnahme", x.name, x.titel)}</td><td>${datum(x.datum)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td class="zahl">${x.maengel_offen ? `<b style="color:#b91c1c">${x.maengel_offen}</b>` : 0}</td></tr>`));
		const ppHtml = tabelle([{ label: "Produktpass" }, { label: "Geliefert" }, { label: "Garantie bis" }, { label: "Status" }], (d.produktpaesse || []).map((x) => `<tr><td>${link("PH Produktpass", x.name, x.titel)}</td><td>${datum(x.lieferdatum)}</td><td>${datum(x.garantie_bis)}</td><td>${pill(x.status, statusKlasse(x.status))}</td></tr>`));
		const aufHtml = tabelle([{ label: "Aufgabe" }, { label: "Fällig" }, { label: "Zuständig" }, { label: "Status" }], (d.aufgaben || []).map((x) => `<tr><td>${link("PH Projekt Aufgabe", x.name, x.titel)}</td><td>${datum(x.faellig)}</td><td>${esc(x.zugewiesen_an || "")}</td><td>${pill(x.status, statusKlasse(x.status))}</td></tr>`));
		const zeitHtml = tabelle([{ label: "Datum" }, { label: "Wer" }, { label: "Tätigkeit" }, { label: "Minuten", zahl: 1 }, { label: "Status" }], (d.zeiten || []).map((x) => `<tr><td>${datum(x.datum)}</td><td>${esc(x.user)}</td><td>${esc(x.taetigkeit)}</td><td class="zahl">${x.dauer_min}</td><td>${pill(x.status, statusKlasse(x.status))}</td></tr>`));
		const nachHtml = (d.nachrichten || []).length ? (d.nachrichten || []).map((x) => `<div style="background:${x.richtung === "eingehend" ? "#faf8f4" : "#eef2ff"};border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px"><div style="color:#6b7280">${x.richtung === "eingehend" ? "←" : "→"} ${esc(x.autor || "")} · ${dt(x.gesendet_am)} ${x.status === "Ungelesen" && x.richtung === "eingehend" ? pill(__("ungelesen"), "orange") : ""}</div>${esc(x.text)}</div>`).join("") : leer;
		const fbHtml = (d.feedback_offen || []).length ? (d.feedback_offen || []).map((x) => `<div style="border-left:3px solid #b45309;padding:4px 8px;margin-bottom:6px;font-size:12px"><a href="/app/ph-rendering-feedback/${encodeURIComponent(x.name)}">${esc(x.titel)}</a><div style="color:#6b7280">${dt(x.erstellt_am)}</div></div>`).join("") : `<div class="ph-leer">${__("Keine offenen Rückmeldungen")}</div>`;
		const refHtml = (d.referenzen || []).length ? tabelle([{ label: "Referenz" }, { label: "Status" }, { label: "Slug" }], (d.referenzen || []).map((x) => `<tr><td>${link("PH Referenz", x.name, x.titel || x.name)}</td><td>${pill(x.status, statusKlasse(x.status))}</td><td>${esc(x.slug || "")}</td></tr>`)) : "";

		// Schnellaktionen
		const neu = (doctype, label) => `<button class="btn btn-xs btn-default ph-neu" data-dt="${doctype}">${esc(label)}</button>`;
		const aktionen = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${neu("PH Projekt Dokument", __("+ Dokument"))}${neu("PH Planung", __("+ Planung"))}${neu("PH Rendering", __("+ Rendering"))}${neu("PH Montageauftrag", __("+ Montage"))}${neu("PH Fremdgewerk", __("+ Gewerk"))}${neu("PH Projekt Aufgabe", __("+ Aufgabe"))}${neu("PH Projektzeit", __("+ Zeit"))}${neu("PH Projekt Nachricht", __("+ Nachricht"))}${apps["PH Angebot"] ? neu("PH Angebot", __("+ Angebot")) : ""}</div>`;

		$body.html(`
			<section class="ph-mappe-karte" style="margin-bottom:14px">
				<div class="ph-mappe-kopf">
					<div style="flex:1;min-width:260px"><div class="ph-titel">${esc(p.titel || "")}</div>
						<div class="ph-meta">${esc(p.name)} · ${esc(p.projektart || "")} · ${__("Berater")}: ${esc(p.berater || "–")} · ${__("Beginn")} ${datum(p.eingang)}${p.prioritaet && p.prioritaet !== "Normal" ? ` · ${pill(p.prioritaet, "rot")}` : ""}</div>
						<div class="ph-meta" style="margin-top:4px"><b>${esc(p.kunde_name || "")}</b>${kontaktZeile ? ` · ${kontaktZeile}` : ""}${k.name ? ` · <a href="/app/ph-kontakt/${encodeURIComponent(k.name)}">${__("Kontakt")}</a>` : ""}${k.portal_aktiv ? ` · ${pill(__("Portal aktiv"), "gruen")}` : ""}</div>
						<div class="ph-meta">${__("Objekt")}: ${esc(adresse || "–")}${p.objekt_hinweis ? ` · ${esc(p.objekt_hinweis)}` : ""}</div>
					</div>
					<div style="text-align:right"><div style="font-size:11px;color:#6b7280;letter-spacing:.06em;text-transform:uppercase">${__("Phase")}</div><div style="font-size:20px;font-weight:600;color:#30373e">${esc(p.status === "Uebergabe" ? "Übergabe" : p.status || "")}</div>${p.portal_sichtbar ? "" : pill(__("nicht im Portal"), "orange")}</div>
				</div>
				<div class="ph-phasen">${phasenHtml}</div>
				${aktionen}
			</section>
			<div class="ph-mappe">
				${karte(__("Belege"), belegeHtml, "halb", belege.length)}
				${karte(__("Zahlungsstand"), summenHtml, "halb")}
				${karte(__("Termine"), termineHtml, "halb", termine.length)}
				${karte(__("Offene Kundenrückmeldungen"), fbHtml, "halb", (d.feedback_offen || []).length)}
				${karte(__("Dokumente"), dokHtml, "halb", (d.dokumente || []).length)}
				${karte(__("Pläne"), planHtml + "<h4 style='margin-top:14px'>" + __("Renderings") + "</h4>" + renHtml, "halb")}
				${karte(__("Galerie"), galerieHtml, "", bilder.length)}
				${karte(__("Herstellerbestellungen"), hbHtml, "halb")}
				${karte(__("Abnahmen"), abnHtml, "halb")}
				${karte(__("Produktpässe"), ppHtml, "halb", (d.produktpaesse || []).length)}
				${karte(__("Servicefälle"), svHtml, "halb")}
				${karte(__("Aufgaben"), aufHtml, "halb", (d.aufgaben || []).length)}
				${karte(__("Zeiten"), zeitHtml, "halb")}
				${karte(__("Nachrichten"), nachHtml, "halb")}
				${refHtml ? karte(__("Referenz-Freigaben"), refHtml, "halb") : ""}
			</div>`);
		$body.find(".ph-neu").on("click", function () {
			frappe.new_doc(this.dataset.dt, { projekt: state.projekt, kontakt: p.kontakt });
		});
		page.set_title(`${__("Auftragsmappe")} · ${p.titel || state.projekt}`);
	}

	wrapper.ph_laden = laden;
	laden();
};

frappe.pages["ph-auftragsmappe"].on_page_show = function (wrapper) {
	if (wrapper.ph_laden && frappe.route_options && frappe.route_options.projekt) wrapper.ph_laden();
};
