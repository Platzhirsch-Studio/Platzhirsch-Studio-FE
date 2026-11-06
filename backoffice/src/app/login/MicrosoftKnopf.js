import Knopf from "@/components/Backoffice/Knopf";

// „Mit Microsoft anmelden“ – einfacher GET-Formular-Absprung zu /auth/microsoft/start (Route Handler,
// setzt das Flow-Cookie und leitet zu Microsoft bzw. im Mock zum lokalen Demo-Issuer). Gestaltung neutral.
export default function MicrosoftKnopf({ next, demo, verfuegbar, primaer }) {
  return (
    <form action="/auth/microsoft/start" method="get">
      {next && <input type="hidden" name="next" value={next} />}
      <Knopf
        type="submit"
        variant={primaer ? "primary" : "secondary"}
        size="l"
        className="w-full"
        disabled={!verfuegbar}
        grund={verfuegbar ? undefined : "Noch nicht verfügbar – die Microsoft-Anmeldung ist nicht eingerichtet."}
        data-testid="login-microsoft"
      >
        {demo ? "Mit Microsoft anmelden (Demo)" : "Mit Microsoft anmelden"}
      </Knopf>
    </form>
  );
}
