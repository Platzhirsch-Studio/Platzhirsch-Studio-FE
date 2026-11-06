// PH Datei – Desk-Formular. Die eigentliche Drive-Oberfläche baut das Next.js-Backoffice (README „Schnittstelle“).
frappe.ui.form.on("PH Datei", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.status === "Papierkorb") {
			frm.set_intro(__("Im Papierkorb – endgültig gelöscht ab {0}.", [frappe.datetime.str_to_user(frm.doc.papierkorb_bis)]), "orange");
		} else if (frm.doc.gesperrt_von) {
			frm.set_intro(__("Ausgecheckt von {0} bis {1}.", [frappe.user.full_name(frm.doc.gesperrt_von), frappe.datetime.str_to_user(frm.doc.gesperrt_bis)]), "blue");
		}
		if (frm.doc.status === "Aktiv") {
			frm.add_custom_button(__("Herunterladen"), () => ph_ablage_oeffnen(frm), __("Aktionen"));
			frm.add_custom_button(__("Neue Version hochladen"), () => ph_ablage_hochladen({ datei: frm.doc.name }, () => frm.reload_doc()), __("Aktionen"));
			if (!frm.doc.gesperrt_von) {
				frm.add_custom_button(__("Auschecken (bearbeiten)"), () =>
					frm.call({ method: "auschecken", doc: frm.doc, args: { stunden: null } }).then(() => frm.reload_doc()), __("Aktionen"));
			} else {
				frm.add_custom_button(__("Einchecken"), () =>
					frm.call({ method: "einchecken", doc: frm.doc, args: { erzwingen: frm.doc.gesperrt_von !== frappe.session.user ? 1 : 0 } }).then(() => frm.reload_doc()), __("Aktionen"));
			}
			frm.add_custom_button(__("Freigabelink"), () => ph_ablage_freigabe_dialog(frm), __("Aktionen"));
			frm.add_custom_button(__("Vorschau neu erzeugen"), () =>
				frm.call({ method: "vorschau_neu", doc: frm.doc }).then(() => frappe.show_alert(__("Eingereiht"))), __("Aktionen"));
			frm.add_custom_button(__("In den Papierkorb"), () =>
				frappe.confirm(__("Datei in den Papierkorb legen?"), () =>
					frm.call({ method: "in_papierkorb", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.status === "Papierkorb") {
			frm.add_custom_button(__("Wiederherstellen"), () =>
				frm.call({ method: "wiederherstellen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
	},
});

function ph_ablage_freigabe_dialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Freigabelink erstellen"),
		fields: [
			{ fieldname: "tage", fieldtype: "Int", label: __("Gültig (Tage)"), default: 7 },
			{ fieldname: "passwort", fieldtype: "Password", label: __("Passwort (optional)") },
			{ fieldname: "max_downloads", fieldtype: "Int", label: __("Höchstzahl Downloads (0 = unbegrenzt)") },
			{ fieldname: "empfaenger_hinweis", fieldtype: "Data", label: __("Für (Hinweis, keine E-Mail)") },
		],
		primary_action_label: __("Erstellen"),
		primary_action(v) {
			frm.call({ method: "freigabelink", doc: frm.doc, args: { tage: v.tage, passwort: v.passwort, max_downloads: v.max_downloads, empfaenger_hinweis: v.empfaenger_hinweis } }).then((r) => {
				d.hide();
				const m = r.message || {};
				const wert = frappe.utils.escape_html(m.url || m.token || "");
				frappe.msgprint({ title: __("Freigabelink"), message: "<p>" + __("Nur jetzt sichtbar – bitte kopieren:") + "</p><p><code>" + wert + "</code></p>" });
				frm.reload_doc();
			});
		},
	});
	d.show();
}

function ph_ablage_oeffnen(frm) {
	frm.call({ method: "herunterladen_link", doc: frm.doc, args: { version: null } }).then((r) => {
		const m = r.message || {};
		if (m.url) window.open(m.url, "_blank", "noopener");
	});
}

// Einfacher Desk-Upload (Prüfsumme im Browser, Teile über ph_ablage.api.upload_chunk) – Neue Version.
function ph_ablage_hochladen(ziel, fertig) {
	const input = document.createElement("input");
	input.type = "file";
	input.onchange = async () => {
		const datei = input.files[0];
		if (!datei) return;
		frappe.show_alert({ message: __("Prüfsumme wird berechnet …"), indicator: "blue" });
		const puffer = await datei.arrayBuffer();
		const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", puffer))).map((b) => b.toString(16).padStart(2, "0")).join("");
		const start = await frappe.call({ method: "ph_ablage.api.neue_version", args: { datei: ziel.datei, groesse: datei.size, mime: datei.type, sha256: sha } });
		const s = start.message;
		if (s.ziel.art === "direkt") {
			await fetch(s.ziel.url, { method: s.ziel.methode, headers: s.ziel.header, body: datei });
		} else {
			const n = s.ziel.chunk_bytes;
			for (let offset = 0; offset < datei.size; offset += n) {
				const teil = await ph_ablage_base64(datei.slice(offset, offset + n));
				await frappe.call({ method: "ph_ablage.api.upload_chunk", args: { token: s.token, offset: offset, daten: teil } });
				frappe.show_progress(__("Hochladen"), Math.min(offset + n, datei.size), datei.size, datei.name);
			}
			frappe.hide_progress();
		}
		await frappe.call({ method: "ph_ablage.api.upload_abschliessen", args: { token: s.token, sha256: sha } });
		frappe.show_alert({ message: __("Neue Version hochgeladen"), indicator: "green" });
		if (fertig) fertig();
	};
	input.click();
}

function ph_ablage_base64(blob) {
	return new Promise((ok, fehler) => {
		const r = new FileReader();
		r.onload = () => ok(String(r.result).split(",")[1]);
		r.onerror = fehler;
		r.readAsDataURL(blob);
	});
}
