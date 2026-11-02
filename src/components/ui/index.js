// Design-system primitives of the Neuauftritt (Design-Bibel §9).
// All are server-safe (no "use client", no async) and can be imported from
// server and client components. Docs: Marktresearch/digital/redesign/fundament.md
export { default as cx } from "./cx";
export { default as SmartLink } from "./SmartLink";
export { default as Container } from "./Container";
export { default as Section } from "./Section";
export { default as Heading } from "./Heading";
export { default as Eyebrow } from "./Eyebrow";
export { default as Lead } from "./Lead";
export { default as Button } from "./Button";
export { default as LinkArrow } from "./LinkArrow";
export { Horizon, Hairline } from "./Horizon";
export { default as Card } from "./Card";
export { default as ProductCard } from "./ProductCard";
export { default as Badge } from "./Badge";
export { default as Grid } from "./Grid";
export { default as Media } from "./Media";
export { default as Accordion, AccordionItem } from "./Accordion";
export { default as Breadcrumbs } from "./Breadcrumbs";
export { default as CTABand } from "./CTABand";
export { default as Leitsatz } from "./Leitsatz";
export { default as Kern, kernDisplay } from "./Kern";
export { typoDe, NBSP, NNBSP } from "./typo";
export { splitLocalePrefix } from "./localePrefix";
