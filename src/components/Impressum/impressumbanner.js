import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import GermanOnlyNotice, { germanText } from "@/components/Legal/GermanOnlyNotice";

// Legal page opening: text only (no photo – the H1 is the LCP element).
// The H1 stays "Impressum" in every locale, as before; the legal text below
// is German, approved by the law firm on 29.10.2026 (see impressum.js).
const ImpressumBanner = () => {
  const legal = useInhalt("legal");
  const common = useInhalt("common");
  // EN/FR/IT (r3-recht-inhalt P1-2): H1 and crumb are German → lang="de";
  // the lead says in the page language that only the German text exists.
  const { locale } = legal;
  return (
    <PageHeader
      breadcrumbs={[{ label: common.t("home"), href: "/" }, { label: germanText("Impressum", locale) }]}
      eyebrow={legal.t("eyebrow")}
      // QM content-legal r3 (200 % text): a soft hyphen at the syllable lets the size cap
      // (longestWordCap, counted per piece) keep the H1 clearly above the body text –
      // it fits in one line anyway, the hyphen only shows if it ever has to break.
      title={germanText("Impres­sum", locale)}
      lead={locale !== "de" ? <GermanOnlyNotice locale={locale} /> : undefined}
    />
  );
};

export default ImpressumBanner;
