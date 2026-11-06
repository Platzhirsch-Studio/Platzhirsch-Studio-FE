"use client";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";

const KEY = "entwurf-atelier-theme";
const EVT = "entwurf-atelier-theme";
const ThemeCtx = createContext({ theme: "system", setTheme: () => {} });

function read() {
  try {
    const q = new URLSearchParams(window.location.search).get("theme");
    if (q === "light" || q === "dark") return q;
    const s = window.localStorage.getItem(KEY);
    return s === "light" || s === "dark" ? s : "system";
  } catch {
    return "system";
  }
}
function subscribe(cb) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}

export default function ThemeRoot({ className, children }) {
  const theme = useSyncExternalStore(subscribe, read, () => "system");
  function setTheme(t) {
    try {
      if (t === "system") window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, t);
      const u = new URL(window.location.href);
      if (u.searchParams.has("theme")) { u.searchParams.delete("theme"); window.history.replaceState(null, "", u); }
    } catch {}
    window.dispatchEvent(new Event(EVT));
  }
  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <div className={`at ${className}`} data-at-theme={theme === "system" ? undefined : theme}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export function ThemeSwitch() {
  const { theme, setTheme } = useContext(ThemeCtx);
  const opts = [
    { v: "light", label: "Hell", Icon: Sun },
    { v: "system", label: "Wie System", Icon: Monitor },
    { v: "dark", label: "Dunkel", Icon: Moon },
  ];
  return (
    <div className="at-theme" role="group" aria-label="Darstellung">
      {opts.map(({ v, label, Icon }) => (
        <button key={v} type="button" aria-pressed={theme === v} aria-label={label} title={label} onClick={() => setTheme(v)}>
          <Icon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

// Benutzermenü: Darstellung gehört hierher, nicht in die Kopfleiste.
export function UserMenu({ name = "Lena Wachter", sub = "Showroom Lochau", initials = "LW", up = true, short }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className={`at-user ${up ? "up" : "down"}`} ref={ref}>
      <button type="button" className="at-user-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
        <span className="at-avatar t1" aria-hidden="true">{initials}</span>
        <span className="txt"><b>{short ?? name}</b>{sub ? <small>{sub}</small> : null}</span>
        <ChevronsUpDown className="chev" aria-hidden="true" />
      </button>
      {open ? (
        <div className="at-menu" role="menu" aria-label="Benutzermenü">
          <div className="at-menu-h"><b>{name}</b><span>{sub}</span></div>
          <div className="at-menu-row"><span>Darstellung</span><ThemeSwitch /></div>
          <a href="#" role="menuitem" className="at-menu-item"><Settings aria-hidden="true" />Einstellungen</a>
          <a href="#" role="menuitem" className="at-menu-item"><LogOut aria-hidden="true" />Abmelden</a>
        </div>
      ) : null}
    </div>
  );
}
