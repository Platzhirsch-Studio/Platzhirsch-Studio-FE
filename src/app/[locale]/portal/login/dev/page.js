import Link from "next/link";
import { notFound } from "next/navigation";
import { IS_PRODUCTION } from "@/lib/portal/config";
import { readDevOutbox } from "@/lib/portal/mailer";
import { formatDate, formatTime } from "@/lib/portal/format";
import { AuthPanel, Empty, Notice } from "@/components/Portal/Core/ui";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Dev-Postausgang",
  robots: { index: false, follow: false },
});

// Development only: shows the magic links that would have been e-mailed.
export default async function DevOutboxPage() {
  if (IS_PRODUCTION) notFound();
  const outbox = await readDevOutbox();

  return (
    <AuthPanel title="Dev-Postausgang">
      <Notice tone="dev">Nur in der Entwicklung sichtbar. In Produktion antwortet diese Seite mit 404.</Notice>
      {outbox.length === 0 ? (
        <Empty>
          Noch keine Links. Auf der{" "}
          <Link href="/de/portal/login" className="underline">
            Anmeldeseite
          </Link>{" "}
          mit <code>demo@kunde.example</code> einen Link anfordern.
        </Empty>
      ) : (
        <ul className="space-y-3">
          {outbox.map((m) => (
            <li key={m.url} className="bg-bone p-4 text-sm">
              <p className="text-xs text-ink/70">
                An {m.to} · {formatDate(m.sentAt)}, {formatTime(m.sentAt)} Uhr · gültig {m.expiresInMinutes} Min. ab Versand
              </p>
              <a href={m.url} className="mt-1 block break-all font-semibold text-ink underline underline-offset-2">
                Anmeldelink öffnen
              </a>
            </li>
          ))}
        </ul>
      )}
    </AuthPanel>
  );
}
