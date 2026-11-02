// tools/seo/indexnow.mjs
// Meldet URLs per IndexNow an Bing (teilt sie mit Yandex, Seznam, Naver …).
// NUR nach einem Produktions-Deploy ausführen – nie gegen Entwicklung.
// Aufruf:
//   node tools/seo/indexnow.mjs              → alle URLs aus https://platzhirsch.studio/sitemap.xml
//   node tools/seo/indexnow.mjs URL1 URL2    → nur diese URLs
//   --dry                                     → nur anzeigen, nichts senden
// Der Schlüssel liegt als public/<KEY>.txt und muss live erreichbar sein.
const HOST = "platzhirsch.studio";
const KEY = "256a3454d816cb8b6fb11ad211a8bac7";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX = 10000; // IndexNow-Grenze je Anfrage

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const given = args.filter((a) => a.startsWith("https://"));

async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const xml = await (await fetch(url)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (/<sitemapindex/.test(xml)) {
    const out = [];
    for (const s of locs) out.push(...(await sitemapUrls(s, seen)));
    return out;
  }
  return locs;
}

const urls = [...new Set(given.length ? given : await sitemapUrls(`https://${HOST}/sitemap.xml`))]
  .filter((u) => new URL(u).host === HOST);
console.log(`${urls.length} URLs`);
if (dry || !urls.length) process.exit(0);

for (let i = 0; i < urls.length; i += MAX) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + MAX) }),
  });
  console.log(`Block ${i / MAX + 1}: HTTP ${res.status}`); // 200/202 = angenommen
}
