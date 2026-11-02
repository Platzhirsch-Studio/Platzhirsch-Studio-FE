import Link from "next/link";
import { notFound } from "next/navigation";
import { portalMetadata } from "@/lib/portal/metadata";
import { AuthPanel } from "@/components/Portal/Core/ui";
import { PHONE_DISPLAY } from "@/lib/site";

// /de/portal/raum/link – Hinweisseite für einen ungültigen oder bereits
// benutzten Raum-Link (Fallback 3). Das Einlösen selbst: /api/portal/raum/link.

export const generateMetadata = portalMetadata({ title: "Raum-Link", robots: { index: false, follow: false }, referrer: "no-referrer" });

const TEXTE = {
  ungueltig: "Dieser Link ist nicht gültig oder wurde schon einmal geöffnet. Aus Sicherheitsgründen funktioniert jeder Raum-Link nur einmal.",
  abgelaufen: "Dieser Link ist abgelaufen.",
  "zu-viele": "Zu viele Versuche. Bitte in einigen Minuten erneut versuchen.",
};

export default async function RaumLinkSeite({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const sp = await searchParams;
  const text = TEXTE[sp?.fehler] || TEXTE.ungueltig;
  return (
    <AuthPanel title="Raum-Link">
      <p>{text}</p>
      <p>
        Wenn Sie den Raum auf diesem Gerät schon einmal geöffnet haben, finden Sie ihn über den Lesezeichen-Link wieder. Sonst schicken wir Ihnen gern einen neuen Link: <a href="mailto:info@platzhirsch.studio" className="underline">info@platzhirsch.studio</a> oder {PHONE_DISPLAY}.
      </p>
      <p>
        <Link href="/de/portal/login" className="underline">
          Zum Kundenportal
        </Link>
      </p>
    </AuthPanel>
  );
}
