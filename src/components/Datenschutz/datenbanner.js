import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { dseHeader } from "./kurzfassung";

// Legal page opening: text only (no photo – the H1 is the LCP element).
// Rat 9,5 A16 (QA Recht −0,1): EN/FR/IT get the H1 and crumb in the page
// language and a summary in that language (./kurzfassung.js) above the German
// full text (approved by the law firm on 29.10.2026: see datenschutz.js). The
// lead says that the German version is authoritative.
const Datenbanner = () => {
  const legal = useInhalt("legal");
  const common = useInhalt("common");
  const { locale } = legal;
  const own = dseHeader(locale);
  const title = own ? own.title : "Datenschutz";
  return (
    <PageHeader
      breadcrumbs={[{ label: common.t("home"), href: "/" }, { label: title }]}
      eyebrow={legal.t("eyebrow")}
      // QM content-legal r3 (200 % text): soft hyphen at the compound joint – the size
      // cap (longestWordCap) counts the longer piece, so the H1 stays clearly larger
      // than the body text („Daten-/schutz“ only when it really has to break).
      title={own ? title : "Daten­schutz"}
      lead={own ? <span data-german-only-notice="">{own.lead}</span> : undefined}
    />
  );
};

export default Datenbanner;
