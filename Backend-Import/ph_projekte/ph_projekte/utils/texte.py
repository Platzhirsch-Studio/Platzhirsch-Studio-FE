"""Mehrsprachige Texte für Montagebericht und Abnahmeprotokoll (de/en/fr/it; Inhaber-Frage Nr. 14).

Verwendung in Druckformaten über die Jinja-Methode ph_projekte.utils.texte.montage_text(sprache, key)
(hooks.py → jinja.methods). Kein Frappe-Import, damit unittest ohne Site läuft."""

SPRACHEN = ("de", "en", "fr", "it")

TEXTE = {
    "montagebericht": {"de": "Montagebericht", "en": "Installation report", "fr": "Rapport de montage", "it": "Rapporto di montaggio"},
    "abnahmeprotokoll": {"de": "Abnahmeprotokoll", "en": "Acceptance report", "fr": "Procès-verbal de réception", "it": "Verbale di collaudo"},
    "projekt": {"de": "Projekt", "en": "Project", "fr": "Projet", "it": "Progetto"},
    "kunde": {"de": "Kunde", "en": "Customer", "fr": "Client", "it": "Cliente"},
    "datum": {"de": "Datum", "en": "Date", "fr": "Date", "it": "Data"},
    "einsatzort": {"de": "Einsatzort", "en": "Site", "fr": "Lieu d'intervention", "it": "Luogo"},
    "team": {"de": "Montageteam", "en": "Installation team", "fr": "Équipe de montage", "it": "Squadra di montaggio"},
    "leistungen": {"de": "Ausgeführte Leistungen", "en": "Work carried out", "fr": "Prestations réalisées", "it": "Lavori eseguiti"},
    "leistung": {"de": "Leistung", "en": "Work", "fr": "Prestation", "it": "Lavoro"},
    "stunden": {"de": "Stunden", "en": "Hours", "fr": "Heures", "it": "Ore"},
    "erledigt": {"de": "Erledigt", "en": "Done", "fr": "Terminé", "it": "Completato"},
    "offen": {"de": "Offen", "en": "Open", "fr": "Ouvert", "it": "Aperto"},
    "fotos_vorher": {"de": "Fotos vorher", "en": "Photos before", "fr": "Photos avant", "it": "Foto prima"},
    "fotos_nachher": {"de": "Fotos nachher", "en": "Photos after", "fr": "Photos après", "it": "Foto dopo"},
    "bericht": {"de": "Bericht", "en": "Report", "fr": "Rapport", "it": "Rapporto"},
    "maengel": {"de": "Festgestellte Mängel", "en": "Defects noted", "fr": "Défauts constatés", "it": "Difetti riscontrati"},
    "keine_maengel": {"de": "Keine Mängel festgestellt.", "en": "No defects noted.", "fr": "Aucun défaut constaté.", "it": "Nessun difetto riscontrato."},
    "frist": {"de": "Frist", "en": "Deadline", "fr": "Délai", "it": "Termine"},
    "zustand": {"de": "Zustand", "en": "Condition", "fr": "État", "it": "Stato"},
    "position": {"de": "Position", "en": "Item", "fr": "Poste", "it": "Posizione"},
    "beschreibung": {"de": "Beschreibung", "en": "Description", "fr": "Description", "it": "Descrizione"},
    "unterschrift_kunde": {"de": "Unterschrift Kunde", "en": "Customer signature", "fr": "Signature du client", "it": "Firma del cliente"},
    "unterschrift_monteur": {"de": "Unterschrift Monteur", "en": "Installer signature", "fr": "Signature du monteur", "it": "Firma del montatore"},
    "unterschrift_studio": {"de": "Unterschrift Platzhirsch", "en": "Platzhirsch signature", "fr": "Signature Platzhirsch", "it": "Firma Platzhirsch"},
    "bestaetigung": {
        "de": "Der Kunde bestätigt die ordnungsgemäße Ausführung der oben genannten Leistungen, vorbehaltlich der aufgeführten Mängel.",
        "en": "The customer confirms that the work listed above has been carried out properly, subject to the defects noted.",
        "fr": "Le client confirme la bonne exécution des prestations ci-dessus, sous réserve des défauts mentionnés.",
        "it": "Il cliente conferma la corretta esecuzione dei lavori sopra indicati, fatti salvi i difetti elencati.",
    },
    "abnahme_erklaert": {"de": "Die Abnahme wird erklärt.", "en": "Acceptance is declared.", "fr": "La réception est prononcée.", "it": "Il collaudo è dichiarato."},
    "abnahme_vorbehalt": {"de": "Abnahme unter Vorbehalt der genannten Mängel.", "en": "Acceptance subject to the defects listed.", "fr": "Réception sous réserve des défauts mentionnés.", "it": "Collaudo con riserva dei difetti indicati."},
    "vorbehalte": {"de": "Vorbehalte", "en": "Reservations", "fr": "Réserves", "it": "Riserve"},
    "anwesend": {"de": "Anwesend", "en": "Present", "fr": "Présents", "it": "Presenti"},
    "naechste_schritte": {"de": "Nächste Schritte", "en": "Next steps", "fr": "Prochaines étapes", "it": "Prossimi passi"},
    "ok": {"de": "in Ordnung", "en": "ok", "fr": "conforme", "it": "conforme"},
    "Mangel": {"de": "Mangel", "en": "defect", "fr": "défaut", "it": "difetto"},
    "Nacharbeit": {"de": "Nacharbeit", "en": "rework", "fr": "reprise", "it": "rilavorazione"},
    "danke": {"de": "Vielen Dank für Ihr Vertrauen.", "en": "Thank you for your trust.", "fr": "Merci de votre confiance.", "it": "Grazie per la fiducia."},
    "koordination": {
        "de": "Fremdgewerke werden von Platzhirsch nur terminlich koordiniert; der Vertrag besteht direkt zwischen Kunde und Partnerbetrieb.",
        "en": "Third-party trades are only coordinated by Platzhirsch in terms of scheduling; the contract is directly between customer and partner company.",
        "fr": "Les corps de métier tiers sont uniquement coordonnés par Platzhirsch sur le plan des délais ; le contrat lie directement le client et l'entreprise partenaire.",
        "it": "Le imprese terze sono coordinate da Platzhirsch solo per i tempi; il contratto intercorre direttamente tra cliente e impresa partner.",
    },
}


def montage_text(sprache, key):
    """Text in der gewünschten Sprache, Rückfall Deutsch, dann der Schlüssel selbst."""
    sprache = (sprache or "de")[:2].lower()
    if sprache not in SPRACHEN:
        sprache = "de"
    eintrag = TEXTE.get(key)
    if not eintrag:
        return key
    return eintrag.get(sprache) or eintrag["de"]
