import Link from "next/link";
import { magicTokenSchema } from "@/lib/portal/schemas";
import { AuthPanel, PrimaryButton } from "@/components/Portal/Core/ui";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Anmeldung bestätigen",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
});

// Target of the e-mail link. The token is only redeemed by the POST below,
// so link scanners that open the URL don't consume it.
export default async function ConfirmLoginPage({ searchParams }) {
  const sp = await searchParams;
  const token = magicTokenSchema.safeParse(sp?.token);

  if (!token.success) {
    return (
      <AuthPanel title="Link unvollständig">
        <p>Dieser Anmeldelink ist unvollständig. Bitte öffnen Sie den Link direkt aus der E-Mail oder fordern Sie einen neuen an.</p>
        <Link href="/de/portal/login" className="inline-block underline underline-offset-4">
          Zur Anmeldung
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title="Willkommen zurück">
      <p>Ein Klick noch – dann sind Sie in Ihrem Kundenportal angemeldet.</p>
      <form action="/api/portal/auth/verify" method="post">
        <input type="hidden" name="token" value={token.data} />
        <PrimaryButton type="submit" autoFocus>
          Jetzt anmelden
        </PrimaryButton>
      </form>
      <p className="text-xs text-ink/70">Sie haben keinen Link angefordert? Dann ignorieren Sie die E-Mail einfach.</p>
    </AuthPanel>
  );
}
