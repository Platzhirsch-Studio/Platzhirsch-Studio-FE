// Desk-Page „Packtisch“ (ph-packtisch): Dashboard-Kopf, offene Bestellungen/Lieferscheine, Pack-Ansicht je Lieferschein
// mit Abhaken/Scan (Barcode-Eingabefeld mit Fokus), Paketwahl aus Paketprofilen, Gewicht, Versicherungswert,
// „Etikett erzeugen“ (Tarifwahl → Buchung → Etikett-PDF), Druck Lieferschein + Etikett, Abholung mit Unterschrift.
// Große Touch-Schaltflächen und Statusfarben: public/css/ph_logistik.css. Server: ph_logistik.ph_logistik.packtisch.
/* global frappe, __ */

frappe.pages["ph-packtisch"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Packtisch"), single_column: true });
	wrapper.packtisch = new PHPacktisch(page, wrapper);
};

frappe.pages["ph-packtisch"].on_page_show = function (wrapper) {
	const ls = frappe.route_options && frappe.route_options.lieferschein;
	if (ls && wrapper.packtisch) {
		frappe.route_options = null;
		wrapper.packtisch.oeffnen(ls);
	} else if (wrapper.packtisch && !wrapper.packtisch.aktuell) {
		wrapper.packtisch.uebersicht();
	}
};

const API = "ph_logistik.ph_logistik.packtisch";
const JTL = "ph_logistik.ph_logistik.packtisch_ablauf"; // Packtisch nach JTL (33-referenz-jtl-packtisch.md § 4)
const packplatz = () => { try { return localStorage.getItem("ph_packplatz") || null; } catch (e) { return null; } };
const esc = (s) => frappe.utils.escape_html(String(s == null ? "" : s));
const eur = (c) => (c == null ? "–" : (c / 100).toFixed(2).replace(".", ",") + " €");
const STATUS_KLASSE = { Entwurf: "ph-st-blau", Gepackt: "ph-st-orange", Uebergeben: "ph-st-lila", Zugestellt: "ph-st-gruen", Storniert: "ph-st-grau", Angelegt: "ph-st-blau", Etikett: "ph-st-cyan", Unterwegs: "ph-st-orange", Problem: "ph-st-rot" };

class PHPacktisch {
	constructor(page, wrapper) {
		this.page = page;
		this.$body = $(wrapper).find(".layout-main-section");
		this.$body.addClass("ph-packtisch");
		this.aktuell = null;
		this.page.set_secondary_action(__("Aktualisieren"), () => (this.aktuell ? this.oeffnen(this.aktuell) : this.uebersicht()), "refresh");
		this.page.add_menu_item(__("Einstellungen"), () => frappe.set_route("Form", "PH Logistik Einstellungen"));
		this.page.add_menu_item(__("Alle Lieferscheine"), () => frappe.set_route("List", "PH Lieferschein"));
		this.page.add_menu_item(__("Alle Sendungen"), () => frappe.set_route("List", "PH Sendung"));
	}

	// ── Übersicht ──────────────────────────────────────────────────────────
	async uebersicht() {
		this.aktuell = null;
		this.page.set_title(__("Packtisch"));
		this.page.clear_primary_action();
		const [stat, offen] = await Promise.all([frappe.xcall(`${API}.statistik`), frappe.xcall(`${API}.offene`)]);
		const kacheln = [
			["zu_packen", __("Zu packen"), "ph-st-blau"],
			["gepackt", __("Gepackt"), "ph-st-orange"],
			["etikett_offen", __("Etikett offen"), "ph-st-cyan"],
			["unterwegs", __("Unterwegs"), "ph-st-lila"],
			["probleme", __("Probleme"), "ph-st-rot"],
			["heute_gepackt", __("Heute gepackt"), "ph-st-gruen"],
			["touren_heute", __("Touren heute"), "ph-st-grau"],
			["zurueckgestellt", __("Zurückgestellt"), "ph-st-rot"],
		];
		let html = `<div class="ph-dash">${kacheln.map(([k, l, c]) => `<div class="ph-kachel ${c}"><div class="ph-zahl">${stat[k] || 0}</div><div class="ph-label">${l}</div></div>`).join("")}</div>`;
		if (offen.mock) html += `<div class="ph-hinweis ph-st-orange">${__("Testmodus: LetMeShip-Mock – es werden keine echten Etiketten gebucht.")}</div>`;
		if (offen.hinweis) html += `<div class="ph-hinweis">${esc(offen.hinweis)}</div>`;
		html += `<div class="ph-scan"><input class="ph-vorgang-input" type="text" placeholder="${__("Lieferschein, Bestellung, Kommission oder Artikel scannen …")}" autocomplete="off"><button class="btn btn-primary ph-btn" data-act="vorgang">${__("Öffnen")}</button></div>`;
		html += `<h3 class="ph-h">${__("Offene Lieferscheine")} <span class="ph-badge">${offen.lieferscheine.length}</span></h3><div class="ph-liste">`;
		if (!offen.lieferscheine.length) html += `<div class="ph-leer">${__("Nichts zu packen.")}</div>`;
		for (const l of offen.lieferscheine) {
			html += `<button class="ph-karte ${STATUS_KLASSE[l.status] || ""}" data-ls="${esc(l.name)}">
				<div class="ph-karte-kopf"><b>${esc(l.name)}</b><span class="ph-pill">${__(l.status)}</span><span class="ph-pill ph-pill-art">${__(l.lieferart)}</span></div>
				<div class="ph-karte-zeile">${esc(l.kunde_name || "")} · ${esc(l.liefer_ort || "")} ${esc(l.liefer_land || "")}</div>
				<div class="ph-karte-zeile text-muted">${esc(l.bestellung || l.auftrag || "")} · ${l.positionen - l.offen}/${l.positionen} ${__("Positionen")}${l.zerbrechlich ? " · " + __("zerbrechlich") : ""}${l.versichern ? " · " + __("versichert") : ""}${l.sendung ? " · " + esc(l.sendung) : ""}${l.teillieferung ? " · " + __("Teillieferung") : ""}</div>
				${l.zurueckgestellt ? `<div class="ph-karte-zeile ph-rot">⏸ ${__("Zurückgestellt")}: ${esc(__(l.zurueckgestellt_grund || ""))}</div>` : ""}
			</button>`;
		}
		html += `</div><h3 class="ph-h">${__("Bezahlte Bestellungen ohne Lieferschein")} <span class="ph-badge">${offen.bestellungen.length}</span></h3><div class="ph-liste">`;
		if (!offen.bestellungen.length) html += `<div class="ph-leer">${__("Keine offenen Bestellungen.")}</div>`;
		for (const b of offen.bestellungen) {
			html += `<button class="ph-karte ph-st-grau" data-best="${esc(b.name)}"><div class="ph-karte-kopf"><b>${esc(b.name)}</b><span class="ph-pill">${esc(b.status)}</span><span class="ph-pill ph-pill-art">${esc(b.lieferart || "")}</span></div><div class="ph-karte-zeile">${esc(b.kunde_name || "")} · ${eur(b.gesamt_cent)}</div><div class="ph-karte-zeile text-muted">${__("Antippen: Lieferschein anlegen und packen")}</div></button>`;
		}
		html += "</div>";
		this.$body.html(html);
		this.$body.find("[data-ls]").on("click", (e) => this.oeffnen($(e.currentTarget).data("ls")));
		const $v = this.$body.find(".ph-vorgang-input");
		setTimeout(() => $v.trigger("focus"), 50);
		$v.on("keydown", (e) => { if (e.key === "Enter") this.vorgang($v.val()); });
		this.$body.find("[data-act=vorgang]").on("click", () => this.vorgang($v.val()));
		this.$body.find("[data-best]").on("click", async (e) => {
			const name = await frappe.xcall(`${API}.lieferschein_aus_bestellung`, { bestellung: $(e.currentTarget).data("best") });
			this.oeffnen(name);
		});
	}

	// ── Pack-Ansicht ───────────────────────────────────────────────────────
	async oeffnen(name) {
		this.aktuell = name;
		const [daten, zusatz] = await Promise.all([frappe.xcall(`${API}.packansicht`, { lieferschein: name }), frappe.xcall(`${JTL}.packansicht_zusatz`, { lieferschein: name, packplatz: packplatz() })]);
		this.daten = daten;
		this.zusatz = zusatz;
		this.pp = zusatz.packplatz || {};
		const ls = this.daten.lieferschein;
		this.page.set_title(`${__("Packtisch")} · ${ls.name}`);
		this.page.set_indicator(__(ls.status), { Entwurf: "blue", Gepackt: "orange", Uebergeben: "purple", Zugestellt: "green", Storniert: "gray" }[ls.status] || "gray");
		this.page.clear_primary_action();
		if (ls.status === "Entwurf") this.page.set_primary_action(__("Verpacken"), () => this.verpacken(0), "check");
		this.render();
	}

	render() {
		const d = this.daten;
		const ls = d.lieferschein;
		const bearbeitbar = ls.status === "Entwurf";
		const alleGepackt = d.positionen.every((p) => (p.menge_gepackt || 0) >= p.menge);
		const gew = (d.pakete || []).reduce((s, p) => s + (p.gewicht_g || 0), 0);
		let html = `<div class="ph-zurueck"><button class="btn btn-default ph-btn" data-act="zurueck">← ${__("Übersicht")}</button>
			<div class="ph-kopf"><div><b>${esc(ls.kunde_name || ls.liefer_name || "")}</b><br><span class="text-muted">${esc(ls.liefer_strasse || "")} ${esc(ls.liefer_hausnr || "")}, ${esc(ls.liefer_plz || "")} ${esc(ls.liefer_ort || "")} ${esc(ls.liefer_land || "")}</span></div>
			<div><span class="ph-pill ph-pill-art">${__(ls.lieferart)}</span> ${ls.bestellung ? `<a href="/app/ph-bestellung/${esc(ls.bestellung)}">${esc(ls.bestellung)}</a>` : ""} ${ls.auftrag ? `<a href="/app/ph-auftragsbestaetigung/${esc(ls.auftrag)}">${esc(ls.auftrag)}</a>` : ""}${ls.teillieferung ? ` <span class="ph-pill ph-st-orange">${__("Teillieferung")}</span>` : ""}</div></div></div>`;
		if (ls.lieferhinweis) html += `<div class="ph-hinweis">${esc(ls.lieferhinweis)}</div>`;
		if (d.einstellungen.mock) html += `<div class="ph-hinweis ph-st-orange">${__("MOCK – Testmodus ohne echte LetMeShip-Buchung")}</div>`;
		const z = this.zusatz || {};
		if (z.zurueckgestellt) html += `<div class="ph-hinweis ph-st-rot">⏸ ${__("Zurückgestellt")}: ${esc(__(z.zurueckgestellt_grund || ""))} <button class="btn btn-xs btn-default" data-act="fortsetzen">${__("Fortsetzen")}</button></div>`;
		if ((z.packhinweise || []).length) {
			html += `<div class="ph-hinweis ph-st-orange"><b>${__("Packhinweise")}</b><ul>${z.packhinweise.map((h) => `<li>${h.bestaetigen ? "⚠ " : ""}<b>${esc(h.bezeichnung)}</b>: ${esc(h.hinweis)}</li>`).join("")}</ul>${z.packhinweise.some((h) => h.bestaetigen) && !z.packhinweise_bestaetigt && bearbeitbar ? `<button class="btn btn-sm btn-warning" data-act="hinweise-ok">${__("Hinweise gelesen – bestätigen")}</button>` : (z.packhinweise_bestaetigt ? `✓ ${__("bestätigt")}` : "")}</div>`;
		}
		if ((z.dokumente || []).length) html += `<div class="ph-hinweis">${__("Dokumente")} (${esc(__(z.teillieferung_art || ""))}): ${z.dokumente.map((x) => `${x.anzahl}× ${esc(__(x.dokument))}${x.drucker ? ` → ${esc(x.drucker)}` : ""}`).join(" · ")}</div>`;

		// Scan
		if (bearbeitbar) {
			html += `<div class="ph-scan"><input class="ph-menge-input" type="number" min="1" value="1" title="${__("Menge vor dem Scan")}" style="width:5em"><input class="ph-scan-input" type="text" placeholder="${__("Barcode / EAN / QR scannen oder eingeben …")}" autocomplete="off"><button class="btn btn-primary ph-btn" data-act="scan">${__("Abhaken")}</button></div>`;
		}
		// Positionen
		html += `<h3 class="ph-h">${__("Positionen")} <span class="ph-badge ${alleGepackt ? "ph-st-gruen" : "ph-st-orange"}">${d.positionen.filter((p) => p.gepackt).length}/${d.positionen.length}</span></h3><div class="ph-pos-liste">`;
		// M2: offene Positionen oben, erledigte nach unten (Reihenfolge sonst wie im Lieferschein)
		const sortiert = [...d.positionen].sort((a, b) => ((a.menge_gepackt || 0) >= a.menge) - ((b.menge_gepackt || 0) >= b.menge));
		for (const p of sortiert) {
			const voll = (p.menge_gepackt || 0) >= p.menge;
			html += `<div class="ph-pos ${voll ? "ph-pos-ok" : ""}" data-pos="${esc(p.name)}">
				<button class="ph-check ${voll ? "ph-check-ok" : ""}" data-act="pack" data-pos="${esc(p.name)}" ${bearbeitbar ? "" : "disabled"}>${voll ? "✓" : `${p.menge_gepackt || 0}/${p.menge}`}</button>
				<div class="ph-pos-text"><b>${esc(p.beschreibung)}</b>${p.ausfuehrung_text ? ` <span class="text-muted">· ${esc(p.ausfuehrung_text)}</span>` : ""}<br>
				${p.ohne_barcode ? `<span class="ph-pill ph-st-orange">${__("ohne Barcode")}</span>${p.hand_bestaetigt ? ` <span class="ph-pill">${__("per Hand")}</span>` : ""}${bearbeitbar && !voll ? ` <button class="btn btn-xs btn-warning" data-act="hand" data-pos="${esc(p.name)}">${__("Per Hand bestätigen")}</button>` : ""}<br>` : ""}<span class="text-muted">${esc(p.marke || "")}${p.ean ? " · EAN " + esc(p.ean) : ""}${p.seriennummer ? " · SN " + esc(p.seriennummer) : ""}${p.zerbrechlich ? ` · <span class="ph-rot">${__("zerbrechlich")}</span>` : ""}</span><br>
				<label class="text-muted">${__("Paketprofil")}: <select class="ph-select-profil" data-pos="${esc(p.name)}" ${bearbeitbar ? "" : "disabled"}><option value="">–</option>${d.profile.map((pr) => `<option value="${esc(pr.key)}" ${(p.paketprofil || p.paketprofil_vorschlag) === pr.key ? "selected" : ""}>${esc(pr.bezeichnung)}${pr.geprueft ? "" : " (Schätzung)"}${pr.versand_gesperrt ? " ⛔" : ""}</option>`).join("")}</select>${!p.paketprofil && p.paketprofil_vorschlag ? ` <span class="ph-pill ph-st-cyan">${__("Vorschlag")}</span>` : ""}</label></div>
				<div class="ph-pos-menge">${p.menge}×${bearbeitbar && (p.menge_gepackt || 0) > 0 ? `<br><button class="btn btn-xs btn-default" data-act="reset" data-pos="${esc(p.name)}">${__("zurück")}</button>` : ""}</div></div>`;
		}
		html += "</div>";

		// Pakete
		html += `<h3 class="ph-h">${__("Pakete")} <span class="ph-badge">${(d.pakete || []).length}</span> <span class="text-muted ph-klein">${__("Gesamt")} ${(gew / 1000).toFixed(2)} kg</span>
			${bearbeitbar ? `<button class="btn btn-default btn-sm" data-act="vorschlag">${__("Aus Profilen vorschlagen")}</button> <button class="btn btn-default btn-sm" data-act="paket-plus">+ ${__("Paket")}</button>` : ""}</h3>
			<table class="table ph-pakete"><thead><tr><th>#</th><th>${__("Profil")}</th><th>L</th><th>B</th><th>H</th><th>${__("Gewicht g")}</th><th>${__("Zerbr.")}</th><th>${__("Inhalt")}</th><th></th></tr></thead><tbody>`;
		const gw = {};
		for (const g of (this.zusatz && this.zusatz.pakete) || []) gw[g.paket_nr] = g;
		for (const p of d.pakete || []) {
			const ro = bearbeitbar ? "" : "disabled";
			const g = gw[p.paket_nr];
			if (!p.inhalt_map && p.inhalt_json) { try { p.inhalt_map = JSON.parse(p.inhalt_json); } catch (e) { p.inhalt_map = {}; } }
			html += `<tr data-paket="${p.paket_nr}"><td>${p.paket_nr}</td>
				<td><select class="form-control input-sm pk-profil" ${ro}><option value="">–</option>${d.profile.map((pr) => `<option value="${esc(pr.key)}" ${p.paketprofil === pr.key ? "selected" : ""}>${esc(pr.bezeichnung)}</option>`).join("")}</select></td>
				<td><input class="form-control input-sm pk-l" type="number" value="${p.laenge_cm || ""}" ${ro}></td><td><input class="form-control input-sm pk-b" type="number" value="${p.breite_cm || ""}" ${ro}></td><td><input class="form-control input-sm pk-h" type="number" value="${p.hoehe_cm || ""}" ${ro}></td>
				<td><input class="form-control input-sm pk-g" type="number" value="${p.gewicht_manuell ? p.gewicht_g || "" : ""}" placeholder="${g && g.vorschlag_g ? g.vorschlag_g : ""}" ${ro}>${g ? `<span class="ph-klein ${g.plausibel ? "" : "ph-rot"}">${g.plausibel ? "✓" : "⚠ " + esc(__(g.grund || ""))}${g.vorschlag_g ? ` · ${__("Vorschlag")} ${g.vorschlag_g} g` : ""}</span>` : ""}</td><td><input type="checkbox" class="pk-z" ${p.zerbrechlich ? "checked" : ""} ${ro}></td>
				<td><input class="form-control input-sm pk-i" value="${esc(p.inhalt || "")}" ${ro}>${bearbeitbar ? `<button class="btn btn-xs btn-default" data-act="inhalt">${__("Inhalt …")}</button>` : ""}</td><td>${bearbeitbar ? `<button class="btn btn-xs btn-default" data-act="paket-minus">✕</button>` : ""}${p.sendung ? `<a href="/app/ph-sendung/${esc(p.sendung)}">${esc(p.sendung)}</a>` : ""}</td></tr>`;
		}
		html += `</tbody></table>
			<div class="ph-versich"><label><input type="checkbox" class="ph-versichern" ${ls.versichern ? "checked" : ""} ${bearbeitbar ? "" : "disabled"}> ${__("Versichern")}</label>
			<label>${__("Versicherungswert")} <input type="number" class="form-control input-sm ph-versich-wert" value="${ls.versicherungswert_cent ? ls.versicherungswert_cent / 100 : ""}" step="0.01" ${bearbeitbar ? "" : "disabled"}> €</label>
			<span class="text-muted ph-klein">${__("Warenwert")} ${eur(ls.warenwert_cent)}${ls.zerbrechlich ? " · " + __("Glas/zerbrechlich → Versicherung (K17)") : ""}</span>
			${bearbeitbar ? `<button class="btn btn-default ph-btn" data-act="pakete-speichern">${__("Pakete speichern")}</button>` : ""}</div>`;

		// Aktionen
		html += `<div class="ph-aktionen">`;
		if (["Versand", "Spedition"].includes(ls.lieferart) && ["Entwurf", "Gepackt"].includes(ls.status) && !d.sendungen.some((s) => ["Angelegt", "Etikett", "Unterwegs"].includes(s.status) && s.richtung === "Ausgang")) {
			html += `<button class="btn btn-primary ph-btn ph-btn-gross" data-act="etikett">🏷 ${__("Etikett erzeugen")}</button>`;
		}
		if (ls.status === "Entwurf") {
			html += `<button class="btn btn-success ph-btn ph-btn-gross" data-act="verpacken" ${alleGepackt ? "" : "disabled"}>✓ ${__("Verpacken")}</button>`;
			html += `<button class="btn btn-default ph-btn" data-act="teillieferung">${__("Teillieferung (nur Gescanntes)")}</button>`;
			html += `<button class="btn btn-default ph-btn" data-act="zurueckstellen">⏸ ${__("Zurückstellen …")}</button>`;
		}
		if (ls.status === "Gepackt" && ls.lieferart === "Abholung") html += `<button class="btn btn-success ph-btn ph-btn-gross" data-act="abholung">✍ ${__("Abholung mit Unterschrift")}</button>`;
		if (ls.status === "Gepackt" && ls.lieferart !== "Abholung") html += `<button class="btn btn-default ph-btn ph-btn-gross" data-act="uebergeben">📦 ${__("An Dienstleister übergeben")}</button>`;
		html += `<button class="btn btn-default ph-btn" data-act="druck-ls">🖨 ${__("Lieferschein")}</button><button class="btn btn-default ph-btn" data-act="druck-pl">🖨 ${__("Packliste")}</button>`;
		for (const s of d.sendungen) {
			if (s.etikett) html += `<a class="btn btn-default ph-btn" href="${esc(s.etikett)}" target="_blank">🖨 ${__("Etikett")} ${esc(s.carrier || "")}</a>`;
		}
		html += `<a class="btn btn-link" href="/app/ph-lieferschein/${esc(ls.name)}">${__("Formular öffnen")}</a></div>`;

		// Sendungen
		if (d.sendungen.length) {
			html += `<h3 class="ph-h">${__("Sendungen")}</h3><div class="ph-liste">`;
			for (const s of d.sendungen) {
				html += `<a class="ph-karte ${STATUS_KLASSE[s.status] || ""}" href="/app/ph-sendung/${esc(s.name)}"><div class="ph-karte-kopf"><b>${esc(s.name)}</b><span class="ph-pill">${__(s.status)}</span><span class="ph-pill ph-pill-art">${__(s.richtung)}</span>${s.env === "mock" ? `<span class="ph-pill ph-st-orange">MOCK</span>` : ""}</div><div class="ph-karte-zeile">${esc(s.carrier || "")} ${esc(s.service_name || "")} · ${eur(s.preis_brutto_cent)} · ${esc(s.tracking_nr || "")}</div></a>`;
			}
			html += "</div>";
		}
		this.$body.html(html);
		this.binden();
	}

	binden() {
		const $b = this.$body;
		const ls = this.daten.lieferschein.name;
		$b.find("[data-act=zurueck]").on("click", () => this.uebersicht());
		const $scan = $b.find(".ph-scan-input");
		if ($scan.length) {
			setTimeout(() => $scan.trigger("focus"), 50);
			$scan.on("keydown", (e) => { if (e.key === "Enter") this.scan($scan.val()); });
			$b.find("[data-act=scan]").on("click", () => this.scan($scan.val()));
		}
		$b.find("[data-act=pack]").on("click", async (e) => {
			const r = await frappe.xcall(`${API}.position_packen`, { lieferschein: ls, position: $(e.currentTarget).data("pos"), anzahl: 1 });
			this.ton(r.vollstaendig ? "ok" : "tick");
			this.oeffnen(ls);
		});
		$b.find("[data-act=reset]").on("click", async (e) => { await frappe.xcall(`${API}.position_zuruecksetzen`, { lieferschein: ls, position: $(e.currentTarget).data("pos") }); this.oeffnen(ls); });
		$b.find(".ph-select-profil").on("change", (e) => {
			const pos = $(e.currentTarget).data("pos");
			const p = this.daten.positionen.find((x) => x.name === pos);
			if (p) p.paketprofil = $(e.currentTarget).val();
			frappe.db.set_value("PH Lieferschein Position", pos, "paketprofil", $(e.currentTarget).val() || null);
		});
		$b.find("[data-act=vorschlag]").on("click", async () => { await frappe.xcall(`${API}.pakete_vorschlagen`, { lieferschein: ls }); this.oeffnen(ls); });
		$b.find("[data-act=paket-plus]").on("click", () => { this.daten.pakete.push({ paket_nr: this.daten.pakete.length + 1 }); this.render(); });
		$b.find("[data-act=paket-minus]").on("click", (e) => { const nr = $(e.currentTarget).closest("tr").data("paket"); this.daten.pakete = this.daten.pakete.filter((p) => p.paket_nr !== nr).map((p, i) => ({ ...p, paket_nr: i + 1 })); this.render(); });
		$b.find(".pk-profil").on("change", (e) => {
			const pr = this.daten.profile.find((x) => x.key === $(e.currentTarget).val());
			const $tr = $(e.currentTarget).closest("tr");
			if (pr) { $tr.find(".pk-l").val(pr.laenge_cm); $tr.find(".pk-b").val(pr.breite_cm); $tr.find(".pk-h").val(pr.hoehe_cm); $tr.find(".pk-g").val(pr.gewicht_g); $tr.find(".pk-z").prop("checked", !!(pr.zerbrechlich || pr.glas)); }
		});
		$b.find("[data-act=pakete-speichern]").on("click", () => this.paketeSpeichern());
		$b.find("[data-act=gepackt]").on("click", () => this.alsGepackt());
		$b.find("[data-act=verpacken]").on("click", () => this.verpacken(0));
		$b.find("[data-act=teillieferung]").on("click", () => frappe.confirm(__("Nur gescannte Mengen verpacken, Rest als neuen Lieferschein anlegen?"), () => this.verpacken(1)));
		$b.find("[data-act=zurueckstellen]").on("click", () => this.zurueckstellen());
		$b.find("[data-act=fortsetzen]").on("click", async () => { await frappe.xcall(`${JTL}.fortsetzen`, { lieferschein: ls }); this.oeffnen(ls); });
		$b.find("[data-act=hinweise-ok]").on("click", async () => { await frappe.xcall(`${JTL}.packhinweise_bestaetigen`, { lieferschein: ls }); this.oeffnen(ls); });
		$b.find("[data-act=hand]").on("click", async (e) => { const r = await frappe.xcall(`${JTL}.hand_bestaetigen`, { lieferschein: ls, position: $(e.currentTarget).data("pos"), packplatz: packplatz() }); this.ton(r.vollstaendig ? "ok" : "tick"); this.oeffnen(ls); });
		$b.find("[data-act=inhalt]").on("click", (e) => this.inhaltDialog($(e.currentTarget).closest("tr").data("paket")));
		$b.find("[data-act=etikett]").on("click", () => this.etikett());
		$b.find("[data-act=uebergeben]").on("click", async () => { await frappe.xcall(`${API}.uebergeben`, { lieferschein: ls, an: "Dienstleister" }); this.oeffnen(ls); });
		$b.find("[data-act=abholung]").on("click", () => this.abholung());
		$b.find("[data-act=druck-ls]").on("click", () => frappe.utils.print("PH Lieferschein", ls, "PH Lieferschein Standard", null, "de"));
		$b.find("[data-act=druck-pl]").on("click", () => frappe.utils.print("PH Lieferschein", ls, "PH Lieferschein Packliste", null, "de"));
	}

	paketeLesen() {
		return this.$body.find(".ph-pakete tbody tr").toArray().map((tr, i) => {
			const $t = $(tr);
			const alt = (this.daten.pakete || [])[i] || {};
			return { paket_nr: i + 1, inhalt_map: alt.inhalt_map || null, paketprofil: $t.find(".pk-profil").val(), laenge_cm: +$t.find(".pk-l").val() || null, breite_cm: +$t.find(".pk-b").val() || null, hoehe_cm: +$t.find(".pk-h").val() || null, gewicht_g: +$t.find(".pk-g").val() || null, zerbrechlich: $t.find(".pk-z").is(":checked") ? 1 : 0, inhalt: $t.find(".pk-i").val() };
		});
	}

	async paketeSpeichern() {
		const ls = this.daten.lieferschein.name;
		const wert = this.$body.find(".ph-versich-wert").val();
		await frappe.xcall(`${JTL}.pakete_mit_inhalt`, { lieferschein: ls, packplatz: packplatz(), pakete: this.paketeLesen(), versichern: this.$body.find(".ph-versichern").is(":checked") ? 1 : 0, versicherungswert_cent: wert ? Math.round(parseFloat(wert) * 100) : 0 });
		frappe.show_alert({ message: __("Pakete gespeichert"), indicator: "green" });
		this.oeffnen(ls);
	}

	async scan(code) {
		if (!code) return;
		const ls = this.daten.lieferschein.name;
		const anzahl = parseInt(this.$body.find(".ph-menge-input").val() || "1", 10) || 1;
		let r = await frappe.xcall(`${JTL}.scan_menge`, { lieferschein: ls, code, anzahl, packplatz: packplatz() });
		if (r.bestaetigen) {
			const ok = await new Promise((res) => frappe.confirm(__("{0} Stück von „{1}“ packen?", [anzahl, esc(r.beschreibung || "")]), () => res(true), () => res(false)));
			if (!ok) return;
			r = await frappe.xcall(`${JTL}.scan_menge`, { lieferschein: ls, code, anzahl, bestaetigt: 1, packplatz: packplatz() });
		}
		if (r.treffer && r.fehler) { this.ton("fehler"); frappe.show_alert({ message: __("Menge nicht möglich ({0})", [r.fehler]), indicator: "red" }); return; }
		if (!r.treffer) { this.ton("fehler"); frappe.show_alert({ message: __("Kein offener Artikel zu „{0}“", [esc(code)]), indicator: "red" }); this.$body.find(".ph-scan-input").val("").trigger("focus"); return; }
		this.ton(r.vollstaendig ? "ok" : "tick");
		frappe.show_alert({ message: `${esc(r.beschreibung)} ${r.menge_gepackt}`, indicator: "green" });
		this.oeffnen(ls);
	}

	async alsGepackt() {
		const ls = this.daten.lieferschein.name;
		if (this.daten.lieferschein.status !== "Entwurf") return;
		if (this.$body.find(".ph-pakete tbody tr").length && this.daten.lieferschein.lieferart !== "Abholung") await this.paketeSpeichern();
		try { await frappe.xcall(`${API}.als_gepackt`, { lieferschein: ls }); frappe.show_alert({ message: __("Gepackt"), indicator: "green" }); this.ton("ok"); } finally { this.oeffnen(ls); }
	}

	async etikett() {
		const ls = this.daten.lieferschein.name;
		if (this.daten.lieferschein.status === "Entwurf") await this.paketeSpeichern();
		const t = await frappe.xcall(`${API}.tarife`, { lieferschein: ls });
		const opts = t.tarife.map((x) => ({ label: `${x.carrier} – ${x.name} · ${eur(x.cent)}${x.tage != null ? ` · ${x.tage} Tag(e)` : ""}`, value: x.id }));
		const d = new frappe.ui.Dialog({
			title: t.env === "mock" ? __("Etikett erzeugen (MOCK)") : __("Etikett erzeugen"),
			fields: [{ fieldname: "tarif", fieldtype: "Select", label: __("Dienst"), options: opts, default: t.empfehlung, reqd: 1 }],
			primary_action_label: __("Buchen und Etikett drucken"),
			primary_action: async (v) => {
				d.hide();
				const s = await frappe.xcall(`${API}.etikett_erzeugen`, { lieferschein: ls, tarif_id: v.tarif });
				frappe.show_alert({ message: __("Sendung {0} gebucht – {1}", [s.name, s.tracking_nr || ""]), indicator: "green" });
				if (s.etikett) window.open(s.etikett, "_blank");
				this.oeffnen(ls);
			},
		});
		d.show();
	}

	abholung() {
		const ls = this.daten.lieferschein;
		const d = new frappe.ui.Dialog({
			title: __("Abholung bestätigen"),
			fields: [
				{ fieldname: "info", fieldtype: "HTML", options: ls.abholcode ? `<p>${__("Abholcode laut Bestellung")}: <b class="ph-code">${esc(ls.abholcode)}</b></p>` : "" },
				{ fieldname: "empfaenger_name", fieldtype: "Data", label: __("Abgeholt von"), default: ls.kunde_name, reqd: 1 },
				{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
			],
			primary_action_label: __("Übergabe buchen"),
			primary_action: async (v) => { d.hide(); await frappe.xcall(`${API}.abholung_buchen`, { lieferschein: ls.name, empfaenger_name: v.empfaenger_name, unterschrift: v.unterschrift }); this.ton("ok"); this.oeffnen(ls.name); },
		});
		d.show();
	}

	async vorgang(code) {
		if (!code) return;
		const r = await frappe.xcall(`${JTL}.vorgang_scannen`, { code, packplatz: packplatz() });
		if (!r.lieferschein) { this.ton("fehler"); frappe.show_alert({ message: __("Kein offener Vorgang zu „{0}“", [esc(code)]), indicator: "red" }); this.$body.find(".ph-vorgang-input").val("").trigger("focus"); return; }
		if (r.schnellversand) {
			const s = await frappe.xcall(`${JTL}.schnellversand`, { code, packplatz: packplatz() });
			if (s.schnellversand) { this.ton("ok"); this.dokumenteDrucken(s); frappe.show_alert({ message: __("Schnellversand {0} – {1}", [s.lieferschein, (s.sendung && s.sendung.tracking_nr) || ""]), indicator: "green" }); this.uebersicht(); return; }
		}
		if ((r.kandidaten || []).length > 1) frappe.show_alert({ message: __("{0} passende Vorgänge – geöffnet: {1}", [r.kandidaten.length, r.lieferschein]), indicator: "blue" });
		this.oeffnen(r.lieferschein);
	}

	async verpacken(teillieferung) {
		const ls = this.daten.lieferschein;
		if (this.$body.find(".ph-pakete tbody tr").length && ls.lieferart !== "Abholung") await this.paketeSpeichern();
		const r = await frappe.xcall(`${JTL}.verpacken`, { lieferschein: ls.name, packplatz: packplatz(), teillieferung: teillieferung ? 1 : 0 });
		this.ton("ok");
		this.dokumenteDrucken(r);
		frappe.show_alert({ message: __("Verpackt") + (r.sendung ? ` · ${esc(r.sendung.tracking_nr || "")}` : "") + (r.rest ? ` · ${__("Rest")} ${esc(r.rest)}` : ""), indicator: "green" });
		this.oeffnen(ls.name);
	}

	dokumenteDrucken(r) {
		// Drucker je Dokumentart steht am Packplatz; ohne Druckdienst öffnet der Browser die Druckansicht.
		for (const d of r.dokumente || []) if (d.url) window.open(d.url, "_blank");
		if (r.sendung && r.sendung.etikett) window.open(r.sendung.etikett, "_blank");
	}

	zurueckstellen() {
		const ls = this.daten.lieferschein.name;
		const d = new frappe.ui.Dialog({
			title: __("Zurückstellen"),
			fields: [
				{ fieldname: "grund", fieldtype: "Select", label: __("Grund"), options: (this.zusatz.gruende || []).join("\n"), reqd: 1 },
				{ fieldname: "text", fieldtype: "Small Text", label: __("Bemerkung") },
			],
			primary_action_label: __("Zurückstellen"),
			primary_action: async (v) => { d.hide(); await frappe.xcall(`${JTL}.zurueckstellen`, { lieferschein: ls, grund: v.grund, text: v.text }); this.uebersicht(); },
		});
		d.show();
	}

	inhaltDialog(nr) {
		const pk = (this.daten.pakete || []).find((p) => p.paket_nr === nr);
		if (!pk) return;
		const felder = this.daten.positionen.map((p) => ({ fieldname: p.name, fieldtype: "Int", label: `${p.beschreibung} (${p.menge_gepackt || 0}/${p.menge})`, default: (pk.inhalt_map || {})[p.name] || 0 }));
		const d = new frappe.ui.Dialog({
			title: __("Inhalt Paket {0}", [nr]),
			fields: felder,
			primary_action_label: __("Übernehmen"),
			primary_action: async (v) => { d.hide(); pk.inhalt_map = {}; for (const [k, m] of Object.entries(v)) if (m > 0) pk.inhalt_map[k] = m; await this.paketeSpeichern(); },
		});
		d.show();
	}

	ton(art) {
		if (this.pp && ((art === "fehler" && !this.pp.ton_fehler) || (art !== "fehler" && this.pp.ton_erfolg === 0))) return;
		try {
			const ctx = new (window.AudioContext || window.webkitAudioContext)();
			const o = ctx.createOscillator();
			const g = ctx.createGain();
			o.connect(g); g.connect(ctx.destination);
			o.frequency.value = art === "fehler" ? 220 : art === "ok" ? 880 : 660;
			g.gain.value = 0.08;
			o.start(); o.stop(ctx.currentTime + (art === "fehler" ? 0.3 : 0.12));
		} catch (e) { /* kein Ton verfügbar */ }
	}
}
