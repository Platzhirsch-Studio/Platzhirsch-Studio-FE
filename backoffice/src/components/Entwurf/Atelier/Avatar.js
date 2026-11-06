import { team } from "./data";

// Avatare: mindestens 24 px, Initialen Geist 10/600, Stapel −6 px mit Papierring.
export function Avatar({ k, size }) {
  const t = team[k];
  return <span className={`at-avatar ${size ?? ""} ${t ? t.tone : ""}`} title={t ? t.name : k}>{k}</span>;
}

// Höchstens drei sichtbar, Rest als „+n“.
export function AvatarStack({ list }) {
  const vis = list.slice(0, 3);
  const rest = list.length - vis.length;
  return (
    <span className="at-stack" aria-label={list.map((k) => team[k]?.name ?? k).join(", ")}>
      {vis.map((k) => <Avatar key={k} k={k} />)}
      {rest > 0 ? <span className="at-avatar more">+{rest}</span> : null}
    </span>
  );
}

