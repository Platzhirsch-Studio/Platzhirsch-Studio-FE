// Waits until the server under test answers /de with 200 before any test runs.
// The dev server is shared with other teams and briefly returns 500 while a
// file is half-saved; starting into that window would fail every test.
export default async function globalSetup(config) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.BASE_URL || "http://localhost:3000";
  const url = new URL("/de", baseURL).toString();
  const deadline = Date.now() + 180_000;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.status === 200) return;
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = String(err);
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error(`Server ${url} nicht bereit (${last}). Läuft der Dev-Server und kompiliert er fehlerfrei?`);
}
