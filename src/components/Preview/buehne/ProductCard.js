import Image from "next/image";
import Link from "next/link";
import s from "./buehne.module.css";
import { BASE } from "./content";

export default function ProductCard({ product, brand = "Minotti", label, sizes = "(min-width: 64rem) 22vw, 45vw" }) {
  return (
    <Link href={`${BASE}/produkt/${product.slug}`} className={`${s.productCard} ${s.reveal}`}>
      <div className={s.frame}>
        {product.image ? (
          <Image src={product.image} alt={product.alt || `${brand} ${product.name}`} fill sizes={sizes} />
        ) : null}
      </div>
      <p className={`${s.overline} mt-4`} style={{ fontSize: "0.6875rem" }}>
        {brand}
        {label ? ` · ${label}` : ""}
      </p>
      <h3 className={s.productName}>{product.name}</h3>
    </Link>
  );
}
