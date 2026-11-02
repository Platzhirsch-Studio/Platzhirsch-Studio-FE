// Zahlenformat einheitlich de-AT ("CHF 21.228,82", "€ 25.000,00").
const cache = new Map();

export function money(value, currency = "EUR", digits = 2) {
  const key = `${currency}:${digits}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.NumberFormat("de-AT", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits })
    );
  }
  return cache.get(key).format(value);
}

export function moneyRange(min, max, currency, digits = 2) {
  if (Math.abs(max - min) < 0.005) return money(min, currency, digits);
  return `${money(min, currency, digits)} – ${money(max, currency, digits).replace(/^[^\d-]+/, "")}`;
}

export function pct(value, digits = 1) {
  return new Intl.NumberFormat("de-AT", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function rate(value) {
  return new Intl.NumberFormat("de-AT", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
}

export function isoDate(d) {
  const [y, m, day] = String(d).split("-");
  return y && m && day ? `${day}.${m}.${y}` : d;
}
