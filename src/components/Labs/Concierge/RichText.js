// Minimal, safe Markdown subset for concierge answers: paragraphs, "- " lists,
// **bold** and [links](/de/...). No HTML is ever injected; links are only
// rendered for site-relative paths and the own domain.
import Link from "next/link";

const SAFE_HREF = /^(\/(?!\/)[^\s]*|https:\/\/platzhirsch\.studio(\/[^\s]*)?|tel:\+?[0-9 ]+|mailto:[^\s]+|https:\/\/www\.google\.com\/maps\/dir\/\?[^\s]*)$/;
// Route planner link (DIRECTIONS_URL from site.js) opens in a new tab.
const EXTERNAL = /^https:\/\/www\.google\.com\//;

function inline(text, keyBase) {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(<strong key={`${keyBase}-b${i++}`}>{m[1]}</strong>);
    } else if (SAFE_HREF.test(m[3])) {
      const href = m[3];
      out.push(
        href.startsWith("/") ? (
          <Link key={`${keyBase}-l${i++}`} href={href}>{m[2]}</Link>
        ) : (
          <a
            key={`${keyBase}-l${i++}`}
            href={href}
            {...(EXTERNAL.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {m[2]}
          </a>
        )
      );
    } else {
      out.push(m[2]);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text }) {
  const blocks = String(text || "").trim().split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
      return (
        <ul key={bi}>
          {lines.map((l, li) => (
            <li key={li}>{inline(l.replace(/^\s*[-*•]\s+/, ""), `${bi}-${li}`)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi}>
        {lines.map((l, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {inline(l.replace(/^#+\s*/, ""), `${bi}-${li}`)}
          </span>
        ))}
      </p>
    );
  });
}
