// /[locale]/termin/postausgang – Dev-Postausgang des Online-Kalenders.
// Zeigt die Mails, die im Mock statt eines Versands in .data/booking/outbox/
// liegen (Kundin + Studio, mit .ics). Nur außerhalb der Produktion, sonst 404.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading } from "@/components/ui";
import { dataDir, outboxVisible } from "@/lib/booking/config";
import { createOutbox } from "@/lib/booking/mail";

export const metadata = { title: "Dev-Postausgang Termine", robots: { index: false, follow: false }, referrer: "no-referrer" };

const linkify = (text) =>
  text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} className="break-all underline underline-offset-2">
        {part}
      </a>
    ) : (
      part
    )
  );

export default async function PostausgangPage() {
  await connection();
  if (!outboxVisible()) notFound();
  const mails = await createOutbox(dataDir()).list(30);
  return (
    <Container size="text" className="py-16 md:py-24">
      <p className="border-l-2 border-notice pl-4 text-small text-text">
        Nur in der Entwicklung sichtbar. Hier geht nichts hinaus; in Produktion antwortet die Seite mit 404.
      </p>
      <Heading level={1} size="display-m" className="mt-6">
        Dev-Postausgang Termine
      </Heading>
      {mails.length === 0 ? (
        <p className="mt-8 text-body text-text-soft">Noch keine Mails. Buchen Sie einen Termin auf /de/termin.</p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {mails.map((m) => (
            <li key={m.id} className="border border-line bg-surface-raised p-4" data-outbox-mail={m.tag}>
              <p className="text-small text-text-soft">
                {m.tag} · an {m.to} · {m.sentAt} · {m.ref}
              </p>
              <p className="mt-1 text-ui text-text">{m.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-small text-text">{linkify(m.text)}</pre>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
