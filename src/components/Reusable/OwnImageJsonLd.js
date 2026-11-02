// ImageObject-JSON-LD (Google „Bild-Metadaten“: creditText, copyrightNotice,
// creator, license) für EIGENE Fotos, die auf der Seite erscheinen.
// Entscheidet allein das Urheber-Register src/lib/seo/imageRights.js:
// Herstellerbilder und nicht eingetragene Bilder ergeben nichts (kein Knoten).
// Server-Komponente, ein <script> je Bild; eigene @id, keine Kollision mit
// den WebPage-/Organization-Knoten der Seite.
import JsonLd from "@/components/Reusable/JsonLd";
import { ownImageSchemas } from "@/lib/seo/imageRights";

/** @param {{images: Array<string | {src: string, alt?: string, width?: number, height?: number}>}} props */
export default function OwnImageJsonLd({ images }) {
  const nodes = ownImageSchemas(images);
  if (!nodes.length) return null;
  return nodes.map((node) => <JsonLd key={node["@id"]} data={node} />);
}
