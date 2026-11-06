// Eigene Next.js-Anwendung des Backoffice (Port 3100). Läuft im gemeinsamen
// Repo neben der Website, aber als eigener Dienst. Abhängigkeiten werden über
// die Node-Auflösung aus dem Eltern-node_modules gefunden (kein eigenes
// npm install), daher zeigt turbopack.root auf das Repo – siehe
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md.
const path = require("node:path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // Nie indexieren – zusätzlich zur Metadata-Angabe im Layout.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
