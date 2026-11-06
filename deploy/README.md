# deploy/ – Staging und Produktion

| Ordner/Datei | Wofür |
|---|---|
| [`staging/`](staging/README.md) | Ein-Befehl-Staging der 12 Frappe-Apps (`./setup.sh`, `./test.sh`, `./reset.sh`) – erster echter Installations- und Testlauf |
| [`produktion/`](produktion/README.md) | Vorlagen für drei getrennte Hosts: Website (:3000), Backoffice (:3100), Frappe (backend.) – Containerfiles, Compose, Caddy/Nginx, systemd/PM2, `.env.example` |
| [`CHECKLISTE-LIVEGANG.md`](CHECKLISTE-LIVEGANG.md) | Schritt für Schritt für Inhaber/IT: Server, DNS, Zertifikate, Secrets, Stripe, Resend, A-Trust/FinanzOnline, Migration M1–M10, Umschalten, Rollback, Monitoring, Backups |

Grundregeln: keine Geheimnisse im Repo (nur `.env.example` mit Namen; `deploy/.gitignore`), kein Zugriff auf Produktionsserver aus Staging, Build-Kontext aller Images ist das Repo-Root (`docker build -f deploy/… .`). Alles wurde nur statisch geprüft (kein Docker auf dem Entwicklungsrechner).
