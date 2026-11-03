// src/lib/shop/orderStore.js
// Ablage der Shop-Bestellungen über einen ADAPTER. Das Backoffice ist
// gesperrt (nur lesen) – es wird NICHTS dorthin geschrieben.
//   createLocalOrderAdapter(dir)  Standard: JSON-Dateien in SHOP_DATA_DIR bzw.
//                                 <Projekt>/.data/shop/ (gitignored, wie das Portal);
//                                 Etiketten als PDF unter .data/shop/etiketten/.
//   createMemoryOrderAdapter()    Tests.
//   frappeOrderAdapter()          Platzhalter für den späteren Doctype
//                                 „Shop Bestellung“ (README) – wirft absichtlich.
// Sammlungen: bestellungen, tarife (Versand-Quotes mit Ablaufzeit), widerrufe (§ 13a FAGG, widerruf.js).
// Keine "@/"-Importe.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeAtomic } from "../payments/store.js";

export const SHOP_COLLECTIONS = Object.freeze(["bestellungen", "tarife", "widerrufe"]);
const clone = (v) => (v == null ? v ?? null : JSON.parse(JSON.stringify(v)));
const check = (n) => {
  if (!SHOP_COLLECTIONS.includes(n)) throw new Error(`Unbekannte Sammlung: ${n}`);
};

function over(load, save, extra = {}) {
  let queue = Promise.resolve();
  const serial = (fn) => {
    const next = queue.catch(() => {}).then(fn);
    queue = next.catch(() => {});
    return next;
  };
  return {
    async get(n, id) {
      check(n);
      return clone((await load(n))[id]) ?? null;
    },
    async list(n) {
      check(n);
      return Object.values(clone(await load(n)));
    },
    async find(n, pred) {
      return (await this.list(n)).find(pred) ?? null;
    },
    async put(n, id, value) {
      check(n);
      return serial(async () => {
        const all = await load(n);
        all[id] = clone(value);
        await save(n, all);
        return clone(value);
      });
    },
    /** fn(alt|null) → neu | undefined (unverändert) */
    async update(n, id, fn) {
      check(n);
      return serial(async () => {
        const all = await load(n);
        const next = await fn(clone(all[id]) ?? null);
        if (next === undefined) return clone(all[id]) ?? null;
        all[id] = clone(next);
        await save(n, all);
        return clone(next);
      });
    },
    ...extra,
  };
}

export function shopDataDir(env = process.env) {
  const v = String(env.SHOP_DATA_DIR ?? "").trim();
  return v ? path.resolve(v) : path.join(process.cwd(), ".data", "shop");
}

export function createLocalOrderAdapter(dir) {
  const fileOf = (n) => path.join(dir, `${n}.json`);
  return over(
    async (n) => {
      try {
        return JSON.parse(await readFile(fileOf(n), "utf8"));
      } catch (err) {
        if (err.code === "ENOENT") return {};
        throw err;
      }
    },
    (n, all) => writeAtomic(fileOf(n), JSON.stringify(all, null, 2)),
    {
      kind: "lokal",
      dir,
      /** Etikett (Base64-PDF) ablegen → relativer Dateiname */
      async saveLabel(orderId, base64) {
        const d = path.join(dir, "etiketten");
        await mkdir(d, { recursive: true });
        const name = `${orderId.replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
        await writeFile(path.join(d, name), Buffer.from(base64, "base64"));
        return `etiketten/${name}`;
      },
    }
  );
}

export function createMemoryOrderAdapter() {
  const data = Object.fromEntries(SHOP_COLLECTIONS.map((c) => [c, {}]));
  const labels = {};
  return over(
    async (n) => data[n],
    async (n, all) => {
      data[n] = all;
    },
    {
      kind: "memory",
      labels,
      async saveLabel(orderId, base64) {
        labels[orderId] = base64;
        return `etiketten/${orderId}.pdf`;
      },
    }
  );
}

/** Späterer Frappe-Adapter: absichtlich gesperrt (Backoffice nur lesen). */
export function frappeOrderAdapter() {
  throw new Error("Frappe-Bestellungen sind gesperrt: Backoffice ist nur lesend freigegeben (siehe qa-screenshots/shop/README.md).");
}
