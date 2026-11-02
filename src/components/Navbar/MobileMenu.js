"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Phone, X } from "@/components/ui/icons";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import LinkArrow from "@/components/ui/LinkArrow";
import SmartLink from "@/components/ui/SmartLink";
import cx from "@/components/ui/cx";
// Tempo-Runde Shell: the wordmark comes as a server-rendered slot (navbar.js,
// <Wordmark sprite>), so brandPaths.js (≈ 13 KB path data) is not in the
// client bundle of every page.
import { ADDRESS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { menuHoursLine } from "./menuHours";
import { findActiveRoom, isCurrent } from "./navMatch";
import { menuColumns } from "./menuColumns";
import { LanguageList } from "./LanguageSwitcher";
import SelectionLink from "./SelectionLink";
import IdeenboardNavLink from "@/components/Pinterest/IdeenboardNavLink";
import { useTerminContext, useTerminHref } from "./HeaderCta";
import { withContext } from "@/lib/forms/pathContext";
import s from "./Navbar.module.css";

// Full-screen menu below 1280 px as a modal <dialog> (showModal): focus is
// trapped, the page behind is inert, Esc closes – all native (Bibel §14).
// It closes after every link tap and on every route change (the prototypes'
// "menu stays open" bug), and gives focus back to the "Menü" button.
// Focus on open goes to the FIRST focusable element of the dialog, which is
// "Menü schließen" (first in the DOM, shown on the right via flex-row-reverse),
// so DOM order, the browser's own showModal() focus and APG agree. Esc (native
// cancel) and every other close return focus to the trigger (R3-shell).
// Rooms are exclusive <details> (name=…), so the list stays short.
// R4-shell-perf: the dialog BODY (rooms, links, buttons, address) is only
// rendered once the menu is about to open (hover/focus/tap on "Menü"), so the
// first load neither ships it as HTML nor hydrates ~100 elements nobody sees.
// The same links are in the server-rendered desktop navigation and the footer,
// so crawlers lose nothing. The dialog frame, "Menü schließen" and the
// wordmark stay in the HTML, so focus handling is unchanged.
// labels: shellLabels() from the server header (R4-shell-perf).
// burgerClassName/dialogClassName (Navbar.module.css .burger/.menuDialog):
// from 1280 px button and dialog only show while the header's measured fit
// says the bar does not fit (data-nav="menu", navFit.js).
export default function MobileMenu({ rooms, terminHref, selectionHref, labels = {}, burgerClassName, dialogClassName, wordmark = null }) {
  const m = labels.menu || {};
  const locale = useLocale();
  const pathname = usePathname();
  const dialogRef = useRef(null);
  const buttonRef = useRef(null);
  const closeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  // Design-Jury P2-9: preparing the body on hover/touchstart is a transition –
  // it may never hold up the tap that follows (input delay < 100 ms); show()
  // sets it again synchronously.
  const prepare = () => startTransition(() => setReady(true));
  const activeId = findActiveRoom(rooms, pathname);
  // Termin keeps the page context (?thema=, ?ort=), r7-p1 ux P1-1.
  const contextualTermin = useTerminHref(terminHref);
  // "Beratung & Termin" in the menu lists: same page context (R5 ux P2).
  const terminCtx = useTerminContext();
  const hrefOf = (link) => (link.context ? withContext(link.href, terminCtx) : link.href);

  const show = (e) => {
    setReady(true);
    // QM shell-home r3: on phones the header wordmark is squeezed by the
    // icons next to it (≈ 160 px at 375 px); the menu had room for 213 px, so
    // the logo jumped when the menu opened. The menu takes the header size.
    const headerMark = document.querySelector("[data-header-logo] > :first-child");
    const w = headerMark?.getBoundingClientRect().width || 0;
    if (w > 0) dialogRef.current?.style.setProperty("--ph-logo-w", `${Math.round(w * 10) / 10}px`);
    else dialogRef.current?.style.removeProperty("--ph-logo-w");
    dialogRef.current?.showModal();
    // Opened by tap or click (detail > 0): no focus ring; by keyboard: ring.
    // WebKit ignores focusVisible:false; data-pointer-focus (globals.css)
    // hides the ring until the first key press or blur.
    const close = closeRef.current;
    if (close && e?.detail) {
      close.setAttribute("data-pointer-focus", "");
      const clear = () => {
        close.removeAttribute("data-pointer-focus");
        close.removeEventListener("keydown", clear);
        close.removeEventListener("blur", clear);
      };
      close.addEventListener("keydown", clear);
      close.addEventListener("blur", clear);
    }
    close?.focus({ focusVisible: !e?.detail });
    document.documentElement.style.overflow = "hidden";
    setOpen(true);
  };
  const hide = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
  };

  useEffect(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [pathname]);

  // Grown past the breakpoint (tablet rotated): close; the header measures
  // again on close (HeaderFrame) and shows the bar – or this button again.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onChange = () => desktop.matches && dialogRef.current?.open && dialogRef.current.close();
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={show}
        onPointerEnter={prepare}
        onTouchStart={prepare}
        onFocus={prepare}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="ph-mobile-menu"
        aria-label={m.open}
        data-nav-burger=""
        className={cx(
          // Below 640 px icon only: -10 px puts the 24 px icon on the gutter.
          "-mr-2.5 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft @min-[36rem]:mr-0 @min-[36rem]:pl-2",
          burgerClassName
        )}
      >
        {/* QM shell-home r5: label by the header row container (rem), not the viewport. */}
        <span aria-hidden="true" className="hidden @min-[36rem]:inline">
          {m.menu}
        </span>
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.5} />
      </button>

      <dialog
        ref={dialogRef}
        id="ph-mobile-menu"
        aria-label={m.menu}
        onClose={() => {
          document.documentElement.style.overflow = "";
          setOpen(false);
          buttonRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target.closest("a")) hide();
        }}
        className={cx(
          s.dialog,
          "fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-surface p-0 text-text",
          dialogClassName
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-header shrink-0 flex-row-reverse items-center justify-between border-b border-line px-gutter">
            <button
              ref={closeRef}
              type="button"
              onClick={hide}
              aria-label={m.close}
              className="-mr-2.5 inline-flex min-h-11 min-w-11 sm:-mr-2 items-center justify-center gap-2 px-2 text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft"
            >
              <span aria-hidden="true" className="hidden sm:inline">
                {m.panelClose}
              </span>
              <X aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </button>
            {/* min-w-0 + w-full max-w: the wordmark scales down at 320 px like
                in the header, so it never pushes the close button. */}
            {/* R4 technik P1-2: the wordmark (≈ 5 KB SVG path, twice with the
                RSC copy) is drawn only once the menu is prepared, like the body. */}
            <Link href="/" aria-label={m.home} className="inline-flex min-h-11 min-w-0 flex-1 items-center pr-4">
              {ready && <span className="block w-full max-w-(--ph-logo-w,213px)">{wordmark}</span>}
            </Link>
          </div>

          {ready && (
          <div className="flex-1 overflow-y-auto overscroll-contain px-gutter pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {/* QM shell-home r3 (iPad quer, 1194 px): rows and the Termin bar
                ran ~960 px wide. r5: the centred 48rem column left ~300 px
                empty on each side – from 1024 px the rubrics take columns
                1–7 and the actions, links and visit block stand beside them
                (8/9–12, sticky), so the wide screen is used and "Termin"
                is in view next to every open rubric. */}
            <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-grid">
            <nav aria-label={m.mainNav} className="lg:col-span-7">
              <ul>
                {rooms.map((room) => (
                  <li key={room.id} className="border-b border-line">
                    <details name="ph-mobile-rooms" open={activeId === room.id || undefined}>
                      <summary
                        className={cx(
                          s.summary,
                          "flex min-h-16 cursor-pointer items-center justify-between gap-4 text-title",
                          activeId === room.id && "text-text-accent"
                        )}
                      >
                        <span>{room.title || room.label}</span>
                        <ChevronDown aria-hidden="true" className={cx(s.chevron, "size-5 shrink-0 text-text")} strokeWidth={1.5} />
                      </summary>
                      <div className={cx(s.fold, "pb-6")}>
                        <p className="max-w-measure text-body text-text-soft">{room.intro}</p>
                        <LinkArrow href={room.all.href} className="mt-2">
                          {room.all.label}
                        </LinkArrow>
                        {room.extra?.map((link) => (
                          // QM shell-home r5 (200 % text): wrapped links touched each other – 4 px between rows.
                          <div key={link.href} className="mt-1">
                            <LinkArrow href={link.href}>{link.label}</LinkArrow>
                          </div>
                        ))}
                        {/* QM shell-home r3 (iPad hoch): a 2-column grid left a hole
                            next to a short group ("Sofas & Sessel" 3 vs. 6 links) –
                            CSS columns let the groups flow without gaps. */}
                        <div className="mt-4 sm:columns-2 sm:gap-x-6">
                          {menuColumns(room).map((column, i) => (
                            // QM shell-home r5 (Marken): a bottom margin moved to the top of the
                            // second CSS column in WebKit ("Bad & Wellness" ~20 px lower
                            // than "Wohnen"); padding stays with its group.
                            <div key={column.title || i} className="break-inside-avoid pb-6 last:pb-0">
                              {column.title && <p className="text-small text-text-soft">{column.title}</p>}
                              <ul className={cx(column.title && "mt-1")}>
                                {column.links.map((link) => (
                                  <li key={link.href + link.label}>
                                    <SmartLink
                                      href={hrefOf(link)}
                                      aria-current={isCurrent(link, pathname) ? "page" : undefined}
                                      className="flex min-h-11 items-center text-ui font-normal text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current aria-[current=page]:text-text-accent"
                                    >
                                      {link.label}
                                    </SmartLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="lg:sticky lg:top-0 lg:col-span-4 lg:col-start-9 lg:pt-6">
            <div className="mt-8 grid gap-3 lg:mt-0">
              <Button href={contextualTermin} prefetch={false} fullWidth>
                {m.termin}
              </Button>
              <Button href={PHONE_HREF} variant="secondary" fullWidth>
                <span className="inline-flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
                  {/* One text run: the flex gap must not land around the dot. */}
                  <span>
                    {m.call}
                    {" · "}
                    <span className="tabular">{PHONE_DISPLAY}</span>
                  </span>
                </span>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <div className="-ml-2 flex flex-wrap items-center gap-x-2">
                <SelectionLink href={selectionHref} showLabel="always" labels={labels.selection} className="px-2" />
                <IdeenboardNavLink showLabel="always" className="px-2" />
              </div>
              {/* -mx-2 cancels the links' px-2 on both edges, so "Deutsch"
                  sits on the gutter when the row wraps and on the right edge
                  when it does not. */}
              <LanguageList className="-mx-2" labels={labels.language} germanOnly={labels.germanOnly} />
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <p className="text-overline uppercase text-text-accent">{m.visit}</p>
              <address className="mt-stack-s text-body not-italic text-text">
                {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}
              </address>
              {/* From OPENING_HOURS in lib/site.js (single source, R3-shell). */}
              <p className="tabular text-body text-text-soft">{menuHoursLine(locale)}</p>
            </div>
            </div>
            </div>
          </div>
          )}
        </div>
      </dialog>
    </>
  );
}
