"use client";
import { Children, useRef, useState } from "react";
import Button from "@/components/ui/Button";

// Client island (≈ 1 KB): reveals the server-rendered news cards in steps.
// Every card is in the HTML from the start (crawlers see all article links);
// cards beyond the current step only carry `hidden`. After "show more" the
// focus moves to the first newly shown card so keyboard and screen-reader
// users continue where they were.
export default function NewsMore({ step = 9, showMoreLabel, statusTemplate, children, className }) {
  const items = Children.toArray(children);
  const [count, setCount] = useState(step);
  const listRef = useRef(null);
  const visible = Math.min(count, items.length);

  const showMore = () => {
    const first = visible;
    setCount((c) => c + step);
    requestAnimationFrame(() => {
      const target = listRef.current?.children?.[first]?.querySelector("a");
      target?.focus();
    });
  };

  return (
    <>
      {/* Motion: cards arrive one after another while scrolling (reveal-group,
          transform only); cards shown via "show more" fade in from 0.6
          (ph-arrive, @starting-style – no layout shift; instant when calm). */}
      <ul ref={listRef} className={["reveal-group", className].filter(Boolean).join(" ")}>
        {items.map((child, i) => (
          <li key={child.key ?? i} hidden={i >= visible} className={i >= step ? "ph-arrive" : undefined}>
            {child}
          </li>
        ))}
      </ul>
      {items.length > step && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <p className="text-small text-text-soft" aria-live="polite">
            {statusTemplate.replace("{shown}", String(visible)).replace("{total}", String(items.length))}
          </p>
          {visible < items.length && (
            <Button variant="secondary" onClick={showMore}>
              {showMoreLabel}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
