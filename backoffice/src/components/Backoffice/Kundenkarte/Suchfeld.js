"use client";
// Pillen-Suchfeld (Lounge §6 „Suche“) – Enter setzt ?q= in der URL (Q-B7).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../icons";

export default function Suchfeld({ basis, params = {}, platzhalter = "Suchen", name = "q", testid = "kk-suchfeld" }) {
  const router = useRouter();
  const [q, setQ] = useState(params[name] || "");
  return (
    <form
      role="search"
      className="bo-kk-scan max-w-[360px]"
      onSubmit={(e) => {
        e.preventDefault();
        const sp = new URLSearchParams(params);
        if (q.trim()) sp.set(name, q.trim());
        else sp.delete(name);
        sp.delete("seite");
        const s = sp.toString();
        router.push(s ? `${basis}?${s}` : basis);
      }}
    >
      <Icon name="Search" className="bo-kk-scan__lupe size-4" />
      <input className="bo-kk-scan__feld h-10 text-[14px]" type="search" value={q} placeholder={platzhalter} aria-label={platzhalter} onChange={(e) => setQ(e.target.value)} data-testid={testid} />
    </form>
  );
}
