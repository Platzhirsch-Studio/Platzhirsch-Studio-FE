import Link from "next/link";
import { IS_PRODUCTION, MAGIC_LINK_TTL_SECONDS } from "@/lib/portal/config";
import { AuthPanel, Notice } from "@/components/Portal/Core/ui";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Link gesendet",
  robots: { index: false, follow: false },
});

export default function LinkSentPage() {
  return (
    <AuthPanel title="Bitte prüfen Sie Ihr Postfach">
      <p>
        Wenn die Adresse bei uns hinterlegt ist, haben wir Ihnen soeben einen Anmeldelink geschickt. Er ist{" "}
        {Math.round(MAGIC_LINK_TTL_SECONDS / 60)} Minuten gültig und kann einmal verwendet werden.
      </p>
      <p className="text-sm text-ink/70">
        Keine E-Mail erhalten? Sehen Sie im Spam-Ordner nach oder{" "}
        <Link href="/de/portal/login" className="underline underline-offset-2 hover:text-ink">
          fordern Sie einen neuen Link an
        </Link>
        .
      </p>
      {!IS_PRODUCTION && (
        <Notice tone="dev">
          <strong>Entwicklung:</strong> Kein Mailversand.{" "}
          <Link href="/de/portal/login/dev" className="underline underline-offset-2">
            Link im Dev-Postausgang öffnen
          </Link>
          .
        </Notice>
      )}
    </AuthPanel>
  );
}
