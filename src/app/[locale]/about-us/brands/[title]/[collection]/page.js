import { notFound } from "next/navigation";
import CollectionDetail from "@/components/MarkenItems/collectionDetail";
import { loadCollectionPage, buildCollectionMetadata } from "@/lib/marken/collectionPage";

// One collection of a brand. The same page exists under all four localized
// About folders (ueber-uns/marken, about-us/brands, a-propos/marques,
// chi-siamo/marche); the logic lives in @/lib/marken/collectionPage.
export async function generateMetadata({ params }) {
  const { locale, title, collection } = await params;
  return buildCollectionMetadata(locale, title, collection);
}

export default async function CollectionPage({ params }) {
  const { locale, title, collection } = await params;

  const data = await loadCollectionPage(title, collection, locale);
  if (!data) notFound();

  return (
    <CollectionDetail
      marke={data.marke}
      collection={data.collection}
      products={data.products}
      otherCollections={data.otherCollections}
      locale={locale}
    />
  );
}
