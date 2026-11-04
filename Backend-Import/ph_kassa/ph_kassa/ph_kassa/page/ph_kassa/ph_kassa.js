/* Desk-Page „ph-kassa“ – Kassen-Oberfläche Platzhirsch (WP10b).
 * Aufbau: Kopfleiste (Kasse, Trainingsmodus, Aktionen) · links Kunde/Auftrag + Belege heute ·
 * Mitte Positionen (Sortiment mit Bild, Freitext, Anzahlung, Gutschein) · rechts Beleg (Summe, Steuersätze,
 * Zahlarten mit Rückgeld-Rechner, Terminal, Buchen, Bon-Vorschau).
 * Touch: Schaltflächen ≥ 48 px. Tastatur: F2 Kunde · F3 Produkt · F4 Freitext · F6 Anzahlung · F7 Gutschein ·
 * F8 Bar · F9 Karte · F10 Überweisung · F12 Buchen · Esc neuer Beleg · Strg+P letzten Bon nachdrucken.
 * Kundendisplay: /app/ph-kassa?display=1&kasse=<ID> (zweites Fenster, frappe.realtime).
 * Server: ph_kassa/ph_kassa/ph_kassa/page/ph_kassa/ph_kassa.py – alle Beträge in Cent.
 */

frappe.pages["ph-kassa"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Kassa"), single_column: true });
	wrapper.ph_kassa = new PHKassa(page, wrapper);
};

frappe.pages["ph-kassa"].on_page_show = function (wrapper) {
	wrapper.ph_kassa && wrapper.ph_kassa.route_aktualisieren();
};

const PH_METHODE = "ph_kassa.ph_kassa.ph_kassa.page.ph_kassa.ph_kassa.";
const eur = (cent) => {
	const v = (Number(cent || 0) / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return `${v} €`;
};
const esc = (s) => frappe.utils.escape_html(String(s == null ? "" : s));
const parseCent = (text) => {
	const t = String(text || "").trim().replace(/€/g, "").replace(/\s/g, "");
	if (!t) return 0;
	const norm = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
	const f = parseFloat(norm);
	return isNaN(f) ? 0 : Math.round(f * 100);
};

class PHKassa {
	constructor(page, wrapper) {
		this.page = page;
		this.wrapper = wrapper;
		this.$body = $(wrapper).find(".layout-main-section");
		this.display_modus = frappe.utils.get_url_arg("display") === "1";
		this.kasse = frappe.utils.get_url_arg("kasse") || null;
		this.ctx = null;
		this.reset_beleg();
		this.css_einbinden();
		if (this.display_modus) {
			this.render_display();
		} else {
			this.laden();
		}
	}

	route_aktualisieren() {
		const k = frappe.utils.get_url_arg("kasse");
		if (k && this.ctx && k !== this.kasse) {
			this.kasse = k;
			this.laden();
		}
	}

	reset_beleg() {
		this.beleg = { kunde: null, auftrag: null, rechnung: null, bestellung: null, positionen: [], zahlarten: [], email: null };
		this.vorschau = null;
		this.terminal = null; // {terminal, payment_intent, status, timer}
		this.letztes_ergebnis = null;
	}

	// ── Laden / Rendern ─────────────────────────────────────────────────

	laden() {
		this.$body.html(`<div class="phk-laden">${__("Kassa wird geladen …")}</div>`);
		frappe.call({ method: PH_METHODE + "kontext", args: { kasse: this.kasse } }).then((r) => {
			this.ctx = r.message;
			this.kasse = this.ctx.kasse;
			this.render();
			this.belege_heute_laden();
			this.tasten_binden();
		});
	}

	render() {
		const c = this.ctx;
		this.page.set_title(__("Kassa") + (c.kasse_doc ? ` · ${esc(c.kasse_doc.bezeichnung || c.kasse)}` : ""));
		const kassen = (c.kassen || []).map((k) => `<option value="${esc(k.name)}" ${k.name === c.kasse ? "selected" : ""}>${esc(k.bezeichnung || k.name)}</option>`).join("");
		const banner = [];
		if (!c.doctypes["PH Kasse"] || !c.doctypes["PH Kassenbeleg"]) banner.push(`<div class="phk-banner phk-banner-rot">${__("RKSV-Kern (WP10a) ist nicht installiert – Belege können nicht signiert werden.")}</div>`);
		if (!c.kern_vorhanden && c.mock_erlaubt) banner.push(`<div class="phk-banner phk-banner-orange">${__("Mock-Kern aktiv (Staging): Belege ohne echte Signatur.")}</div>`);
		this.$body.html(`
		<div class="phk ${c.trainings ? "phk-training" : ""}">
		  <div class="phk-kopf">
		    <div class="phk-titel"><span class="phk-wortmarke">PLATZHIRSCH</span><span class="phk-sub">${__("Kassa")}</span></div>
		    <div class="phk-kopf-mitte">
		      <label class="phk-kasse-wahl">${__("Kasse")} <select class="phk-kasse">${kassen || `<option>${__("keine Kasse")}</option>`}</select></label>
		      <div class="phk-kennzahl"><span>${__("Heute kassiert")}</span><b class="phk-heute">${eur(c.heute_umsatz_cent)}</b></div>
		      <div class="phk-kennzahl"><span>${__("Bargeld laut Kassenbuch")}</span><b class="phk-bestand">${eur(c.bargeld_bestand_cent)}</b></div>
		      <div class="phk-kennzahl"><span>${__("Bedienung")}</span><b>${esc(c.user_name || c.user)}</b></div>
		    </div>
		    <div class="phk-kopf-rechts">
		      <label class="phk-schalter"><input type="checkbox" class="phk-trainings" ${c.trainings ? "checked" : ""}><span>${__("Trainingsmodus")}</span></label>
		      <div class="phk-aktionen">
		        <button class="phk-btn phk-btn-klein" data-aktion="nachdruck" title="Strg+P">${__("Letzten Bon nachdrucken")}</button>
		        <button class="phk-btn phk-btn-klein" data-aktion="email">${__("Beleg per E-Mail")}</button>
		        <button class="phk-btn phk-btn-klein" data-aktion="storno">${__("Storno")}</button>
		        <button class="phk-btn phk-btn-klein" data-aktion="nullbeleg">${__("Nullbeleg")}</button>
		        <button class="phk-btn phk-btn-klein" data-aktion="kassenbuch">${__("Einlage / Entnahme")}</button>
		        <button class="phk-btn phk-btn-klein phk-btn-dunkel" data-aktion="abschluss">${__("Tagesabschluss")}</button>
		      </div>
		    </div>
		  </div>
		  <div class="phk-banner-zeile">
		    ${c.trainings ? `<div class="phk-banner phk-banner-orange">${esc(c.einstellungen.trainings_banner_text)}</div>` : ""}
		    ${c.gesperrt ? `<div class="phk-banner phk-banner-rot">${__("Diese Kasse ist für heute abgeschlossen. Belege erst nach Öffnung durch die Leitung.")}</div>` : ""}
		    ${banner.join("")}
		  </div>
		  <div class="phk-spalten">
		    <section class="phk-spalte phk-kunde">
		      <h2>${__("Kunde / Auftrag")} <kbd>F2</kbd></h2>
		      <input class="phk-eingabe phk-kunde-suche" placeholder="${__("Name, E-Mail, Telefon, AB-Nummer …")}" autocomplete="off">
		      <div class="phk-kunde-treffer"></div>
		      <div class="phk-kunde-karte"></div>
		      <h2 class="phk-h2-klein">${__("Belege heute")}</h2>
		      <div class="phk-belege-heute"><div class="phk-leer">${__("Noch keine Belege.")}</div></div>
		    </section>
		    <section class="phk-spalte phk-positionen">
		      <h2>${__("Positionen")} <kbd>F3</kbd></h2>
		      <input class="phk-eingabe phk-produkt-suche" placeholder="${__("Produkt, Marke, EAN oder Scan …")}" autocomplete="off">
		      <div class="phk-produkt-treffer"></div>
		      <div class="phk-schnell">
		        <button class="phk-btn" data-aktion="freitext">${__("Freitext")} <kbd>F4</kbd></button>
		        <button class="phk-btn" data-aktion="anzahlung">${__("Anzahlung auf Auftrag")} <kbd>F6</kbd></button>
		        <button class="phk-btn" data-aktion="gutschein_verkauf">${__("Gutschein verkaufen")} <kbd>F7</kbd></button>
		        <button class="phk-btn" data-aktion="gutschein_einloesen">${__("Gutschein einlösen")}</button>
		      </div>
		      <div class="phk-positionsliste"></div>
		    </section>
		    <section class="phk-spalte phk-beleg">
		      <div class="phk-summe-box">
		        <span>${__("Summe")}</span>
		        <b class="phk-summe">0,00 €</b>
		        <div class="phk-saetze"></div>
		      </div>
		      <h2>${__("Zahlart")}</h2>
		      <div class="phk-zahlarten">
		        <button class="phk-btn phk-btn-zahl" data-zahlart="Bar">${__("Bar")} <kbd>F8</kbd></button>
		        <button class="phk-btn phk-btn-zahl" data-zahlart="Karte Stripe Terminal">${__("Karte")} <kbd>F9</kbd></button>
		        <button class="phk-btn phk-btn-zahl" data-zahlart="Gutschein">${__("Gutschein")}</button>
		        <button class="phk-btn phk-btn-zahl" data-zahlart="Ueberweisung">${__("Überweisung")} <kbd>F10</kbd></button>
		      </div>
		      <div class="phk-zahlliste"></div>
		      <div class="phk-rueckgeld"></div>
		      <div class="phk-terminal"></div>
		      <button class="phk-btn phk-btn-buchen" data-aktion="buchen">${__("Beleg buchen & drucken")} <kbd>F12</kbd></button>
		      <button class="phk-btn phk-btn-klein phk-btn-neu" data-aktion="neu">${__("Neuer Beleg")} <kbd>Esc</kbd></button>
		      <h2 class="phk-h2-klein">${__("Belegvorschau")}</h2>
		      <pre class="phk-vorschau">${__("Positionen erfassen …")}</pre>
		    </section>
		  </div>
		  <div class="phk-fuss">${__("Belegerstellungspflicht § 132a BAO · Signatur RKSV · Kartenzahlungen sind Barumsätze.")} ${c.einstellungen.kundendisplay_aktiv ? `<a href="/app/ph-kassa?display=1&kasse=${encodeURIComponent(c.kasse)}" target="_blank">${__("Kundendisplay öffnen")}</a>` : ""}</div>
		</div>`);
		this.ereignisse_binden();
		this.render_positionen();
		this.render_zahlarten();
	}

	ereignisse_binden() {
		const $b = this.$body;
		$b.find(".phk-kasse").on("change", (e) => { this.kasse = e.target.value; frappe.set_route("ph-kassa", { kasse: this.kasse }); this.laden(); });
		$b.find(".phk-trainings").on("change", (e) => this.trainings_setzen(e.target.checked ? 1 : 0));
		$b.on("click", "[data-aktion]", (e) => this.aktion($(e.currentTarget).data("aktion"), e));
		$b.on("click", "[data-zahlart]", (e) => this.zahlart_hinzufuegen($(e.currentTarget).data("zahlart")));
		const kundeSuche = frappe.utils.debounce(() => this.kunde_suchen(), 250);
		$b.find(".phk-kunde-suche").on("input", kundeSuche);
		const produktSuche = frappe.utils.debounce(() => this.produkt_suchen(), 250);
		$b.find(".phk-produkt-suche").on("input", produktSuche).on("keydown", (e) => {
			if (e.key === "Enter") { // Scanner sendet Enter: ersten Treffer übernehmen
				const erster = this.produkt_treffer && this.produkt_treffer[0];
				if (erster) { this.position_hinzufuegen({ art: "Artikel", produkt: erster.produkt, bezeichnung: erster.bezeichnung, menge: 1, einzel_brutto_cent: erster.einzel_brutto_cent, steuersatz: erster.steuersatz }); e.target.value = ""; this.$body.find(".phk-produkt-treffer").empty(); }
			}
		});
		$b.on("click", ".phk-treffer-kunde", (e) => this.kunde_waehlen($(e.currentTarget).data("idx")));
		$b.on("click", ".phk-treffer-produkt", (e) => { const p = this.produkt_treffer[$(e.currentTarget).data("idx")]; this.position_hinzufuegen({ art: "Artikel", produkt: p.produkt, bezeichnung: p.bezeichnung, menge: 1, einzel_brutto_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz }); });
		$b.on("click", ".phk-pos-plus", (e) => this.position_menge($(e.currentTarget).data("idx"), 1));
		$b.on("click", ".phk-pos-minus", (e) => this.position_menge($(e.currentTarget).data("idx"), -1));
		$b.on("click", ".phk-pos-weg", (e) => { this.beleg.positionen.splice($(e.currentTarget).data("idx"), 1); this.render_positionen(); });
		$b.on("click", ".phk-pos-edit", (e) => this.position_bearbeiten($(e.currentTarget).data("idx")));
		$b.on("click", ".phk-zahl-weg", (e) => { this.beleg.zahlarten.splice($(e.currentTarget).data("idx"), 1); this.render_zahlarten(); });
		$b.on("click", ".phk-bar-schnell", (e) => this.bar_gegeben($(e.currentTarget).data("cent")));
		$b.on("input", ".phk-bar-eingabe", (e) => this.bar_gegeben(parseCent(e.target.value), true));
		$b.on("click", ".phk-anzahlung-btn", (e) => this.anzahlung_dialog($(e.currentTarget).data("auftrag")));
		$b.on("click", ".phk-rechnung-btn", (e) => this.rechnung_zahlen($(e.currentTarget).data("rechnung"), $(e.currentTarget).data("cent")));
		$b.on("click", ".phk-kunde-weg", () => { this.beleg.kunde = null; this.beleg.auftrag = null; this.render_kunde(); });
		$b.on("click", ".phk-beleg-heute", (e) => this.beleg_heute_menue($(e.currentTarget).data("name"), $(e.currentTarget).data("nr")));
		$b.on("click", "[data-terminal-aktion]", (e) => this.terminal_aktion($(e.currentTarget).data("terminal-aktion")));
	}

	tasten_binden() {
		if (this._tasten) return;
		this._tasten = (e) => {
			if (!$(this.wrapper).is(":visible")) return;
			const map = { F2: () => this.$body.find(".phk-kunde-suche").focus(), F3: () => this.$body.find(".phk-produkt-suche").focus(), F4: () => this.aktion("freitext"), F6: () => this.aktion("anzahlung"), F7: () => this.aktion("gutschein_verkauf"), F8: () => this.zahlart_hinzufuegen("Bar"), F9: () => this.zahlart_hinzufuegen("Karte Stripe Terminal"), F10: () => this.zahlart_hinzufuegen("Ueberweisung"), F12: () => this.aktion("buchen"), Escape: () => this.aktion("neu") };
			if (e.ctrlKey && e.key.toLowerCase() === "p") { e.preventDefault(); this.aktion("nachdruck"); return; }
			if (map[e.key] && !(e.key === "Escape" && $(".modal:visible").length)) { e.preventDefault(); map[e.key](); }
		};
		document.addEventListener("keydown", this._tasten);
	}

	// ── Kunde ────────────────────────────────────────────────────────────

	kunde_suchen() {
		const q = this.$body.find(".phk-kunde-suche").val();
		if (!q || q.length < 2) { this.$body.find(".phk-kunde-treffer").empty(); return; }
		frappe.call({ method: PH_METHODE + "suche_kunde", args: { q } }).then((r) => {
			this.kunde_treffer = r.message || [];
			const html = this.kunde_treffer.length ? this.kunde_treffer.map((k, i) => `<button class="phk-treffer phk-treffer-kunde" data-idx="${i}"><b>${esc(k.titel)}</b><span>${esc(k.untertitel || "")}</span>${k.auftraege.length ? `<em>${k.auftraege.length} ${__("Aufträge")}</em>` : ""}</button>`).join("") : `<div class="phk-leer">${__("Keine Treffer.")}</div>`;
			this.$body.find(".phk-kunde-treffer").html(html);
		});
	}

	kunde_waehlen(idx) {
		const k = this.kunde_treffer[idx];
		this.beleg.kunde = k;
		this.beleg.email = k.email || null;
		this.$body.find(".phk-kunde-treffer").empty();
		this.$body.find(".phk-kunde-suche").val("");
		this.render_kunde();
		this.vorschau_aktualisieren();
	}

	render_kunde() {
		const k = this.beleg.kunde;
		const $k = this.$body.find(".phk-kunde-karte");
		if (!k) { $k.html(`<div class="phk-leer">${__("Kein Kunde – Barverkauf ohne Namen.")}</div>`); return; }
		const auftraege = (k.auftraege || []).map((a) => `<div class="phk-zeile"><div><b>${esc(a.auftrag)}</b><span>${esc(a.status || "")} · ${__("Auftragswert")} ${eur(a.auftragswert_cent)}</span></div>${a.anzahlung_offen_cent > 0 ? `<button class="phk-btn phk-btn-klein phk-anzahlung-btn" data-auftrag="${esc(a.auftrag)}">${__("Anzahlung")} ${eur(a.anzahlung_offen_cent)}</button>` : `<button class="phk-btn phk-btn-klein phk-anzahlung-btn" data-auftrag="${esc(a.auftrag)}">${__("Zahlung")}</button>`}</div>`).join("");
		const rechnungen = (k.rechnungen || []).map((r) => `<div class="phk-zeile"><div><b>${esc(r.rechnung)}</b><span>${esc(r.art || "")} · ${__("offen")} ${eur(r.offen_cent)}</span></div><button class="phk-btn phk-btn-klein phk-rechnung-btn" data-rechnung="${esc(r.rechnung)}" data-cent="${r.offen_cent}">${__("Bezahlen")}</button></div>`).join("");
		const bestellungen = (k.bestellungen || []).map((b) => `<div class="phk-zeile"><div><b>${esc(b.bestellung)}</b><span>${esc(b.status || "")} · ${eur(b.gesamt_cent)}</span></div></div>`).join("");
		$k.html(`<div class="phk-karte"><div class="phk-karte-kopf"><b>${esc(k.titel)}</b><button class="phk-link phk-kunde-weg">${__("entfernen")}</button></div><span>${esc(k.untertitel || "")}${k.email ? ` · ${esc(k.email)}` : ""}</span>${auftraege ? `<h3>${__("Aufträge")}</h3>${auftraege}` : ""}${rechnungen ? `<h3>${__("Offene Rechnungen")}</h3>${rechnungen}` : ""}${bestellungen ? `<h3>${__("Bestellungen")}</h3>${bestellungen}` : ""}</div>`);
	}

	// ── Positionen ───────────────────────────────────────────────────────

	produkt_suchen() {
		const q = this.$body.find(".phk-produkt-suche").val();
		if (!q || q.length < 2) { this.$body.find(".phk-produkt-treffer").empty(); return; }
		frappe.call({ method: PH_METHODE + "suche_produkt", args: { q } }).then((r) => {
			this.produkt_treffer = r.message || [];
			const html = this.produkt_treffer.length ? this.produkt_treffer.map((p, i) => `<button class="phk-kachel phk-treffer-produkt" data-idx="${i}">${p.bild ? `<img src="${esc(p.bild)}" alt="" loading="lazy">` : `<div class="phk-kachel-leer">${esc((p.marke || p.bezeichnung || "?").slice(0, 2).toUpperCase())}</div>`}<b>${esc(p.bezeichnung)}</b><span>${esc(p.marke || "")}</span><em>${p.einzel_brutto_cent ? eur(p.einzel_brutto_cent) : __("Preis eingeben")}</em></button>`).join("") : `<div class="phk-leer">${this.ctx.doctypes["PH Produkt"] ? __("Keine Treffer.") : __("Sortiment (ph_sortiment) noch nicht installiert – Freitext verwenden.")}</div>`;
			this.$body.find(".phk-produkt-treffer").html(html);
		});
	}

	position_hinzufuegen(pos) {
		if (pos.art === "Artikel" && !pos.einzel_brutto_cent) { this.position_dialog(pos); return; }
		const gleich = this.beleg.positionen.find((p) => p.art === "Artikel" && pos.art === "Artikel" && p.produkt && p.produkt === pos.produkt && p.einzel_brutto_cent === pos.einzel_brutto_cent);
		if (gleich) gleich.menge += pos.menge || 1; else this.beleg.positionen.push(pos);
		this.$body.find(".phk-produkt-suche").val("");
		this.$body.find(".phk-produkt-treffer").empty();
		this.render_positionen();
	}

	position_dialog(vorlage, idx) {
		const d = new frappe.ui.Dialog({
			title: vorlage.art === "Freitext" ? __("Freitext-Position") : __("Position"),
			fields: [
				{ fieldname: "bezeichnung", fieldtype: "Data", label: __("Bezeichnung"), reqd: 1, default: vorlage.bezeichnung },
				{ fieldname: "menge", fieldtype: "Float", label: __("Menge"), default: vorlage.menge || 1, reqd: 1 },
				{ fieldname: "einzel", fieldtype: "Currency", label: __("Einzelpreis brutto (€)"), default: (vorlage.einzel_brutto_cent || 0) / 100, reqd: 1 },
				{ fieldname: "steuersatz", fieldtype: "Select", label: __("Steuersatz"), options: this.ctx.steuersaetze, default: vorlage.steuersatz || this.ctx.einstellungen.standard_steuersatz, reqd: 1 },
			],
			primary_action_label: idx != null ? __("Übernehmen") : __("Hinzufügen"),
			primary_action: (v) => {
				const pos = { ...vorlage, bezeichnung: v.bezeichnung, menge: v.menge, einzel_brutto_cent: Math.round(v.einzel * 100), steuersatz: v.steuersatz };
				if (idx != null) this.beleg.positionen[idx] = pos; else this.beleg.positionen.push(pos);
				d.hide();
				this.render_positionen();
			},
		});
		d.show();
		setTimeout(() => d.get_field("bezeichnung").$input.focus(), 200);
	}

	position_bearbeiten(idx) { this.position_dialog(this.beleg.positionen[idx], idx); }

	position_menge(idx, delta) {
		const p = this.beleg.positionen[idx];
		if (!p || p.art !== "Artikel") return;
		p.menge = Math.max(1, (p.menge || 1) + delta);
		this.render_positionen();
	}

	anzahlung_dialog(auftrag) {
		const k = this.beleg.kunde || {};
		const a = (k.auftraege || []).find((x) => x.auftrag === auftrag) || { auftrag, anzahlung_offen_cent: 0, steuersatz: this.ctx.einstellungen.steuersatz_anzahlung };
		const d = new frappe.ui.Dialog({
			title: __("Anzahlung auf Auftrag {0}", [a.auftrag]),
			fields: [
				{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Anzahlung", "Teilzahlung", "Schlusszahlung"], default: a.anzahlung_offen_cent > 0 ? "Anzahlung" : "Teilzahlung", reqd: 1 },
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Betrag brutto (€)"), default: (a.anzahlung_offen_cent || a.offen_cent || 0) / 100, reqd: 1, description: a.anzahlung_offen_cent ? __("Vorschlag: offene Anzahlung laut Zahlungsplan") : "" },
				{ fieldname: "steuersatz", fieldtype: "Select", label: __("Steuersatz (nach Auftrag)"), options: this.ctx.steuersaetze, default: a.steuersatz, reqd: 1 },
			],
			primary_action_label: __("Hinzufügen"),
			primary_action: (v) => {
				this.beleg.auftrag = a.auftrag;
				this.beleg.positionen.push({ art: v.art, bezeichnung: `${__(v.art)} ${__("auf Auftrag")} ${a.auftrag}`, menge: 1, einzel_brutto_cent: Math.round(v.betrag * 100), steuersatz: v.steuersatz, bezug_doctype: "PH Auftragsbestaetigung", bezug: a.auftrag });
				d.hide();
				this.render_positionen();
			},
		});
		d.show();
	}

	rechnung_zahlen(rechnung, cent) {
		this.beleg.rechnung = rechnung;
		this.beleg.positionen.push({ art: "Schlusszahlung", bezeichnung: `${__("Zahlung Rechnung")} ${rechnung}`, menge: 1, einzel_brutto_cent: cent, steuersatz: this.ctx.einstellungen.steuersatz_anzahlung, bezug_doctype: "PH Rechnung", bezug: rechnung });
		this.render_positionen();
	}

	gutschein_verkauf_dialog() {
		const mehrzweck = this.ctx.einstellungen.gutschein_art === "Mehrzweck";
		const d = new frappe.ui.Dialog({
			title: __("Gutschein verkaufen"),
			fields: [
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Wert (€)"), reqd: 1, default: 100 },
				{ fieldname: "empfaenger", fieldtype: "Data", label: __("Für (optional)") },
				{ fieldname: "hinweis", fieldtype: "HTML", options: `<p class="text-muted">${mehrzweck ? __("Mehrzweckgutschein: Verkauf mit Steuersatz „Null 0“ (kein Umsatz, aber RKSV-Barumsatz); Umsatz entsteht bei Einlösung.") : __("Einzweckgutschein: Umsatz mit Standardsteuersatz beim Verkauf.")}</p>` },
			],
			primary_action_label: __("Hinzufügen"),
			primary_action: (v) => {
				this.beleg.positionen.push({ art: "Gutschein Verkauf", bezeichnung: `${__("Wertgutschein")}${v.empfaenger ? ` für ${v.empfaenger}` : ""}`, menge: 1, einzel_brutto_cent: Math.round(v.betrag * 100), steuersatz: mehrzweck ? "Null 0" : this.ctx.einstellungen.standard_steuersatz, zusatz: v.empfaenger });
				d.hide();
				this.render_positionen();
			},
		});
		d.show();
	}

	gutschein_einloesen_dialog() {
		const pruefen = () => frappe.call({ method: PH_METHODE + "gutschein_pruefen", args: { code: d.get_value("code") } }).then((r) => {
			d.gutschein = r.message;
			const offen = Math.max(0, (this.vorschau ? this.vorschau.gesamt_cent : 0) - this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar").reduce((s, z) => s + z.betrag_cent, 0));
			d.get_field("ergebnis").$wrapper.html(`<div class="phk-hinweis-gruen">${__("Gutschein ····{0}: Restwert {1}", [esc(r.message.letzte4), eur(r.message.rest_cent)])}</div>`);
			d.set_df_property("betrag", "hidden", 0);
			d.set_value("betrag", Math.min(r.message.rest_cent, offen || r.message.rest_cent) / 100);
		});
		const d = new frappe.ui.Dialog({
			title: __("Gutschein einlösen"),
			fields: [
				{ fieldname: "code", fieldtype: "Data", label: __("Gutscheincode (scannen oder tippen)"), reqd: 1 },
				{ fieldname: "pruefen", fieldtype: "Button", label: __("Prüfen"), click: () => pruefen() },
				{ fieldname: "ergebnis", fieldtype: "HTML" },
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Einzulösender Betrag (€)"), hidden: 1 },
			],
			primary_action_label: __("Als Zahlart übernehmen"),
			primary_action: (v) => {
				if (!d.gutschein) { frappe.msgprint(__("Bitte zuerst prüfen.")); return; }
				const betrag = Math.min(Math.round(v.betrag * 100), d.gutschein.rest_cent);
				this.beleg.zahlarten = this.beleg.zahlarten.filter((z) => z.zahlart !== "Gutschein" || z.gutschein !== d.gutschein.gutschein);
				this.beleg.zahlarten.push({ zahlart: "Gutschein", betrag_cent: betrag, gutschein: d.gutschein.gutschein, rest_cent: d.gutschein.rest_cent, letzte4: d.gutschein.letzte4 });
				d.hide();
				this.render_zahlarten();
			},
		});
		d.get_field("code").$input.on("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); pruefen(); } });
		d.show();
	}

	render_positionen() {
		const $l = this.$body.find(".phk-positionsliste");
		if (!this.beleg.positionen.length) {
			$l.html(`<div class="phk-leer phk-leer-gross">${__("Noch keine Positionen. Produkt suchen, scannen oder Freitext (F4).")}</div>`);
		} else {
			$l.html(this.beleg.positionen.map((p, i) => {
				const brutto = Math.round((p.menge || 1) * (p.einzel_brutto_cent || 0)) * (p.art === "Gutschein Einloesung" ? -1 : 1);
				return `<div class="phk-pos"><div class="phk-pos-text"><b>${esc(p.bezeichnung)}</b><span>${esc(__(p.art))} · ${esc(p.steuersatz)}${p.menge !== 1 ? ` · ${p.menge} × ${eur(p.einzel_brutto_cent)}` : ""}</span></div>${p.art === "Artikel" ? `<div class="phk-pos-menge"><button class="phk-rund phk-pos-minus" data-idx="${i}">−</button><b>${p.menge}</b><button class="phk-rund phk-pos-plus" data-idx="${i}">+</button></div>` : ""}<b class="phk-pos-betrag">${eur(brutto)}</b><button class="phk-rund phk-pos-edit" data-idx="${i}" title="${__("Bearbeiten")}">✎</button><button class="phk-rund phk-pos-weg" data-idx="${i}" title="${__("Entfernen")}">×</button></div>`;
			}).join(""));
		}
		this.vorschau_aktualisieren();
	}

	// ── Zahlarten ────────────────────────────────────────────────────────

	zahlart_hinzufuegen(zahlart) {
		if (!this.beleg.positionen.length) { frappe.show_alert({ message: __("Zuerst Positionen erfassen."), indicator: "orange" }); return; }
		if (zahlart === "Gutschein") { this.gutschein_einloesen_dialog(); return; }
		const gesamt = this.vorschau ? this.vorschau.gesamt_cent : 0;
		const ohneBar = this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar").reduce((s, z) => s + z.betrag_cent, 0);
		const offen = Math.max(0, gesamt - ohneBar);
		if (zahlart === "Bar") {
			if (this.beleg.zahlarten.some((z) => z.zahlart === "Bar")) return;
			this.beleg.zahlarten.push({ zahlart: "Bar", betrag_cent: offen, gegeben_cent: offen });
			this.render_zahlarten();
			return;
		}
		if (zahlart === "Karte Stripe Terminal") { this.karte_dialog(offen); return; }
		const d = new frappe.ui.Dialog({
			title: __(zahlart === "Ueberweisung" ? "Überweisung" : zahlart),
			fields: [{ fieldname: "betrag", fieldtype: "Currency", label: __("Betrag (€)"), default: offen / 100, reqd: 1 }],
			primary_action_label: __("Übernehmen"),
			primary_action: (v) => { this.beleg.zahlarten = this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar"); this.beleg.zahlarten.push({ zahlart, betrag_cent: Math.round(v.betrag * 100) }); d.hide(); this.render_zahlarten(); },
		});
		d.show();
	}

	karte_dialog(offen) {
		const terminals = this.ctx.terminals || [];
		if (!terminals.length) {
			frappe.confirm(__("Kein Stripe Terminal für diese Kasse. Zahlung als „Karte extern“ (bestehendes Terminal, ohne Automatik) erfassen?"), () => { this.beleg.zahlarten = this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar"); this.beleg.zahlarten.push({ zahlart: "Karte extern", betrag_cent: offen }); this.render_zahlarten(); });
			return;
		}
		const d = new frappe.ui.Dialog({
			title: __("Kartenzahlung (Stripe Terminal)"),
			fields: [
				{ fieldname: "terminal", fieldtype: "Select", label: __("Reader"), options: terminals.map((t) => ({ label: `${t.bezeichnung} (${t.status || "?"})`, value: t.reader_id })), default: terminals[0].reader_id, reqd: 1 },
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Betrag (€)"), default: offen / 100, reqd: 1 },
				{ fieldname: "extern", fieldtype: "Check", label: __("Stattdessen „Karte extern“ (ohne Terminal-Automatik)") },
			],
			primary_action_label: __("Zahlung am Reader starten"),
			primary_action: (v) => {
				const cent = Math.round(v.betrag * 100);
				this.beleg.zahlarten = this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar" && z.zahlart !== "Karte Stripe Terminal" && z.zahlart !== "Karte extern");
				if (v.extern) { this.beleg.zahlarten.push({ zahlart: "Karte extern", betrag_cent: cent }); d.hide(); this.render_zahlarten(); return; }
				d.hide();
				this.terminal_starten(v.terminal, cent);
			},
		});
		d.show();
	}

	terminal_starten(terminal, cent) {
		frappe.call({ method: PH_METHODE + "terminal_start", args: { kasse: this.kasse, terminal, betrag_cent: cent }, freeze: true, freeze_message: __("Reader wird angesprochen …") }).then((r) => {
			this.terminal = { terminal, payment_intent: r.message.payment_intent, status: r.message.status, betrag_cent: cent };
			this.beleg.zahlarten.push({ zahlart: "Karte Stripe Terminal", betrag_cent: cent, terminal, terminal_payment_intent: r.message.payment_intent });
			this.render_zahlarten();
			this.terminal_pollen();
		});
	}

	terminal_pollen() {
		if (!this.terminal) return;
		clearTimeout(this.terminal.timer);
		frappe.call({ method: PH_METHODE + "terminal_status", args: { payment_intent: this.terminal.payment_intent, terminal: this.terminal.terminal } }).then((r) => {
			if (!this.terminal) return;
			this.terminal.status = r.message.status;
			this.terminal.bezahlt = r.message.bezahlt;
			this.render_terminal();
			if (!r.message.fertig) this.terminal.timer = setTimeout(() => this.terminal_pollen(), 2000);
			else if (r.message.bezahlt) frappe.show_alert({ message: __("Kartenzahlung bestätigt."), indicator: "green" });
		});
	}

	terminal_aktion(was) {
		if (!this.terminal) return;
		if (was === "abbruch") {
			frappe.call({ method: PH_METHODE + "terminal_abbruch", args: { payment_intent: this.terminal.payment_intent, terminal: this.terminal.terminal } }).then(() => { this.beleg.zahlarten = this.beleg.zahlarten.filter((z) => z.zahlart !== "Karte Stripe Terminal"); clearTimeout(this.terminal.timer); this.terminal = null; this.render_zahlarten(); });
		} else if (was === "status") {
			this.terminal_pollen();
		} else if (was === "simulieren") {
			frappe.call({ method: PH_METHODE + "terminal_simulieren", args: { terminal: this.terminal.terminal, erfolgreich: 1 } }).then(() => this.terminal_pollen());
		}
	}

	render_terminal() {
		const $t = this.$body.find(".phk-terminal");
		if (!this.terminal) { $t.empty(); return; }
		const t = this.terminal;
		const farbe = t.bezahlt ? "gruen" : ["canceled", "failed"].includes(t.status) ? "rot" : "orange";
		$t.html(`<div class="phk-terminal-box phk-${farbe}"><div><b>${__("Terminal")}</b> ${esc(t.terminal)}<br><span>${__("Status")}: ${esc(t.status)}${t.bezahlt ? " ✓" : ""}</span></div><div class="phk-terminal-btns">${t.bezahlt ? "" : `<button class="phk-btn phk-btn-klein" data-terminal-aktion="status">${__("Status")}</button><button class="phk-btn phk-btn-klein" data-terminal-aktion="abbruch">${__("Abbrechen")}</button>${this.ctx.einstellungen.terminal_testmodus ? `<button class="phk-btn phk-btn-klein" data-terminal-aktion="simulieren">${__("Simulieren (Test)")}</button>` : ""}`}</div></div>`);
	}

	bar_gegeben(cent, ausEingabe) {
		const bar = this.beleg.zahlarten.find((z) => z.zahlart === "Bar");
		if (!bar) return;
		bar.gegeben_cent = Math.max(0, cent);
		this.render_zahlarten(ausEingabe);
	}

	render_zahlarten(eingabeBehalten) {
		const $z = this.$body.find(".phk-zahlliste");
		const $r = this.$body.find(".phk-rueckgeld");
		$z.html(this.beleg.zahlarten.map((z, i) => `<div class="phk-zahl"><b>${esc(__(z.zahlart === "Ueberweisung" ? "Überweisung" : z.zahlart))}${z.letzte4 ? ` ····${esc(z.letzte4)}` : ""}</b><span>${eur(z.betrag_cent)}</span><button class="phk-rund phk-zahl-weg" data-idx="${i}">×</button></div>`).join(""));
		const bar = this.beleg.zahlarten.find((z) => z.zahlart === "Bar");
		if (bar) {
			const gesamt = this.vorschau ? this.vorschau.gesamt_cent : 0;
			const offen = Math.max(0, gesamt - this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar").reduce((s, z) => s + z.betrag_cent, 0));
			bar.betrag_cent = offen;
			const schnell = [500, 1000, 2000, 5000, 10000, 20000].filter((c) => c >= offen || c >= 500).slice(0, 6);
			const rueck = (bar.gegeben_cent || 0) - offen;
			if (!eingabeBehalten) {
				$r.html(`<div class="phk-rueckgeld-box"><div class="phk-rueckgeld-kopf"><span>${__("Gegeben")}</span><input class="phk-eingabe phk-bar-eingabe" inputmode="decimal" value="${(bar.gegeben_cent / 100).toFixed(2).replace(".", ",")}"></div><div class="phk-bar-schnelltasten"><button class="phk-btn phk-btn-klein phk-bar-schnell" data-cent="${offen}">${__("passend")}</button>${schnell.map((c) => `<button class="phk-btn phk-btn-klein phk-bar-schnell" data-cent="${c}">${eur(c).replace(",00", "")}</button>`).join("")}</div><div class="phk-rueckgeld-wert ${rueck < 0 ? "phk-rot" : ""}"><span>${rueck < 0 ? __("Es fehlen") : __("Rückgeld")}</span><b>${eur(Math.abs(rueck))}</b></div></div>`);
			} else {
				$r.find(".phk-rueckgeld-wert").toggleClass("phk-rot", rueck < 0).html(`<span>${rueck < 0 ? __("Es fehlen") : __("Rückgeld")}</span><b>${eur(Math.abs(rueck))}</b>`);
			}
		} else {
			$r.empty();
		}
		this.render_terminal();
		this.vorschau_aktualisieren();
	}

	// ── Vorschau / Buchen ───────────────────────────────────────────────

	vorschau_aktualisieren() {
		clearTimeout(this._vorschau_timer);
		this._vorschau_timer = setTimeout(() => {
			if (!this.beleg.positionen.length) { this.$body.find(".phk-summe").text(eur(0)); this.$body.find(".phk-saetze").empty(); this.$body.find(".phk-vorschau").text(__("Positionen erfassen …")); this.vorschau = null; this.display_senden({ zustand: "leer" }); return; }
			frappe.call({ method: PH_METHODE + "beleg_vorschau", args: { kasse: this.kasse, positionen: this.beleg.positionen, zahlarten: this.beleg.zahlarten, kontakt: this.beleg.kunde && this.beleg.kunde.kontakt } }).then((r) => {
				const v = r.message;
				if (v.fehler) { this.$body.find(".phk-vorschau").text(v.fehler); this.$body.find(".phk-btn-buchen").prop("disabled", true); return; }
				this.vorschau = v;
				this.$body.find(".phk-summe").text(eur(v.gesamt_cent));
				this.$body.find(".phk-saetze").html(Object.entries(v.je_satz).map(([s, w]) => `<div><span>${esc(s)}</span><span>${__("Netto")} ${eur(w.netto_cent)} · ${__("USt")} ${eur(w.ust_cent)}</span></div>`).join(""));
				this.$body.find(".phk-vorschau").text(v.vorschau);
				const bar = this.beleg.zahlarten.find((z) => z.zahlart === "Bar");
				if (bar && bar.betrag_cent !== Math.max(0, v.gesamt_cent - this.beleg.zahlarten.filter((z) => z.zahlart !== "Bar").reduce((s, z) => s + z.betrag_cent, 0))) this.render_zahlarten();
				this.$body.find(".phk-btn-buchen").prop("disabled", !this.beleg.zahlarten.length);
				this.display_senden({ zustand: "positionen", positionen: v.positionen.map((p) => ({ bezeichnung: p.bezeichnung, menge: p.menge, brutto_cent: p.brutto_cent })), gesamt_cent: v.gesamt_cent });
			});
		}, 150);
	}

	buchen() {
		if (!this.beleg.positionen.length) { frappe.show_alert({ message: __("Keine Positionen."), indicator: "orange" }); return; }
		if (!this.beleg.zahlarten.length) { frappe.show_alert({ message: __("Zahlart wählen (F8 Bar, F9 Karte …)."), indicator: "orange" }); return; }
		if (this.terminal && !this.terminal.bezahlt) { frappe.show_alert({ message: __("Terminalzahlung noch nicht bestätigt."), indicator: "orange" }); return; }
		if (this.ctx.gesperrt) { frappe.msgprint(__("Kasse ist heute abgeschlossen.")); return; }
		const args = { kasse: this.kasse, positionen: this.beleg.positionen, zahlarten: this.beleg.zahlarten, kontakt: this.beleg.kunde && this.beleg.kunde.kontakt, auftrag: this.beleg.auftrag, rechnung: this.beleg.rechnung, bestellung: this.beleg.bestellung, trainings: this.ctx.trainings ? 1 : 0, kundenbeleg_email: this.beleg.email_senden ? this.beleg.email : null };
		frappe.call({ method: PH_METHODE + "beleg_buchen", args, freeze: true, freeze_message: __("Beleg wird signiert …") }).then((r) => {
			const e = r.message;
			this.letztes_ergebnis = e;
			this.druck_ausfuehren(e.druck);
			const d = new frappe.ui.Dialog({
				title: e.trainings ? __("Trainingsbeleg {0}", [e.belegnummer || e.beleg]) : __("Beleg {0} gebucht", [e.belegnummer || e.beleg]),
				fields: [{ fieldname: "info", fieldtype: "HTML", options: `<div class="phk-fertig"><div class="phk-fertig-summe">${eur(e.gesamt_cent)}</div>${e.rueckgeld_cent > 0 ? `<div class="phk-fertig-rueck">${__("Rückgeld")} <b>${eur(e.rueckgeld_cent)}</b></div>` : ""}${e.druck && e.druck.fehler ? `<div class="phk-hinweis-rot">${esc(e.druck.fehler)}</div>` : ""}${e.druck && e.druck.pdf_url ? `<a class="phk-btn phk-btn-klein" href="${e.druck.pdf_url}" target="_blank">${__("PDF öffnen")}</a>` : ""}<pre class="phk-vorschau-klein">${esc(e.druck && e.druck.vorschau || "")}</pre></div>` }],
				primary_action_label: __("Neuer Beleg"),
				primary_action: () => { d.hide(); this.aktion("neu"); },
				secondary_action_label: __("Beleg per E-Mail"),
				secondary_action: () => this.email_dialog(e.beleg),
			});
			d.show();
			this.ctx.heute_umsatz_cent += e.trainings ? 0 : e.gesamt_cent;
			this.$body.find(".phk-heute").text(eur(this.ctx.heute_umsatz_cent));
			this.belege_heute_laden();
		});
	}

	druck_ausfuehren(druck) {
		if (!druck) return;
		if (druck.modus === "QZ Tray" && druck.escpos_base64) {
			if (window.qz && qz.websocket) {
				const senden = () => qz.print(qz.configs.create(druck.qz_drucker_name || null), [{ type: "raw", format: "base64", data: druck.escpos_base64 }]).catch((err) => frappe.msgprint(__("QZ Tray: {0}", [err])));
				(qz.websocket.isActive() ? Promise.resolve() : qz.websocket.connect()).then(senden).catch((err) => frappe.msgprint(__("QZ Tray nicht verbunden: {0}", [err])));
			} else {
				frappe.msgprint(__("QZ Tray ist auf diesem Rechner nicht geladen. Bitte PDF verwenden oder QZ Tray installieren."));
			}
		} else if (druck.pdf_url && this.ctx.einstellungen.automatisch_drucken) {
			window.open(druck.pdf_url, "_blank");
		}
	}

	// ── Aktionen Kopfleiste ─────────────────────────────────────────────

	aktion(was) {
		switch (was) {
			case "neu":
				if (this.terminal && !this.terminal.bezahlt) this.terminal_aktion("abbruch");
				clearTimeout(this.terminal && this.terminal.timer);
				this.reset_beleg();
				this.render_kunde();
				this.render_positionen();
				this.render_zahlarten();
				this.$body.find(".phk-produkt-suche").focus();
				break;
			case "freitext": this.position_dialog({ art: "Freitext", menge: 1, steuersatz: this.ctx.einstellungen.standard_steuersatz }); break;
			case "anzahlung": {
				const a = this.beleg.kunde && this.beleg.kunde.auftraege && this.beleg.kunde.auftraege[0];
				if (a) this.anzahlung_dialog(a.auftrag); else this.anzahlung_frei_dialog();
				break;
			}
			case "gutschein_verkauf": this.gutschein_verkauf_dialog(); break;
			case "gutschein_einloesen": this.gutschein_einloesen_dialog(); break;
			case "buchen": this.buchen(); break;
			case "nachdruck": this.nachdruck(); break;
			case "email": this.email_dialog(); break;
			case "storno": this.storno_dialog(); break;
			case "nullbeleg": frappe.confirm(__("Nullbeleg (Betrag 0) erzeugen und drucken?"), () => frappe.call({ method: PH_METHODE + "nullbeleg", args: { kasse: this.kasse }, freeze: true }).then((r) => { this.druck_ausfuehren(r.message.druck); frappe.show_alert({ message: __("Nullbeleg {0} erzeugt", [r.message.belegnummer || r.message.beleg]), indicator: "green" }); this.belege_heute_laden(); })); break;
			case "kassenbuch": this.kassenbuch_dialog(); break;
			case "abschluss": this.abschluss_dialog(); break;
		}
	}

	anzahlung_frei_dialog() {
		const d = new frappe.ui.Dialog({
			title: __("Anzahlung auf Auftrag"),
			fields: [
				{ fieldname: "auftrag", fieldtype: "Link", options: "PH Auftragsbestaetigung", label: __("Auftrag (AB)"), reqd: this.ctx.doctypes["PH Auftragsbestaetigung"] ? 1 : 0 },
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Betrag brutto (€)"), reqd: 1 },
				{ fieldname: "steuersatz", fieldtype: "Select", label: __("Steuersatz"), options: this.ctx.steuersaetze, default: this.ctx.einstellungen.steuersatz_anzahlung, reqd: 1 },
			],
			primary_action_label: __("Hinzufügen"),
			primary_action: (v) => { this.beleg.auftrag = v.auftrag || null; this.beleg.positionen.push({ art: "Anzahlung", bezeichnung: `${__("Anzahlung")}${v.auftrag ? ` ${__("auf Auftrag")} ${v.auftrag}` : ""}`, menge: 1, einzel_brutto_cent: Math.round(v.betrag * 100), steuersatz: v.steuersatz, bezug_doctype: v.auftrag ? "PH Auftragsbestaetigung" : null, bezug: v.auftrag || null }); d.hide(); this.render_positionen(); },
		});
		d.show();
	}

	trainings_setzen(an) {
		frappe.call({ method: PH_METHODE + "trainingsmodus", args: { kasse: this.kasse, an } }).then(() => { this.ctx.trainings = an; this.render(); this.belege_heute_laden(); });
	}

	nachdruck() {
		frappe.call({ method: PH_METHODE + "letzter_beleg", args: { kasse: this.kasse } }).then((r) => {
			if (!r.message) { frappe.show_alert({ message: __("Kein Beleg vorhanden."), indicator: "orange" }); return; }
			frappe.call({ method: PH_METHODE + "beleg_drucken", args: { beleg: r.message.name }, freeze: true }).then((d) => { this.druck_ausfuehren(d.message); if (d.message.pdf_url && !this.ctx.einstellungen.automatisch_drucken) window.open(d.message.pdf_url, "_blank"); frappe.show_alert({ message: __("Beleg {0} nachgedruckt", [r.message.belegnummer || r.message.name]), indicator: "green" }); });
		});
	}

	email_dialog(beleg) {
		const senden = (name, email) => frappe.call({ method: PH_METHODE + "beleg_mailen", args: { beleg: name, email }, freeze: true }).then(() => frappe.show_alert({ message: __("Beleg an {0} gesendet", [email]), indicator: "green" }));
		const d = new frappe.ui.Dialog({
			title: __("Beleg per E-Mail"),
			fields: [
				{ fieldname: "beleg", fieldtype: "Link", options: "PH Kassenbeleg", label: __("Beleg"), default: beleg || (this.letztes_ergebnis && this.letztes_ergebnis.beleg) || "", reqd: 1, description: beleg ? "" : __("Leer lassen = letzter Beleg dieser Kasse") },
				{ fieldname: "email", fieldtype: "Data", options: "Email", label: __("E-Mail"), default: this.beleg.email || "", reqd: 1 },
			],
			primary_action_label: __("Senden"),
			primary_action: (v) => { d.hide(); senden(v.beleg, v.email); },
		});
		if (!d.get_value("beleg")) frappe.call({ method: PH_METHODE + "letzter_beleg", args: { kasse: this.kasse } }).then((r) => r.message && d.set_value("beleg", r.message.name));
		d.show();
	}

	storno_dialog(vorgabe) {
		const d = new frappe.ui.Dialog({
			title: __("Beleg stornieren"),
			fields: [
				{ fieldname: "beleg", fieldtype: "Link", options: "PH Kassenbeleg", label: __("Beleg"), reqd: 1, default: vorgabe || "" },
				{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
				{ fieldname: "hinweis", fieldtype: "HTML", options: `<p class="text-muted">${this.ctx.leitung ? __("Es wird ein Stornobeleg (Gegenbeleg) signiert; der Originalbeleg bleibt in der Kette.") : __("Mitarbeiter dürfen nur eigene Belege von heute stornieren.")}</p>` },
			],
			primary_action_label: __("Stornobeleg erzeugen"),
			primary_action: (v) => frappe.confirm(__("Beleg {0} wirklich stornieren?", [v.beleg]), () => frappe.call({ method: PH_METHODE + "storno", args: v, freeze: true }).then((r) => { d.hide(); this.druck_ausfuehren(r.message.druck); frappe.show_alert({ message: __("Stornobeleg {0} erzeugt", [r.message.belegnummer || r.message.beleg]), indicator: "green" }); this.belege_heute_laden(); })),
		});
		d.show();
	}

	kassenbuch_dialog() {
		const d = new frappe.ui.Dialog({
			title: __("Einlage / Entnahme"),
			fields: [
				{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Einlage", "Entnahme", "Anfangsbestand"], default: "Entnahme", reqd: 1 },
				{ fieldname: "betrag", fieldtype: "Currency", label: __("Betrag (€)"), reqd: 1 },
				{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund / Verwendung"), reqd: 1, description: __("z. B. Bankeinzahlung, Wechselgeld, Portokasse") },
			],
			primary_action_label: __("Buchen"),
			primary_action: (v) => frappe.call({ method: PH_METHODE + "kassenbuch_buchen", args: { kasse: this.kasse, art: v.art, betrag_cent: Math.round(v.betrag * 100), grund: v.grund } }).then((r) => { d.hide(); this.ctx.bargeld_bestand_cent = r.message.bestand_danach_cent; this.$body.find(".phk-bestand").text(eur(r.message.bestand_danach_cent)); frappe.show_alert({ message: __("{0} gebucht ({1})", [__(v.art), r.message.name]), indicator: "green" }); }),
		});
		d.show();
	}

	abschluss_dialog() {
		frappe.call({ method: PH_METHODE + "abschluss_laden", args: { kasse: this.kasse }, freeze: true }).then((r) => {
			const a = r.message;
			const zeilen = a.zaehlprotokoll.map((z) => `<tr><td>${esc(z.bezeichnung)}</td><td><input type="number" min="0" inputmode="numeric" class="phk-zaehl" data-cent="${z.stueckelung_cent}" value="${z.anzahl || 0}"></td><td class="phk-zaehl-summe" data-cent="${z.stueckelung_cent}">${eur(z.summe_cent)}</td></tr>`).join("");
			const saetze = a.umsatz_je_satz.map((s) => `<tr><td>${esc(s.steuersatz)}</td><td>${eur(s.netto_cent)}</td><td>${eur(s.ust_cent)}</td><td>${eur(s.brutto_cent)}</td></tr>`).join("");
			const d = new frappe.ui.Dialog({
				title: __("Tagesabschluss {0} · {1}", [this.kasse, frappe.datetime.str_to_user(frappe.datetime.get_today())]),
				size: "extra-large",
				fields: [
					{ fieldname: "inhalt", fieldtype: "HTML", options: `
					<div class="phk-abschluss">
					  <div class="phk-abschluss-soll">
					    <h3>${__("Soll")}</h3>
					    <table class="phk-tab"><tr><td>${__("Bargeld Anfang")}</td><td><input type="text" class="phk-anfang" inputmode="decimal" value="${(a.bargeld_anfang_cent / 100).toFixed(2).replace(".", ",")}"></td></tr>
					    <tr><td>${__("Bareinnahmen")}</td><td>${eur(a.bar_einnahmen_cent)}</td></tr><tr><td>${__("Barausgaben")}</td><td>− ${eur(a.bar_ausgaben_cent)}</td></tr>
					    <tr><td>${__("Einlagen")}</td><td>${eur(a.einlagen_cent)}</td></tr><tr><td>${__("Entnahmen")}</td><td>− ${eur(a.entnahmen_cent)}</td></tr>
					    <tr class="phk-tab-summe"><td>${__("Bargeld Soll")}</td><td class="phk-soll">${eur(a.bargeld_soll_cent)}</td></tr></table>
					    <h3>${__("Weitere Zahlarten")}</h3>
					    <table class="phk-tab"><tr><td>${__("Karte")}</td><td>${eur(a.karten_cent)}</td></tr><tr><td>${__("Gutschein")}</td><td>${eur(a.gutschein_cent)}</td></tr><tr><td>${__("Überweisung")}</td><td>${eur(a.ueberweisung_cent)}</td></tr><tr class="phk-tab-summe"><td>${__("Belegsumme")} (${a.belege_anzahl} ${__("Belege")}, ${a.stornos_anzahl} ${__("Stornos")}, ${a.trainings_anzahl} ${__("Training")})</td><td>${eur(a.umsatz_cent)}</td></tr></table>
					    <h3>${__("Umsatz je Steuersatz")}</h3>
					    <table class="phk-tab phk-tab-klein"><tr><th>${__("Satz")}</th><th>${__("Netto")}</th><th>${__("USt")}</th><th>${__("Brutto")}</th></tr>${saetze || `<tr><td colspan="4">–</td></tr>`}</table>
					  </div>
					  <div class="phk-abschluss-zaehl">
					    <h3>${__("Zählprotokoll")}</h3>
					    <table class="phk-tab"><tr><th>${__("Stückelung")}</th><th>${__("Anzahl")}</th><th>${__("Summe")}</th></tr>${zeilen}</table>
					    <div class="phk-abschluss-ergebnis"><div><span>${__("Ist")}</span><b class="phk-ist">${eur(a.bargeld_ist_cent)}</b></div><div><span>${__("Differenz")}</span><b class="phk-diff">${eur(a.differenz_cent)}</b></div></div>
					  </div>
					</div>` },
					{ fieldname: "differenz_grund", fieldtype: "Small Text", label: __("Grund bei Differenz") },
					{ fieldname: "unterschrift_name", fieldtype: "Data", label: __("Name (Druckbuchstaben)"), default: this.ctx.user_name },
					{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
				],
				primary_action_label: this.ctx.leitung ? __("Zählen & Tag abschließen") : __("Zählung speichern"),
				primary_action: (v) => {
					const protokoll = d.$wrapper.find(".phk-zaehl").map((_, el) => ({ stueckelung_cent: Number(el.dataset.cent), anzahl: Number(el.value || 0) })).get();
					const anfang = parseCent(d.$wrapper.find(".phk-anfang").val());
					frappe.call({ method: PH_METHODE + "abschluss_zaehlen", args: { kasse: this.kasse, zaehlprotokoll: protokoll, bargeld_anfang_cent: anfang, unterschrift: v.unterschrift, unterschrift_name: v.unterschrift_name }, freeze: true }).then((z) => {
						if (!this.ctx.leitung) { d.hide(); frappe.show_alert({ message: __("Zählung gespeichert ({0}). Abschluss durch die Leitung.", [z.message.name]), indicator: "green" }); return; }
						frappe.confirm(__("Differenz {0}. Tag abschließen? Danach sind heute keine Belege mehr möglich.", [eur(z.message.differenz_cent)]), () => {
							frappe.call({ method: PH_METHODE + "abschluss_abschliessen", args: { kasse: this.kasse, differenz_grund: v.differenz_grund, unterschrift: v.unterschrift, unterschrift_name: v.unterschrift_name }, freeze: true, freeze_message: __("Tag wird abgeschlossen …") }).then((ab) => { d.hide(); window.open(ab.message.pdf_url, "_blank"); frappe.show_alert({ message: __("Tagesabschluss {0} abgeschlossen", [ab.message.name]), indicator: "green" }); this.laden(); });
						});
					});
				},
			});
			const neuRechnen = () => {
				let ist = 0;
				d.$wrapper.find(".phk-zaehl").each((_, el) => { const s = Number(el.dataset.cent) * Number(el.value || 0); ist += s; d.$wrapper.find(`.phk-zaehl-summe[data-cent="${el.dataset.cent}"]`).text(eur(s)); });
				const anfang = parseCent(d.$wrapper.find(".phk-anfang").val());
				const soll = anfang + a.bar_einnahmen_cent - a.bar_ausgaben_cent + a.einlagen_cent - a.entnahmen_cent;
				d.$wrapper.find(".phk-soll").text(eur(soll));
				d.$wrapper.find(".phk-ist").text(eur(ist));
				d.$wrapper.find(".phk-diff").text(eur(ist - soll)).toggleClass("phk-rot", ist - soll !== 0);
			};
			d.$wrapper.on("input", ".phk-zaehl, .phk-anfang", neuRechnen);
			d.show();
			neuRechnen();
		});
	}

	// ── Belege heute ─────────────────────────────────────────────────────

	belege_heute_laden() {
		frappe.call({ method: PH_METHODE + "belege_heute", args: { kasse: this.kasse } }).then((r) => {
			const belege = r.message || [];
			this.$body.find(".phk-belege-heute").html(belege.length ? belege.map((b) => `<button class="phk-beleg-heute ${b.trainings ? "phk-beleg-training" : ""}" data-name="${esc(b.name)}" data-nr="${esc(b.belegnummer || b.name)}"><span>#${esc(b.belegnummer || "–")} · ${frappe.datetime.str_to_user(b.datum_uhrzeit).slice(11, 16)}${b.belegart && b.belegart !== "Standard" ? ` · ${esc(b.belegart)}` : ""}</span><b>${eur(b.gesamt_cent)}</b></button>`).join("") : `<div class="phk-leer">${__("Noch keine Belege.")}</div>`);
		});
	}

	beleg_heute_menue(name, nr) {
		const d = new frappe.ui.Dialog({
			title: __("Beleg #{0}", [nr]),
			fields: [{ fieldname: "h", fieldtype: "HTML", options: `<div class="phk-menue"><button class="phk-btn" data-m="druck">${__("Nachdrucken")}</button><button class="phk-btn" data-m="email">${__("Per E-Mail")}</button><button class="phk-btn" data-m="storno">${__("Stornieren")}</button><button class="phk-btn phk-btn-klein" data-m="oeffnen">${__("Im Desk öffnen")}</button></div>` }],
		});
		d.$wrapper.on("click", "[data-m]", (e) => {
			const m = $(e.currentTarget).data("m");
			d.hide();
			if (m === "druck") frappe.call({ method: PH_METHODE + "beleg_drucken", args: { beleg: name }, freeze: true }).then((r) => { this.druck_ausfuehren(r.message); if (r.message.pdf_url) window.open(r.message.pdf_url, "_blank"); });
			if (m === "email") this.email_dialog(name);
			if (m === "storno") this.storno_dialog(name);
			if (m === "oeffnen") frappe.set_route("Form", "PH Kassenbeleg", name);
		});
		d.show();
	}

	// ── Kundendisplay ────────────────────────────────────────────────────

	display_senden(daten) {
		if (!this.ctx || !this.ctx.einstellungen.kundendisplay_aktiv) return;
		frappe.call({ method: PH_METHODE + "display_senden", args: { kasse: this.kasse, zustand: daten } });
	}

	render_display() {
		this.page.wrapper.find(".page-head").hide();
		const kasse = this.kasse || "";
		this.$body.html(`<div class="phk-display"><div class="phk-display-marke">PLATZHIRSCH</div><div class="phk-display-inhalt"><div class="phk-display-ruhe">${__("Willkommen bei Platzhirsch")}</div></div><div class="phk-display-summe"></div></div>`);
		const $inhalt = this.$body.find(".phk-display-inhalt");
		const $summe = this.$body.find(".phk-display-summe");
		frappe.realtime.on(`ph_kassa_display_${kasse}`, (d) => {
			if (!d || d.zustand === "leer") { $inhalt.html(`<div class="phk-display-ruhe">${__("Willkommen bei Platzhirsch")}</div>`); $summe.empty(); return; }
			if (d.zustand === "positionen") { $inhalt.html(d.positionen.map((p) => `<div class="phk-display-pos"><span>${p.menge !== 1 ? `${p.menge} × ` : ""}${esc(p.bezeichnung)}</span><b>${eur(p.brutto_cent)}</b></div>`).join("")); $summe.html(`<span>${__("Summe")}</span><b>${eur(d.gesamt_cent)}</b>`); }
			if (d.zustand === "karte") $summe.html(`<span>${__("Bitte Karte am Terminal")}</span><b>${eur(d.gesamt_cent)}</b>`);
			if (d.zustand === "fertig") { $inhalt.html(`<div class="phk-display-ruhe">${__("Vielen Dank!")}</div>`); $summe.html(`<span>${__("Bezahlt")}</span><b>${eur(d.gesamt_cent)}</b>${d.rueckgeld_cent ? `<div class="phk-display-rueck">${__("Rückgeld")} ${eur(d.rueckgeld_cent)}</div>` : ""}`); }
		});
	}

	// ── Stil ─────────────────────────────────────────────────────────────

	css_einbinden() {
		if (document.getElementById("phk-css")) return;
		const s = document.createElement("style");
		s.id = "phk-css";
		s.textContent = PHKassa.CSS;
		document.head.appendChild(s);
	}
}

PHKassa.CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
.phk{--tinte:#30373e;--sand:#8a7a66;--leinen:#faf8f4;--linie:#e6e1d8;--weiss:#fff;--gruen:#15803d;--orange:#b45309;--rot:#b91c1c;--blau:#1d4ed8;font-family:"Instrument Sans",Arial,sans-serif;color:var(--tinte);background:var(--leinen);margin:-15px;padding:16px 20px 12px;min-height:calc(100vh - 60px)}
.phk *{box-sizing:border-box}
.phk h2{font-family:"Bodoni Moda",Georgia,serif;font-weight:500;font-size:18px;margin:0 0 10px;display:flex;align-items:center;gap:8px}
.phk h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--sand);margin:14px 0 6px;font-weight:600}
.phk .phk-h2-klein{font-size:15px;margin-top:18px}
.phk kbd{font:600 10px/1 ui-monospace,Menlo,monospace;background:#fff;border:1px solid var(--linie);border-bottom-width:2px;border-radius:4px;padding:3px 5px;color:var(--sand)}
.phk-kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--linie)}
.phk-titel{display:flex;align-items:baseline;gap:12px}
.phk-wortmarke{font-family:"Bodoni Moda",Georgia,serif;font-size:26px;letter-spacing:.18em;font-weight:500}
.phk-sub{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--sand)}
.phk-kopf-mitte{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}
.phk-kasse-wahl{display:flex;flex-direction:column;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--sand);gap:4px}
.phk-kasse-wahl select{min-height:40px;border:1px solid var(--linie);border-radius:8px;background:#fff;padding:0 10px;font-size:15px;color:var(--tinte)}
.phk-kennzahl{display:flex;flex-direction:column;gap:2px}.phk-kennzahl span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--sand)}.phk-kennzahl b{font-size:20px;font-weight:500;font-variant-numeric:tabular-nums}
.phk-kopf-rechts{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.phk-schalter{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin:0}.phk-schalter input{width:20px;height:20px}
.phk-aktionen{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.phk-btn{min-height:48px;border:1px solid var(--linie);background:#fff;color:var(--tinte);border-radius:10px;padding:0 16px;font:500 15px "Instrument Sans",Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:background .12s,border-color .12s;touch-action:manipulation}
.phk-btn:hover{border-color:var(--sand);background:#fffdf9}.phk-btn:disabled{opacity:.45;cursor:not-allowed}
.phk-btn-klein{min-height:40px;font-size:13px;padding:0 12px}
.phk-btn-dunkel{background:var(--tinte);color:#fff;border-color:var(--tinte)}.phk-btn-dunkel:hover{background:#1f252b}
.phk-btn-buchen{width:100%;min-height:64px;font-size:19px;background:var(--tinte);color:#fff;border-color:var(--tinte);margin-top:10px}.phk-btn-buchen:hover{background:#1f252b}
.phk-btn-neu{width:100%;margin-top:8px}
.phk-btn-zahl{flex:1 1 45%;min-height:56px;font-size:16px}
.phk-link{background:none;border:0;color:var(--sand);text-decoration:underline;cursor:pointer;font-size:12px}
.phk-rund{width:40px;height:40px;border-radius:50%;border:1px solid var(--linie);background:#fff;font-size:18px;cursor:pointer;color:var(--tinte);flex:none}
.phk-banner-zeile{display:flex;flex-direction:column;gap:6px;margin:10px 0 0}
.phk-banner{padding:10px 14px;border-radius:8px;font-weight:600;letter-spacing:.04em;text-align:center}
.phk-banner-orange{background:#fef3c7;color:#92400e}.phk-banner-rot{background:#fee2e2;color:#991b1b}
.phk-training .phk-kopf{border-bottom:3px solid var(--orange)}
.phk-spalten{display:grid;grid-template-columns:minmax(260px,1fr) minmax(340px,1.5fr) minmax(320px,1.1fr);gap:18px;margin-top:16px}
.phk-spalte{background:#fff;border:1px solid var(--linie);border-radius:14px;padding:18px;min-height:60vh}
.phk-eingabe{width:100%;min-height:48px;border:1px solid var(--linie);border-radius:10px;padding:0 14px;font-size:16px;background:var(--leinen);color:var(--tinte)}
.phk-eingabe:focus{outline:2px solid var(--sand);outline-offset:1px;background:#fff}
.phk-leer{color:#8b8f96;font-size:13px;padding:10px 2px}.phk-leer-gross{padding:40px 10px;text-align:center;border:1px dashed var(--linie);border-radius:10px;margin-top:12px}
.phk-treffer{display:flex;flex-direction:column;align-items:flex-start;width:100%;min-height:52px;border:1px solid var(--linie);border-radius:10px;background:#fff;padding:8px 12px;margin-top:6px;cursor:pointer;text-align:left}
.phk-treffer b{font-weight:600}.phk-treffer span{font-size:12px;color:#6b7280}.phk-treffer em{font-size:11px;color:var(--sand);font-style:normal}
.phk-karte{border:1px solid var(--linie);border-radius:12px;padding:12px 14px;margin-top:10px;background:var(--leinen)}
.phk-karte-kopf{display:flex;justify-content:space-between;align-items:center}.phk-karte>span{font-size:12px;color:#6b7280}
.phk-zeile{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--linie)}.phk-zeile div{display:flex;flex-direction:column}.phk-zeile span{font-size:12px;color:#6b7280}
.phk-produkt-treffer{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-top:8px}
.phk-kachel{display:flex;flex-direction:column;align-items:flex-start;gap:4px;border:1px solid var(--linie);border-radius:12px;background:#fff;padding:8px;cursor:pointer;text-align:left;min-height:48px}
.phk-kachel img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;background:var(--leinen)}
.phk-kachel-leer{width:100%;aspect-ratio:4/3;border-radius:8px;background:var(--leinen);display:flex;align-items:center;justify-content:center;font-family:"Bodoni Moda",Georgia,serif;font-size:22px;color:var(--sand)}
.phk-kachel b{font-size:13px;font-weight:600;line-height:1.25}.phk-kachel span{font-size:11px;color:#6b7280}.phk-kachel em{font-style:normal;font-size:13px;color:var(--tinte)}
.phk-schnell{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.phk-pos{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--linie)}
.phk-pos-text{flex:1;display:flex;flex-direction:column;min-width:0}.phk-pos-text b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.phk-pos-text span{font-size:12px;color:#6b7280}
.phk-pos-menge{display:flex;align-items:center;gap:8px}.phk-pos-menge b{min-width:20px;text-align:center}
.phk-pos-betrag{min-width:96px;text-align:right;font-variant-numeric:tabular-nums;font-size:16px}
.phk-summe-box{background:var(--leinen);border-radius:14px;padding:18px 20px;margin-bottom:16px}
.phk-summe-box>span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--sand)}
.phk-summe{display:block;font-family:"Bodoni Moda",Georgia,serif;font-size:46px;line-height:1.1;font-weight:500;font-variant-numeric:tabular-nums}
.phk-saetze{margin-top:8px;font-size:12px;color:#6b7280}.phk-saetze div{display:flex;justify-content:space-between;gap:8px}
.phk-zahlarten{display:flex;flex-wrap:wrap;gap:8px}
.phk-zahl{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--linie)}.phk-zahl b{flex:1;font-weight:600}.phk-zahl span{font-variant-numeric:tabular-nums}
.phk-rueckgeld-box{margin-top:12px;border:1px solid var(--linie);border-radius:12px;padding:12px}
.phk-rueckgeld-kopf{display:flex;align-items:center;gap:10px}.phk-rueckgeld-kopf span{font-size:12px;color:#6b7280;min-width:60px}.phk-bar-eingabe{text-align:right;font-size:22px;min-height:52px}
.phk-bar-schnelltasten{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.phk-rueckgeld-wert{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px}.phk-rueckgeld-wert span{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sand)}.phk-rueckgeld-wert b{font-family:"Bodoni Moda",Georgia,serif;font-size:30px;color:var(--gruen)}.phk-rueckgeld-wert.phk-rot b{color:var(--rot)}
.phk-terminal-box{margin-top:12px;border-radius:12px;padding:12px;display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid var(--linie)}.phk-terminal-box span{font-size:12px;color:#6b7280}.phk-terminal-btns{display:flex;gap:6px;flex-wrap:wrap}
.phk-terminal-box.phk-gruen{background:#ecfdf5}.phk-terminal-box.phk-orange{background:#fffbeb}.phk-terminal-box.phk-rot{background:#fef2f2}
.phk-vorschau{font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;background:var(--leinen);border-radius:10px;padding:14px;white-space:pre;overflow:auto;max-height:420px;color:var(--tinte);border:1px solid var(--linie)}
.phk-vorschau-klein{font:11px/1.3 ui-monospace,Menlo,monospace;background:#faf8f4;padding:10px;border-radius:8px;max-height:260px;overflow:auto;white-space:pre}
.phk-belege-heute{display:flex;flex-direction:column;gap:4px;max-height:280px;overflow:auto}
.phk-beleg-heute{display:flex;justify-content:space-between;align-items:center;min-height:44px;border:1px solid var(--linie);border-radius:8px;background:#fff;padding:0 10px;cursor:pointer;font-size:13px}.phk-beleg-heute b{font-variant-numeric:tabular-nums}.phk-beleg-training{opacity:.6;border-style:dashed}
.phk-fertig{text-align:center}.phk-fertig-summe{font-family:"Bodoni Moda",Georgia,serif;font-size:40px}.phk-fertig-rueck{font-size:18px;margin:6px 0 10px}.phk-fertig-rueck b{color:var(--gruen)}
.phk-hinweis-gruen{background:#ecfdf5;color:#065f46;padding:8px 10px;border-radius:8px;margin:6px 0}.phk-hinweis-rot{background:#fef2f2;color:#991b1b;padding:8px 10px;border-radius:8px;margin:6px 0}
.phk-menue{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.phk-fuss{margin-top:14px;font-size:11px;color:#8b8f96;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.phk-abschluss{display:grid;grid-template-columns:1fr 1fr;gap:24px;font-family:"Instrument Sans",Arial,sans-serif}
.phk-abschluss h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7a66;margin:12px 0 6px}
.phk-tab{width:100%;border-collapse:collapse}.phk-tab td,.phk-tab th{padding:6px 4px;border-bottom:1px solid #e6e1d8;text-align:left;font-size:14px}.phk-tab td:last-child,.phk-tab th:last-child,.phk-tab td:nth-child(n+2){text-align:right;font-variant-numeric:tabular-nums}
.phk-tab input{width:90px;min-height:40px;border:1px solid #e6e1d8;border-radius:8px;text-align:right;font-size:16px;padding:0 8px}
.phk-tab-summe td{font-weight:600;border-top:2px solid #30373e}.phk-tab-klein td,.phk-tab-klein th{font-size:12px}
.phk-abschluss-ergebnis{display:flex;justify-content:space-between;margin-top:14px;background:#faf8f4;border-radius:12px;padding:12px 14px}.phk-abschluss-ergebnis span{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7a66}.phk-abschluss-ergebnis b{font-family:"Bodoni Moda",Georgia,serif;font-size:28px}.phk-abschluss-ergebnis b.phk-rot{color:#b91c1c}
.phk-display{font-family:"Instrument Sans",Arial,sans-serif;background:#faf8f4;color:#30373e;min-height:100vh;margin:-15px;padding:40px 48px;display:flex;flex-direction:column}
.phk-display-marke{font-family:"Bodoni Moda",Georgia,serif;font-size:34px;letter-spacing:.2em}
.phk-display-inhalt{flex:1;margin-top:30px;font-size:26px}.phk-display-ruhe{font-family:"Bodoni Moda",Georgia,serif;font-size:44px;color:#8a7a66;margin-top:12vh;text-align:center}
.phk-display-pos{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e6e1d8}
.phk-display-summe{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid #30373e;padding-top:18px;font-size:22px}.phk-display-summe b{font-family:"Bodoni Moda",Georgia,serif;font-size:72px}.phk-display-rueck{width:100%;text-align:right;font-size:24px;color:#15803d}
@media (max-width:1180px){.phk-spalten{grid-template-columns:1fr 1fr}.phk-beleg{grid-column:1/-1}}
@media (max-width:760px){.phk-spalten{grid-template-columns:1fr}.phk{padding:12px}.phk-abschluss{grid-template-columns:1fr}}
`;
