// Mobile Desk-Page „Tour heute“ (ph-tour), Vorbild SHD mex: Stopps in Reihenfolge, Navigation-Link, Unterlagen (PDF),
// Fotos vorher/nachher (Kamera-Upload), Kundenunterschrift, Lieferbestätigung senden, Status je Stopp.
// Offline ist nicht vorgesehen (Hinweis in der Oberfläche). Server: ph_logistik.ph_logistik.tour_mobil.
/* global frappe, __ */

frappe.pages["ph-tour"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Tour heute"), single_column: true });
	wrapper.tour = new PHTourMobil(page, wrapper);
};
frappe.pages["ph-tour"].on_page_show = function (wrapper) {
	const t = frappe.route_options && frappe.route_options.tour;
	if (t) { frappe.route_options = null; wrapper.tour.oeffnen(t); } else if (!wrapper.tour.aktuell) wrapper.tour.liste();
};

const TAPI = "ph_logistik.ph_logistik.tour_mobil";
const tesc = (s) => frappe.utils.escape_html(String(s == null ? "" : s));
const STOPP_KLASSE = { offen: "ph-st-blau", unterwegs: "ph-st-orange", erledigt: "ph-st-gruen", "nicht angetroffen": "ph-st-rot", verschoben: "ph-st-grau" };

class PHTourMobil {
	constructor(page, wrapper) {
		this.page = page;
		this.$body = $(wrapper).find(".layout-main-section").addClass("ph-tour-mobil");
		this.aktuell = null;
		this.page.set_secondary_action(__("Aktualisieren"), () => (this.aktuell ? this.oeffnen(this.aktuell) : this.liste()), "refresh");
	}

	async liste(datum) {
		this.aktuell = null;
		this.page.set_title(__("Tour heute"));
		this.page.clear_primary_action();
		datum = datum || frappe.datetime.get_today();
		const touren = await frappe.xcall(`${TAPI}.meine_touren`, { datum });
		let html = `<div class="ph-datum"><button class="btn btn-default ph-btn" data-d="-1">‹</button><b>${frappe.datetime.str_to_user(datum)}</b><button class="btn btn-default ph-btn" data-d="1">›</button></div>
			<div class="ph-hinweis ph-klein">${__("Online nötig – kein Offline-Betrieb. Fotos werden sofort hochgeladen.")}</div><div class="ph-liste">`;
		if (!touren.length) html += `<div class="ph-leer">${__("Keine Tour an diesem Tag.")}</div>`;
		for (const t of touren) {
			html += `<button class="ph-karte ${({ Geplant: "ph-st-blau", Freigegeben: "ph-st-cyan", Unterwegs: "ph-st-orange", Abgeschlossen: "ph-st-gruen" })[t.status] || ""}" data-tour="${tesc(t.name)}"><div class="ph-karte-kopf"><b>${tesc(t.region || t.name)}</b><span class="ph-pill">${__(t.status)}</span></div><div class="ph-karte-zeile">${tesc(t.fahrzeug || "")} · ${__("Abfahrt")} ${tesc((t.start_zeit || "").slice(0, 5))} · ${t.anzahl_erledigt || 0}/${t.anzahl_stopps || 0} ${__("Stopps")}</div></button>`;
		}
		html += "</div>";
		this.$body.html(html);
		this.$body.find("[data-tour]").on("click", (e) => this.oeffnen($(e.currentTarget).data("tour")));
		this.$body.find("[data-d]").on("click", (e) => this.liste(frappe.datetime.add_days(datum, +$(e.currentTarget).data("d"))));
	}

	async oeffnen(name) {
		this.aktuell = name;
		this.d = await frappe.xcall(`${TAPI}.tour`, { name });
		const t = this.d.tour;
		this.page.set_title(t.region || t.name);
		this.page.set_indicator(__(t.status), { Geplant: "blue", Freigegeben: "cyan", Unterwegs: "orange", Abgeschlossen: "green", Abgebrochen: "gray" }[t.status] || "gray");
		this.page.clear_primary_action();
		if (["Geplant", "Freigegeben"].includes(t.status)) this.page.set_primary_action(__("Tour starten"), () => this.starten(), "play");
		if (t.status === "Unterwegs") this.page.set_primary_action(__("Tour abschließen"), () => this.abschliessen(), "check");
		this.render();
	}

	render() {
		const t = this.d.tour;
		let html = `<div class="ph-zurueck"><button class="btn btn-default ph-btn" data-act="zurueck">← ${__("Touren")}</button>
			<div class="ph-kopf"><div><b>${tesc(this.d.fahrer_name || "")}</b> · ${tesc(this.d.fahrzeug ? this.d.fahrzeug.kennzeichen : "")}<br><span class="text-muted">${frappe.datetime.str_to_user(t.datum)} · ${t.anzahl_erledigt || 0}/${t.anzahl_stopps || 0} ${__("erledigt")}</span></div>
			${t.route_url ? `<a class="btn btn-default ph-btn" href="${tesc(t.route_url)}" target="_blank">🗺 ${__("Route")}</a>` : ""}</div></div><div class="ph-stopps">`;
		for (const s of this.d.stopps) {
			const aktiv = t.status === "Unterwegs" && !["erledigt"].includes(s.status);
			html += `<div class="ph-stopp ${STOPP_KLASSE[s.status] || ""}" data-stopp="${tesc(s.name)}">
				<div class="ph-stopp-kopf"><span class="ph-stopp-nr">${s.reihenfolge}</span><div class="ph-stopp-titel"><b>${tesc(s.kunde_name || "")}</b> <span class="ph-pill ph-pill-art">${__(s.art)}</span><br><span class="text-muted">${tesc(s.adresse || "")}, ${tesc(s.plz || "")} ${tesc(s.ort || "")}</span>${s.zeitfenster_von ? `<br><span class="text-muted">⏱ ${tesc(s.zeitfenster_von.slice(0, 5))}${s.zeitfenster_bis ? "–" + tesc(s.zeitfenster_bis.slice(0, 5)) : ""}</span>` : ""}</div><span class="ph-pill">${__(s.status)}</span></div>
				${s.notiz ? `<div class="ph-hinweis ph-klein">${tesc(s.notiz)}</div>` : ""}
				${(s.positionen || []).length ? `<ul class="ph-pos-kurz">${s.positionen.map((p) => `<li>${p.menge}× ${tesc(p.beschreibung)}${p.ausfuehrung_text ? " · " + tesc(p.ausfuehrung_text) : ""}</li>`).join("")}</ul>` : ""}
				<div class="ph-stopp-aktionen">
					${s.navigation_url ? `<a class="btn btn-default ph-btn" href="${tesc(s.navigation_url)}" target="_blank">🧭 ${__("Navigation")}</a>` : ""}
					${s.telefon ? `<a class="btn btn-default ph-btn" href="tel:${tesc(s.telefon)}">📞 ${__("Anrufen")}</a>` : ""}
					${(s.unterlagen || []).map((u) => `<a class="btn btn-default ph-btn" href="${tesc(u.url)}" target="_blank">📄 ${tesc(u.titel)}</a>`).join("")}
					${aktiv && s.status === "offen" ? `<button class="btn btn-primary ph-btn" data-act="status" data-status="unterwegs">🚚 ${__("Unterwegs zu Stopp")}</button>` : ""}
					${aktiv ? `<button class="btn btn-default ph-btn" data-act="foto" data-art="vorher">📷 ${__("Foto vorher")}</button><button class="btn btn-default ph-btn" data-act="foto" data-art="nachher">📷 ${__("Foto nachher")}</button>` : ""}
					${aktiv ? `<button class="btn btn-success ph-btn ph-btn-gross" data-act="erledigt">✍ ${__("Erledigt + Unterschrift")}</button><button class="btn btn-danger ph-btn" data-act="status" data-status="nicht angetroffen">${__("Nicht angetroffen")}</button><button class="btn btn-default ph-btn" data-act="status" data-status="verschoben">${__("Verschoben")}</button>` : ""}
					${s.status === "erledigt" && s.lieferschein && s.kunde_email && !s.bestaetigung_gesendet_am ? `<button class="btn btn-default ph-btn" data-act="bestaetigung">✉ ${__("Lieferbestätigung senden")}</button>` : ""}
					${s.bestaetigung_gesendet_am ? `<span class="ph-pill ph-st-gruen">✉ ${__("Bestätigung gesendet")}</span>` : ""}
				</div>
				${(s.fotos || []).length ? `<div class="ph-fotos">${s.fotos.map((f) => `<a href="${tesc(f.foto)}" target="_blank"><img src="${tesc(f.foto)}" alt="${tesc(f.art)}"><span>${__(f.art)}</span></a>`).join("")}</div>` : ""}
				${s.unterschrift ? `<div class="ph-unterschrift"><img src="${tesc(s.unterschrift)}" alt="${__("Unterschrift")}"><span>${tesc(s.unterschrift_name || "")}</span></div>` : ""}
			</div>`;
		}
		html += "</div>";
		this.$body.html(html);
		const $b = this.$body;
		$b.find("[data-act=zurueck]").on("click", () => this.liste(t.datum));
		$b.find("[data-act=status]").on("click", async (e) => {
			const $s = $(e.currentTarget).closest(".ph-stopp");
			const status = $(e.currentTarget).data("status");
			let notiz = null;
			if (status !== "unterwegs") notiz = await new Promise((res) => frappe.prompt({ fieldname: "n", fieldtype: "Small Text", label: __("Notiz") }, (v) => res(v.n), __(status)));
			await frappe.xcall(`${TAPI}.stopp_status`, { tour: t.name, stopp: $s.data("stopp"), status, notiz });
			this.oeffnen(t.name);
		});
		$b.find("[data-act=erledigt]").on("click", (e) => this.erledigt($(e.currentTarget).closest(".ph-stopp").data("stopp")));
		$b.find("[data-act=foto]").on("click", (e) => this.foto($(e.currentTarget).closest(".ph-stopp"), $(e.currentTarget).data("art")));
		$b.find("[data-act=bestaetigung]").on("click", async (e) => { await frappe.xcall(`${TAPI}.lieferbestaetigung`, { tour: t.name, stopp: $(e.currentTarget).closest(".ph-stopp").data("stopp") }); frappe.show_alert({ message: __("Gesendet"), indicator: "green" }); this.oeffnen(t.name); });
	}

	erledigt(stopp) {
		const s = this.d.stopps.find((x) => x.name === stopp);
		const d = new frappe.ui.Dialog({
			title: __("Lieferung bestätigen"),
			fields: [
				{ fieldname: "unterschrift_name", fieldtype: "Data", label: __("Name"), default: s ? s.kunde_name : "", reqd: 1 },
				{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift Kunde") },
				{ fieldname: "notiz", fieldtype: "Small Text", label: __("Bemerkung") },
			],
			primary_action_label: __("Erledigt"),
			primary_action: async (v) => { d.hide(); await frappe.xcall(`${TAPI}.stopp_status`, { tour: this.d.tour.name, stopp, status: "erledigt", notiz: v.notiz, unterschrift: v.unterschrift, unterschrift_name: v.unterschrift_name }); this.oeffnen(this.d.tour.name); },
		});
		d.show();
	}

	foto($stopp, art) {
		const s = this.d.stopps.find((x) => x.name === $stopp.data("stopp"));
		new frappe.ui.FileUploader({
			doctype: "PH Tour",
			docname: this.d.tour.name,
			folder: "Home/Attachments",
			allow_multiple: false,
			restrictions: { allowed_file_types: ["image/*"] },
			make_attachments_public: false,
			on_success: async (file) => {
				await frappe.xcall(`${TAPI}.foto`, { tour: this.d.tour.name, stopp_nr: s.reihenfolge, file_url: file.file_url, art });
				this.oeffnen(this.d.tour.name);
			},
		});
	}

	starten() {
		frappe.prompt({ fieldname: "km", fieldtype: "Int", label: __("km-Stand") }, async (v) => { await frappe.xcall(`${TAPI}.starten`, { tour: this.d.tour.name, km_start: v.km }); this.oeffnen(this.d.tour.name); }, __("Tour starten"));
	}

	abschliessen() {
		frappe.prompt({ fieldname: "km", fieldtype: "Int", label: __("km-Stand Ende") }, async (v) => { await frappe.xcall(`${TAPI}.abschliessen`, { tour: this.d.tour.name, km_ende: v.km }); this.oeffnen(this.d.tour.name); }, __("Tour abschließen"));
	}
}
