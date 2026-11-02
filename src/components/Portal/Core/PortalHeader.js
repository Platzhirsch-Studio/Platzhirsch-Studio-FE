import { LogOut } from "lucide-react";
import { getSession } from "@/lib/portal/dal";
import { getAdapter } from "@/lib/portal/adapters";
import PortalNav from "./PortalNav";

// Portal header (brand line, logout, navigation). Renders nothing without a
// session – it is UI only; the auth check itself happens in getPortal()
// inside every page.
export default async function PortalHeader() {
  const session = await getSession();
  if (!session) return null;
  const messages = await getAdapter().listMessages(session.customerId);
  const unread = messages.filter((m) => !m.read && m.from === "studio").length;

  return (
    <header className="mb-4 md:mb-10">
      <div className="flex items-center justify-between gap-4 md:pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">Mein Platzhirsch</p>
        <div className="flex items-center gap-3 text-sm text-ink/70">
          <span className="hidden sm:inline">{session.customer.displayName}</span>
          <LogoutButton />
        </div>
      </div>
      <PortalNav unread={unread} />
    </header>
  );
}

export function LogoutButton({ className = "" }) {
  return (
    <form action="/api/portal/auth/logout" method="post">
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-ink/80 hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
      >
        <LogOut size={16} aria-hidden="true" />
        Abmelden
      </button>
    </form>
  );
}
