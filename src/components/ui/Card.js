import cx from "./cx";
import Media from "./Media";
import SmartLink from "./SmartLink";

/**
 * Editorial / project / brand card (Bibel §9): no frame, no shadow; the whole
 * card is clickable through the title link's ::after (one link, one tab stop).
 * @param {string} [href]
 * @param {string} title
 * @param {string} [eyebrow]   overline above the title
 * @param {string} [text]      1–2 sentences
 * @param {{src, alt}} [image]
 * @param {"3/2"|"4/5"|"1/1"|"21/9"} [ratio="3/2"]
 * @param {string} [sizes]     image sizes (default: 3-column grid)
 * @param {2|3|4} [headingLevel=3]
 * @param {ReactNode} [footer] meta line below the text
 */
export default function Card({
  href,
  title,
  eyebrow,
  text,
  image,
  ratio = "3/2",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  headingLevel = 3,
  footer,
  as: Tag = "article",
  className,
}) {
  const H = `h${headingLevel}`;
  return (
    <Tag className={cx("group relative flex flex-col", className)}>
      {image?.src && (
        <Media
          src={image.src}
          alt={image.alt ?? ""}
          ratio={ratio}
          sizes={sizes}
          imgClassName="transition-transform duration-(--duration-enter) ease-quiet group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
      <div className="mt-4 flex flex-col gap-2">
        {eyebrow && <p className="text-overline uppercase text-text-accent">{eyebrow}</p>}
        <H className="text-title text-text">
          {href ? (
            <SmartLink
              href={href}
              className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
            >
              {title}
            </SmartLink>
          ) : (
            title
          )}
        </H>
        {text && <p className="max-w-measure text-body text-text-soft">{text}</p>}
        {footer && <div className="text-small text-text-soft">{footer}</div>}
      </div>
    </Tag>
  );
}
