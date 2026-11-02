// src/components/CartPage/selectionCopy.js
// Rat 9,5 B9 (T2): Texte von „Ihre Auswahl“ (Tabs, Teilen, Druck,
// Leerzustand, geteilte Auswahl) stehen unter cart.selection.* in
// src/messages (übernommen aus rat95-t2-messages.json am 30.10.2026; die
// frühere Rückfall-Tabelle ist entfernt). Keine "@/..."-Importe (node --test).

/**
 * selectionText(t, locale, key, values) – t = useTranslations("cart") bzw.
 * getTranslations({ namespace: "cart" }); liest cart.selection.<key>.
 * `locale` bleibt in der Signatur (Aufrufer unverändert).
 */
export function selectionText(t, _locale, key, values) {
  return t(`selection.${key}`, values);
}
