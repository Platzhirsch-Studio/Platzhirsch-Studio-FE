// Akte-Slots – Bereich Personal (G-14, Slot-API v1). Schreibt: Team B-PER.
// Bewusst leer: Personaldaten haben keinen Bezug zur Kundenakte (PH Kontakt) oder Auftragsmappe (PH Projekt) –
// ph_personal ist laut Backend „bewusst nicht“ am Kontakt-Hook-Vertrag beteiligt (52-backend-luecken, Hook-Vertrag).
// Projektzeiten gehören zu PH Projektzeit (Bereich Projekte). Kommt später ein Abschnitt (z. B. „Team im Projekt“
// aus PH Zeiterfassung.projekt), wird er hier nach SLOT-API v1 eingetragen und die Zeile in index.js gemeldet.

const slots = [];

export default slots;
