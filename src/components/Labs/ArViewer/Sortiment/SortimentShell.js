"use client";
// Gemeinsamer Zustand für Suche/Filter und Ergebnisliste (QA R1 P2-2):
//   navigate(url, { push }) – Marke/Kategorie/Darstellung per router.push (Zurück-Taste
//   stellt den Filter zurück), Tipp-Suche per router.replace; beides in einer Transition.
//   ResultsRegion markiert die Liste währenddessen mit aria-busy und opacity-60.
import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

const Ctx = createContext({ pending: false, navigate: () => {} });
export const useSortiment = () => useContext(Ctx);

export default function SortimentShell({ children }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (url, { push = false } = {}) => {
      startTransition(() => (push ? router.push(url, { scroll: false }) : router.replace(url, { scroll: false })));
    },
    [router]
  );
  return <Ctx.Provider value={{ pending, navigate }}>{children}</Ctx.Provider>;
}

export function ResultsRegion({ children, className = "" }) {
  const { pending } = useSortiment();
  return (
    <div
      aria-busy={pending ? "true" : undefined}
      data-pending={pending ? "" : undefined}
      className={`transition-opacity duration-(--duration-micro) motion-reduce:transition-none ${pending ? "pointer-events-none opacity-60" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
