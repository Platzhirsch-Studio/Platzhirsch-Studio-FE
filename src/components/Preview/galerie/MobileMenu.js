"use client";

import { useRef } from "react";
import Logo from "./Logo";
import s from "./galerie.module.css";

// Full-screen menu on the native Popover API: top layer, Esc to close and
// focus return come from the browser. The only JS here closes the popover
// after a click on an in-page anchor (the browser would leave it open).
export default function MobileMenu({ items, cta }) {
  const ref = useRef(null);
  const close = () => {
    try {
      ref.current?.hidePopover();
    } catch {
      /* popover already closed */
    }
  };

  return (
    <>
      <button type="button" className={s.menuButton} popoverTarget="galerie-menu" aria-haspopup="dialog">
        Menü
      </button>
      <div id="galerie-menu" popover="auto" ref={ref} className={s.menu} role="dialog" aria-label="Menü">
        <div className={s.menuInner}>
          <div className={s.menuTop}>
            <span className={s.headerLogo} aria-hidden="true">
              <Logo descriptor={false} />
            </span>
            <button type="button" className={s.menuButton} popoverTarget="galerie-menu" popoverTargetAction="hide">
              Schließen
            </button>
          </div>
          <ul className={s.menuList}>
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={close}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={s.menuFoot}>
            <a href={cta.href} className={s.button}>
              {cta.label}
            </a>
            <a href="tel:+43557446255" className={s.small}>
              +43 5574 46255
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
