import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { formatDate, formatTime } from "@/lib/portal/format";
import { Badge, Card, Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import ReplyForm from "@/components/Portal/Messages/ReplyForm";
import { portalMetadata } from "@/lib/portal/metadata";

// /de/portal/nachrichten – mailbox: messages of the studio and the customer's
// own replies, newest first. Opening the page marks studio messages as read
// (they stay highlighted as "Neu" during this visit).

export const generateMetadata = portalMetadata({
  title: "Nachrichten",
  robots: { index: false, follow: false },
});

const one = (v) => (Array.isArray(v) ? v[0] : v);

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÄÖÜ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function NachrichtenPage({ searchParams }) {
  const sp = await searchParams;
  const portal = await getPortal("/de/portal/nachrichten");
  const [messages, projects] = await Promise.all([portal.listMessages(), portal.listProjects()]);

  const unread = new Set(messages.filter((m) => !m.read && m.from === "studio").map((m) => m.id));
  if (unread.size) {
    try {
      await portal.markMessagesRead([...unread]);
    } catch (err) {
      console.warn("[portal/nachrichten] Als gelesen markieren fehlgeschlagen:", err.message);
    }
  }

  const projectTitle = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const projectOptions = projects.map((p) => ({ id: p.id, title: p.title }));
  const wanted = one(sp?.projekt);
  const defaultProjectId = projects.some((p) => p.id === wanted) ? wanted : "";

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader
        overline="Ihr Postfach"
        title="Nachrichten"
        intro="Ihr direkter Draht zum Beratungsteam – Fragen, Rückmeldungen und Neuigkeiten zu Ihren Projekten an einem Ort."
      />

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <section aria-labelledby="msg-list" className="lg:col-span-3">
          <h2 id="msg-list" className="sr-only">
            Verlauf
          </h2>
          {unread.size > 0 && (
            <p className="mb-3 text-sm text-ink/75" role="status">
              {unread.size === 1 ? "1 neue Nachricht" : `${unread.size} neue Nachrichten`}
            </p>
          )}
          {messages.length === 0 ? (
            <Empty>Noch keine Nachrichten. Schreiben Sie uns – Ihr Beratungsteam antwortet hier.</Empty>
          ) : (
            <ol className="space-y-3">
              {messages.map((m) => {
                const studio = m.from === "studio";
                const isNew = unread.has(m.id);
                return (
                  <li
                    key={m.id}
                    className={`border p-4 sm:p-5 ${
                      isNew ? "border-gold bg-white ring-1 ring-gold" : studio ? "border-ink/10 bg-white" : "border-transparent bg-bone sm:ml-10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${studio ? "bg-walnut text-white" : "bg-white text-ink"}`}
                      >
                        {initials(studio ? m.author : "Sie") || "S"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-semibold text-ink">{studio ? m.author : "Sie"}</span>
                          {isNew && <Badge tone="new">Neu</Badge>}
                          <span className="text-ink/75">
                            <time dateTime={m.sentAt}>
                              {formatDate(m.sentAt)}, {formatTime(m.sentAt)} Uhr
                            </time>
                          </span>
                        </p>
                        {m.projectId && projectTitle[m.projectId] && <p className="mt-0.5 text-[13px] text-ink/75">Projekt: {projectTitle[m.projectId]}</p>}
                        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{m.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <Card aria-labelledby="msg-reply" className="lg:col-span-2 lg:self-start">
          <h2 id="msg-reply" className="mb-4 font-display text-xl text-ink sm:text-2xl">
            Nachricht schreiben
          </h2>
          <ReplyForm projects={projectOptions} defaultProjectId={defaultProjectId} />
          {portal.customer.advisor && (
            <p className="mt-5 border-t border-ink/10 pt-4 text-[13px] leading-relaxed text-ink/75">
              Lieber persönlich? {portal.customer.advisor.name} erreichen Sie unter{" "}
              <a href={`tel:${portal.customer.advisor.phone.replace(/\s/g, "")}`} className="py-1 whitespace-nowrap text-ink underline underline-offset-2">
                {portal.customer.advisor.phone}
              </a>
              .
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
