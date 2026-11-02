// src/lib/concierge/retention.js
// Deletion period of optionally stored concierge transcripts – the ONE value.
// Plain module (no "server-only"): the consent text in the client (ChatCore,
// Labs Concierge) shows it, the server store (store.js via config.js) uses it,
// the services register (lib/legal/services.js) quotes it and r4-recht.test
// compares. Rechtspaket 4.6 / Entwurf 02 V13: 30 days. A different value needs
// an owner decision in inhaber-entscheidungen.md first.
export const RETENTION_DAYS = 30;
