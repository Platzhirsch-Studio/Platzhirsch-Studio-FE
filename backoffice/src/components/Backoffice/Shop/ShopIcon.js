// Icons des Shops: Fundament-Vokabular (icons.js) + die wenigen Zeichen, die dort fehlen (Bookmark, CircleSlash …).
// Benannte Importe (kein `import *`), Strichstärke wie Lounge (1,75). Server- und Client-tauglich.
import { Bookmark, Circle, CircleSlash, PanelRight, Copy, Store as StoreIcon } from "lucide-react";
import { Icon, ICONS, strichFuer } from "@/components/Backoffice/icons";

const EXTRA = { Bookmark, Circle, CircleSlash, PanelRight, Copy, StoreIcon };

export default function ShopIcon({ name, className = "size-4", label, ...rest }) {
  const C = EXTRA[name];
  if (C && !ICONS[name]) {
    const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };
    return <C {...a11y} className={className} strokeWidth={strichFuer(className)} {...rest} />;
  }
  return <Icon name={name} className={className} label={label} {...rest} />;
}
