// Ein Einstieg für die Akte-Bausteine (Team P0-5a, G-12 · G-14):
//   import { AkteGeruest, AkteKopf, AkteHero, GlasKachel, GlasKnopf, GlasChip, Band, RechteSpalte,
//            AkteTabs, Vorgangsleiste, Bezuege, AkteSlotListe } from "@/components/Backoffice/Akte";
// AkteSlots ist eine Server-Komponente und steht bewusst nicht hier (sie lädt das Slot-Register mit den
// Server-Modulen der Bereiche); aus Client-Komponenten nur AkteSlotListe verwenden.

export { AkteGeruest, AkteKopf, AkteHero, GlasKachel, GlasKnopf, GlasChip, Band, RechteSpalte } from "./Akte";
export { default as AkteTabs } from "./AkteTabs";
export { default as Vorgangsleiste } from "./Vorgangsleiste";
export { default as Bezuege } from "./Bezuege";
export { AkteSlotListe } from "./SlotListe";
// AkteSlots (Server, lädt das Register): import { AkteSlots } from "@/components/Backoffice/Akte/Slots";
