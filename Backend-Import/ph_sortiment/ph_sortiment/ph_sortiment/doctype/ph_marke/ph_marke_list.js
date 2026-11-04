frappe.listview_settings["PH Marke"] = {
	add_fields: ["status", "haendlerstatus", "bildfreigabe_status", "logo"],
	filters: [["status", "!=", "Inaktiv"]],
	get_indicator(doc) {
		if (doc.status !== "Aktiv") return [__(doc.status), doc.status === "Pausiert" ? "orange" : "gray", `status,=,${doc.status}`];
		const mit_status = ["Haendler", "Vertragshaendler", "Exklusiv", "Partner"].includes(doc.haendlerstatus);
		return mit_status ? [__("Aktiv · {0}", [__(doc.haendlerstatus)]), "green", `haendlerstatus,=,${doc.haendlerstatus}`] : [__("Aktiv · ohne Händlerstatus"), "orange", "haendlerstatus,=,Keiner"];
	},
};
