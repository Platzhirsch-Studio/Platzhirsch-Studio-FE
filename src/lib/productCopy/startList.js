// src/lib/productCopy/startList.js
// First batch for the owner's sign-off (QM R3-produkt P2-2). There is no
// visitor analytics in the repo, so the list is NOT "the most visited"; it is
// picked by visible criteria instead:
//  - ClassiCon (the only brand where Platzhirsch is listed as dealer) – 4 pieces,
//    Bell Side Table also sits in the homepage selection;
//  - Flos Arco – Lichtklassiker, source link flos.com in the facts;
//  - five Minotti pieces from the sofa/armchair categories the QM checked
//    (Lawrence was used for the claim-filter test).
// Every key exists in de.json and its product page answers 200 (checked
// 26.10.2026). Order = suggested reading order.
export const START_LIST = [
  "side-tables/side-tables-bell-side-table",
  "side-tables/side-tables-adjustable-table-e1027",
  "armchairs-stools/armchairs-stools-bibendum-armchair",
  "chaise-longues-daybeds/chaise-longues-daybeds-day-bed",
  "lamps/lamps-arco",
  "sofas-couches/sofas-lawrence",
  "sofas-couches/sofas-hamilton",
  "sofas-couches/sofas-yves",
  "armchairs-stools/armchairs-twiggy-armchairs",
  "armchairs-stools/armchairs-torii",
];
