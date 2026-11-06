// PH Ordner – Desk-Formular (Baum: /app/ph-ordner/view/tree).
frappe.ui.form.on("PH Ordner", {
	setup(frm) {
		frm.set_query("bezug_doctype", () => ({ filters: { name: ["in", ["PH Kontakt", "PH Projekt", "PH Lieferant", "PH Mitarbeiter", "PH Servicefall"]] } }));
		frm.set_query("parent_ph_ordner", () => ({ filters: { name: ["!=", frm.doc.name || ""] } }));
	},
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Dateien"), () => frappe.set_route("List", "PH Datei", { ordner: frm.doc.name, status: "Aktiv" }), __("Aktionen"));
		frm.add_custom_button(__("Datei hochladen"), () => ph_ordner_hochladen(frm), __("Aktionen"));
		if (frm.doc.bezug_doctype && frm.doc.bezug_name) {
			frm.add_custom_button(__("Zum Bezug"), () => frappe.set_route("Form", frm.doc.bezug_doctype, frm.doc.bezug_name), __("Aktionen"));
		}
	},
});

function ph_ordner_base64(blob) {
	return new Promise((ok, fehler) => {
		const r = new FileReader();
		r.onload = () => ok(String(r.result).split(",")[1]);
		r.onerror = fehler;
		r.readAsDataURL(blob);
	});
}

function ph_ordner_hochladen(frm) {
	const input = document.createElement("input");
	input.type = "file";
	input.onchange = async () => {
		const datei = input.files[0];
		if (!datei) return;
		frappe.show_alert({ message: __("Prüfsumme wird berechnet …"), indicator: "blue" });
		const puffer = await datei.arrayBuffer();
		const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", puffer))).map((b) => b.toString(16).padStart(2, "0")).join("");
		const start = await frappe.call({ method: "ph_ablage.api.upload_start", args: { ordner: frm.doc.name, dateiname: datei.name, groesse: datei.size, mime: datei.type, sha256: sha } });
		const s = start.message;
		if (s.ziel.art === "direkt") {
			await fetch(s.ziel.url, { method: s.ziel.methode, headers: s.ziel.header, body: datei });
		} else {
			const n = s.ziel.chunk_bytes;
			for (let offset = 0; offset < datei.size; offset += n) {
				const teil = await ph_ordner_base64(datei.slice(offset, offset + n));
				await frappe.call({ method: "ph_ablage.api.upload_chunk", args: { token: s.token, offset: offset, daten: teil } });
				frappe.show_progress(__("Hochladen"), Math.min(offset + n, datei.size), datei.size, datei.name);
			}
			frappe.hide_progress();
		}
		const r = await frappe.call({ method: "ph_ablage.api.upload_abschliessen", args: { token: s.token, sha256: sha } });
		const m = r.message || {};
		frappe.show_alert({ message: m.duplikat ? __("Hochgeladen – gleiche Datei existiert bereits") : __("Hochgeladen"), indicator: m.duplikat ? "orange" : "green" });
		frappe.set_route("Form", "PH Datei", m.datei);
	};
	input.click();
}
