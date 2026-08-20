export function getProductKeywords(produkt, locale) {
  let keywords;
  switch (locale) {
    case "it":
      keywords = [
        ...(produkt.keywords_it ?? []),
        ...(produkt.keywords_mid_it ?? []),
        ...(produkt.keywords_long_it ?? [])
      ].map(item => item.keyword);
      break;
    case "fr":
      keywords = [
        ...(produkt.keywords_fr ?? []),
        ...(produkt.keywords_mid_fr ?? []),
        ...(produkt.keywords_long_fr ?? [])
      ].map(item => item.keyword);
      break;
    case "en":
      keywords = [
        ...(produkt.keywords_en ?? []),
        ...(produkt.keywords_mid_en ?? []),
        ...(produkt.keywords_long_en ?? [])
      ].map(item => item.keyword);
      break;
    case "de":
    default:
      keywords = [
        ...(produkt.keywords ?? []),
        ...(produkt.keywords_mid ?? []),
        ...(produkt.keywords_long ?? [])
      ].map(item => item.keyword);
      break;
  }
  // Add this line for debugging:
  return keywords;
}
