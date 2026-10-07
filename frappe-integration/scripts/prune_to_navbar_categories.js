// One-off maintenance script: keeps only the 31 navbar-matching Produkte
// Kategorie rows (the 30 navbar leaf items + "kitchen"). For every other
// category still in the doctype: clears `kategories` on every product that
// points to it (rather than guessing a replacement category), then deletes
// the category row itself.
//
// Run: node --env-file=.env.local frappe-integration/scripts/prune_to_navbar_categories.js

const SERVER = process.env.NEW_API_SERVER;
const API_KEY = process.env.NEW_API_KEY;
const API_SECRET = process.env.NEW_API_SECRET;
const KATEGORIE = "Produkte Kategorie";
const PRODUKTE = "Produkte New";

if (!SERVER || !API_KEY || !API_SECRET) {
  console.error("Missing NEW_API_SERVER / NEW_API_KEY / NEW_API_SECRET.");
  process.exit(1);
}

const headers = {
  Authorization: `token ${API_KEY}:${API_SECRET}`,
  "Content-Type": "application/json",
};

// The 32 rows to keep: the 30 navbar leaf items + "kitchen" + "bedwear"
// (both added to the navbar after the original 30-item cleanup).
const KEEP = new Set([
  "sofas-couches", "corner-sofas", "sleeper-sofas", "chaise-longues-daybeds", "armchairs-stools", "leather-sofas",
  "dining-chairs", "bar-stools", "desk-chairs", "dining-tables", "coffee-tables", "side-tables",
  "beds", "night-tables", "wardrobes", "bedwear",
  "sideboards-chests", "shelves", "tv-low-units", "display-cabinets", "small-furniture",
  "garden-tables", "garden-chairs", "lounge-furniture-daybeds", "sun-loungers", "parasols",
  "lamps", "rugs", "decor", "mirrors", "kitchen-accessories",
  "kitchen",
]);

async function getAllCategoryKeys() {
  const res = await fetch(`${SERVER}/api/resource/${encodeURIComponent(KATEGORIE)}?limit_page_length=0`, { headers });
  if (!res.ok) throw new Error(`list categories failed: ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  return data.map((r) => r.name);
}

async function getProductsForCategory(key) {
  const filters = encodeURIComponent(JSON.stringify([["kategories", "=", key]]));
  const fields = encodeURIComponent(JSON.stringify(["name"]));
  const res = await fetch(`${SERVER}/api/resource/${encodeURIComponent(PRODUKTE)}?filters=${filters}&fields=${fields}&limit_page_length=0`, { headers });
  if (!res.ok) throw new Error(`list products for "${key}" failed: ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  return data.map((r) => r.name);
}

async function main() {
  const allKeys = await getAllCategoryKeys();
  const extra = allKeys.filter((k) => !KEEP.has(k));

  let cleared = 0;
  const deletedOk = [];
  const deleteBlocked = [];

  for (const key of extra) {
    const products = await getProductsForCategory(key);

    for (const name of products) {
      const res = await fetch(`${SERVER}/api/resource/${encodeURIComponent(PRODUKTE)}/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ kategories: "" }),
      });
      if (res.ok) cleared++;
      else console.error(`  FAILED clear "${name}": ${res.status} ${await res.text()}`);
    }

    const delRes = await fetch(`${SERVER}/api/resource/${encodeURIComponent(KATEGORIE)}/${encodeURIComponent(key)}`, { method: "DELETE", headers });
    if (delRes.ok) {
      deletedOk.push(key);
    } else {
      deleteBlocked.push([key, delRes.status, await delRes.text()]);
    }
  }

  if (deleteBlocked.length) {
    deleteBlocked.forEach(([k, status, body]) => console.log(`  ${k}: ${status} ${body.slice(0, 200)}`));
  }

  const remaining = await getAllCategoryKeys();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
